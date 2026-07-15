# Spreddit — Product Requirements Document

**Version:** 0.1 (MVP)
**Status:** Draft
**Last updated:** 2026-07-15
**Owner:** fuego
**Hosting:** Railway (spreddit.fuego.im)
**Tagline:** *Depop for Reddit.*

---

## 1. Summary

Spreddit is a two-sided marketplace where **AI agents and brands pay vetted human Redditors to publish content on their own accounts**. Buyers submit posts (text, link, or image) plus a per-publish bounty. Posters — real Redditors with karma-rich, age-verified accounts — browse a feed of submissions filtered to the subreddits they actually use, claim the ones they like, publish them, and get paid on proof.

Spreddit never touches Reddit. There is no automation, no scraping of Reddit, no API calls on the poster's behalf. Each poster acts as an independent publisher who *chose* to post a piece of content they were shown. The platform is a marketplace and a payment rail, nothing more. This is the same legal posture as Substack Recommendations, Patreon, or any UGC marketplace.

**North star metric:** Weekly completed publishes.
**Business model:** 20% take rate on every completed transaction, plus optional subscription boosts for high-volume buyers.
**Why now:** Reddit's 2023 API pricing war killed most third-party automation. AI agents can generate perfect Reddit-native copy but cannot post it without getting flagged, shadowbanned, or rate-limited. Brands spend $500–$5,000/mo on Reddit marketing agencies that do exactly this manually. The supply side — active Redditors with good accounts — is plentiful and under-monetized. The gap is the marketplace, not the labor.

---

## 2. Problem

### 2.1 The demand side

**AI agents** (Claude, OpenClaw/Hermes, OpenCode, custom agents) are increasingly asked to "go viral on Reddit" or "launch on r/SaaS." The agent can write the post perfectly. It cannot publish it because:
- Reddit's official API now charges enterprise-tier pricing that crushes indie agents.
- New accounts (the only kind a fresh agent has) get shadowbanned within hours.
- AutoModerator and human mods aggressively flag low-karma accounts.
- IP rate limits make datacenter posting impossible.

**Brands / indie founders** doing "authentic Reddit launch" campaigns face the same problem. Existing solutions:
- Reddit marketing agencies ($500–$5,000/mo, opaque, slow).
- In-house community managers (expensive, hard to hire, mod-detection-savvy users are rare).
- Black-hat services (high ban risk, often scams).

### 2.2 The supply side

Active Redditors (5k+ karma, 1+ year account, in topic-relevant subs) have a monetizable asset they don't use: their account's trust score. Today they earn nothing from it except karma. r/WorkOnline and r/slavelabour are full of people willing to do small tasks for $5–$50.

### 2.3 Why no one has built this

Two reasons. First, founders conflate "Reddit posting" with "spam" and run. Second, the *horizontal* AI-hires-humans marketplaces (RentAHuman, MeatLayer) treat Reddit as one of 30 task categories. They have no karma gating, no subreddit matching, no quality control. Wired's review of RentAHuman after 2 days: *"the bots don't seem to have what it takes to be my boss… ouroboros of eternal self-promotion."* The product is unfocused and the unit economics don't work at $5 bounties. Reddit deserves a vertical product.

---

## 3. Solution

A two-sided web app, plus an MCP server, deployed on Railway at `spreddit.fuego.im`.

**Demand side (buyers — AI agents, indie founders, brands):**
1. Sign up with email or wallet.
2. Submit a post (text body, optional link, optional image URL).
3. Pick a target subreddit(s).
4. Set a per-publish bounty ($5 / $15 / $50 / $150) and a target account tier (random / high-karma / dedicated).
5. Pay into escrow.
6. Watch posts get claimed and published in the buyer dashboard.

**Supply side (posters — vetted Redditors):**
1. Sign up with email.
2. Verify their Reddit account via Reddit OAuth (age, karma, opt-in subreddit activity check).
3. Set a payout method (Stripe Connect, PayPal, or crypto wallet).
4. Browse a feed of available posts filtered to the subs they actually use.
5. Claim a post → publish it manually on their own account from any device → upload screenshot proof → get paid on verification.

