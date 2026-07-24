/**
 * KB authoring format and loader.
 *
 * A KB entry pairs one clause with the evidence that backs it. They are
 * written together deliberately: reviewing a rule means asking "does this
 * logic actually follow from that text?", and separating the two into
 * different files makes the one question that matters the hardest one to ask.
 *
 * Clause ids are explicit rather than positional. An index-derived id would
 * silently re-point every evidence record downstream of an inserted clause,
 * which is precisely the sort of quiet corruption this KB cannot tolerate.
 */

import { KnowledgeBase } from "../engine/kb";
import { parseClause } from "../logic/parse";
import { literalKey } from "../logic/types";
import type { Clause } from "../logic/types";
import { EvidenceStore } from "./evidence";
import type { Evidence } from "./evidence";
import { validateKb } from "./validate";
import type { ValidationReport } from "./validate";

export interface KbEntry {
  /** Stable, human-chosen id, e.g. "qaida:la-darar". */
  readonly id: string;
  /** Exactly one clause in surface syntax, terminated by '.'. */
  readonly clause: string;
  /** Why this clause is in the KB and what it is worth. */
  readonly evidence: Omit<Evidence, "clauseId">;
}

export interface LoadedKb {
  readonly kb: KnowledgeBase;
  readonly evidence: EvidenceStore;
  readonly clauses: readonly Clause[];
  readonly report: ValidationReport;
}

export class KbLoadError extends Error {
  constructor(
    message: string,
    readonly entryId: string
  ) {
    super(`${entryId}: ${message}`);
    this.name = "KbLoadError";
  }
}

/**
 * Parses entries into a knowledge base and evidence store, then lints them.
 *
 * Parse failures throw immediately — a clause that will not parse is a broken
 * build, not a data-quality warning. Lint findings are returned rather than
 * thrown so a caller can decide: the dev server should surface them loudly,
 * while a test exercising one rule need not care about unrelated gaps.
 */
export function loadKb(entries: readonly KbEntry[]): LoadedKb {
  const seen = new Set<string>();
  const clauses: Clause[] = [];
  const evidenceRecords: Evidence[] = [];

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      throw new KbLoadError("duplicate entry id", entry.id);
    }
    seen.add(entry.id);

    let clause: Clause;
    try {
      clause = parseClause(entry.clause, entry.id);
    } catch (cause) {
      throw new KbLoadError(
        `could not parse clause: ${cause instanceof Error ? cause.message : String(cause)}`,
        entry.id
      );
    }

    clauses.push(clause);
    evidenceRecords.push({ ...entry.evidence, clauseId: entry.id });
  }

  const kb = new KnowledgeBase(clauses);
  const evidence = new EvidenceStore(evidenceRecords);
  return { kb, evidence, clauses, report: validateKb(kb, evidence) };
}

/** Loads and throws if anything is wrong. Used by tests and the build. */
export function loadKbStrict(entries: readonly KbEntry[]): LoadedKb {
  const loaded = loadKb(entries);
  if (!loaded.report.ok) {
    const detail = loaded.report.errors
      .map((e) => `  [${e.code}] ${e.clauseId}: ${e.message}`)
      .join("\n");
    throw new Error(`knowledge base has ${loaded.report.errors.length} error(s):\n${detail}`);
  }
  return loaded;
}

/** Counts of clauses per head predicate, for diagnostics and the KB browser. */
export function kbStatistics(loaded: LoadedKb) {
  const byPredicate = new Map<string, number>();
  const byKind = new Map<string, number>();

  for (const clause of loaded.clauses) {
    const key = literalKey(clause.head);
    byPredicate.set(key, (byPredicate.get(key) ?? 0) + 1);
    const kind = loaded.evidence.getOrUnknown(clause.id).kind;
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
  }

  return {
    clauses: loaded.clauses.length,
    facts: loaded.clauses.filter((c) => c.body.length === 0).length,
    rules: loaded.clauses.filter((c) => c.body.length > 0).length,
    byPredicate: Object.fromEntries([...byPredicate].sort()),
    byKind: Object.fromEntries([...byKind].sort()),
    unreviewed: loaded.evidence.all().filter((e) => e.unreviewed).length,
  };
}
