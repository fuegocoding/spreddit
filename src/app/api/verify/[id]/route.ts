import { NextResponse } from "next/server";
import { verifyClaim, runSurvivalCheck } from "@/lib/verification";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Verify ownership: buyer or poster
  const [claim] = await db
    .select()
    .from(schema.claims)
    .where(eq(schema.claims.id, id))
    .limit(1);
  if (!claim)
    return NextResponse.json({ error: "claim not found" }, { status: 404 });

  const allowed =
    claim.posterId === session.user.id ||
    (await db
      .select()
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.id, claim.postId),
          eq(schema.posts.buyerId, session.user.id)
        )
      )
      .limit(1)).length > 0;
  if (!allowed)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "verify";
  const result =
    action === "survival" ? await runSurvivalCheck(id) : await verifyClaim(id);
  return NextResponse.json(result);
}

export const dynamic = "force-dynamic";
