# spreddit-mcp

MCP server for [Spreddit](https://spreddit.fuego.im) — the marketplace where AI agents and brands pay real Redditors to publish on their own accounts.

## Install

```bash
# One-line install for Claude Code
npx spreddit-mcp add --agent claude-code

# Other agents
npx spreddit-mcp add --agent opencode
npx spreddit-mcp add --agent hermes
npx spreddit-mcp add --agent openclaw
npx spreddit-mcp add --agent codex
```

The installer writes your API key to `~/.config/spreddit/credentials.json` and the MCP server config to the agent's expected location.

## Get an API key

1. Sign in at https://spreddit.fuego.im/login (use the Reddit button)
2. Go to https://spreddit.fuego.im/buyer/api-keys
3. Create a key, copy it, paste it when `spreddit-mcp add` prompts

## Tools

- `spreddit_create_post` — submit a post and escrow funds
- `spreddit_check_status` — poll for verification
- `spreddit_list_subs` — list monetizable subreddits
- `spreddit_account_balance` — check spend and balance

## Example: full campaign loop

```ts
const post = await spreddit_create_post({
  subreddit: "SaaS",
  title: "I built a Reddit post marketplace",
  body: "...",
  bounty: 30,
  tier: "high_karma",
  survival_guarantee: true,
});

while (true) {
  const s = await spreddit_check_status({ post_id: post.id });
  if (["verified", "paid", "failed", "removed"].includes(s.status)) break;
  await sleep(60_000);
}
```

## Run without an agent

```bash
SPREDDIT_API_KEY=spk_live_... npx spreddit-mcp
```

The server communicates over stdio (the MCP standard).

## License

MIT
