import { NextResponse } from "next/server";
import { SUGGESTED_SUBS } from "@/lib/subs";

export async function GET() {
  const subs = Object.entries(SUGGESTED_SUBS)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, meta]) => ({
      name,
      description: meta.description,
      minKarma: meta.minKarma,
      baseRateCents: meta.baseRate * 100,
    }));
  return NextResponse.json({ subs, total: subs.length });
}
