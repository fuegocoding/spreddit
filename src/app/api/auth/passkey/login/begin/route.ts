import { NextResponse } from "next/server";
import { generateAuthenticationOpts } from "@/lib/passkey";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  let credentials: { id: string; type: "public-key"; transports?: AuthenticatorTransport[] }[] = [];

  if (parsed.success && parsed.data.email) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, parsed.data.email))
      .limit(1);
    if (user) {
      const passkeys = await db
        .select()
        .from(schema.passkeys)
        .where(eq(schema.passkeys.userId, user.id));
      credentials = passkeys.map((pk) => ({
        id: pk.credentialId,
        type: "public-key" as const,
        transports: pk.transports as AuthenticatorTransport[],
      }));
    }
  }

  const opts = await generateAuthenticationOpts(credentials);

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