import { db, schema } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/pricing";
import { formatUsd } from "@/lib/money";
import { Coins, Clock } from "lucide-react";
import Link from "next/link";
import { ClaimButton } from "./claim-button";

export default async function PublicFeed() {
  const session = await auth();
  const posts = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.status, "available"))
    .orderBy(desc(schema.posts.createdAt))
    .limit(50);

  const accounts =
    session?.user
      ? await db
          .select()
          .from(schema.redditAccounts)
          .where(
            and(
              eq(schema.redditAccounts.userId, session.user.id),
              eq(schema.redditAccounts.status, "active")
            )
          )
      : [];

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Post feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length} post{posts.length !== 1 && "s"} waiting to be published.
            {session?.user
              ? accounts.length > 0
                ? " Click claim to publish on your account."
                : " Sign in and connect Reddit to claim."
              : " Sign in to claim."}
          </p>
        </div>
        {!session?.user && (
          <Button render={<Link href="/login" />}>Sign in to claim</Button>
        )}
      </div>

      {posts.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center text-muted-foreground">
            No posts in the feed right now. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const accountOk =
              session?.user && session.user.role === "poster" && accounts.length > 0;
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">r/{p.targetSub}</Badge>
                    <Badge variant="secondary">
                      {TIER_LABEL[p.tier]} ({TIER_MULTIPLIER[p.tier]}×)
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-base">{p.title}</CardTitle>
                  <CardDescription className="line-clamp-3 text-xs">
                    {p.body.slice(0, 200)}
                    {p.body.length > 200 ? "…" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-orange-500">
                      <Coins className="size-4" />
                      <span className="font-semibold">
                        {formatUsd(p.bountyCents, { withCents: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {accountOk ? (
                    <ClaimButton
                      postId={p.id}
                      accounts={accounts.map((a) => ({
                        id: a.id,
                        username: a.redditUsername,
                        karma: a.karma,
                      }))}
                    />
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      {session?.user?.role === "poster"
                        ? "Connect a Reddit account"
                        : "Sign in as poster to claim"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
