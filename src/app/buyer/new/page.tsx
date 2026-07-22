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
import {
  TIER_LABEL,
  TIER_PRICE_CENTS,
  calculateBoostsTotal,
} from "@/lib/pricing";
import { formatUsd } from "@/lib/money";
import Link from "next/link";
import { IconArrowLeft, IconBolt } from "@tabler/icons-react";
import { ALL_SUGGESTED_SUB_NAMES } from "@/lib/subs";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const balance = session.user.balanceCents ?? 0;
  const standardPrice = TIER_PRICE_CENTS.random;

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-16 py-16">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/buyer">
          <IconArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </Button>

      <h1 className="font-sans text-4xl font-extrabold tracking-tight">New post</h1>
      <p className="mt-2 text-muted-foreground">
        Pick a subreddit, write your post, choose account quality. Funds come
        from your wallet balance.
      </p>

      {balance < standardPrice && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
          <IconBolt className="mt-0.5 size-4 text-yellow-600 shrink-0" />
          <div>
            Your balance is {formatUsd(balance, { withCents: true })}.{" "}
            <Link href="/buyer" className="text-primary underline">
              Top up your wallet
            </Link>{" "}
            before submitting a post.
          </div>
        </div>
      )}

      <form action={createPostAction} className="mt-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Where to post</CardTitle>
            <CardDescription>
              Any valid subreddit. We do not gate the marketplace. Pick a sub
              your account has the karma to post in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="targetSub">Subreddit</Label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted-foreground text-sm">r/</span>
              <Input
                id="targetSub"
                name="targetSub"
                required
                minLength={2}
                maxLength={21}
                pattern="[A-Za-z0-9_]+"
                placeholder="SaaS"
                className="flex-1 font-mono"
                defaultValue="SaaS"
                list="suggested-subs"
              />
              <datalist id="suggested-subs">
                {ALL_SUGGESTED_SUB_NAMES.slice(0, 50).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Letters, numbers, and underscores. 2 to 21 characters.{" "}
              {ALL_SUGGESTED_SUB_NAMES.length} popular subs are pre-loaded; type
              any other name to target it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans">The post</CardTitle>
            <CardDescription>
              Write like a Redditor. Posters pick what they publish.
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
                className="mt-2"
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
                placeholder="Hey r/SaaS - I spent the last 3 months building..."
                className="mt-2 font-mono text-sm"
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
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://..."
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Account quality</CardTitle>
            <CardDescription>
              Higher quality accounts have more karma and older age, which
              gives a better survival rate on mod-strict subs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset className="grid gap-3 sm:grid-cols-3">
              {(["random", "high_karma", "dedicated"] as const).map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer flex-col gap-2 rounded-lg border p-4 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold">{TIER_LABEL[t]}</span>
                    <span className="font-sans font-black text-lg">
                      {formatUsd(TIER_PRICE_CENTS[t], { withCents: true })}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t === "random" && "1k+ karma / 6mo+"}
                    {t === "high_karma" && "10k+ karma / 1yr+"}
                    {t === "dedicated" && "50k+ karma / 2yr+"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t === "random" && "Volume play for low-stakes subs"}
                    {t === "high_karma" && "Most popular. Survives AutoMod."}
                    {t === "dedicated" && "Hero posts. Front-page pushes."}
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
            <CardTitle className="font-sans">Boosts (optional)</CardTitle>
            <CardDescription>
              Add-ons that increase your post's chance of being claimed fast and
              surviving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="checkbox" name="survivalGuarantee" className="mt-1 size-4" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Survival guarantee</span>
                  <Badge variant="outline">+$5.00</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Full refund if the post is mod-removed within 24 hours.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="checkbox" name="subMatchPriority" className="mt-1 size-4" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Sub-match priority</span>
                  <Badge variant="outline">+$2.00</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Surfaces first to posters opted into the target sub.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="checkbox" name="sameDayPublish" className="mt-1 size-4" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Same-day publish</span>
                  <Badge variant="outline">+$3.00</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bounty doubles if unclaimed after 1 hour.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/buyer">Cancel</Link>
          </Button>
          <Button type="submit">Submit post</Button>
        </div>
      </form>
    </div>
  );
}
