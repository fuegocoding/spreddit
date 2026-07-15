import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_LABEL, TIER_MULTIPLIER, calculateBounty, calculatePlatformFee, calculatePosterEarnings } from "@/lib/pricing";
import { dollarsToCents, formatUsd } from "@/lib/money";

export default function DocsPage() {
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Spreddit API & MCP docs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Two ways to drive Spreddit: a JSON REST API, and an MCP server that
        installs in one line on Claude Code, OpenCode, Hermes, OpenClaw, or
        Codex CLI.
      </p>

      <DocSection title="1. Get an API key">
        <p>Sign in as a buyer at <code>/login</code>, then go to <code>/buyer/api-keys</code> and create a key. It looks like:</p>
        <CodeBlock>spk_live_5b1f7a9c…</CodeBlock>
        <p>Pass it as a Bearer token. The key is shown only once at creation.</p>
      </DocSection>

      <DocSection title="2. REST API">
        <p>All endpoints accept JSON and require <code>Authorization: Bearer spk_live_…</code>.</p>
        <Endpoint method="GET" path="/api/v1/subs" desc="List monetizable subreddits and their base rates." />
        <Endpoint method="GET" path="/api/v1/account" desc="Account balance and basic info." />
        <Endpoint method="POST" path="/api/v1/posts" desc="Create a post. Funds are escrowed immediately." />
        <Endpoint method="GET" path="/api/v1/posts/:id" desc="Get post + claim status. Poll every 30–60s until status is verified, paid, failed, or removed." />
        <Endpoint method="GET" path="/api/v1/posts" desc="List your posts." />

        <h3 className="mt-6 text-lg font-semibold">Example: create a post</h3>
        <CodeBlock>{`curl -X POST https://spreddit.fuego.im/api/v1/posts \\
  -H "Authorization: Bearer spk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetSub": "SaaS",
    "title": "I built a Reddit post marketplace",
    "body": "Hey r/SaaS — I built Spreddit...",
    "tier": "high_karma",
    "baseBounty": 30,
    "survivalGuarantee": true
  }'`}</CodeBlock>
        <p>Response:</p>
        <CodeBlock>{`{
  "id": "ps_8e7f…",
  "status": "available",
  "bountyCents": 8500,
  "platformFeeCents": 1700,
  "posterPayoutCents": 6800
}`}</CodeBlock>
      </DocSection>

      <DocSection title="3. MCP server (one-line install)">
        <p>For AI agents. Available runtimes:</p>
        <CodeBlock>{`npx spreddit-mcp add --agent claude-code
npx spreddit-mcp add --agent opencode
npx spreddit-mcp add --agent hermes
npx spreddit-mcp add --agent openclaw
npx spreddit-mcp add --agent codex`}</CodeBlock>
        <p>The installer writes <code>~/.config/spreddit/mcp.json</code> (or the
        equivalent for your runtime) and prompts you for an API key on first run.</p>

        <h3 className="mt-6 text-lg font-semibold">Tools exposed</h3>
        <Tool name="spreddit_create_post" desc="Create a post and escrow funds." args='{ subreddit, title, body, bounty (USD), tier, boosts? }' />
        <Tool name="spreddit_check_status" desc="Get the current status of a post and any claims." args='{ post_id }' />
        <Tool name="spreddit_list_subs" desc="List monetizable subreddits and base rates." args="" />
        <Tool name="spreddit_account_balance" desc="Check remaining credit." args="" />

        <h3 className="mt-6 text-lg font-semibold">Example: full campaign loop</h3>
        <CodeBlock>{`const post = await spreddit_create_post({
  subreddit: "SaaS",
  title: "I built a Reddit post marketplace",
  body: "...",
  bounty: 30,
  tier: "high_karma",
  survival_guarantee: true,
});

while (true) {
  const s = await spreddit_check_status({ post_id: post.id });
  if (s.status === "verified") break;
  if (s.status === "failed") break;
  if (s.status === "removed") break;
  await sleep(60_000);
}`}</CodeBlock>
      </DocSection>

      <DocSection title="4. Pricing math">
        <p>Total bounty you pay = base × tier multiplier + boost fees.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(["random", "high_karma", "dedicated"] as const).map((t) => {
            const total = calculateBounty(2500, t);
            return (
              <div key={t} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{TIER_LABEL[t]}</span>
                  <Badge variant="outline">{TIER_MULTIPLIER[t]}×</Badge>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {formatUsd(total, { withCents: true })}
                </div>
                <div className="text-xs text-muted-foreground">
                  poster earns {formatUsd(calculatePosterEarnings(total), { withCents: true })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Platform fee: 20% of the bounty. Example for a $25 base on
          high-karma tier: buyer pays $62.50, poster earns $50.00.
        </p>
      </DocSection>

      <DocSection title="5. Status lifecycle">
        <p>A post moves through these states:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li><Badge variant="outline">available</Badge> — in the feed, posters can claim</li>
          <li><Badge>claimed</Badge> — a poster has 60 min to publish and submit proof</li>
          <li><Badge>proof_submitted</Badge> — auto-verifier is fetching the URL</li>
          <li><Badge>verified</Badge> — URL is live and matches; 24h survival timer starts</li>
          <li><Badge variant="default">paid</Badge> — survived 24h, payout queued</li>
          <li><Badge variant="destructive">removed</Badge> — mod-removed, refunded (if survival guarantee)</li>
          <li><Badge variant="destructive">failed</Badge> — proof didn&apos;t match, claim rejected</li>
        </ul>
      </DocSection>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_p]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground [&_h3]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-card p-3 font-mono text-xs leading-relaxed text-foreground">
      {children}
    </pre>
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
      <div className="flex items-center justify-between">
        <code className="font-mono text-xs">{name}</code>
      </div>
      <p className="mt-1 text-muted-foreground">{desc}</p>
      {args && (
        <div className="mt-2 text-xs text-muted-foreground">
          Args: <code className="text-foreground">{args}</code>
        </div>
      )}
    </div>
  );
}
