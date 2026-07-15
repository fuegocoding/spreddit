import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createPostAction } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/pricing";
import { SUB_OPTIONS, MONETIZABLE_SUBS } from "@/lib/subs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="container py-10 max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={<Link href="/buyer" />}
      >
        <ArrowLeft /> Back to dashboard
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight">New post</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a subreddit, write your post, set the bounty. We&apos;ll show you the
        total before you submit.
      </p>

      <form action={createPostAction} className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Where to post</CardTitle>
            <CardDescription>
              We currently support {Object.keys(MONETIZABLE_SUBS).length}{" "}
              subreddits. Want more?{" "}
              <a href="mailto:hi@spreddit.fuego.im" className="text-foreground underline">
                Request one
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="targetSub">Subreddit</Label>
            <select
              id="targetSub"
              name="targetSub"
              required
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue="SaaS"
            >
              {SUB_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The post</CardTitle>
            <CardDescription>
              Write like a Redditor. Posters pick what they publish, so authentic
              tone wins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                minLength={10}
                maxLength={300}
                placeholder="I built a tool that lets AI agents launch on Reddit"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                name="body"
                required
                minLength={20}
                maxLength={10000}
                rows={8}
                placeholder="Hey r/SaaS — I spent the last 3 months building..."
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="linkUrl">Link URL (optional)</Label>
                <Input
                  id="linkUrl"
                  name="linkUrl"
                  type="url"
                  placeholder="https://spreddit.fuego.im"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account quality</CardTitle>
            <CardDescription>
              Higher tiers = older, higher-karma accounts. Higher survival rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset className="grid gap-3 sm:grid-cols-3">
              {(["random", "high_karma", "dedicated"] as const).map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 hover:bg-muted has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{TIER_LABEL[t]}</span>
                    <Badge variant="outline">{TIER_MULTIPLIER[t]}×</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t === "random" && "1k+ karma · 6mo+"}
                    {t === "high_karma" && "10k+ karma · 1yr+"}
                    {t === "dedicated" && "50k+ karma · 2yr+"}
                  </span>
                  <input
                    type="radio"
                    name="tier"
                    value={t}
                    defaultChecked={t === "random"}
                    className="sr-only"
                  />
                </label>
              ))}
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Base bounty × tier multiplier. Optional boosts add cost.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="baseBounty">Base bounty (USD)</Label>
              <Input
                id="baseBounty"
                name="baseBounty"
                type="number"
                step="1"
                min="5"
                max="500"
                defaultValue="25"
                required
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum $5. Recommended $25–$50 for SaaS and AI subs.
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="survivalGuarantee"
                  className="size-4"
                />
                <span>
                  <strong>Survival guarantee</strong>{" "}
                  <span className="text-muted-foreground">— +$5, full refund if mod-removed within 24h</span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="subMatchPriority"
                  className="size-4"
                />
                <span>
                  <strong>Sub-match priority</strong>{" "}
                  <span className="text-muted-foreground">— +$2, surfaces first to posters in this sub</span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="sameDayPublish"
                  className="size-4"
                />
                <span>
                  <strong>Same-day publish</strong>{" "}
                  <span className="text-muted-foreground">— +$3, bounty doubles if unclaimed after 1h</span>
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" render={<Link href="/buyer" />}>
            Cancel
          </Button>
          <Button type="submit">Submit post</Button>
        </div>
      </form>
    </div>
  );
}
