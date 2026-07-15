import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/money";
import { IconArrowLeft, IconWallet, IconBrandStripe } from "@tabler/icons-react";
import Link from "next/link";
import { requestWithdrawAction } from "./actions";

export default async function WithdrawPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "poster") redirect("/buyer");

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  const payouts = await db
    .select()
    .from(schema.payouts)
    .where(eq(schema.payouts.userId, user.id))
    .orderBy(desc(schema.payouts.createdAt))
    .limit(20);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/poster">
            <IconArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-1">
            Withdraw
          </p>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight">Payouts</h1>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconWallet className="size-5" />
            </div>
            <div>
              <CardTitle className="font-sans">Available balance</CardTitle>
              <CardDescription>Withdraw your earnings at any time.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-sans font-extrabold mb-6">
            {formatUsd(user.balanceCents ?? 0, { withCents: true })}
          </div>

          {!user.stripeAccountId ? (
            <Button asChild className="gap-2">
              <Link href="/api/stripe/connect">
                <IconBrandStripe className="size-5" />
                Connect Stripe
              </Link>
            </Button>
          ) : (
            <form action={requestWithdrawAction} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="amountCents">Amount (cents)</Label>
                <Input
                  id="amountCents"
                  name="amountCents"
                  type="number"
                  min={100}
                  max={user.balanceCents ?? 0}
                  placeholder="100"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Min $1.00 &middot; Max {formatUsd(user.balanceCents ?? 0, { withCents: true })}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Payout method</Label>
                <select
                  id="method"
                  name="method"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <Button type="submit" className="gap-2">
                <IconWallet className="size-4" />
                Withdraw
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Payout history</CardTitle>
            <CardDescription>Your recent withdrawals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">
                    {formatUsd(p.amountCents, { withCents: true })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()} &middot; {p.method}
                  </div>
                </div>
                <span className="text-sm capitalize text-muted-foreground">
                  {p.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
