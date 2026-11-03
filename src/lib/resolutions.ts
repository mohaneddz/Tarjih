import { prisma } from "@/data/db";
import type { ResolutionView } from "@/lib/pipeline/resolve";

/**
 * Stores a computed resolution. Shared by the /api/resolve route and the demo
 * seed script so a seeded case is stored exactly as a live one would be.
 */
export async function saveResolution(view: ResolutionView) {
  return prisma.resolution.create({
    data: {
      question: view.question,
      goal: view.goalText,
      madhhab: view.madhhab,
      strictness: view.strictness,
      verdict: view.verdict,
      confidence: view.confidence,
      contested: view.contested,
      truncated: view.truncated,
      result: JSON.stringify(view),
    },
  });
}
