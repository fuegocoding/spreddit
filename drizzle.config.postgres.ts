import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.postgres.ts",
  out: "./drizzle-pg",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
