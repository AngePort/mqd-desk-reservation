import { z } from "zod";

// Next.js automatically loads env files from the project root (this `web/` folder).
// In VM/remote setups it's common to place `.env` at the repo root instead.
// This loader makes server-side code resilient by loading from:
// - web/.env, web/.env.local
// - repo-root .env, .env.local
// It is safe here because `getEnv()` is only used in Node.js server routes.
import path from "node:path";
import dotenv from "dotenv";

let didLoadDotenv = false;
function ensureDotenvLoaded() {
  if (didLoadDotenv) return;
  didLoadDotenv = true;

  const cwd = process.cwd();

  // Try project root (web/)
  dotenv.config({ path: path.join(cwd, ".env.local") });
  dotenv.config({ path: path.join(cwd, ".env") });

  // Try repo root (../)
  dotenv.config({ path: path.resolve(cwd, "..", ".env.local") });
  dotenv.config({ path: path.resolve(cwd, "..", ".env") });
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // iron-session requires >= 32 chars
  SESSION_PASSWORD: z
    .string()
    .min(32, "SESSION_PASSWORD must be at least 32 characters (see .env.example)"),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;

  ensureDotenvLoaded();

  cachedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_PASSWORD: process.env.SESSION_PASSWORD,
  });

  return cachedEnv;
}
