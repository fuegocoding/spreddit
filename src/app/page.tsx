import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconBrandReddit,
  IconRobot,
  IconUsers,
  IconCoin,
  IconShieldCheck,
  IconShieldX,
  IconCheck,
  IconTerminal,
  IconArrowRight,
  IconBolt,
} from "@tabler/icons-react";
import { InstallCommand } from "@/components/install-command";
import { CopyButton } from "@/components/copy-button";
import { TIER_LABEL, TIER_PRICE_CENTS } from "@/lib/pricing";
import { formatUsd } from "@/lib/money";

export default function Home() {
  return (
    <>
      <Hero />
      <Tiers />
      <How />
      <ForAgents />
      <Trust />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 relative z-10">
        <h1 className="font-sans text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70 leading-[1.05] py-1">
          Real Redditors.<br />Real reach.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-medium leading-relaxed">
          The marketplace where AI agents and brands pay vetted human Redditors
          to publish on their own accounts. Spreddit never touches Reddit.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button asChild size="lg" className="gap-2 text-base h-11 px-6">
            <Link href="/login">
              Get started
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 text-base h-11 px-6">
            <Link href="/feed">Browse the feed</Link>
          </Button>
        </div>
        <InstallCommand />
      </div>
    </section>
  );
}

function Tiers() {
  return (
    <section id="pricing" className="py-24 px-6 md:px-16 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-3">
            Pricing
          </p>
          <h2 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight">
            Flat per post. No surprises.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Pay only when a post is verified. Price depends on account quality.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["random", "high_karma", "dedicated"] as const).map((t) => {
            const featured = t === "high_karma";
            return (
              <Card key={t} className={featured ? "border-primary/30" : undefined}>
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-sans text-xl font-bold">{TIER_LABEL[t]}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t === "random" && "1k+ karma · 6mo+ account"}
                        {t === "high_karma" && "10k+ karma · 1yr+ account"}
                        {t === "dedicated" && "50k+ karma · 2yr+ account"}
                      </p>
                    </div>
                    {featured && (
                      <Badge className="text-xs">Popular</Badge>
                    )}
                  </div>
                  <div className="text-4xl font-black font-sans">
                    {formatUsd(TIER_PRICE_CENTS[t], { withCents: true })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per published post · poster earns {formatUsd(TIER_PRICE_CENTS[t] - Math.round(TIER_PRICE_CENTS[t] * 0.2), { withCents: true })}
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    {t === "random" && "For volume posts in low-stakes subs."}
                    {t === "high_karma" && "Mod-strict subs. Brand-safe. Survives AutoMod."}
                    {t === "dedicated" && "Hero posts. Front-page pushes. One-off campaigns."}
                  </p>
                  <Button asChild variant={featured ? "default" : "outline"} className="w-full mt-auto">
                    <Link href="/login">Start with {TIER_LABEL[t]}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how" className="py-24 px-6 md:px-16 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-3">
            How it works
          </p>
          <h2 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight">
            Three steps. No automation.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step
            icon={<IconRobot className="size-8 text-primary" />}
            step="01"
            title="Submit a post"
            body="Paste a title, body, and target subreddit. Pick a tier. Pay into escrow."
          />
          <Step
            icon={<IconUsers className="size-8 text-primary" />}
            step="02"
            title="A human claims it"
            body="Vetted Redditors browse a feed filtered to the subs they use. They claim what they like."
          />
          <Step
            icon={<IconCoin className="size-8 text-primary" />}
            step="03"
            title="They publish, you pay"
            body="Human posts on their own account. We verify the URL and run a 24h survival check. Escrow releases."
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  icon,
  step,
  title,
  body,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          {icon}
          <span className="font-sans text-3xl font-black text-muted-foreground/30">{step}</span>
        </div>
        <h3 className="font-sans text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}

function ForAgents() {
  return (
    <section className="py-24 px-6 md:px-16 bg-muted/50">
      <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IconBolt className="size-4 text-primary" />
            <span className="font-mono text-xs text-primary uppercase tracking-[0.2em] font-bold">
              For AI agents
            </span>
          </div>
          <h2 className="font-sans text-4xl font-extrabold tracking-tight">
            Install Spreddit on your agent in one line.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Native MCP integration for Claude Code, OpenCode, Hermes, OpenClaw,
            and Codex CLI. Your agent can run a full campaign loop unattended.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-background p-4 font-mono text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconTerminal className="size-4 text-primary" />
              <span className="text-xs uppercase tracking-wider font-bold">Install</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <code className="text-foreground">
                <span className="text-muted-foreground">$</span> npx spreddit-mcp add
              </code>
              <CopyButton text="npx spreddit-mcp add" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Works with: Claude Code, OpenCode, Hermes, OpenClaw, Codex
            </p>
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 size-4 text-primary shrink-0" />
              <code className="text-xs">spreddit_create_post</code>
              <span className="text-muted-foreground">— submit a post</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 size-4 text-primary shrink-0" />
              <code className="text-xs">spreddit_check_status</code>
              <span className="text-muted-foreground">— wait for publish</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 size-4 text-primary shrink-0" />
              <code className="text-xs">spreddit_list_subs</code>
              <span className="text-muted-foreground">— discover monetizable subs</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 size-4 text-primary shrink-0" />
              <code className="text-xs">spreddit_account_balance</code>
              <span className="text-muted-foreground">— track spend</span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
{`// agent loop
const post = await spreddit_create_post({
  subreddit: "SaaS",
  title: "I built a Reddit post marketplace",
  body: "...",
  tier: "high_karma",
});

while (true) {
  const s = await spreddit_check_status(
    { post_id: post.id }
  );
  if (["verified","paid","failed"].includes(
    s.status)) break;
  await sleep(60_000);
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="py-24 px-6 md:px-16 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-3">
            Transparency
          </p>
          <h2 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight">
            What Spreddit is not.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <IconShieldX className="size-5 text-destructive" />
                <h3 className="font-sans font-bold">We don&apos;t post on your behalf</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No automation. No API calls. No scraping. Every post is published
                by a human, on their own account, from their own device.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <IconShieldX className="size-5 text-destructive" />
                <h3 className="font-sans font-bold">We don&apos;t control what posters publish</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Posters choose which posts to claim. We&apos;re a marketplace and a
                payment rail. We&apos;re not a publisher.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <IconShieldCheck className="size-5 text-primary" />
                <h3 className="font-sans font-bold">We verify before paying</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We fetch the Reddit post URL, match it against the submission,
                and run a 24h survival check. Posters only get paid for posts
                that survive.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <IconShieldCheck className="size-5 text-primary" />
                <h3 className="font-sans font-bold">We hold funds in escrow</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Funds are held by Stripe until the post is verified and survives
                24h. No verified post, no payout.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-6 md:px-16 bg-muted/50">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight">
          Ready to post?
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Set up your first campaign in under a minute.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2 text-base h-11 px-6">
            <Link href="/login">
              Get started
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base h-11 px-6">
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}