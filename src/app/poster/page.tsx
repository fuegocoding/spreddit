import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getPosterStats,
  getPosterClaims,
  getRedditAccountsForUser,
} from "@/lib/queries";
import { formatUsd } from "@/lib/money";
import { TIER_LABEL } from "@/lib/pricing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconArrowRight,
  IconBrandReddit,
  IconPlus,
  IconWallet,
} from "@tabler/icons-react";
import Link from "next/link";

export async function PosterDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isPoster) redirect("/poster/connect");

  const [stats, claims, accounts] = await Promise.all([
    getPosterStats(session.user.id),
    getPosterClaims(session.user.id),
    getRedditAccountsForUser(session.user.id),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-16 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
        <div>
          <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-2">
            Dashboard
          </p>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight">Poster</h1>
          {session.user.balanceCents > 0 && (
            <p className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <IconWallet className="size-3.5" />
              Balance: {formatUsd(session.user.balanceCents, { withCents: true })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/poster/withdraw">
              <IconWallet className="size-4" />
              Withdraw
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/feed">
              Browse the feed
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Stat label="Active" value={stats?.active?.toString() ?? "0"} />
        <Stat label="Pending" value={stats?.pending?.toString() ?? "0"} />
        <Stat label="Verified" value={stats?.verified?.toString() ?? "0"} />
        <Stat label="Earnings" value={formatUsd(stats?.earningsCents ?? 0, { withCents: true })} />
      </div>

      {accounts.length === 0 && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <IconBrandReddit className="size-5 text-primary" />
              Connect your Reddit account
            </CardTitle>
            <CardDescription>
              Verify your Reddit account to start claiming posts. We require at
              least 1,000 karma and a 6-month-old account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/poster/connect">Connect Reddit</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-sans">Your accounts</CardTitle>
            <CardDescription>
              Each account can claim posts. We match posts to your karma and opted-in subs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <IconBrandReddit className="size-5" />
                  </div>
                  <div>
                    <div className="font-medium">u/{a.redditUsername}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.karma.toLocaleString()} karma · {a.accountAgeDays}d old
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>
                    {a.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Survival: {(a.survivalRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/poster/connect">Connect another account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Your claims</CardTitle>
          <CardDescription>Recent posts you&apos;ve claimed.</CardDescription>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No claims yet.{" "}
              <Link href="/feed" className="text-primary underline">Browse the feed</Link>
              {" "}to find posts.
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map((c) => {
                if (!c.post) return null;
                return (
                  <Link
                    key={c.claim.id}
                    href={`/poster/claims/${c.claim.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">{c.post.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>r/{c.post.targetSub}</span>
                        <span>·</span>
                        <span>{TIER_LABEL[c.post.tier]}</span>
                        <span>·</span>
                        <span>claim {new Date(c.claim.claimedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-sm font-bold font-sans">
                        {formatUsd(c.claim.payoutCents, { withCents: true })}
                      </span>
                      <Badge variant="secondary">{c.claim.status}</Badge>
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

export default PosterDashboard;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-sans font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}