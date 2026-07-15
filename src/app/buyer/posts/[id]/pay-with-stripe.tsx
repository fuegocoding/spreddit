"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconCreditCard } from "@tabler/icons-react";
import { formatUsd } from "@/lib/money";

export function PayWithStripe({ postId, amountCents }: { postId: string; amountCents: number }) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert(data.error ?? "Something went wrong");
    }
  }

  return (
    <Button onClick={pay} disabled={loading} size="lg" className="gap-2">
      <IconCreditCard className="size-4" />
      {loading ? "Redirecting to Stripe..." : `Pay ${formatUsd(amountCents, { withCents: true })}`}
    </Button>
  );
}
