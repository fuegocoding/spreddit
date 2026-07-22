import { NextResponse } from "next/server";
import { runWeeklyPayoutBatch } from "@/lib/verification";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "dev-cron-secret"}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runWeeklyPayoutBatch();
  return NextResponse.json({ ok: true, ...result });
}

export const dynamic = "force-dynamic";
