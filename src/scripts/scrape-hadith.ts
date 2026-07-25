/**
 * CLI: scrapes a range of hadiths from sunnah.com into the SourceText table.
 *
 * Usage: pnpm tsx src/scripts/scrape-hadith.ts <collection> <start> <end>
 * Example: pnpm tsx src/scripts/scrape-hadith.ts tirmidhi 1 50
 *
 * Idempotent: re-running over an already-scraped range skips existing rows
 * (unique on kind+collection+number) rather than erroring, so a batch can
 * safely be re-run or extended.
 *
 * Rate-limited even though sunnah.com's robots.txt specifies no crawl-delay —
 * courtesy to a small nonprofit's server, not a requirement, and the delay
 * costs nothing against a one-off batch job.
 */

import { prisma } from "../data/db";
import { fetchHadith, findCollection } from "../lib/scrape/sunnah";

const RATE_LIMIT_MS = 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const [, , collectionArg, startArg, endArg] = process.argv;
  const collection = findCollection(collectionArg ?? "");
  const start = Number(startArg);
  const end = Number(endArg);

  if (!collection || !Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    console.error("Usage: pnpm tsx src/scripts/scrape-hadith.ts <collection> <start> <end>");
    console.error(`Known collections: ${collectionArg ? "" : "(none given) "}`);
    process.exitCode = 1;
    return;
  }

  let fetched = 0;
  let skippedExisting = 0;
  let notFound = 0;
  let errors = 0;

  for (let n = start; n <= end; n++) {
    try {
      const existing = await prisma.sourceText.findUnique({
        where: { kind_collection_number: { kind: "sunnah", collection: collection.slug, number: n } },
      });
      if (existing) {
        skippedExisting++;
        continue;
      }

      const parsed = await fetchHadith(collection.slug, n);
      if (!parsed) {
        notFound++;
        console.log(`  ${collection.slug}:${n} — not found (likely past the end of the collection)`);
        // Collections are contiguous; a 404 almost certainly means we've run
        // past the end, so stop rather than spending the rest of the range
        // on requests that will all fail the same way.
        break;
      }

      await prisma.sourceText.create({
        data: {
          kind: "sunnah",
          collection: collection.slug,
          number: n,
          reference: parsed.reference,
          textEn: parsed.textEn,
          textAr: parsed.textAr,
          grade: parsed.grade,
        },
      });
      fetched++;
      console.log(`  ${parsed.reference} — grade: ${parsed.grade ?? "ungraded"}`);
    } catch (error) {
      errors++;
      console.error(`  ${collection.slug}:${n} — error:`, error instanceof Error ? error.message : error);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(
    `\nDone. fetched=${fetched} skipped(existing)=${skippedExisting} not-found=${notFound} errors=${errors}`
  );
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
