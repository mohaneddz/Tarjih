/**
 * CLI: fills the database with demo content, so a fresh deployment doesn't
 * open on an empty Cases ledger, history, and review queue.
 *
 * Usage: pnpm seed:demo            (runs anywhere GROQ_API_KEY is set)
 *        tsx src/scripts/seed-demo.ts --if-vercel   (what the build runs)
 *
 * Two parts, both through the real pipeline — nothing here is hand-written
 * output:
 *
 * 1. Demo questions, resolved by the engine and narrated by the model. Each
 *    is run with the goal a person would confirm in the grounding preview,
 *    so a seeded case is exactly what /study produces after "Confirm &
 *    Analyze"; the narration is the model's own.
 * 2. A handful of hadiths fetched from sunnah.com and formalized into
 *    candidate clauses, which land in the review queue as unreviewed — the
 *    same path `scrape:hadith` + `formalize:hadith` take.
 *
 * Best-effort throughout: idempotent (existing rows are skipped), and it
 * never exits non-zero, because a demo seed failing — the model rate-limited,
 * sunnah.com unreachable — is no reason to fail a deployment.
 */

import fs from "fs";
import path from "path";

import { DEMO_QUESTIONS } from "../lib/demo";

/** Hadiths to put in the review queue: the opening of Tirmidhi's chapter on purification. */
const DEMO_HADITHS: readonly { collection: string; number: number }[] = [1, 2, 3, 4, 5, 6].map((number) => ({
  collection: "tirmidhi",
  number,
}));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const onlyOnVercel = process.argv.includes("--if-vercel");
  if (onlyOnVercel && !process.env.VERCEL) return;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("[seed-demo] GROQ_API_KEY is not set; skipping the demo seed.");
    return;
  }

  // Write to the file that ships with the build, not a runtime /tmp copy.
  // Set before the database module loads, which is why the imports below are dynamic.
  process.env.TARJIH_DB_PATH ??= "prisma/dev.db";
  if (!fs.existsSync(path.resolve(process.cwd(), process.env.TARJIH_DB_PATH))) {
    console.log("[seed-demo] no database file; run `prisma db push` first. Skipping.");
    return;
  }

  const { prisma } = await import("../data/db");
  const { saveResolution } = await import("../lib/resolutions");
  const { loadCoreKb } = await import("../lib/kb/core");
  const { GroqClient } = await import("../lib/pipeline/llm");
  const { resolveQuestion } = await import("../lib/pipeline/resolve");
  const { formalizeHadith } = await import("../lib/pipeline/formalize");
  const { fetchHadith } = await import("../lib/scrape/sunnah");

  const llm = new GroqClient(apiKey);
  const kb = loadCoreKb();

  // --- 1. demo questions (inserted oldest-first so the list reads top-down) ---
  let resolved = 0;
  for (const { question, goal } of [...DEMO_QUESTIONS].reverse()) {
    try {
      if (await prisma.resolution.findFirst({ where: { question } })) continue;
      const result = await resolveQuestion({ question, llm, kb, confirmedGoal: goal, requireNarration: true });
      if (!result.ok) {
        console.warn(`[seed-demo] ${question} — not resolved (${result.error.stage})`);
        continue;
      }
      await saveResolution(result.view);
      resolved++;
      console.log(`[seed-demo] resolved: ${question}`);
    } catch (error) {
      console.warn(`[seed-demo] ${question} — ${error instanceof Error ? error.message : error}`);
    }
    await sleep(300);
  }

  // --- 2. hadiths into the review queue ---
  let queued = 0;
  for (const { collection, number } of DEMO_HADITHS) {
    try {
      const key = { kind: "sunnah", collection, number };
      let source = await prisma.sourceText.findUnique({ where: { kind_collection_number: key } });
      if (!source) {
        const parsed = await fetchHadith(collection, number);
        if (!parsed) continue;
        source = await prisma.sourceText.create({
          data: {
            ...key,
            reference: parsed.reference,
            textEn: parsed.textEn,
            textAr: parsed.textAr,
            grade: parsed.grade,
          },
        });
      }
      if (source.formalisationStatus !== "pending") continue;

      const clauseId = `sunnah:${collection}:${number}`;
      const grade = (source.grade ?? undefined) as Parameters<typeof formalizeHadith>[0]["grade"];
      const result = await formalizeHadith({ clauseId, reference: source.reference, textEn: source.textEn, grade }, llm);
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
        queued++;
        console.log(`[seed-demo] queued for review: ${source.reference}`);
      } else if (result.reason === "llm-error") {
        // Left pending, so the next build tries it again.
        console.warn(`[seed-demo] ${source.reference} — model error: ${result.message}`);
      } else {
        const status = result.reason === "not-a-ruling" ? "skipped" : "failed";
        const note =
          result.reason === "not-a-ruling"
            ? result.rationale
            : result.reason === "validation-failed"
              ? result.issues.map((i) => i.message).join("; ")
              : result.message;
        await prisma.sourceText.update({
          where: { id: source.id },
          data: { formalisationStatus: status, formalisationError: note },
        });
        console.log(`[seed-demo] ${source.reference} — ${status}`);
      }
    } catch (error) {
      console.warn(`[seed-demo] ${collection}:${number} — ${error instanceof Error ? error.message : error}`);
    }
    await sleep(500);
  }

  console.log(`[seed-demo] done: ${resolved} demo case(s) resolved, ${queued} hadith clause(s) queued for review.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  // Never fail the build over demo content.
  console.warn("[seed-demo] stopped early:", error instanceof Error ? error.message : error);
});
