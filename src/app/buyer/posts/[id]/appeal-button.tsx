"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

export function AppealButton({ claimId }: { claimId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function appeal() {
    setLoading(true);
    try {
      const res = await fetch("/api/buyer/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Banned poster's account restored. $${(data.chargedCents / 100).toFixed(2)} charged to your wallet.`);
        router.refresh();
      } else {
        toast.error(data.error ?? "Appeal failed");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Appeal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={appeal} disabled={loading} size="sm" variant="outline" className="gap-1">
      {loading ? <IconLoader2 className="size-3 animate-spin" /> : null}
      {loading ? "Working..." : "Appeal ban ($0.99)"}
    </Button>
  );
}
