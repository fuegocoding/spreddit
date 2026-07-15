#!/usr/bin/env node
// One-line installer: `npx spreddit-mcp add --agent claude-code` etc.

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command !== "add") {
    console.error("Usage: npx spreddit-mcp add --agent <agent>");
    process.exit(1);
  }

  const agentFlag = args.indexOf("--agent");
  const agent = agentFlag !== -1 ? args[agentFlag + 1] : "claude-code";

  const validAgents = [
    "claude-code",
    "opencode",
    "hermes",
    "openclaw",
    "codex",
    "codex-cli",
  ];
  if (!validAgents.includes(agent)) {
    console.error(`Unknown agent: ${agent}`);
    console.error(`Valid: ${validAgents.join(", ")}`);
    process.exit(1);
  }

  const configDir = `${homedir()}/.config/spreddit`;
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  const credPath = `${configDir}/credentials.json`;

  let apiKey = process.env.SPREDDIT_API_KEY;

  if (!apiKey && existsSync(credPath)) {
    try {
      const cfg = JSON.parse(readFileSync(credPath, "utf-8"));
      apiKey = cfg.apiKey;
    } catch {}
  }

  if (!apiKey) {
    console.log("No API key found.");
    console.log("Get one at https://spreddit.fuego.im/buyer/api-keys");
    console.log("");
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(
      "Paste your API key (spk_live_...): "
    );
    rl.close();
    apiKey = answer.trim();
    if (!apiKey || !apiKey.startsWith("spk_live_")) {
      console.error("Invalid API key format. Must start with spk_live_");
      process.exit(1);
    }
  }

  writeFileSync(
    credPath,
    JSON.stringify({ apiKey, installedAt: new Date().toISOString() }, null, 2),
    { mode: 0o600 }
  );
  console.log(`✓ Saved credentials to ${credPath}`);

  const config = {
    mcpServers: {
      spreddit: {
        command: "npx",
        args: ["-y", "spreddit-mcp"],
        env: { SPREDDIT_API_KEY: apiKey },
      },
    },
  };

  let targetPath;
  switch (agent) {
    case "claude-code":
      targetPath = `${homedir()}/.claude/mcp_servers.json`;
      break;
    case "opencode":
      targetPath = `${homedir()}/.config/opencode/mcp.json`;
      break;
    case "hermes":
      targetPath = `${homedir()}/.hermes/mcp.json`;
      break;
    case "openclaw":
      targetPath = `${homedir()}/.openclaw/mcp.json`;
      break;
    case "codex":
    case "codex-cli":
      targetPath = `${homedir()}/.codex/mcp_servers.json`;
      break;
  }

  mkdirSync(dirname(targetPath), { recursive: true });

  let existing = {};
  if (existsSync(targetPath)) {
    try {
      existing = JSON.parse(readFileSync(targetPath, "utf-8"));
    } catch {
      console.warn(
        `Could not parse existing ${targetPath}; overwriting.`
      );
    }
  }

  const merged = {
    ...existing,
    mcpServers: {
      ...(existing.mcpServers || {}),
      ...config.mcpServers,
    },
  };

  writeFileSync(targetPath, JSON.stringify(merged, null, 2));
  console.log(`✓ Wrote MCP config for ${agent} → ${targetPath}`);
  console.log(`\nRestart ${agent} to pick up the Spreddit server.`);
  console.log(`\nTry it: ask your agent to "use spreddit_create_post" or visit`);
  console.log(`  https://spreddit.fuego.im/docs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
