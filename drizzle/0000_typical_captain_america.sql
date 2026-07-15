CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`last_used_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `api_keys_user_idx` ON `api_keys` (`user_id`);--> statement-breakpoint
CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`poster_id` text NOT NULL,
	`reddit_account_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`claimed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`proof_url` text,
	`reddit_post_url` text,
	`submitted_at` integer,
	`verified_at` integer,
	`survival_checked_at` integer,
	`payout_cents` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`poster_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reddit_account_id`) REFERENCES `reddit_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `claims_post_idx` ON `claims` (`post_id`);--> statement-breakpoint
CREATE INDEX `claims_poster_idx` ON `claims` (`poster_id`);--> statement-breakpoint
CREATE INDEX `claims_status_idx` ON `claims` (`status`);--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`claim_id` text NOT NULL,
	`raised_by` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `disputes_claim_idx` ON `disputes` (`claim_id`);--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`method` text DEFAULT 'stripe' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`stripe_transfer_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payouts_user_idx` ON `payouts` (`user_id`);--> statement-breakpoint
CREATE INDEX `payouts_status_idx` ON `payouts` (`status`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`target_sub` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`link_url` text,
	`image_url` text,
	`tier` text DEFAULT 'random' NOT NULL,
	`bounty_cents` integer NOT NULL,
	`survival_guarantee` integer DEFAULT false NOT NULL,
	`sub_match_priority` integer DEFAULT false NOT NULL,
	`same_day_publish` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_buyer_idx` ON `posts` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `posts_status_idx` ON `posts` (`status`);--> statement-breakpoint
CREATE INDEX `posts_sub_idx` ON `posts` (`target_sub`);--> statement-breakpoint
CREATE TABLE `reddit_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reddit_username` text NOT NULL,
	`reddit_id` text NOT NULL,
	`karma` integer DEFAULT 0 NOT NULL,
	`account_age_days` integer DEFAULT 0 NOT NULL,
	`opted_subs` text DEFAULT ('[]') NOT NULL,
	`verified_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`survival_rate` real DEFAULT 1 NOT NULL,
	`total_posts` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reddit_accounts_reddit_username_unique` ON `reddit_accounts` (`reddit_username`);--> statement-breakpoint
CREATE UNIQUE INDEX `reddit_accounts_reddit_id_unique` ON `reddit_accounts` (`reddit_id`);--> statement-breakpoint
CREATE INDEX `reddit_accounts_user_idx` ON `reddit_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `reddit_accounts_username_idx` ON `reddit_accounts` (`reddit_username`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer,
	`name` text,
	`image` text,
	`role` text DEFAULT 'buyer' NOT NULL,
	`stripe_customer_id` text,
	`stripe_account_id` text,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verificationTokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
