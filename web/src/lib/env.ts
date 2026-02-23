import { z } from "zod";

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

  cachedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_PASSWORD: process.env.SESSION_PASSWORD,
  });

  return cachedEnv;
}
