import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/passkey";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get("sp_challenge")?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "No challenge found. Try again." },
      { status: 400 }
    );
  }

  const credential = await request.json();

  const [stored] = await db
    .select()
    .from(schema.passkeys)
    .where(eq(schema.passkeys.credentialId, credential.id))
    .limit(1);

  if (!stored) {
    return NextResponse.json(
      { error: "Passkey not found" },
      { status: 404 }
    );
  }

  let verification;
  try {
    verification = await verifyAuthentication(
      credential,
      expectedChallenge,
      stored.publicKey,
      stored.counter
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: `Verification failed: ${e.message}` },
      { status: 400 }
    );
  }

  if (!verification.verified) {
    return NextResponse.json(
      { error: "Authentication not verified" },
      { status: 400 }
    );
  }

  await db
    .update(schema.passkeys)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(schema.passkeys.id, stored.id));

  cookieStore.delete("sp_challenge");

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, stored.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    salt: "next-auth.session-token",
    token: {
      id: user.id,
      email: user.email,
      role: user.role,
      balanceCents: user.balanceCents,
    },
    maxAge: 30 * 24 * 60 * 60,
  });

  const isSecure = request.url.startsWith("https");
  cookieStore.set(isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token", token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.json({
    ok: true,
    email: user.email,
    role: user.role,
  });
}