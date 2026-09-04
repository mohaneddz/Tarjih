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
 * An elimination tournament: the current leader is challenged by every group
 * that contradicts *it*, and a challenger that wins takes its place and faces
 * the rest. Two things follow from "contradicts it" rather than "contradicts
 * the opening leader", and both were wrong before:
 *
 * - The contested/related split has to be recomputed as the leader moves.
 *   Fixing it against `groups[0]` misfiles any group that sits close to the
 *   opening leader but far from the eventual winner — mandub is one step from
 *   wajib and three from haram, so a wajib-led question that resolves to haram
 *   would have shown mandub as a merely "related" opinion while it in fact
 *   gives the opposite instruction.
 * - Whether the question is unresolved is a property of the *surviving*
 *   leader, so it is settled by a final audit rather than latched the first
 *   time any pair ties. A tie against a leader that is later displaced is no
 *   longer the live question, and latching it reported an open question that
 *   the tournament had in fact decided.
 *
 * This remains a simplification — a fully general treatment would check the
 * preference relation for transitivity across all pairs — but the murajjihat
 * compare on a fixed, mostly-ordered set of textual attributes, so intransitive
 * cycles are not a realistic concern for this KB, and the sequential form is
 * what keeps the trail of reasoning legible in the UI.
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

  const resolution: TarjihStep[] = [];
  const recorded = new Set<string>();
  let current = groups[0];
  let contested = false;

  // Each pass challenges the leader with everything that contradicts it. A
  // pass that displaces the leader is followed by another, since the new
  // leader faces a different set of contradictions. Bounded by the number of
  // groups: every displacement consumes one, and there are at most five.
  for (let pass = 0; pass < groups.length; pass++) {
    let displaced = false;

    for (const challenger of groups) {
      if (challenger === current) continue;
      if (!contradicts(current.outcome, challenger.outcome)) continue;

      contested = true;
      const { winner, step } = adjudicate(current, challenger, evidence);
      if (!step) continue; // Inseparable; the audit below decides what that means.

      // A displacement is always followed by a rematch — the new leader is
      // challenged by the side it just beat — and the murajjihat are
      // symmetric, so that rematch re-derives a step already recorded. Key the
      // pairing on the unordered pair so the trail shows each comparison once.
      const pairing = [current.outcome, challenger.outcome].sort().join("|");
      if (!recorded.has(pairing)) {
        recorded.add(pairing);
        resolution.push(step);
      }

      if (winner !== current) {
        current = winner;
        displaced = true;
        break;
      }
    }

    if (!displaced) break;
  }

  /*
   * The verdict stands only if the surviving leader can actually be separated
   * from every ruling that opposes it. Asking this at the end, of the leader
   * that survived, is the whole point: a tie recorded mid-tournament against a
   * leader that was later displaced is no longer the live question, and
   * treating it as one reported an open question the tournament had decided.
   */
  const deadlocked = groups.some(
    (g) =>
      g !== current &&
      contradicts(current.outcome, g.outcome) &&
      adjudicate(current, g, evidence).step === undefined
  );

  const relatedOpinions = groups.filter(
    (g) => g !== current && !contradicts(current.outcome, g.outcome)
  );

  return {
    groups,
    contested,
    verdict: deadlocked ? undefined : current.outcome,
    unresolved: deadlocked,
    resolution,
    relatedOpinions,
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
