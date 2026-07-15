#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const args = process.argv.slice(2);
const command = args[0];

if (command === "add") {
  const agentFlag = args.indexOf("--agent");
  const agent = agentFlag !== -1 ? args[agentFlag + 1] : "claude-code";

  const configDir = `${homedir()}/.config/spreddit`;
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  const credPath = `${configDir}/credentials.json`;

  let apiKey = process.env.SPREDDIT_API_KEY;
  if (!apiKey && existsSync(credPath)) {
    const cfg = JSON.parse(readFileSync(credPath, "utf-8"));
    apiKey = cfg.apiKey;
  }
  if (!apiKey) {
    console.log("No API key found.");
    console.log("Get one at https://spreddit.fuego.im/buyer/api-keys");
    console.log("");
    process.stdout.write("Paste your API key (spk_live_...): ");
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (data) => {
      const key = data.toString().trim();
      writeFileSync(credPath, JSON.stringify({ apiKey: key }, null, 2), {
        mode: 0o600,
      });
      console.log(`Saved to ${credPath}`);
      writeAgentConfig(agent);
    });
  } else {
    writeFileSync(credPath, JSON.stringify({ apiKey }, null, 2), { mode: 0o600 });
    writeAgentConfig(agent);
  }
} else {
  // Run the MCP server
  const child = spawn(
    process.execPath,
    [resolve(root, "dist/index.js"), ...args],
    { stdio: "inherit" }
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

function writeAgentConfig(agent: string) {
  const config = {
    mcpServers: {
      spreddit: {
        command: "npx",
        args: ["spreddit-mcp"],
        env: {
          SPREDDIT_API_KEY:
            process.env.SPREDDIT_API_KEY ??
            JSON.parse(readFileSync(`${homedir()}/.config/spreddit/credentials.json`, "utf-8"))
              .apiKey,
        },
      },
    },
  };

  let targetPath: string;
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
    default:
      targetPath = `${homedir()}/.config/spreddit/mcp.json`;
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, JSON.stringify(config, null, 2));
  console.log(`✓ Wrote MCP config for ${agent} → ${targetPath}`);
  console.log(`\nRestart ${agent} to pick up the new server.`);
}
