import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "timestamp" }),
    name: text("name"),
    image: text("image"),
    role: text("role", { enum: ["buyer", "poster", "admin"] })
      .notNull()
      .default("buyer"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeAccountId: text("stripe_account_id"),
    balanceCents: integer("balance_cents").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

export const redditAccounts = sqliteTable(
  "reddit_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redditUsername: text("reddit_username").notNull().unique(),
    redditId: text("reddit_id").notNull().unique(),
    karma: integer("karma").notNull().default(0),
    accountAgeDays: integer("account_age_days").notNull().default(0),
    optedSubs: text("opted_subs", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`('[]')`),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    status: text("status", { enum: ["pending", "active", "banned", "suspended"] })
      .notNull()
      .default("pending"),
    survivalRate: real("survival_rate").notNull().default(1.0),
    totalPosts: integer("total_posts").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("reddit_accounts_user_idx").on(t.userId),
    index("reddit_accounts_username_idx").on(t.redditUsername),
  ]
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetSub: text("target_sub").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    linkUrl: text("link_url"),
    imageUrl: text("image_url"),
    tier: text("tier", { enum: ["random", "high_karma", "dedicated"] })
      .notNull()
      .default("random"),
    bountyCents: integer("bounty_cents").notNull(),
    survivalGuarantee: integer("survival_guarantee", { mode: "boolean" })
      .notNull()
      .default(false),
    subMatchPriority: integer("sub_match_priority", { mode: "boolean" })
      .notNull()
      .default(false),
    sameDayPublish: integer("same_day_publish", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status", {
      enum: [
        "pending_payment",
        "available",
        "claimed",
        "published",
        "verified",
        "paid",
        "failed",
        "refunded",
      ],
    })
      .notNull()
      .default("pending_payment"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  },
  (t) => [
    index("posts_buyer_idx").on(t.buyerId),
    index("posts_status_idx").on(t.status),
    index("posts_sub_idx").on(t.targetSub),
  ]
);

export const claims = sqliteTable(
  "claims",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    posterId: text("poster_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redditAccountId: text("reddit_account_id")
      .notNull()
      .references(() => redditAccounts.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: [
        "active",
        "proof_submitted",
        "verified",
        "rejected",
        "expired",
        "survived",
        "removed",
      ],
    })
      .notNull()
      .default("active"),
    claimedAt: integer("claimed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    proofUrl: text("proof_url"),
    redditPostUrl: text("reddit_post_url"),
    submittedAt: integer("submitted_at", { mode: "timestamp" }),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    survivalCheckedAt: integer("survival_checked_at", { mode: "timestamp" }),
    payoutCents: integer("payout_cents").notNull(),
  },
  (t) => [
    index("claims_post_idx").on(t.postId),
    index("claims_poster_idx").on(t.posterId),
    index("claims_status_idx").on(t.status),
  ]
);

export const payouts = sqliteTable(
  "payouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    method: text("method", { enum: ["stripe", "paypal", "crypto"] })
      .notNull()
      .default("stripe"),
    status: text("status", {
      enum: ["queued", "processing", "paid", "failed"],
    })
      .notNull()
      .default("queued"),
    stripeTransferId: text("stripe_transfer_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    paidAt: integer("paid_at", { mode: "timestamp" }),
  },
  (t) => [
    index("payouts_user_idx").on(t.userId),
    index("payouts_status_idx").on(t.status),
  ]
);

export const disputes = sqliteTable(
  "disputes",
  {
    id: text("id").primaryKey(),
    claimId: text("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    raisedBy: text("raised_by", { enum: ["buyer", "poster", "system"] })
      .notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["open", "resolved", "rejected"] })
      .notNull()
      .default("open"),
    resolution: text("resolution"),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("disputes_claim_idx").on(t.claimId)]
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("api_keys_user_idx").on(t.userId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  redditAccounts: many(redditAccounts),
  posts: many(posts),
  claims: many(claims),
  payouts: many(payouts),
  apiKeys: many(apiKeys),
}));

export const redditAccountsRelations = relations(redditAccounts, ({ one, many }) => ({
  user: one(users, { fields: [redditAccounts.userId], references: [users.id] }),
  claims: many(claims),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  buyer: one(users, { fields: [posts.buyerId], references: [users.id] }),
  claims: many(claims),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  post: one(posts, { fields: [claims.postId], references: [posts.id] }),
  poster: one(users, { fields: [claims.posterId], references: [users.id] }),
  redditAccount: one(redditAccounts, {
    fields: [claims.redditAccountId],
    references: [redditAccounts.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RedditAccount = typeof redditAccounts.$inferSelect;
export type NewRedditAccount = typeof redditAccounts.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Dispute = typeof disputes.$inferSelect;
export type NewDispute = typeof disputes.$inferInsert;
