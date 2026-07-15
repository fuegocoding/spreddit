import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { submitProofAction } from "@/app/poster/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

const CLAIM_STATUS: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  active: { variant: "secondary", label: "Active" },
  proof_submitted: { variant: "default", label: "Awaiting verify" },
  verified: { variant: "default", label: "Verified" },
  survived: { variant: "default", label: "Paid" },
  rejected: { variant: "destructive", label: "Rejected" },
  expired: { variant: "outline", label: "Expired" },
  removed: { variant: "destructive", label: "Removed" },
};

export default async function PosterClaimDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const [row] = await db
    .select({
      claim: schema.claims,
      post: schema.posts,
      redditAccount: schema.redditAccounts,
    })
    .from(schema.claims)
    .leftJoin(schema.posts, eq(schema.posts.id, schema.claims.postId))
    .leftJoin(
      schema.redditAccounts,
      eq(schema.redditAccounts.id, schema.claims.redditAccountId)
    )
    .where(
      and(eq(schema.claims.id, id), eq(schema.claims.posterId, session.user.id))
    )
    .limit(1);

  if (!row || !row.post) notFound();

  const { claim, post, redditAccount } = row;
  const status = CLAIM_STATUS[claim.status] ?? CLAIM_STATUS.active;
  const expiresAt = new Date(claim.expiresAt);
  const minutesLeft = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / 60000)
  );
  const isActive = claim.status === "active";
  const isPending = claim.status === "proof_submitted";

  return (
    <div className="container py-10 max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={<Link href="/poster" />}
      >
        <ArrowLeft /> Back
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-2">r/{post.targetSub}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{TIER_LABEL[post.tier]} ({TIER_MULTIPLIER[post.tier]}×)</span>
            <span>·</span>
            <span className="text-orange-500 font-medium">
              Earn {formatUsd(claim.payoutCents, { withCents: true })}
            </span>
            {isActive && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {minutesLeft} min left
                </span>
              </>
            )}
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What to publish</CardTitle>
          <CardDescription>
            Post this on r/{post.targetSub} from your account{" "}
            <strong>u/{redditAccount?.redditUsername}</strong>. The title and body
            should match exactly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground">TITLE</div>
            <div className="mt-1 rounded-lg bg-muted/30 p-3 text-sm font-mono">
              {post.title}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">BODY</div>
            <pre className="mt-1 rounded-lg bg-muted/30 p-3 text-sm font-mono whitespace-pre-wrap">
              {post.body}
            </pre>
          </div>
          {post.linkUrl && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">LINK</div>
              <div className="mt-1 text-sm">{post.linkUrl}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Submit proof</CardTitle>
            <CardDescription>
              After publishing, paste the Reddit post URL and (optionally) a
              screenshot. We&apos;ll auto-verify within 2 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={submitProofAction} className="space-y-4">
              <input type="hidden" name="claimId" value={claim.id} />
              <div>
                <Label htmlFor="redditPostUrl">Reddit post URL</Label>
                <Input
                  id="redditPostUrl"
                  name="redditPostUrl"
                  type="url"
                  required
                  placeholder="https://www.reddit.com/r/SaaS/comments/..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="proofUrl">Screenshot URL (optional)</Label>
                <Input
                  id="proofUrl"
                  name="proofUrl"
                  type="url"
                  placeholder="https://imgur.com/..."
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional. Helps with disputes.
                </p>
              </div>
              <Button type="submit">Submit proof</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card className="mt-6 border-orange-500/50">
          <CardHeader>
            <CardTitle>Awaiting verification</CardTitle>
            <CardDescription>
              Your post is being verified. We&apos;ll run a 24h survival check
              after the URL is confirmed live.
            </CardDescription>
          </CardHeader>
          {claim.redditPostUrl && (
            <CardContent>
              <a
                href={claim.redditPostUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                {claim.redditPostUrl} <ExternalLink className="size-3" />
              </a>
            </CardContent>
          )}
        </Card>
      )}

      {(claim.status === "verified" || claim.status === "survived") && (
        <Card className="mt-6 border-green-500/50">
          <CardHeader>
            <CardTitle>Paid ✓</CardTitle>
            <CardDescription>
              {formatUsd(claim.payoutCents, { withCents: true })} will be sent
              in the next payout batch (weekly).
            </CardDescription>
          </CardHeader>
          {claim.redditPostUrl && (
            <CardContent>
              <a
                href={claim.redditPostUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm underline"
              >
                View on Reddit <ExternalLink className="size-3" />
              </a>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
