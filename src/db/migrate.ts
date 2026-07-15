import Database from "better-sqlite3";
import { mkdirSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

const DB_URL = process.env.DATABASE_URL ?? "./data/spreddit.db";
const isPostgres = DB_URL.startsWith("postgres://") || DB_URL.startsWith("postgresql://");

if (isPostgres) {
  console.log("This migrator is for SQLite only.");
  console.log("For Postgres, run `npx drizzle-kit push` against your DATABASE_URL.");
  process.exit(0);
}

if (!existsSync(dirname(DB_URL))) {
  mkdirSync(dirname(DB_URL), { recursive: true });
}

const db = new Database(DB_URL);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const migrationsDir = "./drizzle";
if (!existsSync(migrationsDir)) {
  console.log("No migrations directory found. Run `npm run db:generate` first.");
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migration files found.");
  process.exit(1);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const applied = new Set(
  db
    .prepare("SELECT name FROM _migrations")
    .all()
    .map((r: any) => r.name)
);

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    db.exec(stmt);
  }
  db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  console.log("✓", file);
  count++;
}

if (count === 0) {
  console.log("Up to date.");
} else {
  console.log(`\nApplied ${count} migration(s).`);
}

db.close();
