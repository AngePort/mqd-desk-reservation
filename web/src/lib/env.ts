import { z } from "zod";

const envSchema = z.object({
  SHARED_USERNAME: z.string().min(1),
  SHARED_PASSWORD: z.string().min(1),
  SESSION_PASSWORD: z.string().min(16),
});

export const env = envSchema.parse({
  SHARED_USERNAME: process.env.SHARED_USERNAME,
  SHARED_PASSWORD: process.env.SHARED_PASSWORD,
  SESSION_PASSWORD: process.env.SESSION_PASSWORD,
});
