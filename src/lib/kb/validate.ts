/**
 * KB linting.
 *
 * Most of what can go wrong in a logic KB goes wrong *silently*: a rule with a
 * misspelled body predicate never fires, and a query that should have found
 * counter-evidence simply returns fewer results. Nothing errors. In a tool
 * whose output is a juristic opinion, that failure mode is unacceptable, so
 * these checks run over the whole KB at load time and the pipeline runs them
 * over every batch of generated clauses.
 */

import type { KnowledgeBase } from "../engine/kb";
import { collectLiteralVars, literalToString } from "../logic/term";
import type { Clause } from "../logic/types";
import type { EvidenceStore } from "./evidence";
import {
  AHKAM_TAKLIFIYYA,
  isHukm,
  lookupPredicate,
  PREDICATES,
  QUERY_SUPPLIED_PREDICATES,
} from "./ontology";

export type IssueSeverity = "error" | "warning";

export interface KbIssue {
  readonly severity: IssueSeverity;
  readonly clauseId: string;
  readonly code: string;
  readonly message: string;
}

export interface ValidationReport {
  readonly issues: readonly KbIssue[];
  readonly errors: readonly KbIssue[];
  readonly warnings: readonly KbIssue[];
  readonly ok: boolean;
}

function report(issues: KbIssue[]): ValidationReport {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return { issues, errors, warnings, ok: errors.length === 0 };
}

/**
 * Checks a single clause against the ontology.
 *
 * Runs per-clause so the formalisation pipeline can reject a bad generation
 * and retry it without discarding the whole batch.
 */
export function validateClause(clause: Clause): KbIssue[] {
  const issues: KbIssue[] = [];
  const literals = [clause.head, ...clause.body];

  for (const literal of literals) {
    const spec = lookupPredicate(literal.predicate, literal.args.length);
    if (!spec) {
      // Distinguish a wrong arity from an unknown name: the two have very
      // different fixes, and arity slips are the commoner mistake.
      const otherArities = PREDICATES.filter((p) => p.name === literal.predicate).map((p) => p.arity);
      const hint = otherArities.length
        ? ` ${literal.predicate} is defined with arity ${otherArities.join(" or ")}.`
        : " Check for a typo, or add it to PREDICATES if genuinely new.";
      issues.push({
        severity: "error",
        clauseId: clause.id,
        code: "unknown-predicate",
        message:
          `${literalToString(literal)} uses ${literal.predicate}/${literal.args.length}, ` +
          `which is not in the ontology.${hint}`,
      });
      continue;
    }

    // The ruling value must be one of the five, or the clause can never be
    // compared against anything else and will silently sit outside the search.
    if (spec.name === "ruling") {
      const hukm = literal.args[1];
      if (hukm.kind === "atom" && !isHukm(hukm.name)) {
        issues.push({
          severity: "error",
          clauseId: clause.id,
          code: "invalid-hukm",
          message:
            `${literalToString(literal)} gives the ruling as "${hukm.name}"; ` +
            `it must be one of: ${AHKAM_TAKLIFIYYA.join(", ")}.`,
        });
      }
    }
  }

  // A rule whose head introduces a variable never bound by its body derives an
  // unconstrained conclusion — "everything is forbidden" — which is both wrong
  // and, because it matches every query, extremely disruptive.
  if (clause.body.length > 0) {
    const bodyVars = new Set<string>();
    for (const b of clause.body) collectLiteralVars(b, bodyVars);
    const headVars = collectLiteralVars(clause.head);

    for (const name of headVars) {
      if (!bodyVars.has(name)) {
        issues.push({
          severity: "error",
          clauseId: clause.id,
          code: "unbound-head-variable",
          message:
            `${name} appears in the head of ${literalToString(clause.head)} but in no body goal, ` +
            `so this rule concludes something unconstrained.`,
        });
      }
    }
  }

  return issues;
}

/** Runs every check across the KB and its evidence store. */
export function validateKb(kb: KnowledgeBase, evidence?: EvidenceStore): ValidationReport {
  const issues: KbIssue[] = [];
  const seen = new Set<string>();
  for (const key of kb.predicates()) {
    for (const clause of kb.clausesFor({ predicate: key.split("/")[0], args: fakeArgs(key) })) {
      if (seen.has(clause.id)) continue;
      seen.add(clause.id);
      issues.push(...validateClause(clause));
    }
  }

  // A body goal nothing can satisfy is a rule that never fires — unless the
  // predicate is one the question supplies, in which case being undefined
  // here is the point.
  for (const { clauseId, goal } of kb.danglingReferences()) {
    if (QUERY_SUPPLIED_PREDICATES.has(goal)) continue;
    issues.push({
      severity: "warning",
      clauseId,
      code: "dangling-goal",
      message:
        `body goal ${goal} is not defined by any clause, so this rule can never succeed. ` +
        `Usually a typo or a missing ontology fact.`,
    });
  }

  if (evidence) {
    for (const clauseId of seen) {
      if (!evidence.has(clauseId)) {
        issues.push({
          severity: "warning",
          clauseId,
          code: "missing-evidence",
          message: `no evidence record; this clause will contribute no juristic weight.`,
        });
      }
    }
    for (const record of evidence.all()) {
      if (record.grade === "mawdu") {
        issues.push({
          severity: "error",
          clauseId: record.clauseId,
          code: "fabricated-source",
          message: `evidence is graded mawdu (fabricated) and must not be in the KB at all.`,
        });
      }
      if (record.abrogation === "mansukh" && !record.abrogates) {
        issues.push({
          severity: "warning",
          clauseId: record.clauseId,
          code: "unlinked-abrogation",
          message: `marked mansukh but does not record which text abrogated it.`,
        });
      }
    }
  }

  return report(issues);
}

/** Placeholder args so `clausesFor` can retrieve a predicate's bucket by arity. */
function fakeArgs(key: string): { kind: "var"; name: string }[] {
  const arity = Number(key.split("/")[1]);
  return Array.from({ length: arity }, (_, i) => ({ kind: "var" as const, name: `_L${i}` }));
}
