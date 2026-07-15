import Stripe from "stripe";
import { env } from "./env";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-09-30.acacia" as any })
  : null;

export const PLATFORM_FEE_BPS = env.STRIPE_PLATFORM_FEE_BPS;

export function platformFeeAmount(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

export function assertStripe() {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
    );
  }
  return stripe;
}