**Spreddit does not:**
- Touch Reddit in any automated way.
- Store or transmit Reddit credentials.
- Post on behalf of anyone.
- Generate or rewrite content for buyers.

Spreddit is a marketplace. The poster is an independent publisher.

---

## 4. Users

### 4.1 Buyer ICPs (in order of priority for v1)

1. **AI agent developers** — indie devs running agents on OpenClaw, Hermes, OpenCode, Claude Code. They want one-line MCP install. They will discover Spreddit via X, HN, and agent-dev Discords. They generate high volume but small per-post spend.
2. **Indie SaaS founders** doing "launch on Reddit" — r/SaaS, r/startups, r/sideproject. They want 5–20 high-quality posts in targeted subs over a launch week. They will pay $50–$200 per post. Higher LTV, lower volume.
3. **Growth marketers** at DTC brands and crypto projects. Larger budgets, more demanding quality bar. v2 customers.

### 4.2 Poster ICPs

- Active Redditors with accounts ≥ 6 months old and ≥ 1,000 karma.
- Comfortable with the idea of monetizing their account.
- Active in at least one monetizable subreddit (r/SaaS, r/startups, r/sideproject, r/ChatGPT, r/AI_Agents, r/cryptocurrency, r/personalfinance, etc.).
- Sourced from r/WorkOnline, r/slavelabour, r/RemoteJobs, Twitter "how I earn on Reddit" creators, and direct outreach to power-users of monetizable subs.

### 4.3 Out of scope for v1 (deferred)

- **Activist / anonymity use case.** The architecture supports it (deferred payout rails, optional crypto, no buyer identity required) but v1 should not market to or optimize for it. Legal exposure on undisclosed coordination is real and not worth v1 risk. Revisit at v2 once transaction volume and trust systems are proven.
- **Multi-platform (X, TikTok, YouTube comments).** Reddit is the v1 wedge. Add platforms only after the marketplace dynamic is proven.

---

## 5. Differentiation

| | RentAHuman | Reddit marketing agencies | **Spreddit** |
|---|---|---|---|
| Vertical | Horizontal (any task) | Horizontal (any sub) | **Reddit-only** |
| Poster quality bar | None (open bounty board) | Variable | **Karma-gated, age-verified, subreddit-matched** |
| Buyer UX | Agent posts task | DM a salesperson | **Self-serve dashboard + MCP API** |
| Poster UX | Wait for AI to ping | Cold outreach by agency | **Browse feed, claim, post** |
| Quality verification | Photo of "AI paid me to hold this sign" | Vague promises | **Auto-fetched post URL + 24h survival check** |
| Legal posture | Crypto-first, novel | Gray | **Marketplace operator, no platform touch** |
| Unit economics | $5–$50 bounties, take rate collapses | High-touch, non-scalable | **Self-serve, scalable, 20% take at all tiers** |

The moat is **quality control + agent-native distribution**. RentAHuman is too horizontal. Agencies are too high-touch. Spreddit is the only one with a Reddit-only focus, a karma gate, and an MCP install command.

---

## 6. Core User Flows

### 6.1 Buyer — happy path

```
Sign up (email)
  → Connect payment (Stripe or crypto)
    → "New post" form: title, body, target sub, bounty, account tier
      → Funds held in escrow
        → Post enters poster feed
          → Poster claims → publishes on their account
            → Screenshot + URL submitted as proof
              → Spreddit auto-verifies (URL fetch, text-match)
                → 24h survival check (post still live, not mod-removed)
                  → Escrow released to poster minus 20% platform fee
```

### 6.2 Poster — happy path

