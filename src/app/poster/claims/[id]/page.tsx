import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { submitProofAction } from "@/app/poster/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowLeft, IconClock, IconExternalLink, IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";

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
    .where(and(eq(schema.claims.id, id), eq(schema.claims.posterId, session.user.id)))
    .limit(1);

  if (!row || !row.post) notFound();
  const { claim, post, redditAccount } = row;
  const expiresAt = new Date(claim.expiresAt);
  const minutesLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));
  const isActive = claim.status === "active";
  const isPending = claim.status === "proof_submitted";

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-16">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/poster">
          <IconArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <Badge variant="outline" className="mb-2">r/{post.targetSub}</Badge>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{TIER_LABEL[post.tier]}</span>
            <span>·</span>
            <span className="text-primary font-bold">{formatUsd(claim.payoutCents, { withCents: true })}</span>
            {isActive && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <IconClock className="size-3" /> {minutesLeft} min left
                </span>
              </>
            )}
          </div>
        </div>
        <Badge variant="secondary">{claim.status}</Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-sans">What to publish</CardTitle>
          <CardDescription>
            Post this on r/{post.targetSub} from your account{" "}
            <strong>u/{redditAccount?.redditUsername}</strong>. Title and body
            should match exactly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">TITLE</div>
            <div className="mt-1 rounded-lg bg-muted/50 p-3 text-sm font-mono">{post.title}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">BODY</div>
            <pre className="mt-1 rounded-lg bg-muted/50 p-3 text-sm font-mono whitespace-pre-wrap">{post.body}</pre>
          </div>
          {post.linkUrl && (
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">LINK</div>
              <div className="mt-1 text-sm">{post.linkUrl}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-sans">Submit proof</CardTitle>
            <CardDescription>
              After publishing, paste the Reddit post URL. We&apos;ll auto-verify
              that it&apos;s live and matches the submission.
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
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="proofUrl">Screenshot URL (optional)</Label>
                <Input
                  id="proofUrl"
                  name="proofUrl"
                  type="url"
                  placeholder="https://imgur.com/..."
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">Optional. Helps with disputes.</p>
              </div>
              <Button type="submit">Submit proof</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <IconShieldCheck className="size-5 text-primary" />
              Awaiting verification
            </CardTitle>
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
                className="inline-flex items-center gap-1 text-sm underline text-primary"
              >
                {claim.redditPostUrl} <IconExternalLink className="size-3" />
              </a>
            </CardContent>
          )}
        </Card>
      )}

      {(claim.status === "verified" || claim.status === "survived") && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <IconShieldCheck className="size-5 text-primary" />
              Verified ✓
            </CardTitle>
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
                className="inline-flex items-center gap-1 text-sm underline text-primary"
              >
                View on Reddit <IconExternalLink className="size-3" />
              </a>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}