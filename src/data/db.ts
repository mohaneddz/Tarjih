import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

/**
 * Where the SQLite file lives.
 *
 * Locally it is `prisma/dev.db`, created by `prisma db push`. On Vercel the
 * deployed files are read-only, so the database built (and seeded with demo
 * cases) during the build is shipped with the functions and copied to the
 * writable `/tmp` on a cold start. Writes then work, but last only as long as
 * that server instance: fine for a demo, and the reason a hosted database is
 * the next step for real persistence.
 */
function resolveDbPath(): string {
  // Build-time scripts (the demo seed) write the file that gets bundled, not a /tmp copy.
  if (process.env.TARJIH_DB_PATH) {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.TARJIH_DB_PATH);
  }

  const bundled = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "prisma/dev.db");
  if (!process.env.VERCEL) return bundled;

  const writable = path.join("/tmp", "tarjih.db");
  try {
    if (!fs.existsSync(writable) && fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, writable);
    }
  } catch (error) {
    console.warn("[Tarjih] could not copy the bundled database to /tmp:", error);
  }
  return writable;
}

export const dbPath = resolveDbPath();

// Singleton instantiation pattern for development hot-reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  prismaInstance = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
