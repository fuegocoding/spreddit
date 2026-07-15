import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    await db.select().from((await import("@/db")).schema.users).limit(1);
    return NextResponse.json({ status: "ok", driver: (await import("@/db")).driver });
  } catch (e: any) {
    return NextResponse.json(
      {
        status: "error",
        error: e.message,
        cause: e.cause?.message,
        stack: e.stack?.split("\n").slice(0, 5).join("\n"),
      },
      { status: 503 }
    );
  }
}

export const dynamic = "force-dynamic";
