"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newId, generateClaimExpiry } from "@/lib/ids";
import { calculatePosterEarnings } from "@/lib/pricing";

const claimSchema = z.object({});

import { z } from "zod";

export async function claimPostAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const postId = String(formData.get("postId") ?? "");
  const redditAccountId = String(formData.get("redditAccountId") ?? "");

  return claimPost({ postId, redditAccountId, userId: session.user.id });
}

async function claimPost({
  postId,
  redditAccountId,
  userId,
}: {
  postId: string;
  redditAccountId: string;
  userId: string;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Verify ownership of the reddit account
  const [account] = await db
    .select()
    .from(schema.redditAccounts)
    .where(
      and(
        eq(schema.redditAccounts.id, redditAccountId),
        eq(schema.redditAccounts.userId, userId),
        eq(schema.redditAccounts.status, "active")
      )
    )
    .limit(1);
  if (!account) {
    throw new Error("Invalid Reddit account. Connect a verified account first.");
  }

  // Verify post is available
  const [post] = await db
    .select()
    .from(schema.posts)
    .where(
      and(
        eq(schema.posts.id, postId),
        eq(schema.posts.status, "available")
      )
    )
    .limit(1);
  if (!post) {
    throw new Error("Post is no longer available.");
  }

  // Check tier compatibility
  const minKarma =
    post.tier === "dedicated" ? 50000 : post.tier === "high_karma" ? 10000 : 1000;
  if (account.karma < minKarma) {
    throw new Error(
      `This post requires ${minKarma}+ karma. Your account has ${account.karma}.`
    );
  }

  const expiresAt = generateClaimExpiry();
  const payoutCents = calculatePosterEarnings(post.bountyCents);

  const claimId = newId();
  await db.insert(schema.claims).values({
    id: claimId,
    postId: post.id,
    posterId: userId,
    redditAccountId: account.id,
    status: "active",
    expiresAt,
    payoutCents,
  });
  await db
    .update(schema.posts)
    .set({ status: "claimed" })
    .where(eq(schema.posts.id, post.id));

  revalidatePath("/feed");
  revalidatePath("/poster");
  return { claimId };
}

const proofSchema = z.object({
  claimId: z.string(),
  redditPostUrl: z.string().url(),
  proofUrl: z.string().url().optional().or(z.literal("")),
});

export async function submitProofAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = proofSchema.parse({
    claimId: formData.get("claimId"),
    redditPostUrl: formData.get("redditPostUrl"),
    proofUrl: formData.get("proofUrl") ?? "",
  });

  const [claim] = await db
    .select()
    .from(schema.claims)
    .where(
      and(
        eq(schema.claims.id, parsed.claimId),
        eq(schema.claims.posterId, session.user.id),
        eq(schema.claims.status, "active")
      )
    )
    .limit(1);
  if (!claim) {
    throw new Error("Claim not found or already submitted.");
  }

  // Handle screenshot file upload (optional). Stored as base64 in proof_uploads.
  const screenshot = formData.get("screenshot");
  if (screenshot && screenshot instanceof File && screenshot.size > 0) {
    if (screenshot.size > 5 * 1024 * 1024) {
      throw new Error("Screenshot must be under 5MB");
    }
    const mimeType = screenshot.type || "image/png";
    if (!mimeType.startsWith("image/")) {
      throw new Error("Screenshot must be an image file");
    }
    const arrayBuffer = await screenshot.arrayBuffer();
    const data = Buffer.from(arrayBuffer).toString("base64");
    await db.insert(schema.proofUploads).values({
      id: newId(),
      claimId: claim.id,
      filename: screenshot.name || "screenshot.png",
      mimeType,
      sizeBytes: screenshot.size,
      data,
    });
  }

  await db
    .update(schema.claims)
    .set({
      redditPostUrl: parsed.redditPostUrl,
      proofUrl: parsed.proofUrl || null,
      status: "proof_submitted",
      submittedAt: new Date(),
    })
    .where(eq(schema.claims.id, claim.id));

  revalidatePath(`/poster/claims/${claim.id}`);
  revalidatePath("/poster");
}
