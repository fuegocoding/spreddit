import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, platformFeeAmount, assertStripe } from "@/lib/stripe";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schemaReq = z.object({
  postId: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schemaReq.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const [post] = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, parsed.data.postId))
    .limit(1);
  if (!post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
  if (post.buyerId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (post.status !== "pending_payment") {
    return NextResponse.json(
      { error: "post is not awaiting payment" },
      { status: 400 }
    );
  }

  const s = assertStripe();

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

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

  const successUrl =
    parsed.data.successUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL}/buyer/posts/${post.id}?paid=1`;
  const cancelUrl =
    parsed.data.cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/buyer/new`;

  const checkoutSession = await s.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Spreddit post: r/${post.targetSub}`,
            description: post.title.slice(0, 200),
          },
          unit_amount: post.bountyCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeAmount(post.bountyCents),
      transfer_data: undefined,
      metadata: { postId: post.id, userId: user.id },
    },
    metadata: { postId: post.id, userId: user.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
