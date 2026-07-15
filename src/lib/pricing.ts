export const TIER_MULTIPLIER = {
  random: 1.0,
  high_karma: 2.5,
  dedicated: 5.0,
} as const;

export const TIER_LABEL = {
  random: "Random",
  high_karma: "High-karma",
  dedicated: "Dedicated",
} as const;

export const TIER_REQUIREMENTS = {
  random: { minKarma: 1000, minAgeDays: 180 },
  high_karma: { minKarma: 10000, minAgeDays: 365 },
  dedicated: { minKarma: 50000, minAgeDays: 730 },
} as const;

export const BASE_BOUNTY_CENTS = 1000;
export const PLATFORM_FEE_BPS = 2000;

export function calculateBounty(
  baseCents: number,
  tier: keyof typeof TIER_MULTIPLIER,
  boosts: { survival?: boolean; subMatch?: boolean; sameDay?: boolean } = {}
) {
  const tiered = Math.round(baseCents * TIER_MULTIPLIER[tier]);
  const boostTotal =
    (boosts.survival ? 500 : 0) +
    (boosts.subMatch ? 200 : 0) +
    (boosts.sameDay ? 300 : 0);
  return tiered + boostTotal;
}

export function calculatePlatformFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

export function calculatePosterEarnings(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}
