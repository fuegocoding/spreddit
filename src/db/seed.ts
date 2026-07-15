import { db, schema, sqliteSchema } from "@/db";
const s: typeof sqliteSchema = schema as any;
import { newId } from "@/lib/ids";
import { TIER_PRICE_CENTS } from "@/lib/pricing";
import { dollarsToCents } from "@/lib/money";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding...");

  const [existing] = await db
    .select()
    .from(s.users)
    .where(eq(s.users.email, "buyer@spreddit.dev"))
    .limit(1);
  if (existing) {
    console.log("Already seeded. Delete data/spreddit.db to re-seed.");
    return;
  }

  const buyerId = newId();
  const posterId = newId();
  const redditId = newId();

  await db.insert(s.users).values([
    {
      id: buyerId,
      email: "buyer@spreddit.dev",
      emailVerified: new Date(),
      name: "Demo Buyer",
      role: "buyer",
      balanceCents: 0,
    },
    {
      id: posterId,
      email: "poster@spreddit.dev",
      emailVerified: new Date(),
      name: "Demo Poster",
      role: "poster",
      balanceCents: 0,
    },
  ]);

  await db.insert(s.redditAccounts).values({
    id: redditId,
    userId: posterId,
    redditUsername: "demo_poster",
    redditId: "t2_demo",
    karma: 15000,
    accountAgeDays: 600,
    optedSubs: ["SaaS", "startups", "sideproject", "AI_Agents", "ChatGPT"],
    verifiedAt: new Date(),
    status: "active",
    survivalRate: 0.92,
    totalPosts: 47,
  });

  const samplePosts = [
    {
      title: "I built a Reddit post marketplace so AI agents can launch on the front page of the internet",
      body: `Hey r/SaaS — I spent the last 6 months building Spreddit after hitting Reddit's API wall trying to launch my own tool.

The premise: AI agents can write the perfect Reddit post but can't post it without getting flagged, shadowbanned, or rate-limited. So I built a marketplace where AI agents and brands pay vetted human Redditors to publish on their own accounts.

What it does:
- Submit a post, set a bounty
- Vetted Redditors (1k+ karma, 6mo+ old) claim and publish
- Auto-verify the URL + 24h survival check
- Refund if the post gets mod-removed

The interesting part is the MCP integration — your Claude Code or OpenCode agent can run a full campaign loop unattended. One line to install.

We're in private beta. Looking for the first 50 posters and a handful of agent devs to try it.

Happy to answer questions or take feedback.`,
      targetSub: "SaaS",
      tier: "high_karma" as const,
      baseBounty: 30,
    },
    {
      title: "Open-sourcing my side project after 3 years — here's everything I learned",
      body: `After 3 years of nights and weekends, I'm finally open-sourcing my note-taking app.

Lessons learned:
1. Pick a niche. "Note-taking" is too broad. I narrowed to "note-taking for researchers" and the conversion tripled.
2. Launch on Reddit early. I waited until I had a "perfect" product. Bad move. The feedback from the v0 launch shaped the actual product.
3. Don't write a manifesto. Write a post.
4. Use a real domain. cost-of-domain.com is fine.
5. Charge from day one. Even $5/mo. Free users don't give feedback.

Repo: [link]
Live: [link]

AMA in the comments.`,
      targetSub: "sideproject",
      tier: "random" as const,
      baseBounty: 20,
    },
    {
      title: "Spent $200 testing AI agents on Reddit. Here's what I learned about post quality.",
      body: `I run a small AI agent and wanted to test if it could "launch on Reddit" the way a human would. After 50 posts across r/AI_Agents, r/ChatGPT, r/SaaS, and a few others, here's the data:

What worked:
- Posts that started with a specific personal story outperformed generic "I built X" posts by 3x
- The agent that wrote like a Redditor (lowercase, casual, no marketing tone) got 5x the engagement
- Posts with a clear "AMA in the comments" at the end got 2x more comments

What didn't:
- "Revolutionary", "game-changing", "10x" — instant downvotes
- Posts that linked in the first paragraph — flagged
- Posting more than 2x per week from the same account — mod-flagged

The biggest lesson: AI agents can write the post, but they can't post it without getting flagged. You need a human account with karma.

That's why I built Spreddit. It's a marketplace where AI agents submit posts and vetted humans (1k+ karma, 6mo+) publish them. I just open-beta'd it.

[link]

Curious what other agent devs are doing for distribution.`,
      targetSub: "AI_Agents",
      tier: "high_karma" as const,
      baseBounty: 30,
    },
  ];

  for (const p of samplePosts) {
    const bountyCents = TIER_PRICE_CENTS[p.tier];
    await db.insert(s.posts).values({
      id: newId(),
      buyerId,
      targetSub: p.targetSub,
      title: p.title,
      body: p.body,
      tier: p.tier,
      bountyCents,
      status: "available",
    });
  }

  console.log("Seeded:");
  console.log("  buyer@spreddit.dev");
  console.log("  poster@spreddit.dev (with verified u/demo_poster)");
  console.log(`  ${samplePosts.length} sample posts in the feed`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
