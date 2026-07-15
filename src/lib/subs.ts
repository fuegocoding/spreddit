export const MONETIZABLE_SUBS: Record<
  string,
  { description: string; minKarma: number; baseRate: number }
> = {
  SaaS: { description: "Software as a Service launches", minKarma: 1000, baseRate: 25 },
  startups: { description: "Startup launches and news", minKarma: 1000, baseRate: 30 },
  sideproject: { description: "Side project showcases", minKarma: 500, baseRate: 20 },
  ChatGPT: { description: "AI chatbot discussion", minKarma: 1000, baseRate: 15 },
  AI_Agents: { description: "AI agent discussion", minKarma: 1000, baseRate: 20 },
  artificial: { description: "General AI discussion", minKarma: 1000, baseRate: 15 },
  cryptocurrency: { description: "Crypto news and discussion", minKarma: 2000, baseRate: 20 },
  personalfinance: { description: "Personal finance advice", minKarma: 2000, baseRate: 25 },
  Entrepreneur: { description: "Entrepreneurship and business", minKarma: 1500, baseRate: 25 },
  IndieHackers: { description: "Indie hacker community", minKarma: 1000, baseRate: 25 },
};

export const SUB_OPTIONS = Object.entries(MONETIZABLE_SUBS).map(([name, meta]) => ({
  value: name,
  label: `r/${name} — ${meta.description}`,
}));

export function isSubAllowed(name: string): boolean {
  return name in MONETIZABLE_SUBS;
}
