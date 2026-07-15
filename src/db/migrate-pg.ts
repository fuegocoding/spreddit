// Postgres migrator. Reads migrations from drizzle-pg/ and applies them.
// Use `npx drizzle-kit generate --config drizzle.config.postgres.ts` to create.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const migrationsDir = "./drizzle-pg";
if (!existsSync(migrationsDir)) {
  console.log(
    "No drizzle-pg/ directory found. Run `npx drizzle-kit generate --config drizzle.config.postgres.ts` first."
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migration files found.");
  process.exit(1);
}

const sql = postgres(DB_URL, { max: 1 });

try {
  await sql`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  const applied = new Set(
    (await sql`SELECT name FROM _migrations`).map((r: any) => r.name)
  );

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const content = readFileSync(join(migrationsDir, file), "utf-8");
    await sql.unsafe(content);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
    console.log("✓", file);
    count++;
  }

  if (count === 0) {
    console.log("Up to date.");
  } else {
    console.log(`\nApplied ${count} migration(s).`);
  }
} finally {
  await sql.end();
}
