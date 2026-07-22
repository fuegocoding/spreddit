import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "stripe not configured" }, { status: 503 });
  }
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      if (type === "appeal") {
        const claimId = session.metadata?.claimId;
        const posterId = session.metadata?.posterId;
        const buyerId = session.metadata?.buyerId;

        if (claimId && posterId && buyerId) {
          await db.insert(schema.disputes).values({
            id: require("node:crypto").randomUUID(),
            claimId,
            raisedBy: "buyer",
            reason: "buyer_appeal",
            status: "resolved",
            resolution: "Buyer paid $0.99 to lift ban",
            resolvedAt: new Date(),
          });
          await db
            .update(schema.users)
            .set({ role: "poster" })
            .where(eq(schema.users.id, posterId));
        }
      } else if (type === "topup") {
        const topupId = session.metadata?.topupId;
        const userId = session.metadata?.userId;
        const amountCents = Number(session.metadata?.amountCents ?? "0");
        if (topupId && userId && amountCents > 0) {
          const [topup] = await db
            .select()
            .from(schema.topups)
            .where(eq(schema.topups.id, topupId))
            .limit(1);
          if (topup && topup.status === "pending") {
            await db
              .update(schema.topups)
              .set({
                status: "succeeded",
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null,
                paidAt: new Date(),
              })
              .where(eq(schema.topups.id, topupId));
            await db
              .update(schema.users)
              .set({ balanceCents: sql`balance_cents + ${amountCents}` })
              .where(eq(schema.users.id, userId));
          }
        }
      } else if (session.metadata?.postId) {
        const postId = session.metadata.postId;
        await db
          .update(schema.posts)
          .set({ status: "available", paidAt: new Date() })
          .where(eq(schema.posts.id, postId));
      }
      break;
    }
    case "account.updated": {
      // Future: track onboarding state, payouts enabled, etc.
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const dynamic = "force-dynamic";
