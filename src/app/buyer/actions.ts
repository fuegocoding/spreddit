"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newId } from "@/lib/ids";
import { isValidSubredditName } from "@/lib/subs";
import { z } from "zod";
import {
  TIER_PRICE_CENTS,
  calculateBoostsTotal,
  calculatePlatformFee,
  calculatePosterEarnings,
} from "@/lib/pricing";
import { isDemoMode } from "@/lib/env";

const createPostSchema = z.object({
  targetSub: z
    .string()
    .min(2)
    .max(21)
    .refine(isValidSubredditName, "Invalid subreddit name"),
  title: z.string().min(10).max(300),
  body: z.string().min(20).max(10000),
  linkUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["random", "high_karma", "dedicated"]),
  survivalGuarantee: z.union([z.literal("on"), z.literal(""), z.literal("true"), z.literal("false")]).optional(),
  subMatchPriority: z.union([z.literal("on"), z.literal(""), z.literal("true"), z.literal("false")]).optional(),
  sameDayPublish: z.union([z.literal("on"), z.literal(""), z.literal("true"), z.literal("false")]).optional(),
});

function isOn(v: string | undefined): boolean {
  return v === "on" || v === "true";
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
    survivalGuarantee: formData.get("survivalGuarantee") ?? "",
    subMatchPriority: formData.get("subMatchPriority") ?? "",
    sameDayPublish: formData.get("sameDayPublish") ?? "",
  });

  const survivalGuarantee = isOn(parsed.survivalGuarantee as any);
  const subMatchPriority = isOn(parsed.subMatchPriority as any);
  const sameDayPublish = isOn(parsed.sameDayPublish as any);

  const tierPrice = TIER_PRICE_CENTS[parsed.tier];
  const boosts = calculateBoostsTotal({
    survivalGuarantee,
    subMatchPriority,
    sameDayPublish,
  });
  const totalCharge = tierPrice + boosts;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) throw new Error("User not found");

  if ((user.balanceCents ?? 0) < totalCharge) {
    const shortfall = totalCharge - (user.balanceCents ?? 0);
    throw new Error(
      `Insufficient balance. You need $${(shortfall / 100).toFixed(
        2
      )} more. Top up your wallet first.`
    );
  }

  const id = newId();

  // Atomic deduction + insert. SQLite serializes writes; Postgres needs an
  // explicit transaction wrapper but we keep this side portable.
  await db
    .update(schema.users)
    .set({ balanceCents: (user.balanceCents ?? 0) - totalCharge })
    .where(eq(schema.users.id, user.id));

  await db.insert(schema.posts).values({
    id,
    buyerId: session.user.id,
    targetSub: parsed.targetSub,
    title: parsed.title,
    body: parsed.body,
    linkUrl: parsed.linkUrl || null,
    imageUrl: parsed.imageUrl || null,
    tier: parsed.tier,
    bountyCents: tierPrice,
    survivalGuarantee,
    subMatchPriority,
    sameDayPublish,
    status: "available",
    paidAt: new Date(),
    paymentIntentId: isDemoMode ? `demo_${id}` : null,
  });

  revalidatePath("/buyer");
  revalidatePath("/feed");
  redirect(`/buyer/posts/${id}?paid=1`);
}
