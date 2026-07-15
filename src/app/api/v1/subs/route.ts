import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MONETIZABLE_SUBS } from "@/lib/subs";

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

export async function GET() {
  const subs = Object.entries(MONETIZABLE_SUBS).map(([name, meta]) => ({
    name,
    description: meta.description,
    minKarma: meta.minKarma,
    baseRateCents: meta.baseRate * 100,
  }));
  return NextResponse.json({ subs });
}
