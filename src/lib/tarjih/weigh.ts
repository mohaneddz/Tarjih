/**
 * Top-level tarjih: turn a set of derivations into a weighed, explainable
 * verdict.
 *
 * This is the piece the old implementation never had. It replaces a model
 * inventing a confidence percentage with a number computed from evidence
 * grade and proof structure, and replaces silent verdict-picking with a
 * recorded tournament the user can read and disagree with.
 */

import type { ProveResult, Solution } from "../engine/prover";
import type { EvidenceStore } from "../kb/evidence";
import { contradicts, isHukm } from "../kb/ontology";
import type { Hukm } from "../kb/ontology";
import { buildRuleInput, MURAJJIH_RULES, overallStrength, rootClauseId } from "./murajjih";
import { chainStrength, combinedConfidence } from "./strength";

export interface Derivation {
  readonly solution: Solution;
  readonly outcome: Hukm;
  readonly strength: number;
  readonly rootClauseId: string;
}

export interface OutcomeGroup {
  readonly outcome: Hukm;
  readonly derivations: readonly Derivation[];
  /** The single strongest derivation, used as this group's representative in tarjih comparisons. */
  readonly best: Derivation;
  /** Computed from `best.strength` plus a capped bump for independent corroboration. */
  readonly confidence: number;
}

export interface TarjihStep {
  readonly rule: string;
  readonly ruleLabel: string;
  readonly winner: Hukm;
  readonly loser: Hukm;
  readonly explanation: string;
}

export interface TarjihResult {
  /** One group per distinct ruling reached, sorted by confidence descending. */
  readonly groups: readonly OutcomeGroup[];
  /**
   * True when at least two groups give instructions that cannot honestly be
   * presented as a spread of opinion (see `contradicts`) and had to be
   * weighed against each other.
   */
  readonly contested: boolean;
  /** The prevailing ruling. Present even when uncontested (there is still exactly one answer). */
  readonly verdict?: Hukm;
  /** True when contested and the murajjihat could not separate the sides — reported, not papered over. */
  readonly unresolved: boolean;
  /** The tournament's reasoning, in order. Empty when uncontested. */
  readonly resolution: readonly TarjihStep[];
  /** Outcome groups that differ from the verdict but do not rise to genuine contradiction (e.g. makruh alongside mubah). */
  readonly relatedOpinions: readonly OutcomeGroup[];
}

const HUKM_VAR = "H";

function outcomeVar(solution: Solution): Hukm | undefined {
  const term = solution.bindings[HUKM_VAR];
  if (!term || term.kind !== "atom" || !isHukm(term.name)) return undefined;
  return term.name;
}

/**
 * Groups the solutions of a `ruling(Act, H)`-shaped query by the value bound
 * to `H`, computing each group's representative derivation and confidence.
 *
 * Solutions that do not bind `H` to one of the five ahkam (a different query
 * shape entirely) are silently skipped rather than erroring, since this
 * function is meant to be called speculatively on any ProveResult.
 */
