import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import postgres from "postgres";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import * as sqliteSchema from "./schema.sqlite";
import * as postgresSchema from "./schema.postgres";

const DB_URL = process.env.DATABASE_URL ?? "./data/spreddit.db";
const isPostgres =
  DB_URL.startsWith("postgres://") || DB_URL.startsWith("postgresql://");

// We use the SQLite schema typing for both drivers, because the query builder
// API is identical and our schema shape is the same. At runtime the underlying
// driver is swapped; the TS types are unified here.
type DBSchema = typeof sqliteSchema;
type DB = BetterSQLite3Database<DBSchema>;

function makeSqlite(): DB {
  if (!existsSync(dirname(DB_URL))) {
    mkdirSync(dirname(DB_URL), { recursive: true });
  }
  const sqlite = new Database(DB_URL);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzleSqlite(sqlite, { schema: sqliteSchema as any }) as DB;
}

function makePostgres(): DB {
  const client = postgres(DB_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzlePostgres(client, { schema: postgresSchema as any }) as unknown as DB;
}

export const db: DB = isPostgres ? makePostgres() : makeSqlite();
export { sqliteSchema, postgresSchema };
export const schema = isPostgres ? postgresSchema : sqliteSchema;
export const driver = isPostgres ? "postgres" : "sqlite";
