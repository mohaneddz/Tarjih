/**
 * Bridges human-reviewed, DB-stored clauses into the same `KbEntry` shape the
 * hand-authored core KB uses.
 *
 * Without this, "reviewing" a formalized clause would be theater: the
 * formalization pipeline (`formalize.ts`) writes candidates into the `Clause`
 * table, but `getKb()` only ever loaded the hand-authored `CORE_ENTRIES` —
 * nothing marked `unreviewed: false` in the database ever reached a live
 * query. This module is what makes approval actually change the engine's
 * answers.
 *
 * Kept as a pure mapping function, separate from the Prisma call that
 * fetches rows, so the mapping logic is unit-testable without a database.
 */

import type { KbEntry } from "./entry";
import type {
  Certainty,
  EvidenceKind,
  HadithGrade,
  Madhhab,
  Restriction,
  Scope,
} from "./evidence";
import { MADHAHIB } from "./evidence";

/** Plain shape mirroring the columns of the `Clause` Prisma model. */
export interface ClauseRow {
  readonly id: string;
  readonly source: string;
  readonly kind: string;
  readonly reference: string;
  readonly grade: string | null;
  readonly thubut: string | null;
  readonly dalala: string | null;
  readonly scope: string | null;
  readonly restriction: string | null;
  readonly abrogation: string | null;
  readonly abrogates: string | null;
  readonly madhahib: string | null;
  readonly unreviewed: boolean;
  readonly notes: string | null;
}

function isMadhhab(value: string): value is Madhhab {
  return (MADHAHIB as readonly string[]).includes(value);
}

/**
 * Parses the `madhahib` JSON column defensively. A malformed value (should
 * never happen given only this codebase writes it, but a hand-edited DB row
 * is not impossible) is treated as "no restriction recorded" rather than
 * thrown, since one bad row must not break every other clause's load.
 */
function parseMadhahib(json: string | null): readonly Madhhab[] | undefined {
  if (!json) return undefined;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return undefined;
    const filtered = parsed.filter((v): v is Madhhab => typeof v === "string" && isMadhhab(v));
    return filtered.length > 0 ? filtered : undefined;
  } catch {
    return undefined;
  }
}

/** Converts one DB row into a `KbEntry`, ready to be merged with `CORE_ENTRIES`. */
export function clauseRowToEntry(row: ClauseRow): KbEntry {
  return {
    id: row.id,
    clause: row.source,
    evidence: {
      kind: row.kind as EvidenceKind,
      reference: row.reference,
      grade: (row.grade ?? undefined) as HadithGrade | undefined,
      thubut: (row.thubut ?? undefined) as Certainty | undefined,
      dalala: (row.dalala ?? undefined) as Certainty | undefined,
      scope: (row.scope ?? undefined) as Scope | undefined,
      restriction: (row.restriction ?? undefined) as Restriction | undefined,
      abrogation: (row.abrogation ?? undefined) as "nasikh" | "mansukh" | undefined,
      abrogates: row.abrogates ?? undefined,
      madhahib: parseMadhahib(row.madhahib),
      unreviewed: row.unreviewed,
      notes: row.notes ?? undefined,
    },
  };
}

export function clauseRowsToEntries(rows: readonly ClauseRow[]): KbEntry[] {
  return rows.map(clauseRowToEntry);
}
