import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
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
      const postId = session.metadata?.postId;
      const type = session.metadata?.type;

      if (type === "appeal") {
        const claimId = session.metadata?.claimId;
        const posterId = session.metadata?.posterId;
        const buyerId = session.metadata?.buyerId;

        if (claimId && posterId && buyerId) {
          // Create dispute record
          await db.insert(schema.disputes).values({
            id: require("node:crypto").randomUUID(),
            claimId,
            raisedBy: "buyer",
            reason: "buyer_appeal",
            status: "resolved",
            resolution: "Buyer paid $0.99 to lift ban",
            resolvedAt: new Date(),
          });
          // Unban the poster
          await db
            .update(schema.users)
            .set({ role: "poster" })
            .where(eq(schema.users.id, posterId));
        }
      } else if (postId) {
        // Normal post payment
        await db
          .update(schema.posts)
          .set({ status: "available" })
          .where(eq(schema.posts.id, postId));
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      // For now we just track that the account is connected; full KYC review
      // could be added later.
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const dynamic = "force-dynamic";
