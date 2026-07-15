"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newId } from "@/lib/ids";
import { isSubAllowed } from "@/lib/subs";
import { z } from "zod";
import { dollarsToCents } from "@/lib/money";
import {
  TIER_MULTIPLIER,
  calculatePlatformFee,
  calculatePosterEarnings,
} from "@/lib/pricing";

const createPostSchema = z.object({
  targetSub: z.string().min(2).max(40),
  title: z.string().min(10).max(300),
  body: z.string().min(20).max(10000),
  linkUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["random", "high_karma", "dedicated"]),
  baseBounty: z.coerce.number().min(5).max(500),
  survivalGuarantee: z.coerce.boolean().optional().default(false),
  subMatchPriority: z.coerce.boolean().optional().default(false),
  sameDayPublish: z.coerce.boolean().optional().default(false),
});

function calculateBountyCents(
  baseCents: number,
  tier: keyof typeof TIER_MULTIPLIER,
  boosts: { survival?: boolean; subMatch?: boolean; sameDay?: boolean }
) {
  const tiered = Math.round(baseCents * TIER_MULTIPLIER[tier]);
  const boostTotal =
    (boosts.survival ? 500 : 0) +
    (boosts.subMatch ? 200 : 0) +
    (boosts.sameDay ? 300 : 0);
  return tiered + boostTotal;
}

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
    baseBounty: formData.get("baseBounty"),
    survivalGuarantee: formData.get("survivalGuarantee") === "on",
    subMatchPriority: formData.get("subMatchPriority") === "on",
    sameDayPublish: formData.get("sameDayPublish") === "on",
  });

  if (!isSubAllowed(parsed.targetSub)) {
    throw new Error(`r/${parsed.targetSub} is not in the monetizable sub list.`);
  }

  const baseCents = dollarsToCents(parsed.baseBounty);
  const totalBounty = calculateBountyCents(baseCents, parsed.tier, {
    survival: parsed.survivalGuarantee,
    subMatch: parsed.subMatchPriority,
    sameDay: parsed.sameDayPublish,
  });

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
    bountyCents: totalBounty,
    survivalGuarantee: parsed.survivalGuarantee,
    subMatchPriority: parsed.subMatchPriority,
    sameDayPublish: parsed.sameDayPublish,
    status: "available",
  });

  revalidatePath("/buyer");
  revalidatePath("/feed");
  redirect(`/buyer/posts/${id}`);
}
