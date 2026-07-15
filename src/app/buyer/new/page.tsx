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
import { TIER_LABEL, TIER_PRICE_CENTS } from "@/lib/pricing";
import { SUB_OPTIONS, MONETIZABLE_SUBS } from "@/lib/subs";
import { formatUsd } from "@/lib/money";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
        Pick a subreddit, write your post, choose account quality.
        Pay per post — flat price, no surprises.
      </p>

      <form action={createPostAction} className="mt-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Where to post</CardTitle>
            <CardDescription>
              We currently support {Object.keys(MONETIZABLE_SUBS).length} subreddits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="targetSub">Subreddit</Label>
            <select
              id="targetSub"
              name="targetSub"
              required
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                placeholder="Hey r/SaaS — I spent the last 3 months building..."
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
              Higher quality accounts have more karma and older age — better
              survival rate on mod-strict subs.
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
                    {t === "random" && "1k+ karma · 6mo+"}
                    {t === "high_karma" && "10k+ karma · 1yr+"}
                    {t === "dedicated" && "50k+ karma · 2yr+"}
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