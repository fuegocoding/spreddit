import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { newId } from "@/lib/ids";
import { isValidSubredditName, SUGGESTED_SUBS } from "@/lib/subs";
import {
  TIER_PRICE_CENTS,
  calculateBoostsTotal,
  calculatePlatformFee,
  calculatePosterEarnings,
} from "@/lib/pricing";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getApiUser() {
  const h = await headers();
  const authHeader = h.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    if (key.startsWith("spk_live_")) {
      const [apiKey] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.key, key))
        .limit(1);
      if (apiKey) {
        await db
          .update(schema.apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(schema.apiKeys.id, apiKey.id));
        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, apiKey.userId))
          .limit(1);
        if (user) return user;
      }
    }
  }
  const session = await auth();
  if (session?.user) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id))
      .limit(1);
    return user ?? null;
  }
  return null;
}

const createSchema = z.object({
  targetSub: z
    .string()
    .min(2)
    .max(21)
    .refine(isValidSubredditName, "Invalid subreddit name"),
  title: z.string().min(10).max(300),
  body: z.string().min(20).max(10000),
  linkUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tier: z.enum(["random", "high_karma", "dedicated"]),
  survivalGuarantee: z.boolean().optional(),
  subMatchPriority: z.boolean().optional(),
  sameDayPublish: z.boolean().optional(),
});

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const subs = Object.entries(SUGGESTED_SUBS).map(([name, meta]) => ({
    name,
    description: meta.description,
    minKarma: meta.minKarma,
    baseRateCents: meta.baseRate * 100,
  }));
  return NextResponse.json({ subs });
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (user.role === "poster" && !user.isBuyer) {
    return NextResponse.json(
      { error: "Posters cannot create posts" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tierPrice = TIER_PRICE_CENTS[parsed.data.tier];
  const boosts = calculateBoostsTotal({
    survivalGuarantee: parsed.data.survivalGuarantee,
    subMatchPriority: parsed.data.subMatchPriority,
    sameDayPublish: parsed.data.sameDayPublish,
  });
  const totalCharge = tierPrice + boosts;

  if ((user.balanceCents ?? 0) < totalCharge) {
    return NextResponse.json(
      {
        error: "insufficient_balance",
        requiredCents: totalCharge,
        balanceCents: user.balanceCents ?? 0,
      },
      { status: 402 }
    );
  }

  const id = newId();
  await db
    .update(schema.users)
    .set({ balanceCents: (user.balanceCents ?? 0) - totalCharge })
    .where(eq(schema.users.id, user.id));

  await db.insert(schema.posts).values({
    id,
    buyerId: user.id,
    targetSub: parsed.data.targetSub,
    title: parsed.data.title,
    body: parsed.data.body,
    linkUrl: parsed.data.linkUrl ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    tier: parsed.data.tier,
    bountyCents: tierPrice,
    survivalGuarantee: parsed.data.survivalGuarantee ?? false,
    subMatchPriority: parsed.data.subMatchPriority ?? false,
    sameDayPublish: parsed.data.sameDayPublish ?? false,
    status: "available",
    paidAt: new Date(),
  });

  return NextResponse.json({
    id,
    status: "available",
    bountyCents: tierPrice,
    boostCents: boosts,
    totalChargedCents: totalCharge,
    platformFeeCents: calculatePlatformFee(tierPrice),
    posterPayoutCents: calculatePosterEarnings(tierPrice),
    remainingBalanceCents: (user.balanceCents ?? 0) - totalCharge,
  });
}
