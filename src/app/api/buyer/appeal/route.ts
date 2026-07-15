import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { assertStripe } from "@/lib/stripe";
import { z } from "zod";

const APPEAL_FEE_CENTS = 99;

const bodySchema = z.object({
  claimId: z.string(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  // Find the claim
  const [claim] = await db
    .select()
    .from(schema.claims)
    .where(eq(schema.claims.id, parsed.data.claimId))
    .limit(1);
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }

  // Verify the buyer owns the post this claim is for
  const [post] = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, claim.postId))
    .limit(1);
  if (!post || post.buyerId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const s = assertStripe();

  // Create a checkout session for $0.99
  const checkoutSession = await s.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Appeal poster ban",
            description: "Lift the ban on the poster who removed their post.",
          },
          unit_amount: APPEAL_FEE_CENTS,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "appeal",
      claimId: claim.id,
      posterId: claim.posterId,
      buyerId: session.user.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/buyer/posts/${post.id}?appealed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/buyer/posts/${post.id}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
