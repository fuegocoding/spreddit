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

export const BOOST_PRICE_CENTS = {
  survival_guarantee: 500,
  sub_match_priority: 200,
  same_day_publish: 300,
} as const;

export function calculatePlatformFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

export function calculatePosterEarnings(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}

export function getTierPrice(tier: keyof typeof TIER_LABEL): number {
  return TIER_PRICE_CENTS[tier];
}

export function calculateBoostsTotal(opts: {
  survivalGuarantee?: boolean;
  subMatchPriority?: boolean;
  sameDayPublish?: boolean;
}): number {
  let total = 0;
  if (opts.survivalGuarantee) total += BOOST_PRICE_CENTS.survival_guarantee;
  if (opts.subMatchPriority) total += BOOST_PRICE_CENTS.sub_match_priority;
  if (opts.sameDayPublish) total += BOOST_PRICE_CENTS.same_day_publish;
  return total;
}

export function calculateTotalCharge(
  tier: keyof typeof TIER_LABEL,
  opts: {
    survivalGuarantee?: boolean;
    subMatchPriority?: boolean;
    sameDayPublish?: boolean;
  } = {}
): { base: number; boosts: number; total: number } {
  const base = TIER_PRICE_CENTS[tier];
  const boosts = calculateBoostsTotal(opts);
  return { base, boosts, total: base + boosts };
}
