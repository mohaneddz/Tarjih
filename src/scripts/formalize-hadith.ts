/**
 * CLI: runs pending SourceText rows through the formalisation pipeline.
 *
 * Usage: pnpm tsx src/scripts/formalize-hadith.ts [limit]
 *
 * Every outcome is recorded on the SourceText row so a batch is resumable and
 * auditable: "done" rows produced a Clause, "skipped" rows were judged to
 * state no ruling (with the model's reason kept), "failed" rows hit a parse
 * or validation error (kept for a human to look at, never silently retried
 * into acceptance). Nothing this script produces enters the live KB used by
 * `getKb()` — see `loadCoreKb`, which only ever loads the hand-authored
 * `CORE_ENTRIES`. Wiring generated clauses into live queries is a deliberate
 * separate step, gated on human review.
 */

import { prisma } from "../data/db";
import { formalizeHadith } from "../lib/pipeline/formalize";
import { GroqClient } from "../lib/pipeline/llm";

const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set.");
    process.exitCode = 1;
    return;
  }
  const llm = new GroqClient(apiKey);

  const limit = Number(process.argv[2]) || 20;
  const pending = await prisma.sourceText.findMany({
    where: { formalisationStatus: "pending" },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  console.log(`Formalizing ${pending.length} pending source text(s)...`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const source of pending) {
    const clauseId = `sunnah:${source.collection}:${source.number}`;
    const grade = (source.grade ?? undefined) as Parameters<typeof formalizeHadith>[0]["grade"];

    const result = await formalizeHadith(
      { clauseId, reference: source.reference, textEn: source.textEn, grade },
      llm
    );

    if (result.ok) {
      await prisma.clause.create({
        data: {
          id: clauseId,
          source: result.candidate.clauseSource,
          head: result.candidate.head,
          kind: "sunnah",
          reference: result.candidate.reference,
          grade: result.candidate.grade,
          scope: result.candidate.scope,
          dalala: result.candidate.dalala,
          unreviewed: true,
          notes: result.candidate.rationale,
          sourceTextId: source.id,
        },
      });
      await prisma.sourceText.update({
        where: { id: source.id },
        data: { formalisationStatus: "done", formalisedAt: new Date() },
      });
      done++;
      console.log(`  DONE   ${source.reference}: ${result.candidate.clauseSource}`);
    } else if (result.reason === "not-a-ruling") {
      await prisma.sourceText.update({
        where: { id: source.id },
        data: { formalisationStatus: "skipped", formalisationError: result.rationale },
      });
      skipped++;
      console.log(`  SKIP   ${source.reference}: ${result.rationale}`);
    } else {
      const message =
        result.reason === "validation-failed"
          ? result.issues.map((i) => `[${i.code}] ${i.message}`).join("; ")
          : result.message;
      await prisma.sourceText.update({
        where: { id: source.id },
        data: { formalisationStatus: "failed", formalisationError: `${result.reason}: ${message}` },
      });
      failed++;
      console.log(`  FAIL   ${source.reference}: ${result.reason}: ${message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. accepted=${done} skipped(no-ruling)=${skipped} failed=${failed}`);
  console.log("All accepted clauses are stored with unreviewed=true and are not part of any live query yet.");
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
