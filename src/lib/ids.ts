import { randomUUID, randomBytes } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

export function newApiKey(): { id: string; key: string; prefix: string } {
  const id = randomUUID();
  const raw = randomBytes(24).toString("base64url");
  const prefix = "spk_live_";
  const key = `${prefix}${raw}`;
  return { id, key, prefix };
}

export function generateClaimExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}
