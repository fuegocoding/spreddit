import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema, sqliteSchema } from "@/db";
const s: typeof sqliteSchema = schema as any;
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { newId } from "@/lib/ids";

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

  const [claim] = await db
    .select()
    .from(s.claims)
    .where(eq(s.claims.id, parsed.data.claimId))
    .limit(1);
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }

  const [post] = await db
    .select()
    .from(s.posts)
    .where(eq(s.posts.id, claim.postId))
    .limit(1);
  if (!post || post.buyerId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [user] = await db
    .select()
    .from(s.users)
    .where(eq(s.users.id, session.user.id))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }
  if ((user.balanceCents ?? 0) < APPEAL_FEE_CENTS) {
    return NextResponse.json(
      {
        error: "insufficient_balance",
        requiredCents: APPEAL_FEE_CENTS,
        balanceCents: user.balanceCents ?? 0,
      },
      { status: 402 }
    );
  }

  await db
    .update(s.users)
    .set({ balanceCents: sql`balance_cents - ${APPEAL_FEE_CENTS}` })
    .where(eq(s.users.id, user.id));
  await db.insert(s.disputes).values({
    id: newId(),
    claimId: claim.id,
    raisedBy: "buyer",
    reason: "buyer_appeal",
    status: "resolved",
    resolution: `Buyer paid $${(APPEAL_FEE_CENTS / 100).toFixed(2)} to lift ban`,
    resolvedAt: new Date(),
  });
  await db
    .update(s.users)
    .set({ role: "poster" })
    .where(eq(s.users.id, claim.posterId));

  return NextResponse.json({ ok: true, chargedCents: APPEAL_FEE_CENTS });
}
