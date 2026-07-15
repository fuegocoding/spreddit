import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconAlertTriangle, IconArrowLeft, IconCheck, IconBrandReddit, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { connectRedditAction, submitVerificationAction } from "./actions";

export default async function ConnectRedditPage(props: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await props.searchParams;
  const verifyAccountId = params.verify;

  const linkedAccounts = await db
    .select()
    .from(schema.redditAccounts)
    .where(eq(schema.redditAccounts.userId, session.user.id));

  const pendingAccount = verifyAccountId
    ? linkedAccounts.find((a) => a.id === verifyAccountId && a.status === "pending")
    : null;

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-16 py-16">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/poster">
          <IconArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <h1 className="font-sans text-4xl font-extrabold tracking-tight">Connect Reddit</h1>
      <p className="mt-2 text-muted-foreground">
        Link your Reddit account. We verify ownership by checking a post you make. No OAuth needed.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-sans flex items-center gap-2">
            <IconBrandReddit className="size-5 text-primary" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> 1,000+ karma and 6+ months old (Standard tier)</div>
          <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> 10,000+ karma and 1+ year old (Premium tier)</div>
          <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> 50,000+ karma and 2+ years old (Pro tier)</div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-sans">How verification works</CardTitle>
          <CardDescription>
            No Reddit OAuth needed. We verify by checking a public Reddit post.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2"><span className="text-primary font-bold">1.</span> Enter your Reddit username below</div>
          <div className="flex items-start gap-2"><span className="text-primary font-bold">2.</span> We give you a unique code — post it anywhere on Reddit (you can delete it after)</div>
          <div className="flex items-start gap-2"><span className="text-primary font-bold">3.</span> Paste the post URL — we confirm you own the account</div>
          <div className="flex items-start gap-2"><span className="text-primary font-bold">4.</span> We also check your profile for karma and account age</div>
        </CardContent>
      </Card>

      {linkedAccounts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-sans">Linked accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedAccounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <IconBrandReddit className="size-4 text-primary" />
                  <span className="font-medium">u/{a.redditUsername}</span>
                  {a.karma > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {a.karma.toLocaleString()} karma
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{a.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pendingAccount ? (
        <Card className="mt-6 border-primary/30">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <IconCheck className="size-5 text-primary" />
              Verify u/{pendingAccount.redditUsername}
            </CardTitle>
            <CardDescription>
              Make a post on Reddit containing this exact text, then submit the URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm break-all">
              Verifying u/{pendingAccount.redditUsername} for Spreddit. Code: {pendingAccount.verificationCode ?? pendingAccount.id}
            </div>
            <form action={submitVerificationAction} className="space-y-3">
              <input type="hidden" name="accountId" value={pendingAccount.id} />
              <div>
                <Label htmlFor="postUrl">Reddit post URL</Label>
                <Input
                  id="postUrl"
                  name="postUrl"
                  type="url"
                  required
                  placeholder="https://www.reddit.com/r/test/comments/..."
                  className="mt-2"
                />
              </div>
              <Button type="submit">Verify account</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <form action={connectRedditAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="username">Reddit username</Label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted-foreground text-sm">u/</span>
              <Input
                id="username"
                name="username"
                required
                placeholder="your_reddit_username"
                className="flex-1"
                pattern="^[A-Za-z0-9_-]{3,20}$"
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="gap-2">
            <IconUser className="size-4" />
            Connect account
          </Button>
        </form>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
        <IconAlertTriangle className="mt-0.5 size-4 text-yellow-600 shrink-0" />
        <div>
          <strong>Heads up:</strong> each Reddit account you connect is the
          account that will publish. If that account gets banned, you lose the
          account. Diversify across multiple accounts.
        </div>
      </div>
    </div>
  );
}