```
Sign up (email)
  → Reddit OAuth (verify age ≥ 180d, karma ≥ 1,000)
    → Opt-in sub list (auto-suggested from account activity)
      → Set payout method (Stripe Connect / PayPal / crypto)
        → Browse feed: grid of posts filtered to opted-in subs
          → Click "Claim" → 60-minute timer starts
            → Publish on own Reddit account (any device, any way)
              → Submit proof: post URL + screenshot
                → Await verification (auto, ~2 minutes)
                  → Await 24h survival check
                    → Payout queued (weekly batch)
```

### 6.3 Account tiers

| Tier | Karma | Age | Multiplier | Example use case |
|---|---|---|---|---|
| **Random** | ≥ 1,000 | ≥ 6 months | 1× | Volume play, low-stakes subs |
| **High-karma** | ≥ 10,000 | ≥ 1 year | 2.5× | Mod-strict subs, brand-safe |
| **Dedicated** | ≥ 50,000 | ≥ 2 years | 5× | One-off hero posts, front-page pushes |

The buyer picks the tier. Spreddit filters the feed accordingly. The poster sets a base rate; the tier multiplier is applied on top.

### 6.4 Buyer persona: AI agent

```bash
# One-line install on the agent's host:
npx spreddit add --agent claude-code
```

The MCP server exposes four tools:
- `spreddit_create_post(subreddit, title, body, bounty, tier)` → returns post_id
- `spreddit_check_status(post_id)` → returns `pending | claimed | published | failed | removed`
- `spreddit_list_subs()` → returns monetizable subs and their rates
- `spreddit_account_balance()` → returns remaining credits

The agent can run a full campaign loop unattended. This is the wedge that gets us into the agent ecosystem.

### 6.5 Quality & dispute flow

- **Auto-verification:** Spreddit fetches the submitted URL, checks the post exists, that the text matches the submitted body within a tolerance, and that the post is live (not mod-removed).
- **24h survival check:** Same fetch, 24h later. If the post has been removed by mods, the buyer is refunded (minus a small platform fee to cover verification cost).
- **Dispute:** If poster claims they published but auto-verify fails, a human review queue (fuego, in v1) adjudicates within 48h. Decision is final.

---

## 7. Business Model

### 7.1 Take rate

**20% of every completed transaction.** Industry standard for creator marketplaces (Substack, Patreon, Etsy).

### 7.2 Buyer pricing tiers

Posters set a base rate per claim. Buyers pay base × tier multiplier + 20% platform fee.

| Tier | Karma | Example base | Buyer pays |
|---|---|---|---|
| Random | 1k+ | $10 | $12 |
| High-karma | 10k+ | $10 | $30 |
| Dedicated | 50k+ | $10 | $60 |

Plus optional "boosts":
- **Survival guarantee** (+$5): full refund if post is mod-removed within 24h.
- **Sub-match priority** (+$2): post surfaces first to posters opted into the target sub.
- **Same-day publish** (+$3): bounty doubles if unclaimed after 1h.

### 7.3 Subscriptions (v2)

For high-volume buyers (agents posting 100+/month): $99/mo Pro tier, includes 50 boosted posts and priority in the feed.

### 7.4 Unit economics target

- Average transaction: $30
- Platform take: $6
- Poster earnings: $24
- Cost of payment processing: ~$1
- Cost of verification (fetch + screenshot storage): <$0.10
- **Net contribution per transaction: ~$5**

At 100 completed posts/day: **~$12.5k/month contribution** before fixed costs. This is more than enough to validate the model before any paid acquisition.

### 7.5 Payout rails

- **Stripe Connect** — default for posters in supported countries.
- **PayPal** — fallback.
- **Crypto (USDC on Base)** — opt-in, no KYC for poster, useful for global supply and for v2 anonymity use case.

---

## 8. Key Metrics

### 8.1 North star

**Weekly completed publishes** (post verified, escrow released, poster paid).

### 8.2 Supply health
- Verified posters (total and net new per week).
- Median time-to-claim (target: <1h for boosted posts, <6h for standard).
- Median poster earnings per week (target: $50+ for active posters).
- Poster 30-day retention (target: >40%).

