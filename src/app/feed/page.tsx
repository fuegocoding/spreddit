import { db, schema } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIER_LABEL, TIER_PRICE_CENTS } from "@/lib/pricing";
import { formatUsd } from "@/lib/money";
import { IconCoin, IconClock, IconBrandReddit, IconLogin } from "@tabler/icons-react";
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

  const accounts = session?.user
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
    <div className="max-w-5xl mx-auto px-6 md:px-16 py-16">
      <div className="mb-12">
        <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-2">
          Feed
        </p>
        <h1 className="font-sans text-4xl font-extrabold tracking-tight">
          {posts.length} post{posts.length !== 1 && "s"} waiting
        </h1>
        <p className="mt-2 text-muted-foreground">
          {session?.user
            ? accounts.length > 0
              ? "Claim a post, publish it on your account, submit proof, get paid."
              : "Connect your Reddit account to start claiming. We verify via a public post URL."
            : "Sign in to claim."}
        </p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No posts in the feed right now. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const accountOk =
              session?.user && session.user.role === "poster" && accounts.length > 0;
            return (
              <Card key={p.id} className="flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
                <CardContent className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">r/{p.targetSub}</Badge>
                    <Badge variant="secondary">{TIER_LABEL[p.tier]}</Badge>
                  </div>
                  <h3 className="font-sans font-bold line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {p.body.slice(0, 160)}
                    {p.body.length > 160 ? "…" : ""}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-primary font-sans font-bold">
                      <IconCoin className="size-4" />
                      {formatUsd(p.bountyCents, { withCents: true })}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconClock className="size-3" />
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
                    <Button asChild variant="outline" className="w-full gap-2">
                      <Link href="/login">
                        <IconLogin className="size-4" />
                        Sign in to claim
                      </Link>
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