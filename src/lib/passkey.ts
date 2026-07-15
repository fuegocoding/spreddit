import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

const RP_NAME = "Spreddit";

function getWebAuthnConfig() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const rpID = new URL(url).hostname;
  const origin = url;
  return { rpID, origin };
}

export async function generateRegistrationOpts(user: {
  id: string;
  email: string;
}) {
  const { rpID } = getWebAuthnConfig();
  const opts = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email,
    userDisplayName: user.email,
    userID: isoBase64URL.fromString(user.id),
    attestationType: "none",
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
  return opts;
}

export async function verifyRegistration(
  response: any,
  expectedChallenge: string
) {
  const { rpID, origin } = getWebAuthnConfig();
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
}

export async function generateAuthenticationOpts(allowCredentials: {
  id: string;
  type: "public-key";
  transports?: AuthenticatorTransport[];
}[]) {
  const { rpID } = getWebAuthnConfig();
  const opts = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials as any,
    userVerification: "preferred",
  });
  return opts;
}

export async function verifyAuthentication(
  response: any,
  expectedChallenge: string,
  credentialPublicKeyBase64: string,
  credentialCounter: number
) {
  const { rpID, origin } = getWebAuthnConfig();
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialPublicKey: isoBase64URL.toBuffer(credentialPublicKeyBase64),
      credentialID: isoBase64URL.toBuffer(response.id),
      counter: credentialCounter,
      transports: response.response?.transports ?? [],
    },
  });
}