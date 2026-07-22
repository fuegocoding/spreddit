import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TIER_LABEL,
  TIER_PRICE_CENTS,
  calculatePosterEarnings,
  BOOST_PRICE_CENTS,
} from "@/lib/pricing";
import { formatUsd } from "@/lib/money";
import { ALL_SUGGESTED_SUB_NAMES } from "@/lib/subs";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-16">
      <h1 className="font-sans text-4xl font-extrabold tracking-tight">API & MCP docs</h1>
      <p className="mt-2 text-muted-foreground">
        Two ways to drive Spreddit: a JSON REST API, and an MCP server that
        installs in one line.
      </p>

      <Section title="1. Get an API key">
        <p>Sign in at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/login</code>, then go to <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/buyer/api-keys</code> and create a key.</p>
        <CodeBlock>{`spk_live_5b1f7a9c...`}</CodeBlock>
        <p>Pass it as a Bearer token. Shown only once at creation.</p>
      </Section>

      <Section title="2. REST API">
        <p>All endpoints accept JSON and require <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer spk_live_...</code>.</p>
        <Endpoint method="GET" path="/api/v1/subs" desc={`List ${ALL_SUGGESTED_SUB_NAMES.length} discovered subs. The platform accepts any valid sub name; this list is just for discovery.`} />
        <Endpoint method="GET" path="/api/v1/account" desc="Wallet balance and stats." />
        <Endpoint method="POST" path="/api/v1/posts" desc="Create a post. Deducted from your wallet balance. Returns remaining balance." />
        <Endpoint method="GET" path="/api/v1/posts/:id" desc="Get post + claim status. Poll every 30-60s." />
        <h3 className="mt-6 font-sans font-bold">Example: top up wallet, then create a post</h3>
        <CodeBlock>{`# 1. Top up wallet (or use demo mode in dev)
curl -X POST https://spreddit.fuego.im/api/wallet/topup \\
  -H "Authorization: Bearer spk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"amountCents": 5000}'

# 2. Create a post
curl -X POST https://spreddit.fuego.im/api/v1/posts \\
  -H "Authorization: Bearer spk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetSub": "SaaS",
    "title": "I built a Reddit post marketplace",
    "body": "Hey r/SaaS - I built Spreddit...",
    "tier": "high_karma",
    "subMatchPriority": true
  }'`}</CodeBlock>
        <h3 className="mt-6 font-sans font-bold">Response</h3>
        <CodeBlock>{`{
  "id": "ps_8e7f...",
  "status": "available",
  "bountyCents": 699,
  "boostCents": 200,
  "totalChargedCents": 899,
  "platformFeeCents": 140,
  "posterPayoutCents": 559,
  "remainingBalanceCents": 4101
}`}</CodeBlock>
        <p className="mt-2 text-sm">If the wallet has insufficient funds, the API returns <code className="text-xs">402 Payment Required</code> with the shortfall.</p>
      </Section>

      <Section title="3. MCP server (one-line install)">
        <p>For AI agents. Works with any MCP-supporting runtime.</p>
        <CodeBlock>{`npx spreddit-mcp add --agent claude-code
npx spreddit-mcp add --agent opencode
npx spreddit-mcp add --agent hermes
npx spreddit-mcp add --agent openclaw
npx spreddit-mcp add --agent codex
npx spreddit-mcp add --agent cursor
npx spreddit-mcp add --agent windsurf

# Or any agent: just point at its MCP config file
npx spreddit-mcp add --agent my-agent --config ~/.my-agent/mcp.json`}</CodeBlock>
        <h3 className="mt-6 font-sans font-bold">Tools exposed</h3>
        <Tool name="spreddit_create_post" desc="Create a post. Deducts from your wallet balance." args='{ subreddit, title, body, tier, survivalGuarantee?, subMatchPriority?, sameDayPublish? }' />
        <Tool name="spreddit_check_status" desc="Get the current status of a post." args='{ post_id }' />
        <Tool name="spreddit_list_subs" desc="List discovered subs. The platform accepts any valid sub name." args="" />
        <Tool name="spreddit_account_balance" desc="Check wallet balance and stats." args="" />
        <h3 className="mt-6 font-sans font-bold">Example: campaign loop</h3>
        <CodeBlock>{`const post = await spreddit_create_post({
  subreddit: "SaaS",
  title: "I built a Reddit post marketplace",
  body: "...",
  tier: "high_karma",
});

while (true) {
  const s = await spreddit_check_status({ post_id: post.id });
  if (["verified","paid","failed"].includes(s.status)) break;
  await sleep(60_000);
}`}</CodeBlock>
      </Section>

      <Section title="4. Pricing">
        <p>Flat per post. Price depends on account quality tier.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(["random", "high_karma", "dedicated"] as const).map((t) => (
            <div key={t} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold">{TIER_LABEL[t]}</span>
              </div>
              <div className="mt-2 text-2xl font-sans font-black">
                {formatUsd(TIER_PRICE_CENTS[t], { withCents: true })}
              </div>
              <div className="text-xs text-muted-foreground">
                poster earns {formatUsd(calculatePosterEarnings(TIER_PRICE_CENTS[t]), { withCents: true })}
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-6 font-sans font-bold">Boosts (stack on any tier)</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li><Badge variant="outline">survival_guarantee</Badge> +{formatUsd(BOOST_PRICE_CENTS.survival_guarantee)} - full refund if mod-removed within 24h</li>
          <li><Badge variant="outline">sub_match_priority</Badge> +{formatUsd(BOOST_PRICE_CENTS.sub_match_priority)} - surfaces first to opted-in posters</li>
          <li><Badge variant="outline">same_day_publish</Badge> +{formatUsd(BOOST_PRICE_CENTS.same_day_publish)} - bounty doubles if unclaimed after 1h</li>
        </ul>
      </Section>

      <Section title="5. Subreddit targeting">
        <p>Any valid subreddit name is accepted. Names must be 2-21 characters of letters, numbers, and underscores. The platform does not maintain a whitelist.</p>
        <p className="mt-2">We expose a discovery list of {ALL_SUGGESTED_SUB_NAMES.length} popular subs via <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/api/v1/subs</code>, but you can target any sub that exists on Reddit.</p>
      </Section>

      <Section title="6. Status lifecycle">
        <ul className="mt-2 space-y-1 text-sm">
          <li><Badge variant="outline">available</Badge> - in the feed, posters can claim</li>
          <li><Badge>claimed</Badge> - a poster has 60 min to publish and submit proof</li>
          <li><Badge>proof_submitted</Badge> - auto-verifier is fetching the URL</li>
          <li><Badge>verified</Badge> - URL is live and matches; 24h survival timer starts</li>
          <li><Badge variant="default">paid</Badge> - survived 24h, payout queued for next weekly batch</li>
          <li><Badge variant="destructive">removed</Badge> - mod-removed, refunded to buyer (if survival guarantee)</li>
          <li><Badge variant="destructive">failed</Badge> - proof did not match, claim rejected</li>
        </ul>
      </Section>

      <Section title="7. Payment">
        <p>Spreddit uses a pre-funded wallet. Buyers top up via Stripe, then each post deducts from the balance. In demo mode (no Stripe configured), top-ups are added instantly without a real charge.</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Platform fee: 20% of the base bounty. Posters earn 80%.</li>
          <li>Payouts: weekly batch via Stripe Connect (or queued for manual review in demo mode).</li>
          <li>Refund policy: full refund minus platform fee if the post is mod-removed within 24h and the survival_guarantee boost is on.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-sans text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_p]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground [&_h3]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground">{children}</pre>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
      <Badge variant={method === "GET" ? "secondary" : "default"}>{method}</Badge>
      <code className="font-mono text-xs">{path}</code>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}

function Tool({ name, desc, args }: { name: string; desc: string; args: string }) {
  return (
    <div className="mt-2 rounded-lg border p-3 text-sm">
      <code className="font-mono text-xs text-foreground">{name}</code>
      <p className="mt-1 text-muted-foreground">{desc}</p>
      {args && (
        <div className="mt-2 text-xs text-muted-foreground">Args: <code className="text-foreground">{args}</code></div>
      )}
    </div>
  );
}