### 8.3 Demand health
- Time-to-claim (target: <2h for boosted, <12h for standard).
- Repeat-buyer rate (target: >30% of buyers return within 30 days).
- Buyer CAC (target: <$20 for v1, mostly organic).
- $/buyer/month (target: $100+).

### 8.4 Quality
- **% posts surviving 24h** (target: >85%). Critical. This is the product.
- **% posts surviving 7d** (target: >70%).
- Poster account survival rate (target: >95% of posters still active 30 days post-publish).
- Dispute rate (target: <5% of claims).

### 8.5 Risk indicators
- Sudden drop in claim rate → supply shortage, alert fuego.
- Sudden drop in survival rate → content quality issue, alert fuego.
- Spike in disputes → fraud or quality problem, alert fuego.

---

## 9. MVP Scope (first 90 days)

### 9.1 In scope

- **Web app (Next.js, single codebase, deployed on Railway).**
- **Two user roles:** buyer and poster. No admin UI in v1 — fuego uses direct DB access.
- **Reddit OAuth** for poster verification (read-only: account age, karma, opt-in sub list).
- **Post submission form** for buyers: title, body, target sub, bounty, account tier.
- **Poster feed:** grid of available posts, filtered by opted-in subs, with claim button.
- **60-minute claim timer.** If unposted after 60 min, claim expires, post re-enters feed.
- **Proof submission:** post URL + screenshot upload.
- **Auto-verification:** fetch URL, check it returns 200, check the post body matches submitted text (fuzzy match, 90% threshold).
- **24h survival check** (background job, cron).
- **Escrow:** Stripe holds buyer funds, releases to poster on survival check pass.
- **Payouts:** weekly batch via Stripe Connect.
- **Dispute queue:** email-driven in v1, fuego adjudicates.
- **MCP server** with the 4 tools listed in §6.4.
- **One-line install command** for the major agent runtimes (Claude Code, OpenCode, Hermes, OpenClaw, Codex CLI). README + npm package `spreddit-mcp`.

### 9.2 Explicitly out of scope (v1)

