import { db, schema, sqliteSchema } from "@/db";
import { and, desc, eq, sql, inArray } from "drizzle-orm";

// We type the schema explicitly so the union (sqlite|postgres) doesn't break
// inference at consumer sites. At runtime, schema.posts etc. resolve to the
// active driver's tables; TS sees only the SQLite shapes.
const s: typeof sqliteSchema = schema as any;

type ClaimRow = {
  claim: typeof s.claims.$inferSelect;
  poster: { id: string; email: string | null } | null;
  redditAccount: {
    id: string;
    username: string;
    karma: number;
  } | null;
};

export async function getBuyerStats(buyerId: string) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.as("total"),
      active: sql<number>`sum(case when status in ('available','claimed','published') then 1 else 0 end)`.as("active"),
      paid: sql<number>`sum(case when status in ('paid','verified') then 1 else 0 end)`.as("paid"),
      spendCents: sql<number>`coalesce(sum(case when status in ('paid','verified') then bounty_cents else 0 end), 0)`.as("spend"),
    })
    .from(s.posts)
    .where(eq(s.posts.buyerId, buyerId));
  return stats;
}

export async function getBuyerPosts(buyerId: string) {
  return db
    .select()
    .from(s.posts)
    .where(eq(s.posts.buyerId, buyerId))
    .orderBy(desc(s.posts.createdAt))
    .limit(50) as Promise<(typeof s.posts.$inferSelect)[]>;
}

export async function getBuyerPostWithClaims(
  buyerId: string,
  postId: string
): Promise<{
  post: typeof s.posts.$inferSelect;
  claims: ClaimRow[];
} | null> {
  const postRows = (await db
    .select()
    .from(s.posts)
    .where(and(eq(s.posts.id, postId), eq(s.posts.buyerId, buyerId)))
    .limit(1)) as (typeof s.posts.$inferSelect)[];
  const post = postRows[0];
  if (!post) return null;
  const claimRows = (await db
    .select({
      claim: s.claims,
      poster: { id: s.users.id, email: s.users.email },
      redditAccount: {
        id: s.redditAccounts.id,
        username: s.redditAccounts.redditUsername,
        karma: s.redditAccounts.karma,
      },
    })
    .from(s.claims)
    .leftJoin(s.users, eq(s.users.id, s.claims.posterId))
    .leftJoin(
      s.redditAccounts,
      eq(s.redditAccounts.id, s.claims.redditAccountId)
    )
    .where(eq(s.claims.postId, postId))
    .orderBy(desc(s.claims.claimedAt))) as unknown as ClaimRow[];
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
    .from(s.claims)
    .where(eq(s.claims.posterId, posterId));
  return stats;
}

export async function getPosterClaims(posterId: string): Promise<
  Array<{
    claim: typeof s.claims.$inferSelect;
    post: typeof s.posts.$inferSelect | null;
  }>
> {
  return (await db
    .select({
      claim: s.claims,
      post: s.posts,
    })
    .from(s.claims)
    .leftJoin(s.posts, eq(s.posts.id, s.claims.postId))
    .where(eq(s.claims.posterId, posterId))
    .orderBy(desc(s.claims.claimedAt))
    .limit(50)) as any;
}

export async function getRedditAccountsForUser(userId: string) {
  return db
    .select()
    .from(s.redditAccounts)
    .where(eq(s.redditAccounts.userId, userId)) as Promise<
    (typeof s.redditAccounts.$inferSelect)[]
  >;
}
