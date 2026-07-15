#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.SPREDDIT_API_URL ?? "https://spreddit.fuego.im";
const API_KEY =
  process.env.SPREDDIT_API_KEY ??
  (() => {
    const fs = require("node:fs");
    const path = require("node:path");
    const os = require("node:os");
    const configPath = path.join(os.homedir(), ".config", "spreddit", "credentials.json");
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return cfg.apiKey;
    }
    return "";
  })();

if (!API_KEY) {
  console.error(
    "spreddit-mcp: no API key. Set SPREDDIT_API_KEY or run `spreddit-mcp add`."
  );
  process.exit(1);
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spreddit API ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "spreddit",
  version: "0.1.0",
});

server.tool(
  "spreddit_create_post",
  "Submit a post to the Spreddit feed. Funds are escrowed immediately. Returns the post id, status, and pricing breakdown.",
  {
    subreddit: z.string().describe("Target subreddit name, no r/ prefix"),
    title: z.string().min(10).max(300).describe("Post title"),
    body: z.string().min(20).max(10000).describe("Post body in markdown/plaintext"),
    bounty: z
      .number()
      .min(5)
      .max(500)
      .describe("Base bounty in USD (before tier multiplier and boosts)"),
    tier: z
      .enum(["random", "high_karma", "dedicated"])
      .default("random")
      .describe("Account quality tier"),
    link_url: z.string().url().optional().describe("Optional link URL"),
    image_url: z.string().url().optional().describe("Optional image URL"),
    survival_guarantee: z
      .boolean()
      .optional()
      .describe("+$5 — full refund if post is mod-removed within 24h"),
    sub_match_priority: z
      .boolean()
      .optional()
      .describe("+$2 — surface first to posters opted into the sub"),
    same_day_publish: z
      .boolean()
      .optional()
      .describe("+$3 — bounty doubles if unclaimed after 1h"),
  },
  async (args) => {
    const result = await api("/api/v1/posts", {
      method: "POST",
      body: JSON.stringify({
        targetSub: args.subreddit,
        title: args.title,
        body: args.body,
        linkUrl: args.link_url,
        imageUrl: args.image_url,
        baseBounty: args.bounty,
        tier: args.tier,
        survivalGuarantee: args.survival_guarantee,
        subMatchPriority: args.sub_match_priority,
        sameDayPublish: args.same_day_publish,
      }),
    });
    return {
      content: [
        {
          type: "text",
          text:
            `Post created.\n` +
            `id: ${result.id}\n` +
            `status: ${result.status}\n` +
            `bounty: $${(result.bountyCents / 100).toFixed(2)}\n` +
            `platform fee: $${(result.platformFeeCents / 100).toFixed(2)}\n` +
            `poster payout: $${(result.posterPayoutCents / 100).toFixed(2)}\n` +
            `\nPoll spreddit_check_status({ post_id: "${result.id}" }) to track.`,
        },
      ],
    };
  }
);

server.tool(
  "spreddit_check_status",
  "Get the current status of a post and any claims. Poll this until status is verified, paid, failed, or removed.",
  {
    post_id: z.string().describe("The post id returned from spreddit_create_post"),
  },
  async (args) => {
    const { post, claims } = await api(`/api/v1/posts/${args.post_id}`);
    const summary = claims
      .map(
        (c: any) =>
          `  claim ${c.id}: ${c.status} (expires ${c.expiresAt})`
      )
      .join("\n");
    return {
      content: [
        {
          type: "text",
          text:
            `Post: ${post.id}\n` +
            `status: ${post.status}\n` +
            `sub: r/${post.targetSub}\n` +
            `bounty: $${(post.bountyCents / 100).toFixed(2)}\n` +
            `tier: ${post.tier}\n` +
            `claims: ${claims.length}\n` +
            (summary ? `\n${summary}` : ""),
        },
      ],
    };
  }
);

server.tool(
  "spreddit_list_subs",
  "List the subreddits Spreddit currently supports and their base rates.",
  {},
  async () => {
    const { subs } = await api("/api/v1/subs");
    return {
      content: [
        {
          type: "text",
          text: subs
            .map(
              (s: any) =>
                `r/${s.name}  —  min karma ${s.minKarma}  —  base $${(s.baseRateCents / 100).toFixed(0)}`
            )
            .join("\n"),
        },
      ],
    };
  }
);

server.tool(
  "spreddit_account_balance",
  "Get your Spreddit account balance and stats.",
  {},
  async () => {
    const acct = await api("/api/v1/account");
    return {
      content: [
        {
          type: "text",
          text:
            `Account: ${acct.email}\n` +
            `role: ${acct.role}\n` +
            `active posts: ${acct.activePosts}\n` +
            `total spend: $${(acct.totalSpendCents / 100).toFixed(2)}`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
