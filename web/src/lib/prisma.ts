import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

import { getEnv } from "@/lib/env";

function resolveSqliteFilePath(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error('DATABASE_URL must start with "file:" for SQLite');
  }

  const filePath = databaseUrl.slice("file:".length);
  return path.resolve(process.cwd(), filePath);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const { DATABASE_URL: databaseUrl } = getEnv();

const sqliteFilePath = resolveSqliteFilePath(databaseUrl);
const adapter = new PrismaBetterSqlite3({ url: sqliteFilePath });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
