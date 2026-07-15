"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AppealButton({ claimId }: { claimId: string }) {
  const [loading, setLoading] = useState(false);

  async function appeal() {
    setLoading(true);
    const res = await fetch("/api/buyer/appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
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
    <Button onClick={appeal} disabled={loading} size="sm" variant="outline" className="gap-1">
      {loading ? "..." : "Appeal ban ($0.99)"}
    </Button>
  );
}