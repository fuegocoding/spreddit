"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newId } from "@/lib/ids";
import { isSubAllowed } from "@/lib/subs";
import { z } from "zod";
import { calculatePosterEarnings, TIER_PRICE_CENTS } from "@/lib/pricing";

const createPostSchema = z.object({
  targetSub: z.string().min(2).max(40),
  title: z.string().min(10).max(300),
  body: z.string().min(20).max(10000),
  linkUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["random", "high_karma", "dedicated"]),
});

export async function createPostAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = createPostSchema.parse({
    targetSub: formData.get("targetSub"),
    title: formData.get("title"),
    body: formData.get("body"),
    linkUrl: formData.get("linkUrl") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    tier: formData.get("tier"),
  });

  if (!isSubAllowed(parsed.targetSub)) {
    throw new Error(`r/${parsed.targetSub} is not in the monetizable sub list.`);
  }

  const bountyCents = TIER_PRICE_CENTS[parsed.tier];

  const id = newId();
  await db.insert(schema.posts).values({
    id,
    buyerId: session.user.id,
    targetSub: parsed.targetSub,
    title: parsed.title,
    body: parsed.body,
    linkUrl: parsed.linkUrl || null,
    imageUrl: parsed.imageUrl || null,
    tier: parsed.tier,
    bountyCents,
    survivalGuarantee: false,
    subMatchPriority: false,
    sameDayPublish: false,
    status: "pending_payment",
  });

  revalidatePath("/buyer");
  revalidatePath("/feed");
  redirect(`/buyer/posts/${id}`);
}