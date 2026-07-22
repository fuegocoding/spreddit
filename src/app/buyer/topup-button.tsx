"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { IconBolt, IconCreditCard, IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const QUICK_AMOUNTS = [10, 25, 50, 100, 250];

export function TopupButton({ demo }: { demo: boolean }) {
  const [amount, setAmount] = useState<number>(50);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function topup() {
    const amountCents = Math.round(amount * 100);
    if (amountCents < 500) {
      toast.error("Minimum top-up is $5.00");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/wallet/topup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountCents, demo: demo ? "true" : "false" }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else if (data.ok && data.mode === "demo") {
          toast.success(
            `Added ${(data.amountCents / 100).toFixed(2)}. New balance: $${(data.balanceCents / 100).toFixed(2)}`
          );
          router.refresh();
        } else {
          toast.error(data.error ?? "Top-up failed");
        }
      } catch (e: any) {
        toast.error(e.message ?? "Top-up failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="topup-amount">Amount (USD)</Label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">$</span>
            <Input
              id="topup-amount"
              type="number"
              min={5}
              max={10000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {QUICK_AMOUNTS.map((a) => (
            <Button
              key={a}
              type="button"
              variant={amount === a ? "default" : "outline"}
              size="sm"
              onClick={() => setAmount(a)}
            >
              ${a}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={topup} disabled={pending} className="gap-2">
          {pending ? <IconLoader2 className="size-4 animate-spin" /> : demo ? <IconBolt className="size-4" /> : <IconCreditCard className="size-4" />}
          {pending
            ? "Processing..."
            : demo
            ? `Add $${amount} (demo)`
            : `Top up $${amount} with Stripe`}
        </Button>
        {demo && (
          <p className="text-xs text-muted-foreground max-w-md">
            Demo mode is on. Stripe is not configured, so top-ups are added
            instantly without a real charge. Set <code>STRIPE_SECRET_KEY</code>{" "}
            in your env to switch to real payments.
          </p>
        )}
      </div>
    </div>
  );
}
