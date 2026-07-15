import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { assertStripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const s = assertStripe();

  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await s.accounts.create({
      type: "express",
      email: user.email,
      metadata: { userId: user.id },
    });
    accountId = account.id;
    await db
      .update(schema.users)
      .set({ stripeAccountId: accountId })
      .where(eq(schema.users.id, user.id));
  }

  const link = await s.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/poster`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/poster?onboarded=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
