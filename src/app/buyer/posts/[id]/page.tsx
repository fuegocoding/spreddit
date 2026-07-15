import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuyerPostWithClaims } from "@/lib/queries";
import { formatUsd } from "@/lib/money";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/pricing";
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
import { ArrowLeft, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

const CLAIM_STATUS: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  active: { variant: "secondary", label: "Claimed" },
  proof_submitted: { variant: "default", label: "Proof submitted" },
  verified: { variant: "default", label: "Verified" },
  survived: { variant: "default", label: "Survived 24h" },
  rejected: { variant: "destructive", label: "Rejected" },
  expired: { variant: "outline", label: "Expired" },
  removed: { variant: "destructive", label: "Removed" },
};

export default async function BuyerPostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const data = await getBuyerPostWithClaims(session.user.id, id);
  if (!data) notFound();
  const { post, claims } = data;

  return (
    <div className="container py-10 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={<Link href="/buyer" />}
      >
        <ArrowLeft /> Back
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2">
            r/{post.targetSub}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{TIER_LABEL[post.tier]} ({TIER_MULTIPLIER[post.tier]}×)</span>
            <span>·</span>
            <span>{formatUsd(post.bountyCents, { withCents: true })} bounty</span>
            <span>·</span>
            <span>Posted {new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <Badge variant="default">{post.status}</Badge>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Post body</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 rounded-lg p-4">
              {post.body}
            </pre>
            {post.linkUrl && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Link: </span>
                <a
                  className="text-foreground underline inline-flex items-center gap-1"
                  href={post.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {post.linkUrl} <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Boosts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <BoostRow on={post.survivalGuarantee} label="Survival guarantee" />
            <BoostRow on={post.subMatchPriority} label="Sub-match priority" />
            <BoostRow on={post.sameDayPublish} label="Same-day publish" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Claims</CardTitle>
          <CardDescription>
            Posters who claimed this. Verified means the post URL was live and matched the body.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No claims yet. Posters can see this in their feed.
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => {
                const status = CLAIM_STATUS[c.claim.status] ?? CLAIM_STATUS.active;
                return (
                  <div
                    key={c.claim.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-orange-500/10 text-orange-500 font-medium text-xs">
                        u/
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {c.redditAccount?.username ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.redditAccount?.karma?.toLocaleString()} karma · claimed{" "}
                          {new Date(c.claim.claimedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.claim.redditPostUrl && (
                        <Button variant="ghost" size="sm">
                          <a
                            href={c.claim.redditPostUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1"
                          >
                            View on Reddit <ExternalLink className="size-3" />
                          </a>
                        </Button>
                      )}
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BoostRow({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {on ? (
        <ShieldCheck className="size-4 text-orange-500" />
      ) : (
        <ShieldAlert className="size-4 text-muted-foreground" />
      )}
      <span className={on ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
