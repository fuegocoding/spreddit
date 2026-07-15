import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateRegistrationOpts } from "@/lib/passkey";
import { cookies } from "next/headers";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const opts = await generateRegistrationOpts({
    id: session.user.id,
    email: session.user.email,
  });

  const cookieStore = await cookies();
  cookieStore.set("sp_challenge", opts.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });

  return NextResponse.json(opts);
}