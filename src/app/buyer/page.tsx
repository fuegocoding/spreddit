import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuyerStats, getBuyerPosts } from "@/lib/queries";
import { formatUsd } from "@/lib/money";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TIER_LABEL } from "@/lib/pricing";
import { IconArrowRight, IconPlus, IconKey, IconWallet } from "@tabler/icons-react";
import Link from "next/link";
import { TopupButton } from "./topup-button";
import { isDemoMode } from "@/lib/env";

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  pending_payment: { variant: "outline", label: "Pending payment" },
  available: { variant: "secondary", label: "In feed" },
  claimed: { variant: "default", label: "Claimed" },
  published: { variant: "default", label: "Published" },
  verified: { variant: "default", label: "Verified" },
  paid: { variant: "default", label: "Paid" },
  failed: { variant: "destructive", label: "Failed" },
  refunded: { variant: "destructive", label: "Refunded" },
};

export default async function BuyerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getBuyerStats(session.user.id);
  const posts = await getBuyerPosts(session.user.id);
  const balance = session.user.balanceCents ?? 0;
  const demo = isDemoMode;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-16 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
        <div>
          <p className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-2">
            Dashboard
          </p>
          <h1 className="font-sans text-4xl font-extrabold tracking-tight">Buyer</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/buyer/api-keys">
              <IconKey className="size-4" />
              API keys
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/buyer/new">
              <IconPlus className="size-4" />
              New post
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Stat label="Total posts" value={stats?.total?.toString() ?? "0"} />
        <Stat label="Active" value={stats?.active?.toString() ?? "0"} />
        <Stat label="Verified" value={stats?.paid?.toString() ?? "0"} />
        <Stat label="Total spend" value={formatUsd(stats?.spendCents ?? 0, { withCents: true })} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <IconWallet className="size-5" />
              </div>
              <div>
                <CardTitle className="font-sans">Wallet balance</CardTitle>
                <CardDescription>
                  Used to fund new posts. Top up any amount, then submit posts that
                  deduct from your balance.
                </CardDescription>
              </div>
            </div>
            <div className="text-3xl font-sans font-extrabold">
              {formatUsd(balance, { withCents: true })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TopupButton demo={demo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Your posts</CardTitle>
          <CardDescription>All campaigns you have submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">No posts yet.</p>
              <Button asChild className="gap-2">
                <Link href="/buyer/new">
                  <IconPlus className="size-4" />
                  Create your first post
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Sub</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => {
                  const status = STATUS_BADGE[p.status] ?? STATUS_BADGE.available;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-[260px] truncate font-medium">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground">r/{p.targetSub}</TableCell>
                      <TableCell><Badge variant="outline">{TIER_LABEL[p.tier]}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatUsd(p.bountyCents, { withCents: true })}
                      </TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/buyer/posts/${p.id}`}>
                            <IconArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