export function groupByOutcome(result: ProveResult, evidence: EvidenceStore): OutcomeGroup[] {
  const byOutcome = new Map<Hukm, Derivation[]>();

  for (const solution of result.solutions) {
    const outcome = outcomeVar(solution);
    if (!outcome) continue;
    const derivation: Derivation = {
      solution,
      outcome,
      strength: chainStrength(solution, evidence),
      rootClauseId: rootClauseId(solution),
    };
    const bucket = byOutcome.get(outcome);
    if (bucket) bucket.push(derivation);
    else byOutcome.set(outcome, [derivation]);
  }

  const groups: OutcomeGroup[] = [];
  for (const [outcome, derivations] of byOutcome) {
    const best = derivations.reduce((a, b) => (b.strength > a.strength ? b : a));
    const confidence = combinedConfidence(derivations.map((d) => d.strength));
    groups.push({ outcome, derivations, best, confidence });
  }

  return groups.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Runs the murajjihat between two representative derivations. Returns the
 * winner and, when one was found, which rule decided and why.
 */
function adjudicate(
  a: OutcomeGroup,
  b: OutcomeGroup,
  evidence: EvidenceStore
): { winner: OutcomeGroup; loser: OutcomeGroup; step?: TarjihStep } {
  const inputA = buildRuleInput(a.best.solution, evidence);
  const inputB = buildRuleInput(b.best.solution, evidence);

  for (const rule of [...MURAJJIH_RULES, overallStrength]) {
    const result = rule.compare(inputA, inputB);
    if (result === "tie") continue;
    const [winner, loser, side] = result === "a" ? [a, b, "a" as const] : [b, a, "b" as const];
    return {
      winner,
      loser,
      step: {
        rule: rule.id,
        ruleLabel: rule.label,
        winner: winner.outcome,
        loser: loser.outcome,
        explanation: rule.explain(inputA, inputB, side),
      },
    };
  }

  // Every rule tied: genuinely unresolved. Keep `a` as the nominal current
  // holder so the tournament can still finish, but the caller marks the
  // result `unresolved` and must not present this as a decided question.
  return { winner: a, loser: b };
}

/**
 * Weighs every outcome group against every other, resolving genuine
 * contradictions via the murajjihat and leaving ordinary scholarly spread
 * (e.g. mubah alongside makruh) alone.
 *
 * Implemented as a sequential elimination tournament: the current leader is
 * challenged by each remaining contradicting group in turn. This is a
 * simplification — a fully general treatment would check the preference
 * relation for transitivity across all pairs — but the murajjihat compare on
 * a fixed, mostly-ordered set of textual attributes, so intransitive cycles
 * are not a realistic concern for this KB, and the sequential form is what
 * keeps the trail of reasoning legible in the UI.
 */
export function weighRuling(result: ProveResult, evidence: EvidenceStore): TarjihResult | undefined {
  const groups = groupByOutcome(result, evidence);
  if (groups.length === 0) return undefined;
  if (groups.length === 1) {
    return {
      groups,
      contested: false,
      verdict: groups[0].outcome,
      unresolved: false,
      resolution: [],
      relatedOpinions: [],
    };
  }

  const contesting: OutcomeGroup[] = [];
  const related: OutcomeGroup[] = [];
  let current = groups[0];
  for (const g of groups.slice(1)) {
    if (contradicts(current.outcome, g.outcome)) contesting.push(g);
    else related.push(g);
  }

  if (contesting.length === 0) {
    return {
      groups,
      contested: false,
      verdict: current.outcome,
      unresolved: false,
      resolution: [],
      relatedOpinions: related,
    };
  }

  const resolution: TarjihStep[] = [];
  let unresolved = false;
  for (const challenger of contesting) {
    const { winner, loser, step } = adjudicate(current, challenger, evidence);
    if (!step) {
      unresolved = true;
      // Keep going: a later, more decisive challenger might still resolve
      // against whichever side remains current.
      continue;
    }
    resolution.push(step);
    current = winner;
    void loser;
  }

  return {
    groups,
    contested: true,
    verdict: unresolved ? undefined : current.outcome,
    unresolved,
    resolution,
    relatedOpinions: related,
  };
}

/** Renders a group's outcome as `haram (72% confidence)` style text, for logging and quick display. */
export function summariseGroup(group: OutcomeGroup): string {
  return `${group.outcome} (${group.confidence}% confidence, ${group.derivations.length} derivation${group.derivations.length === 1 ? "" : "s"})`;
}

/** Debug helper: renders a full tarjih result as readable text. */
export function tarjihToString(result: TarjihResult): string {
  const lines: string[] = [];
  lines.push(`Groups: ${result.groups.map(summariseGroup).join("; ")}`);
  if (result.contested) {
    lines.push(`Contested. ${result.unresolved ? "Unresolved by the murajjihat." : `Verdict: ${result.verdict}.`}`);
    for (const step of result.resolution) {
      lines.push(`  [${step.ruleLabel}] ${step.winner} over ${step.loser}: ${step.explanation}`);
    }
  } else {
    lines.push(`Uncontested. Verdict: ${result.verdict}.`);
  }
  if (result.relatedOpinions.length > 0) {
    lines.push(`Related (non-contradicting) opinions: ${result.relatedOpinions.map(summariseGroup).join("; ")}`);
  }
  return lines.join("\n");
}
