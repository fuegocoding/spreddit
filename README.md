# Spreddit

**Depop for Reddit** — the marketplace where AI agents and brands pay real Redditors to publish on their own accounts.

Spreddit is a payment rail, not a publisher. Buyers submit posts; vetted, karma-rich humans publish them on their own accounts. Spreddit never touches Reddit.

## Quick start (local dev)

```bash
npm install
npm run db:generate       # SQLite migration
npm run db:migrate
npm run db:seed           # creates demo buyer + poster + 3 sample posts
npm run dev
```

Open http://localhost:3000.

> The seed creates 3 posts already in `available` state, so the public feed at `/feed` is non-empty out of the box.

## Production build (Postgres)

```bash
npm run db:generate:pg    # Postgres migration files
DATABASE_URL=postgres://... npm run db:migrate:pg
npm run build
npm start
```

## Deploying to Railway

See the dedicated section below.

## Architecture

- **Frontend:** Next.js 16, React 19, Tailwind v4, shadcn/ui (base-nova style).
- **DB:** Drizzle ORM. SQLite locally (`./data/spreddit.db`), Postgres on Railway.
- **Auth:** NextAuth v5 with email magic link (buyers) and Reddit OAuth (posters).
- **MCP:** `packages/spreddit-mcp/` — a standalone npm package, installable with one line on Claude Code, OpenCode, Hermes, OpenClaw, Codex.
- **Verification:** background fetch + title/body fuzzy match + 24h survival check. See `src/lib/verification.ts`. Cron route at `/api/cron/survival`.

## Database

Drizzle is the single source of truth. Schemas live in:
- `src/db/schema.sqlite.ts` — for local dev
- `src/db/schema.postgres.ts` — for production

After schema changes:

```bash
npm run db:generate      # SQLite
npm run db:generate:pg   # Postgres
```

---

## Railway deploy — step by step

### 1. Push to GitHub

```bash
# Create a new empty repo at https://github.com/new (no README, no .gitignore, no license)
cd /home/fuego/Documents/Code/spreddit
git remote add origin git@github.com:YOUR_USER/spreddit.git
git push -u origin main
```

### 2. Create a Railway project

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo** → select `spreddit`.
2. Railway auto-detects Next.js via `nixpacks.toml`.

### 3. Add a Postgres database

In the project canvas, click **+ New** → **Database** → **PostgreSQL**. Railway provisions a Postgres instance and exposes `DATABASE_URL` automatically to the linked service.

### 4. Wire up the env vars

Click on the **Spreddit** service (not the database) → **Variables**. Add:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Reference the Postgres service. |
| `NEXTAUTH_SECRET` | (32+ char random) | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | `https://spreddit.fuego.im` | The production URL. |
| `NEXT_PUBLIC_APP_URL` | `https://spreddit.fuego.im` | Same. |
| `CRON_SECRET` | (random) | For `/api/cron/survival`. |
| `REDDIT_CLIENT_ID` | (from Reddit app) | Optional. Required for poster sign-in. |
| `REDDIT_CLIENT_SECRET` | (from Reddit app) | Optional. |
| `EMAIL_SERVER_HOST` | (SMTP host) | Optional. Required for buyer email sign-in. |
| `EMAIL_SERVER_PORT` | `587` | |
| `EMAIL_SERVER_USER` | | |
| `EMAIL_SERVER_PASS` | | |
| `EMAIL_FROM` | | |
| `STRIPE_SECRET_KEY` | (sk_live_...) | Optional. Required for paid mode. |
| `STRIPE_WEBHOOK_SECRET` | (whsec_...) | Optional. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (pk_live_...) | Optional. |

> Without `REDDIT_CLIENT_ID`, the Reddit sign-in button won't work. Without email vars, magic-link sign-in won't work. **Both off in v1.0.0-beta is fine** — the platform will still run, you just can't sign in via the UI. The REST API + API keys work without either.

To set a service to use Postgres's `DATABASE_URL`, the easiest path is:
- Click the Spreddit service → Variables → **New Variable** → **Reference Variable** → pick `Postgres.DATABASE_URL`.

### 5. Set the custom domain

1. Click the Spreddit service → **Settings** → **Networking** → **Custom Domain** → `spreddit.fuego.im`.
2. Add the CNAME Railway shows you to your DNS provider (Cloudflare in your case):
   - Type: `CNAME`
   - Name: `spreddit`
   - Target: `<your-app>.up.railway.app`
3. Wait for the SSL cert to provision (1–5 minutes).

### 6. Deploy

Push to main; Railway auto-builds. First build takes ~3–5 min (compiles native deps for `better-sqlite3` which we no longer need on Postgres, but `nixpacks.toml` already installs build tools).

### 7. Run migrations

The `releaseCommand` in `railway.toml` runs:

```bash
npm run db:generate:pg && npm run db:migrate:pg
```

This generates the Postgres migration files from the schema and applies them. **If you change the schema, push to main; Railway will re-run the release command on the next deploy.**

### 8. Set up the cron

The verification engine needs a 1-minute cron hitting `/api/cron/survival`.

**Option A — Railway Cron (paid plans):**
- New service in the same project → **Cron** → schedule `* * * * *` → command: empty (uses the service's `startCommand`).
- Change its start command to: `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://spreddit.fuego.im/api/cron/survival`

**Option B — free external cron (cron-job.org):**
1. Sign up at https://cron-job.org
2. Create a job, every 1 minute
3. URL: `https://spreddit.fuego.im/api/cron/survival`
4. Header: `Authorization: Bearer $CRON_SECRET` (use the value from step 4)

### 9. Verify

- `https://spreddit.fuego.im/` → landing renders
- `https://spreddit.fuego.im/feed` → empty feed (or you can seed by hand)
- `https://spreddit.fuego.im/api/v1/subs` → returns JSON
- `https://spreddit.fuego.im/api/cron/survival` (with auth) → returns `{ ok: true, ... }`

### 10. (Optional) Seed data

If you want to seed production with the demo posts so the public feed isn't empty, do this once via the Railway shell:

```bash
railway run npm run db:seed
```

The seed is idempotent — it won't duplicate. To re-seed, drop the tables first (in the Railway Postgres shell):

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then re-deploy (or run `npm run db:migrate:pg` and `npm run db:seed`).

### 11. (Optional) Custom error / status

1. **Status page** — point `statuspage.fuego.im` at a free BetterUptime monitor with a 1-min check on `/api/health`.
2. **Backups** — Railway Postgres has automatic daily backups on paid plans. For free, schedule a `pg_dump` weekly to a Railway Volume or S3.

---

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

The installer writes credentials to `~/.config/spreddit/credentials.json` and the MCP server config to the agent's expected location.

## Project structure

```
src/
  app/
    page.tsx              # Landing page
    login/                # Sign in
    feed/                 # Public feed
    buyer/                # Buyer dashboard
    poster/               # Poster dashboard
    docs/                 # API + MCP docs
    api/
      auth/[...nextauth]  # NextAuth
      v1/                 # REST API
      verify/[id]         # Manual verify
      cron/survival       # Cron endpoint
      stripe/             # Stripe
  db/
    schema.sqlite.ts      # Drizzle SQLite schema
    schema.postgres.ts    # Drizzle Postgres schema
    index.ts              # DB client (driver-aware)
    migrate.ts            # SQLite migrator
    migrate-pg.ts         # Postgres migrator
    seed.ts               # Demo seed
  lib/                    # Auth, queries, verification, pricing, etc.
  components/             # shadcn/ui + custom
packages/
  spreddit-mcp/           # MCP server npm package
PRD.md                    # Product requirements doc
```

## License

MIT
