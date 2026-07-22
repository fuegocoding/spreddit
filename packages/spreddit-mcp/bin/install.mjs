#!/usr/bin/env node
// One-line installer: `npx spreddit-mcp add --agent <name> [--config <path>]`
//
// Works for any MCP-supporting agent. Writes an entry to the agent's MCP
// config file pointing at `npx -y spreddit-mcp`. Pass --config to point at
// a custom path; otherwise we fall back to a few well-known locations.

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

const KNOWN_AGENT_PATHS: Record<string, string> = {
  "claude-code": `${homedir()}/.claude/mcp_servers.json`,
  "claude-code-desktop": `${homedir()}/.claude/mcp_servers.json`,
  claude: `${homedir()}/.claude/mcp_servers.json`,
  opencode: `${homedir()}/.config/opencode/mcp.json`,
  hermes: `${homedir()}/.hermes/mcp.json`,
  openclaw: `${homedir()}/.openclaw/mcp.json`,
  codex: `${homedir()}/.codex/mcp_servers.json`,
  "codex-cli": `${homedir()}/.codex/mcp_servers.json`,
  cursor: `${homedir()}/.cursor/mcp.json`,
  windsurf: `${homedir()}/.codeium/windsurf/mcp_config.json`,
  zed: `${homedir()}/.config/zed/settings.json`,
  "cline-desktop": `${homedir()}/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`,
  roo: `${homedir()}/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`,
  continue: `${homedir()}/.continue/config.json`,
  "github-copilot-cli": `${homedir()}/.copilot/mcp-config.json`,
  aider: `${homedir()}/.aider.mcp.json`,
  goose: `${homedir()}/.config/goose/config.yaml`,
  bolt: `${homedir()}/.bolt/mcp.json`,
  raycast: `${homedir()}/.raycast/mcp-config.json`,
  amazonq: `${homedir()}/.aws/amazonq/mcp.json`,
  kiro: `${homedir()}/.kiro/settings/mcp.json`,
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command !== "add") {
    console.error("Usage:");
    console.error("  npx spreddit-mcp add --agent <name> [--config <path>]");
    console.error("");
    console.error("Common agents:");
    console.error(
      "  " +
        Object.keys(KNOWN_AGENT_PATHS)
          .sort()
          .join(", ")
    );
    console.error("");
    console.error("Any agent that reads a JSON MCP config is supported. Pass");
    console.error("--config to point at a custom path.");
    process.exit(1);
  }

  const agentFlag = args.indexOf("--agent");
  const configFlag = args.indexOf("--config");
  const agent = agentFlag !== -1 ? args[agentFlag + 1] : "claude-code";
  const customConfig = configFlag !== -1 ? args[configFlag + 1] : null;

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
  console.log(`+ Saved credentials to ${credPath}`);

  const config = {
    mcpServers: {
      spreddit: {
        command: "npx",
        args: ["-y", "spreddit-mcp"],
        env: { SPREDDIT_API_KEY: apiKey },
      },
    },
  };

  let targetPath: string | null = customConfig || KNOWN_AGENT_PATHS[agent] || null;

  if (!targetPath) {
    console.error(
      `Unknown agent: ${agent}. Pass --config <path> to specify the MCP config location.`
    );
    console.error("Known agents:");
    console.error(
      "  " + Object.keys(KNOWN_AGENT_PATHS).sort().join("\n  ")
    );
    process.exit(1);
  }

  mkdirSync(dirname(targetPath), { recursive: true });

  let existing: any = {};
  if (existsSync(targetPath)) {
    try {
      existing = JSON.parse(readFileSync(targetPath, "utf-8"));
    } catch {
      console.warn(
        `Could not parse existing ${targetPath}; merging into a new mcpServers key.`
      );
      existing = {};
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
  console.log(`+ Wrote MCP config for ${agent} -> ${targetPath}`);
  console.log("");
  console.log("Restart your agent to pick up the Spreddit server.");
  console.log("Try it: ask your agent to use the spreddit_create_post tool.");
  console.log("Docs: https://spreddit.fuego.im/docs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
