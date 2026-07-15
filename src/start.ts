import "dotenv/config";
import { spawn } from "node:child_process";

console.log("Running Postgres migrations...");
const result = await new Promise<{ code: number | null }>((resolve) => {
  const child = spawn("npx", ["tsx", "src/db/migrate-pg.ts"], {
    stdio: "inherit",
  });
  child.on("exit", (code) => resolve({ code }));
});

if (result.code !== 0) {
  console.error("Migrations failed. Aborting start.");
  process.exit(1);
}

console.log("Starting Next.js...");
const next = spawn("npx", ["next", "start"], { stdio: "inherit" });
next.on("exit", (code) => process.exit(code ?? 0));
