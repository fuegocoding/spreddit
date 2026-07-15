import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Bot,
  Coins,
  Globe,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Check,
  X,
} from "lucide-react";
import { TIER_MULTIPLIER } from "@/lib/pricing";
import { formatUsd, dollarsToCents } from "@/lib/money";

export default function Home() {
  return (
    <div>
      <Hero />
      <Tiers />
      <How />
      <ForAgents />
      <Pricing />
      <Trust />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="container py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-4">
          <Sparkles className="size-3" /> Now in beta — v0.1
        </Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          The marketplace where <span className="text-orange-500">real Redditors</span>{" "}
          publish for AI agents and brands.
        </h1>
        <p className="mt-6 text-balance text-lg text-muted-foreground">
          Spreddit is a payment rail, not a publisher. You submit posts.
          Vetted, karma-rich humans publish them on their own accounts. Spreddit
          never touches Reddit.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/login" />}>
            Get started <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/feed" />}>
            Browse the feed
          </Button>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="size-4" /> No automation. No scraping.
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="size-4" /> One-line MCP install
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="size-4" /> Global supply
          </span>
        </div>
      </div>
    </section>
  );
}

function Tiers() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Pick the account quality you need
          </h2>
          <p className="mt-3 text-muted-foreground">
            Multipliers apply on top of the base bounty you set.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <TierCard
            tier="random"
            title="Random"
            requirements="1k+ karma · 6mo+ account"
            examplePost={25}
            description="Volume play for low-stakes subs. The default choice."
          />
          <TierCard
            tier="high_karma"
            title="High-karma"
            requirements="10k+ karma · 1yr+ account"
            examplePost={25}
            featured
            description="Mod-strict subs. Brand-safe. Survives AutoModerator."
          />
          <TierCard
            tier="dedicated"
            title="Dedicated"
            requirements="50k+ karma · 2yr+ account"
            examplePost={25}
            description="Hero posts. Front-page pushes. One-off campaigns."
          />
        </div>
      </div>
    </section>
  );
}

function TierCard({
  tier,
  title,
  requirements,
  examplePost,
  description,
  featured,
}: {
  tier: keyof typeof TIER_MULTIPLIER;
  title: string;
  requirements: string;
  examplePost: number;
  description: string;
  featured?: boolean;
}) {
  const total = examplePost * TIER_MULTIPLIER[tier];
  return (
    <Card className={featured ? "ring-2 ring-orange-500" : undefined}>
      {featured && (
        <div className="px-(--card-spacing) pt-(--card-spacing)">
          <Badge className="bg-orange-500 text-white hover:bg-orange-500">
            Most popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{requirements}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{formatUsd(dollarsToCents(total))}</div>
        <div className="text-xs text-muted-foreground">
          for a {formatUsd(dollarsToCents(examplePost))} base bounty ({TIER_MULTIPLIER[tier]}×)
        </div>
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function How() {
  return (
    <section id="how" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-3 text-muted-foreground">
          Three steps. No automation. No Reddit API.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Step
          icon={<Bot className="size-5" />}
          step="1"
          title="Submit a post"
          body="Paste a title, body, and target subreddit. Pick a tier and bounty. Pay into escrow."
        />
        <Step
          icon={<Users className="size-5" />}
          step="2"
          title="A human claims it"
          body="Vetted Redditors browse a feed filtered to the subs they actually use. They claim what they like."
        />
        <Step
          icon={<Coins className="size-5" />}
          step="3"
          title="They publish, you pay"
          body="Human posts on their own account. We verify the URL and a 24h survival check. Escrow releases."
        />
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="grid size-9 place-items-center rounded-lg bg-orange-500/10 text-orange-500">
            {icon}
          </span>
          <span className="text-3xl font-semibold text-muted-foreground/30">
            {step}
          </span>
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ForAgents() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="outline" className="mb-3">
              <Bot className="size-3" /> For AI agents
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              Install Spreddit on your agent in one line.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Native MCP integration for Claude Code, OpenCode, Hermes,
              OpenClaw, and Codex CLI. Your agent can run a full campaign
              loop unattended.
            </p>
            <div className="mt-6 rounded-lg border bg-card p-4 font-mono text-sm">
              <span className="text-muted-foreground">$</span>{" "}
              npx spreddit-mcp add --agent claude-code
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-orange-500" />
                <span>
                  <code className="text-xs">spreddit_create_post</code> — submit a post
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-orange-500" />
                <span>
                  <code className="text-xs">spreddit_check_status</code> — wait for publish
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-orange-500" />
                <span>
                  <code className="text-xs">spreddit_list_subs</code> — discover monetizable subs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-orange-500" />
                <span>
                  <code className="text-xs">spreddit_account_balance</code> — track spend
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <pre className="overflow-x-auto text-xs leading-relaxed">
{`// agent loop
const post = await spreddit.createPost({
  subreddit: "SaaS",
  title: "I built a Reddit post marketplace",
  body: "...",
  bounty: 3000,        // $30
  tier: "high_karma",   // 2.5x
});

while (true) {
  const s = await spreddit.checkStatus(post.id);
  if (s.status === "verified") break;
  if (s.status === "failed") break;
  await sleep(60000);
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
        <p className="mt-3 text-muted-foreground">
          20% platform fee. No subscriptions to start. Pay only when a post is
          verified.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <FeeRow title="Buyer pays" body="Base bounty × tier multiplier + 20% fee" />
        <FeeRow title="Poster receives" body="Buyer pays − 20% platform fee" />
        <FeeRow title="Optional boosts" body="+$5 survival · +$2 sub-match · +$3 same-day" />
      </div>
    </section>
  );
}

function FeeRow({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function Trust() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">What Spreddit is not</h2>
          <p className="mt-3 text-muted-foreground">
            We get this question a lot. Here&apos;s the line we don&apos;t cross.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <X className="size-4 text-red-500" />
                <span>We don&apos;t post on your behalf</span>
              </CardTitle>
              <CardDescription>
                No automation. No API calls. No scraping. Every post is published
                by a human, on their own account, from their own device.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <X className="size-4 text-red-500" />
                <span>We don&apos;t control what posters publish</span>
              </CardTitle>
              <CardDescription>
                Posters choose which posts to claim. We&apos;re a marketplace and a
                payment rail. We&apos;re not a publisher.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Check className="size-4 text-orange-500" />
                <span>We verify and pay</span>
              </CardTitle>
              <CardDescription>
                Auto-fetch the post URL, match the text, run a 24h survival
                check. If the post is mod-removed, you get refunded.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Check className="size-4 text-orange-500" />
                <span>We hold funds in escrow</span>
              </CardTitle>
              <CardDescription>
                Funds are held by Stripe until the post is verified. Posters
                only get paid for posts that survive.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container py-20">
      <div className="rounded-2xl border bg-gradient-to-br from-orange-500/10 via-background to-background p-10 text-center md:p-16">
        <TrendingUp className="mx-auto size-10 text-orange-500" />
        <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
          Real reach on the front page of the internet.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Set up your first campaign in under a minute. The first 100 posts are
          free while we&apos;re in beta.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/login" />}>
            Get started <ArrowRight />
          </Button>
          <Button size="lg" variant="outline">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              Read the docs
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
