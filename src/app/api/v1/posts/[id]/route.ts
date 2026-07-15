import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [post] = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, id))
    .limit(1);
  if (!post) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (post.buyerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const claims = await db
    .select()
    .from(schema.claims)
    .where(eq(schema.claims.postId, post.id));
  return NextResponse.json({ post, claims });
}