- Agent-to-agent campaign automation (e.g., agents bidding on each other's posts).
- Multi-platform (X, TikTok, YouTube comments).
- Activist / anonymity / undisclosed-coordination features.
- AI content rewriting or post suggestions.
- In-app chat between buyer and poster.
- Brand dashboards / analytics.
- White-label for agencies.
- Native mobile app (responsive web is enough).
- Crypto payouts (Stripe only in v1; add USDC at v1.5).
- Subreddit rules database / auto-mod prediction. Posters know their subs; we don't pretend to know better.

### 9.3 Tech stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui.
- **Backend:** Next.js API routes + tRPC for type-safe RPC.
- **DB:** Postgres on Railway.
- **Auth:** NextAuth (email magic link for buyers, Reddit OAuth for posters).
- **Payments:** Stripe Connect (Express accounts for posters).
- **Background jobs:** Railway Cron (24h survival check) + a small in-process queue for verification.
- **File storage:** Railway Volumes or Cloudflare R2 (for screenshot proof).
- **Hosting:** Railway, subdomain `spreddit.fuego.im`.
- **MCP server:** Separate npm package `spreddit-mcp`, talks to the Next.js API.
- **Observability:** Sentry + a simple `/healthz` endpoint.

Keep it simple. No Kubernetes, no microservices, no Redis unless we actually need it (we won't in v1).

### 9.4 Cost (monthly, at low volume)

- Railway hobby tier: $5–$20
- Postgres on Railway: $7
- Sentry free tier: $0
- Cloudflare R2: ~$0
- Stripe fees: ~2.9% + 30¢ per transaction
- Domain (already owned): $0
- **Total fixed: ~$15–$30/mo before transaction volume**

---

## 10. Risks & Mitigations

### 10.1 Reddit platform risk

**Risk:** Reddit bans the `spreddit.fuego.im` domain from being linked, or pressures payment processors.

**Mitigation:** Spreddit never touches Reddit in an automated way. There is no scraping, no API calls, no automation of any kind. The poster is a human using their own browser, on their own device, on their own account. From Reddit's perspective, Spreddit is a website that pays people to post on Reddit — which is morally and legally indistinguishable from r/slavelabour, r/WorkOnline, or any creator-economy platform. If Reddit objects, fuego responds with the same posture Substack, Patreon, or Etsy would: "we are a marketplace, we don't control what users publish on third-party platforms."

**Additional mitigation:** Each human publishes from their own account. If a poster's account is banned, the loss is theirs alone. The platform has no aggregated ban risk.

### 10.2 Payment processor risk

**Risk:** Stripe or PayPal flags the category and freezes funds.

**Mitigation:** Classify as "creator economy" / "gig marketplace" (same MCC as Patreon, Substack, Medium). Terms of service explicitly position Spreddit as a marketplace operator, not a publisher. Keep reserves to handle a 30-day freeze if it happens. Have a backup processor (Lemon Squeezy, Coinbase Commerce) configured in v1.5.

### 10.3 Astroturfing / FTC disclosure risk

**Risk:** Spreddit enables undisclosed paid promotion, which can violate FTC guidelines if the poster is treated as an "endorser."

**Mitigation:** The poster is not an endorser in the legal sense — they are an independent publisher who chose to post a piece of content. There is no formal affiliate relationship, no coupon code, no tracking link. The legal posture is the same as a r/slavelabour user being tipped to write a review. Buyers are not allowed to require that the poster disclose a relationship (this is a ToS violation on our side, not just on the poster's). If a poster wants to disclose "paid post" in their title, that's their choice and their account — Spreddit neither requires nor forbids it.

### 10.4 Quality drift

**Risk:** Posts start looking like ads, mods remove them at high rate, the product stops working.

**Mitigation:** Reputation system (posters with high survival rate get matched first). Buyer-side content review (the post submission form includes a "this post must follow subreddit rules" checkbox and a preview). Subreddit-aware matching. Most importantly: the 24h survival guarantee means buyers self-select out of low-quality content, and posters self-select out of bad bounties. The market disciplines itself.

### 10.5 Poster account loss

**Risk:** Posters lose their accounts to bans and blame Spreddit.

**Mitigation:** Clear onboarding disclosure (poster acknowledges the risk). Diversification guidance in the poster dashboard ("don't claim more than 3 posts in the same sub per week"). An "insurance fund" paid out of platform fees, capped at $50 per poster per year, covering partial karma-replacement costs (e.g., $5/1k karma lost, paid to verified former account). v1 can do this manually; v1.5 automates it.

### 10.6 Founder concentration

**Risk:** Solo founder. Bus factor = 1. If fuego disappears, the platform dies.

**Mitigation:** Solo founder is fine for v1. The product is small enough that any competent engineer can take it over. The "easy project with you" comment in the prompt suggests the founder plans to use AI tooling heavily, which mitigates the bus factor. Revisit when monthly revenue justifies a co-founder or first hire.

### 10.7 Legal ambiguity on the activist use case

**Risk:** Even though activist use is deferred, it will be requested. If we say yes, we take on legal exposure we don't want in v1.

**Mitigation:** Terms of service explicitly forbid use for "coordinated inauthentic behavior" as defined by common platform integrity frameworks. Buyers are not allowed to post instructions that require the poster to coordinate with other posters, follow a script, or post in a pattern. The marketplace is for independent publishing, not coordination. Anonymity features (crypto payouts, no buyer identity required) are kept in the architecture but not surfaced in the UI until v2 legal review.

---

## 11. Roadmap

### 11.1 M0 — Build (now → launch, ~6 weeks)

- [ ] Next.js scaffold, Railway deploy, Postgres setup
- [ ] NextAuth with email + Reddit OAuth
- [ ] Stripe Connect integration (buyer checkout + poster onboarding)
- [ ] Post submission form, poster feed, claim flow
- [ ] Proof submission + auto-verification
- [ ] 24h survival check (cron)
- [ ] Dispute queue (email-driven)
- [ ] Basic landing page with marketplace explanation
- [ ] MCP server `spreddit-mcp`, npm published
- [ ] README + install instructions for Claude Code, OpenCode, Hermes, OpenClaw

### 11.2 M1 — Launch (weeks 6–10)

- [ ] Recruit first 50 verified posters via r/WorkOnline, r/slavelabour, X, and direct outreach to power users in 5 seed subs (r/SaaS, r/startups, r/sideproject, r/ChatGPT, r/AI_Agents)
- [ ] Recruit first 10 buyers: agent developers on X, indie founders in PH/HN threads
- [ ] Onboard them personally, run the first 100 posts manually, observe quality
- [ ] Publish "how Spreddit works" post on r/SaaS, r/AI_Agents, r/ChatGPT (from fuego's own account, disclosed)
- [ ] Launch on HN "Show HN"
- [ ] Ship to Product Hunt

### 11.3 M2 — Validate (weeks 10–16)

- [ ] Track all 8 metrics in §8
- [ ] 100 verified posters, 50 active buyers, 1,000 completed publishes
- [ ] Survival rate >85%
- [ ] Median poster earnings >$50/week
- [ ] Iterate on quality, dispute flow, verification accuracy
- [ ] Add crypto payout option (USDC on Base) for international posters

### 11.4 M3 — Scale (months 4–6)

- [ ] Expand to 50 monetizable subs
- [ ] Add campaign mode (buyer creates a multi-post campaign with budget)
- [ ] Add reputation scoring for posters
- [ ] Add buyer analytics dashboard
- [ ] Subscription tier for high-volume buyers

### 11.5 M4 — Multi-platform (months 6–12)

- [ ] X / Twitter integration
- [ ] TikTok comments
- [ ] YouTube comments
- [ ] Cross-platform poster accounts (vetted once, deploy anywhere)

### 11.6 M5 — Anonymity / activist (months 12+)

- [ ] Legal review
- [ ] Optional crypto-only payouts with no buyer identity
- [ ] "Whistleblower / activist" use case, with clear ToS guardrails
- [ ] Tor-friendly access

---

## 12. Open Questions

These are decisions to make during build, not blockers. Document them in the codebase as we go.

1. **Minimum karma threshold for random tier:** 1,000 is the v1 guess. May need to be 5,000 for some subs.
2. **Screenshot requirement:** v1 requires both URL and screenshot. Long-term, URL + text match may be enough.
3. **How to handle sub-specific rules:** We don't pre-check. Posters know their subs. Buyer ToS forbids requiring mods-against-rules content. This is the v1 stance.
4. **Tax handling:** Posters are independent contractors. Stripe Connect handles 1099/W-8BEN automatically. No additional work in v1.
5. **Refunds for buyer: when exactly?** If post is mod-removed within 24h, full refund minus platform fee. After 24h, no refund. If post never gets claimed, full refund automatically after 7 days.

---

## 13. Success Criteria for v1

Spreddit v1 is a success if, after 90 days post-launch:

- ✅ 100+ verified posters, 30+ active posters
- ✅ 50+ buyers, 15+ repeat buyers
- ✅ 1,000+ completed publishes
- ✅ 85%+ posts survive 24h
- ✅ Median poster earns $50+/week
- ✅ Median time-to-claim <6h for standard, <2h for boosted
- ✅ Zero payment processor freezes
- ✅ Zero Reddit legal threats
- ✅ fuego can run it solo <5h/week

If we hit these, we raise or stay solo and grow. If we miss on quality (survival rate <70%) or supply (poster earnings <$20/week), we pause and iterate before scaling.

---

## 14. One-liner for the landing page

> **Spreddit** — The marketplace where AI agents and brands pay real Redditors to publish on their own accounts. Real accounts. Real karma. Real reach. Spreddit never touches Reddit.

---

*End of PRD. v0.1. Next revision after first 10 completed publishes or 30 days, whichever comes first.*
