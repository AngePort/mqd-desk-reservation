// This file is used by the Prisma CLI (e.g. `prisma migrate dev`).
// Load env vars from `web/.env` reliably even when the CLI is run from a different cwd.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));

// Prefer `web/.env`, but also support a repo-root `.env` (common in VM deployments).
dotenv.config({ path: path.join(configDir, ".env") });
if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: path.resolve(configDir, "..", ".env") });
}

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Put it in web/.env, repo-root .env, or set DATABASE_URL in the environment before running Prisma.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
