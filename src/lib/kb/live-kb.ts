/**
 * The KB actually used to answer a query: the hand-authored core plus every
 * human-reviewed formalized clause.
 *
 * Rebuilding and re-validating this on every request would be wasteful once
 * the reviewed set grows, so the merged result is cached at module scope and
 * only rebuilt when `invalidateLiveKb()` is called — which the review-queue
 * API routes do immediately after an approve/reject, so a scholar's decision
 * takes effect on the very next query, not on some polling delay.
 *
 * Validation runs on the *merged* set, not just each new clause in isolation,
 * because some problems only exist in combination (a KB-wide dangling
 * reference, for instance). A single bad reviewed clause must not break
 * every other user's query, so failing entries are reported and excluded
 * rather than the whole load being thrown away — see `mergeSafely`.
 */

import { CORE_ENTRIES } from "./core";
import { loadKb } from "./entry";
import type { KbEntry, LoadedKb } from "./entry";
import { prisma } from "../../data/db";
import { clauseRowsToEntries } from "./reviewed";
import type { ValidationReport } from "./validate";

export interface LiveKbResult {
  readonly loaded: LoadedKb;
  /** Reviewed entries excluded because they failed validation in combination with the rest. */
  readonly excluded: readonly { entry: KbEntry; report: ValidationReport }[];
}

let cached: Promise<LiveKbResult> | null = null;

async function fetchReviewedEntries(): Promise<KbEntry[]> {
  const rows = await prisma.clause.findMany({ where: { unreviewed: false } });
  return clauseRowsToEntries(rows);
}

const MAX_EXCLUSION_ROUNDS = 5;

/**
 * Loads core + reviewed entries together, and if validation fails, drops
 * exactly the entries whose id is named in an error and re-validates —
 * repeating a few rounds in the rare case that removing one bad clause
 * exposes another (e.g. two reviewed clauses each papering over the other's
 * dangling reference). Bounded rather than looped unconditionally so a
 * pathological case degrades to "exclude everything reviewed" instead of
 * spinning.
 */
function mergeSafely(reviewed: readonly KbEntry[]): LiveKbResult {
  let candidates = [...reviewed];
  const excluded: { entry: KbEntry; report: ValidationReport }[] = [];

  for (let round = 0; round < MAX_EXCLUSION_ROUNDS; round++) {
    const attempt = loadKb([...CORE_ENTRIES, ...candidates]);
    if (attempt.report.ok) {
      return { loaded: attempt, excluded };
    }

    const badIds = new Set(attempt.report.errors.map((e) => e.clauseId));
    const stillGood: KbEntry[] = [];
    for (const entry of candidates) {
      if (badIds.has(entry.id)) {
        excluded.push({
          entry,
          report: { ...attempt.report, issues: attempt.report.issues.filter((i) => i.clauseId === entry.id) },
        });
      } else {
        stillGood.push(entry);
      }
    }

    // Nothing identifiable to remove (error attached to a core clause id,
    // which should be impossible) — stop rather than looping forever.
    if (stillGood.length === candidates.length) break;
    candidates = stillGood;
  }

  // Fall back to core-only rather than surfacing a broken KB to users.
  return { loaded: loadKb(CORE_ENTRIES), excluded };
}

async function buildLiveKb(): Promise<LiveKbResult> {
  const reviewed = await fetchReviewedEntries();
  return mergeSafely(reviewed);
}

/**
 * Returns the merged, validated KB, computing and caching it on first use.
 *
 * A failed build clears the cache rather than being remembered. Caching the
 * promise is what makes the concurrent case correct — two requests arriving
 * together share one database read — but a rejected promise cached under the
 * same rule would make one transient database hiccup permanent for the life
 * of the process: every later query would fail on the stored rejection, with
 * nothing to retry and no way back short of a restart.
 */
export function getLiveKb(): Promise<LiveKbResult> {
  if (!cached) {
    const attempt = buildLiveKb();
    cached = attempt;
    attempt.catch(() => {
      // Only drop it if nothing has replaced it in the meantime; an
      // `invalidateLiveKb()` racing this must not be undone.
      if (cached === attempt) cached = null;
    });
  }
  return cached;
}

/** Forces the next `getLiveKb()` call to recompute. Call after any review-queue mutation. */
export function invalidateLiveKb(): void {
  cached = null;
}

/**
 * Checks whether `candidate` can be safely added to core + the given
 * already-reviewed entries, without mutating anything.
 *
 * Used by the review-queue "approve" action to refuse an approval up front
 * with a specific reason, rather than flipping the DB flag and leaving the
 * scholar to discover later — via a confusing gap in query results — that
 * their approved clause was silently excluded from live use.
 */
export function wouldValidate(existingReviewed: readonly KbEntry[], candidate: KbEntry): ValidationReport {
  const attempt = loadKb([...CORE_ENTRIES, ...existingReviewed, candidate]);
  const issues = attempt.report.issues.filter((i) => i.clauseId === candidate.id);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return { issues, errors, warnings, ok: errors.length === 0 };
}
