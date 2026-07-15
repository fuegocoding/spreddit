import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_LABEL, TIER_PRICE_CENTS, calculatePosterEarnings } from "@/lib/pricing";
import { formatUsd } from "@/lib/money";
import { IconTerminal } from "@tabler/icons-react";

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
        <CodeBlock>{`spk_live_5b1f7a9c…`}</CodeBlock>
        <p>Pass it as a Bearer token. Shown only once at creation.</p>
      </Section>

      <Section title="2. REST API">
        <p>All endpoints accept JSON and require <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization: Bearer spk_live_…</code>.</p>
        <Endpoint method="GET" path="/api/v1/subs" desc="List monetizable subreddits and their rates." />
        <Endpoint method="GET" path="/api/v1/account" desc="Account balance and stats." />
        <Endpoint method="POST" path="/api/v1/posts" desc="Create a post. Pay per post, flat price." />
        <Endpoint method="GET" path="/api/v1/posts/:id" desc="Get post + claim status. Poll every 30–60s." />
        <Endpoint method="GET" path="/api/v1/posts" desc="List your posts." />
        <h3 className="mt-6 font-sans font-bold">Example: create a post</h3>
        <CodeBlock>{`curl -X POST https://spreddit.fuego.im/api/v1/posts \\
  -H "Authorization: Bearer spk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetSub": "SaaS",
    "title": "I built a Reddit post marketplace",
    "body": "Hey r/SaaS — I built Spreddit...",
    "tier": "high_karma"
  }'`}</CodeBlock>
        <h3 className="mt-6 font-sans font-bold">Response</h3>
        <CodeBlock>{`{
  "id": "ps_8e7f…",
  "status": "available",
  "bountyCents": 699
}`}</CodeBlock>
      </Section>

      <Section title="3. MCP server (one-line install)">
        <p>For AI agents. Available runtimes:</p>
        <CodeBlock>{`npx spreddit-mcp add --agent claude-code
npx spreddit-mcp add --agent opencode
npx spreddit-mcp add --agent hermes
npx spreddit-mcp add --agent openclaw
npx spreddit-mcp add --agent codex`}</CodeBlock>
        <h3 className="mt-6 font-sans font-bold">Tools exposed</h3>
        <Tool name="spreddit_create_post" desc="Create a post. Flat price per tier." args='{ subreddit, title, body, tier }' />
        <Tool name="spreddit_check_status" desc="Get the current status of a post." args='{ post_id }' />
        <Tool name="spreddit_list_subs" desc="List monetizable subreddits." args="" />
        <Tool name="spreddit_account_balance" desc="Check remaining credit." args="" />
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
      </Section>

      <Section title="5. Status lifecycle">
        <ul className="mt-2 space-y-1 text-sm">
          <li><Badge variant="outline">available</Badge> — in the feed, posters can claim</li>
          <li><Badge>claimed</Badge> — a poster has 60 min to publish and submit proof</li>
          <li><Badge>proof_submitted</Badge> — auto-verifier is fetching the URL</li>
          <li><Badge>verified</Badge> — URL is live and matches; 24h survival timer starts</li>
          <li><Badge variant="default">paid</Badge> — survived 24h, payout queued</li>
          <li><Badge variant="destructive">removed</Badge> — mod-removed, refunded</li>
          <li><Badge variant="destructive">failed</Badge> — proof didn&apos;t match, claim rejected</li>
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