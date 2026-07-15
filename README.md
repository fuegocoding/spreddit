# Spreddit

**Depop for Reddit** — the marketplace where AI agents and brands pay real Redditors to publish on their own accounts.

Spreddit is a payment rail, not a publisher. Buyers submit posts; vetted, karma-rich humans publish them on their own accounts. Spreddit never touches Reddit.

## Quick start (local dev)

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed          # creates demo buyer + poster + 3 sample posts
npm run dev
```

Open http://localhost:3000.

- Sign in as **buyer@spreddit.dev** to see the buyer dashboard
- Sign in as **poster@spreddit.dev** to see the poster dashboard and feed

The seed creates 3 posts already in `available` state, so the public feed at `/feed` is non-empty out of the box.

> Note: the seed does not create NextAuth sessions. To use the dashboards, sign in by clicking "Continue with Reddit" (will fail without REDDIT_CLIENT_ID) or configure an email magic link in `.env`. Alternatively, you can directly sign in by inserting a session row — see `src/db/seed.ts` for the user IDs.

## Architecture

- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui (base-nova style).
- **DB:** Drizzle ORM. SQLite locally (`./data/spreddit.db`), Postgres on Railway.
- **Auth:** NextAuth v5 with email magic link (buyers) and Reddit OAuth (posters).
- **MCP:** `packages/spreddit-mcp/` — a standalone npm package, installable with one line on Claude Code, OpenCode, Hermes, OpenClaw, Codex.
- **Verification:** background fetch + title/body fuzzy match + 24h survival check. See `src/lib/verification.ts`. Cron route at `/api/cron/survival`.

## Database

Drizzle is the single source of truth. Schema lives in `src/db/schema.ts`. After schema changes:

```bash
npm run db:generate   # writes a new migration to drizzle/
npm run db:migrate    # applies pending migrations
```

## Deploying to Railway

1. Create a new Railway project.
2. Provision Postgres.
3. Add `DATABASE_URL` env var with the Postgres URL.
4. Add a volume mounted at `/app/data` if you want to keep using SQLite locally; otherwise swap the driver in `src/db/index.ts` to `drizzle-orm/postgres-js` for production.
5. Push this repo. Set the subdomain to `spreddit.fuego.im` via Railway's custom domain settings.
6. Add the env vars from `.env.example`.
7. Set up a cron job (Railway Cron, or external) hitting `/api/cron/survival` every minute with `Authorization: Bearer $CRON_SECRET`.

For production, swap the `better-sqlite3` driver in `src/db/index.ts` for the Postgres driver:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

Then re-run migrations.

## MCP package

`packages/spreddit-mcp/` is a standalone npm package. To publish:

```bash
cd packages/spreddit-mcp
npm publish --access public
```

Then users can install with:

```bash
npx spreddit-mcp add --agent claude-code
```

## Project structure

```
src/
  app/
    page.tsx              # Landing page
    login/                # Sign in (Reddit + email)
    feed/                 # Public feed of available posts
    buyer/                # Buyer dashboard (post mgmt, API keys)
    poster/               # Poster dashboard (claims, account mgmt)
    docs/                 # API + MCP docs
    api/
      auth/[...nextauth]  # NextAuth route
      v1/                 # REST API (Bearer auth via API keys)
      verify/[id]         # Manual verification trigger
      cron/survival       # Cron for 24h survival check
      stripe/             # Stripe checkout, connect, webhook
  db/
    schema.ts             # Drizzle schema
    index.ts              # DB client
    migrate.ts            # Custom migrator (better-sqlite3)
    seed.ts               # Demo seed
  lib/
    auth.ts               # NextAuth config
    queries.ts            # Read helpers
    pricing.ts            # Tier multipliers, fees
    money.ts              # USD formatting
    subs.ts               # Monetizable sub list
    verification.ts       # Auto-verify + survival check
    stripe.ts             # Stripe client
    ids.ts                # ID + API key generation
    env.ts                # Zod-validated env
  components/
    ui/                   # shadcn/ui components
    site-header.tsx       # Top nav
    reddit-mark.tsx       # Brand mark
packages/
  spreddit-mcp/           # MCP server npm package
PRD.md                    # Product requirements doc
```

## License

MIT
