import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
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

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [activePosts] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(schema.posts)
    .where(eq(schema.posts.buyerId, user.id));
  const [spend] = await db
    .select({
      total: sql<number>`coalesce(sum(bounty_cents), 0)`.as("total"),
    })
    .from(schema.posts)
    .where(eq(schema.posts.buyerId, user.id));
  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    balanceCents: user.balanceCents,
    activePosts: activePosts?.count ?? 0,
    totalSpendCents: spend?.total ?? 0,
  });
}
