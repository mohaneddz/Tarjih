import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { answersData, AnswerData } from "./answers-data";
import path from "path";

// Singleton instantiation pattern for development hot-reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prismaInstance: PrismaClient;

// Use absolute path for SQLite file to ensure Next.js resolves it correctly
const dbPath = path.resolve(process.cwd(), "prisma/dev.db");

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

// Map the flat text fields in the SQLite database to parsed typed visual contracts
function mapDbToAnswerData(dbAns: any): AnswerData {
  return {
    id: dbAns.id,
    question: dbAns.question,
    category: dbAns.category,
    summary: dbAns.summary,
    analysis: dbAns.analysis,
    references: JSON.parse(dbAns.references),
    notes: dbAns.notes,
    confidence: dbAns.confidence as any,
    disclaimer: dbAns.disclaimer as any,
    reasoningTree: JSON.parse(dbAns.reasoningTree),
  };
}

/**
 * Loads all resolved cases from the SQLite local database.
 * If empty, automatically seeds it with initial default consensus records.
 */
export async function getAnswers(): Promise<AnswerData[]> {
  try {
    let list = await prisma.answer.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed if the database is empty
    if (list.length === 0 && answersData.length > 0) {
      console.log("[Tarjih DB] Database table is empty. Auto-seeding initial cases...");
      
      // Perform sequential insertions to ensure safe execution
      for (const item of answersData) {
        await prisma.answer.create({
          data: {
            id: item.id,
            question: item.question,
            category: item.category,
            summary: item.summary,
            analysis: item.analysis,
            references: JSON.stringify(item.references),
            notes: item.notes,
            confidence: item.confidence,
            disclaimer: item.disclaimer,
            reasoningTree: JSON.stringify(item.reasoningTree),
          },
        });
      }

      // Re-fetch list after seeding
      list = await prisma.answer.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return list.map(mapDbToAnswerData);
  } catch (error) {
    console.error("[Tarjih DB] getAnswers failed, falling back to empty list", error);
    return [];
  }
}

/**
 * Retrieves a single juristic query by its string identifier.
 */
export async function getAnswerById(id: string): Promise<AnswerData | null> {
  try {
    const dbAns = await prisma.answer.findUnique({
      where: { id },
    });
    if (!dbAns) return null;
    return mapDbToAnswerData(dbAns);
  } catch (error) {
    console.error("[Tarjih DB] getAnswerById failed", error);
    return null;
  }
}
