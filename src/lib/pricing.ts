export const TIER_LABEL = {
  random: "Standard",
  high_karma: "Premium",
  dedicated: "Pro",
} as const;

export const TIER_REQUIREMENTS = {
  random: { minKarma: 1000, minAgeDays: 180 },
  high_karma: { minKarma: 10000, minAgeDays: 365 },
  dedicated: { minKarma: 50000, minAgeDays: 730 },
} as const;

export const TIER_PRICE_CENTS: Record<keyof typeof TIER_LABEL, number> = {
  random: 399,
  high_karma: 699,
  dedicated: 999,
};

export const PLATFORM_FEE_BPS = 2000;

export function calculatePlatformFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

export function calculatePosterEarnings(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}

export function getTierPrice(tier: keyof typeof TIER_LABEL): number {
  return TIER_PRICE_CENTS[tier];
}