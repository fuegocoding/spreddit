#!/usr/bin/env node
// Entry point for `npx spreddit-mcp` (no args).
// Loads the compiled server from dist/index.js. Use `npx spreddit-mcp add` for installer.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, "..", "dist", "index.js");

if (!existsSync(serverPath)) {
  console.error(
    "spreddit-mcp: dist/index.js not found. The package may not be built correctly."
  );
  process.exit(1);
}

const child = spawn(process.execPath, [serverPath], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
