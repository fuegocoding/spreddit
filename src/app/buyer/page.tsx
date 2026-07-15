import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getBuyerStats,
  getBuyerPosts,
} from "@/lib/queries";
import { formatUsd, dollarsToCents } from "@/lib/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TIER_LABEL, TIER_MULTIPLIER } from "@/lib/pricing";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  if (session.user.role === "poster") redirect("/poster");

  const stats = await getBuyerStats(session.user.id);
  const posts = await getBuyerPosts(session.user.id);

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Buyer dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit posts. Track claims. Pay only when verified.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/buyer/api-keys" />}>
            API keys
          </Button>
          <Button render={<Link href="/buyer/new" />}>
            <Plus /> New post
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat
          label="Total posts"
          value={stats?.total?.toString() ?? "0"}
        />
        <Stat
          label="Active"
          value={stats?.active?.toString() ?? "0"}
          hint="In feed, claimed, or published"
        />
        <Stat
          label="Verified"
          value={stats?.paid?.toString() ?? "0"}
          hint="Survived 24h check"
        />
        <Stat
          label="Total spend"
          value={formatUsd(stats?.spendCents ?? 0)}
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your posts</CardTitle>
          <CardDescription>
            All campaigns you&apos;ve submitted. Click a row to see claim status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Sub</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Bounty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => {
                  const status = STATUS_BADGE[p.status] ?? STATUS_BADGE.available;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-[320px] truncate font-medium">
                        {p.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        r/{p.targetSub}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIER_LABEL[p.tier]} ({TIER_MULTIPLIER[p.tier]}×)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatUsd(p.bountyCents, { withCents: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" render={<Link href={`/buyer/posts/${p.id}`} />}>
                          <ArrowRight />
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

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {hint && <CardDescription className="text-xs">{hint}</CardDescription>}
      </CardHeader>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-sm text-muted-foreground">No posts yet.</div>
      <Button render={<Link href="/buyer/new" />}>
        <Plus /> Create your first post
      </Button>
    </div>
  );
}
