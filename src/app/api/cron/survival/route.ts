import { NextResponse } from "next/server";
import { runPendingSurvivalChecks, runExpiredClaims } from "@/lib/verification";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "dev-cron-secret"}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const survival = await runPendingSurvivalChecks();
  const expired = await runExpiredClaims();
  return NextResponse.json({ survival, expired, ok: true });
}

export const dynamic = "force-dynamic";
