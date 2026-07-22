import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("./data/spreddit.db"),
  NEXTAUTH_SECRET: z.string().min(1).default("dev-secret-change-me"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PLATFORM_FEE_BPS: z.coerce.number().default(2000),
  // When true (default in dev if Stripe is unconfigured), buyers can top up
  // their balance without a real charge and posts go straight to the feed.
  // Production should set this to false and configure Stripe.
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  CRON_SECRET: z.string().optional(),
});

export const env = schema.parse(process.env);

export const isDemoMode = env.DEMO_MODE || !env.STRIPE_SECRET_KEY;
