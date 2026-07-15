import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getPosterStats,
  getPosterClaims,
  getRedditAccountsForUser,
} from "@/lib/queries";
import { formatUsd } from "@/lib/money";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/pricing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RedditMark } from "@/components/reddit-mark";

const CLAIM_STATUS: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  active: { variant: "secondary", label: "Claimed" },
  proof_submitted: { variant: "default", label: "Awaiting verify" },
  verified: { variant: "default", label: "Verified" },
  survived: { variant: "default", label: "Paid" },
  rejected: { variant: "destructive", label: "Rejected" },
  expired: { variant: "outline", label: "Expired" },
  removed: { variant: "destructive", label: "Removed" },
};

export default async function PosterDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "poster") redirect("/buyer");

  const [stats, claims, accounts] = await Promise.all([
    getPosterStats(session.user.id),
    getPosterClaims(session.user.id),
    getRedditAccountsForUser(session.user.id),
  ]);

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Poster dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Claim posts. Publish on your own account. Get paid.
          </p>
        </div>
        <Button render={<Link href="/feed" />}>
          Browse the feed <ArrowRight />
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat label="Active claims" value={stats?.active?.toString() ?? "0"} />
        <Stat label="Pending verify" value={stats?.pending?.toString() ?? "0"} />
        <Stat label="Verified posts" value={stats?.verified?.toString() ?? "0"} />
        <Stat label="Earnings" value={formatUsd(stats?.earningsCents ?? 0, { withCents: true })} />
      </div>

      {accounts.length === 0 && (
        <Card className="mt-6 border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RedditMark className="size-5 text-orange-500" />
              Connect your Reddit account
            </CardTitle>
            <CardDescription>
              Verify your Reddit account to start claiming posts. We require at
              least 1,000 karma and a 6-month-old account for the default tier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/poster/connect" />}>Connect Reddit</Button>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your accounts</CardTitle>
            <CardDescription>
              Each account you connect can claim posts. We match posts to your
              karma and opted-in subs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-full bg-orange-500/10">
                      <RedditMark className="size-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-medium">u/{a.redditUsername}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.karma.toLocaleString()} karma · {a.accountAgeDays}d old
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={a.status === "active" ? "default" : "secondary"}
                    >
                      {a.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Survival: {(a.survivalRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" render={<Link href="/poster/connect" />}>
                Connect another account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your claims</CardTitle>
          <CardDescription>
            Recent posts you&apos;ve claimed, in order of most recent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No claims yet.{" "}
              <Link href="/feed" className="text-foreground underline">
                Browse the feed
              </Link>{" "}
              to find posts.
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map((c) => {
                if (!c.post) return null;
                const status =
                  CLAIM_STATUS[c.claim.status] ?? CLAIM_STATUS.active;
                return (
                  <Link
                    key={c.claim.id}
                    href={`/poster/claims/${c.claim.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {c.post.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>r/{c.post.targetSub}</span>
                        <span>·</span>
                        <span>{TIER_LABEL[c.post.tier]}</span>
                        <span>·</span>
                        <span>claim{" "}
                          {new Date(c.claim.claimedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {formatUsd(c.claim.payoutCents, { withCents: true })}
                      </span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
