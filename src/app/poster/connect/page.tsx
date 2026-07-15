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
import { IconBrandReddit, IconShieldCheck, IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export default async function ConnectRedditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const linkedAccounts = await db
    .select()
    .from(schema.redditAccounts)
    .where(eq(schema.redditAccounts.userId, session.user.id));

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
        Verify your Reddit account via OAuth. We read your username, karma, and
        account age. We don&apos;t post on your behalf or store your password.
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
          <CardTitle className="font-sans flex items-center gap-2">
            <IconShieldCheck className="size-5 text-primary" />
            What we access
          </CardTitle>
          <CardDescription>
            Spreddit uses Reddit OAuth to read only: your username, karma,
            account age. We never post, comment, vote, or message on your behalf.
          </CardDescription>
        </CardHeader>
      </Card>

      {linkedAccounts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-sans">Already connected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedAccounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">u/{a.redditUsername}</span>
                <span className="text-xs text-muted-foreground">{a.status}</span>
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
        <Button type="submit" size="lg" className="gap-2">
          <IconBrandReddit className="size-5" />
          Continue with Reddit
        </Button>
      </form>

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