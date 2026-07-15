import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyRegistration } from "@/lib/passkey";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { newId } from "@/lib/ids";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get("sp_challenge")?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "No challenge found. Try again." },
      { status: 400 }
    );
  }

  const credential = await request.json();

  let verification;
  try {
    verification = await verifyRegistration(credential, expectedChallenge);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Verification failed: ${e.message}` },
      { status: 400 }
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json(
      { error: "Registration not verified" },
      { status: 400 }
    );
  }

  const { credentialPublicKey, credentialID, counter } =
    verification.registrationInfo;

  await db.insert(schema.passkeys).values({
    id: newId(),
    userId: session.user.id,
    credentialId: isoBase64URL.fromBuffer(credentialID),
    publicKey: isoBase64URL.fromBuffer(credentialPublicKey),
    counter,
    backedUp: false,
    transports: credential.response?.transports ?? [],
  });

  cookieStore.delete("sp_challenge");

  return NextResponse.json({ ok: true });
}