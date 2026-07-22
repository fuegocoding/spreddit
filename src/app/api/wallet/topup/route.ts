import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { newId } from "@/lib/ids";
import { assertStripe, stripe, platformFeeAmount } from "@/lib/stripe";
import { isDemoMode } from "@/lib/env";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const topupSchema = z.object({
  amountCents: z.coerce.number().int().min(500).max(1000000),
  demo: z.union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")]).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

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

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = topupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const { amountCents } = parsed.data;
  const forceDemo = parsed.data.demo === "true" || parsed.data.demo === "1";

  // Demo mode: top up instantly, no Stripe call.
  if (forceDemo || isDemoMode) {
    const id = newId();
    await db
      .update(schema.users)
      .set({ balanceCents: (user.balanceCents ?? 0) + amountCents })
      .where(eq(schema.users.id, user.id));
    await db.insert(schema.topups).values({
      id,
      userId: user.id,
      amountCents,
      method: "demo",
      status: "succeeded",
      paidAt: new Date(),
    });
    revalidatePath("/buyer");
    revalidatePath("/poster");
    return NextResponse.json({
      ok: true,
      mode: "demo",
      amountCents,
      balanceCents: (user.balanceCents ?? 0) + amountCents,
    });
  }

  // Real Stripe checkout for wallet top-up
  const s = assertStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await s.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(schema.users)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.users.id, user.id));
  }

  const topupId = newId();
  const successUrl =
    parsed.data.successUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL}/buyer?topup=success`;
  const cancelUrl =
    parsed.data.cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/buyer?topup=cancel`;

  const checkoutSession = await s.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Spreddit wallet top-up`,
            description: `Add $${(amountCents / 100).toFixed(2)} to your Spreddit wallet`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeAmount(amountCents),
      metadata: { topupId, userId: user.id, type: "topup" },
    },
    metadata: { topupId, userId: user.id, type: "topup", amountCents: String(amountCents) },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  await db.insert(schema.topups).values({
    id: topupId,
    userId: user.id,
    amountCents,
    method: "stripe",
    status: "pending",
    stripeSessionId: checkoutSession.id,
  });

  return NextResponse.json({
    ok: true,
    mode: "stripe",
    url: checkoutSession.url,
    topupId,
  });
}
