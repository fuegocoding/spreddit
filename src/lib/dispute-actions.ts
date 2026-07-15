"use server";

import { db, schema, sqliteSchema } from "@/db";
const s: typeof sqliteSchema = schema as any;
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { newId } from "@/lib/ids";
import { z } from "zod";
import { redirect } from "next/navigation";

const raiseSchema = z.object({
  claimId: z.string(),
  reason: z.string().min(20).max(2000),
});

export async function raiseDisputeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const parsed = raiseSchema.parse({
    claimId: formData.get("claimId"),
    reason: formData.get("reason"),
  });

  const [claim] = await db
    .select()
    .from(s.claims)
    .where(eq(s.claims.id, parsed.claimId))
    .limit(1);
  if (!claim) throw new Error("Claim not found");

  const isBuyer = await db
    .select()
    .from(s.posts)
    .where(
      and(
        eq(s.posts.id, claim.postId),
        eq(s.posts.buyerId, session.user.id)
      )
    )
    .limit(1);
  const isPoster = claim.posterId === session.user.id;
  if (!isBuyer.length && !isPoster) throw new Error("Forbidden");

  await db.insert(s.disputes).values({
    id: newId(),
    claimId: parsed.claimId,
    raisedBy: isBuyer.length ? "buyer" : "poster",
    reason: parsed.reason,
  });
  revalidatePath("/poster");
  revalidatePath("/buyer");
}
