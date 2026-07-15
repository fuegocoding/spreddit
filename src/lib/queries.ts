import { db, schema } from "@/db";
import { and, desc, eq, sql, inArray } from "drizzle-orm";

export async function getBuyerStats(buyerId: string) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.as("total"),
      active: sql<number>`sum(case when status in ('available','claimed','published') then 1 else 0 end)`.as("active"),
      paid: sql<number>`sum(case when status in ('paid','verified') then 1 else 0 end)`.as("paid"),
      spendCents: sql<number>`coalesce(sum(case when status in ('paid','verified') then bounty_cents else 0 end), 0)`.as("spend"),
    })
    .from(schema.posts)
    .where(eq(schema.posts.buyerId, buyerId));
  return stats;
}

export async function getBuyerPosts(buyerId: string) {
  return db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.buyerId, buyerId))
    .orderBy(desc(schema.posts.createdAt))
    .limit(50);
}

export async function getBuyerPostWithClaims(buyerId: string, postId: string) {
  const [post] = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.buyerId, buyerId)))
    .limit(1);
  if (!post) return null;
  const claimRows = await db
    .select({
      claim: schema.claims,
      poster: { id: schema.users.id, email: schema.users.email },
      redditAccount: {
        id: schema.redditAccounts.id,
        username: schema.redditAccounts.redditUsername,
        karma: schema.redditAccounts.karma,
      },
    })
    .from(schema.claims)
    .leftJoin(schema.users, eq(schema.users.id, schema.claims.posterId))
    .leftJoin(
      schema.redditAccounts,
      eq(schema.redditAccounts.id, schema.claims.redditAccountId)
    )
    .where(eq(schema.claims.postId, postId))
    .orderBy(desc(schema.claims.claimedAt));
  return { post, claims: claimRows };
}

export async function getPosterStats(posterId: string) {
  const [stats] = await db
    .select({
      earningsCents: sql<number>`coalesce(sum(payout_cents), 0)`.as(
        "earnings"
      ),
      active: sql<number>`sum(case when status = 'active' then 1 else 0 end)`.as("active"),
      verified: sql<number>`sum(case when status in ('verified','survived') then 1 else 0 end)`.as(
        "verified"
      ),
      pending: sql<number>`sum(case when status in ('proof_submitted') then 1 else 0 end)`.as(
        "pending"
      ),
    })
    .from(schema.claims)
    .where(eq(schema.claims.posterId, posterId));
  return stats;
}

export async function getPosterClaims(posterId: string) {
  return db
    .select({
      claim: schema.claims,
      post: schema.posts,
    })
    .from(schema.claims)
    .leftJoin(schema.posts, eq(schema.posts.id, schema.claims.postId))
    .where(eq(schema.claims.posterId, posterId))
    .orderBy(desc(schema.claims.claimedAt))
    .limit(50);
}

export async function getAvailablePosts(posterId: string, redditAccountIds: string[]) {
  if (redditAccountIds.length === 0) return [];
  return db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.status, "available"))
    .orderBy(desc(schema.posts.createdAt))
    .limit(50);
}

export async function getRedditAccountsForUser(userId: string) {
  return db
    .select()
    .from(schema.redditAccounts)
    .where(eq(schema.redditAccounts.userId, userId));
}
