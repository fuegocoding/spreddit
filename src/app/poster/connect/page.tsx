import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
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
import { RedditMark } from "@/components/reddit-mark";
import { ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function ConnectRedditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // See if there's an existing unlinked Reddit account from a prior session
  const linkedAccounts = await db
    .select()
    .from(schema.redditAccounts)
    .where(eq(schema.redditAccounts.userId, session.user.id));

  return (
    <div className="container py-10 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={<Link href="/poster" />}
      >
        ← Back
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight">Connect Reddit</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify your Reddit account via OAuth. We read your username, karma, and
        account age. We don&apos;t post on your behalf or store your password.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RedditMark className="size-5 text-orange-500" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ReqRow>1,000+ karma and 6+ months old (Random tier)</ReqRow>
          <ReqRow>10,000+ karma and 1+ year old (High-karma tier)</ReqRow>
          <ReqRow>50,000+ karma and 2+ years old (Dedicated tier)</ReqRow>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-orange-500" />
            What we access
          </CardTitle>
          <CardDescription>
            Spreddit uses Reddit OAuth to read only: your username, karma,
            account age, and the subreddits you moderate. We never post,
            comment, vote, or message on your behalf.
          </CardDescription>
        </CardHeader>
      </Card>

      {linkedAccounts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Already connected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedAccounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium">u/{a.redditUsername}</span>
                <span className="text-xs text-muted-foreground">
                  {a.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <form
        action={async () => {
          "use server";
          await signIn("reddit", { redirectTo: "/poster" });
        }}
        className="mt-6"
      >
        <Button type="submit" size="lg">
          <RedditMark className="size-4" /> Continue with Reddit
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
        <AlertCircle className="mt-0.5 size-4 text-yellow-600" />
        <div>
          <strong>Heads up:</strong> each Reddit account you connect is the
          account that will publish. If that account gets banned, you lose the
          account. Diversify across multiple accounts.
        </div>
      </div>
    </div>
  );
}

function ReqRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="size-1.5 rounded-full bg-orange-500" />
      <span>{children}</span>
    </div>
  );
}
