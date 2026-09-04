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
import { contradicts, isHukm, isValidity, validityContradicts } from "../kb/ontology";
import type { Hukm, Validity } from "../kb/ontology";
import { buildRuleInput, MURAJJIH_RULES, overallStrength, rootClauseId } from "./murajjih";
import { chainStrength, combinedConfidence } from "./strength";

/**
 * The set of answers one kind of question can come back with.
 *
 * Everything in this module — grouping, contest detection, the tournament —
 * is about the *shape* of a disagreement, not about what is being disagreed
 * over, so it is parameterised over the axis rather than hard-wired to the
 * five ahkam. The murajjihat compare evidence, and evidence does not care
 * whether the conclusion is "forbidden" or "void".
 *
 * The axis supplies the two things that genuinely differ: which query
 * variable carries the answer, and when two answers are far enough apart that
 * one has to be chosen rather than both being reported.
 */
export interface OutcomeAxis<T extends string> {
  readonly id: string;
  /** Query variable the answer is bound to, e.g. "H" for ruling/2. */
  readonly variable: string;
  isValue(name: string): name is T;
  contradicts(a: T, b: T): boolean;
}

/** al-ahkam al-taklifiyya: the five defining rulings, as `ruling(Act, H)`. */
export const AHKAM_AXIS: OutcomeAxis<Hukm> = {
  id: "ahkam",
  variable: "H",
  isValue: isHukm,
  contradicts,
};

/** al-ahkam al-wad'iyya: declaratory status, as `validity(Transaction, V)`. */
export const VALIDITY_AXIS: OutcomeAxis<Validity> = {
  id: "validity",
  variable: "V",
  isValue: isValidity,
  contradicts: validityContradicts,
};

export interface Derivation<T extends string = Hukm> {
  readonly solution: Solution;
  readonly outcome: T;
  readonly strength: number;
  readonly rootClauseId: string;
}

export interface OutcomeGroup<T extends string = Hukm> {
  readonly outcome: T;
  readonly derivations: readonly Derivation<T>[];
  /** The single strongest derivation, used as this group's representative in tarjih comparisons. */
  readonly best: Derivation<T>;
  /** Computed from `best.strength` plus a capped bump for independent corroboration. */
  readonly confidence: number;
}

export interface TarjihStep<T extends string = Hukm> {
  readonly rule: string;
  readonly ruleLabel: string;
  readonly winner: T;
  readonly loser: T;
  readonly explanation: string;
}

export interface TarjihResult<T extends string = Hukm> {
  /** One group per distinct answer reached, sorted by confidence descending. */
  readonly groups: readonly OutcomeGroup<T>[];
  /**
   * True when at least two groups give answers that cannot honestly be
   * presented as a spread of opinion (see the axis's `contradicts`) and had to
   * be weighed against each other.
   */
  readonly contested: boolean;
  /** The prevailing answer. Present even when uncontested (there is still exactly one). */
  readonly verdict?: T;
  /** True when contested and the murajjihat could not separate the sides — reported, not papered over. */
  readonly unresolved: boolean;
  /** The tournament's reasoning, in order. Empty when uncontested. */
  readonly resolution: readonly TarjihStep<T>[];
  /** Groups that differ from the verdict but do not rise to genuine contradiction (e.g. makruh alongside mubah). */
  readonly relatedOpinions: readonly OutcomeGroup<T>[];
}

function outcomeVar<T extends string>(solution: Solution, axis: OutcomeAxis<T>): T | undefined {
  const term = solution.bindings[axis.variable];
  if (!term || term.kind !== "atom" || !axis.isValue(term.name)) return undefined;
  return term.name;
}

/**
 * Groups a query's solutions by the value bound to the axis variable,
 * computing each group's representative derivation and confidence.
 *
 * Solutions that do not bind that variable to a value on the axis (a
 * different query shape entirely) are silently skipped rather than erroring,
 * since this function is meant to be called speculatively on any ProveResult.
 */
export function groupByOutcome<T extends string = Hukm>(
  result: ProveResult,
  evidence: EvidenceStore,
  axis: OutcomeAxis<T> = AHKAM_AXIS as unknown as OutcomeAxis<T>
): OutcomeGroup<T>[] {
  const byOutcome = new Map<T, Derivation<T>[]>();

  for (const solution of result.solutions) {
    const outcome = outcomeVar(solution, axis);
    if (!outcome) continue;
    const derivation: Derivation<T> = {
      solution,
      outcome,
      strength: chainStrength(solution, evidence),
      rootClauseId: rootClauseId(solution),
    };
    const bucket = byOutcome.get(outcome);
    if (bucket) bucket.push(derivation);
    else byOutcome.set(outcome, [derivation]);
  }

  const groups: OutcomeGroup<T>[] = [];
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
function adjudicate<T extends string>(
  a: OutcomeGroup<T>,
  b: OutcomeGroup<T>,
  evidence: EvidenceStore
): { winner: OutcomeGroup<T>; loser: OutcomeGroup<T>; step?: TarjihStep<T> } {
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
 * Weighs every outcome group against every other and returns the prevailing
 * answer, the reasoning that got there, and what else remains standing.
 *
 * An elimination tournament: the current leader is challenged by every other
 * group in turn, and a challenger the murajjihat prefer takes its place and
 * faces the rest.
 *
 * **Every** other group — `contradicts` decides how a result is *presented*,
 * never whether it gets weighed. Those are separate questions and merging
 * them was wrong. wajib against mandub is one step apart, so it is not a
 * crisis and both readings genuinely stand; but which of them prevails is
 * still a question the murajjihat answer, and skipping the comparison left it
 * to raw confidence instead. That handed the verdict to whichever side had
 * the higher-scoring source — reporting a minority reading backed by a direct
 * verse over the majority one backed by the verse that qualifies it, which is
 * precisely the judgement the specificity rule exists to make. An engine
 * whose whole claim is that it weighs rather than scores cannot decide its
 * closest calls by score.
 *
 * `contradicts` then does exactly two jobs: it decides whether the result is
 * flagged contested, and whether a losing group is suppressed or shown as a
 * live alternative.
 *
 * Two further properties, both of which were wrong before:
 *
 * - The contested/related split is recomputed against the *surviving* leader,
 *   not the opening one. Fixing it against `groups[0]` misfiles any group that
 *   sits close to the opening leader but far from the eventual winner — mandub
 *   is one step from wajib and three from haram, so a wajib-led question that
 *   resolves to haram would have shown mandub as merely "related" while it in
 *   fact gives the opposite instruction.
 * - Whether the question is unresolved is a property of the surviving leader,
 *   so it is settled by a final audit rather than latched the first time any
 *   pair ties. Only a tie with a *contradicting* group leaves the question
 *   open: two compatible readings the rules cannot separate is what a spread
 *   of scholarly opinion looks like, not a failure to answer.
 *
 * This remains a simplification — a fully general treatment would check the
 * preference relation for transitivity across all pairs — but the murajjihat
 * compare on a fixed, mostly-ordered set of textual attributes, so intransitive
 * cycles are not a realistic concern for this KB, and the sequential form is
 * what keeps the trail of reasoning legible in the UI.
 */
export function weighRuling<T extends string = Hukm>(
  result: ProveResult,
  evidence: EvidenceStore,
  axis: OutcomeAxis<T> = AHKAM_AXIS as unknown as OutcomeAxis<T>
): TarjihResult<T> | undefined {
  const groups = groupByOutcome(result, evidence, axis);
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

  const resolution: TarjihStep<T>[] = [];
  const recorded = new Set<string>();
  let current = groups[0];
  let contested = false;

  // Each pass challenges the leader with every other group. A pass that
  // displaces the leader is followed by another, since the new leader has yet
  // to face the rest. Bounded by the number of groups: every displacement
  // consumes one, and there are at most five.
  for (let pass = 0; pass < groups.length; pass++) {
    let displaced = false;

    for (const challenger of groups) {
      if (challenger === current) continue;

      if (axis.contradicts(current.outcome, challenger.outcome)) contested = true;
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
   * The verdict stands only if the surviving leader can be separated from
   * every ruling that genuinely opposes it. Two conditions, both load-bearing:
   *
   * - Asked of the leader that survived, not of every pair seen along the way.
   *   A tie against a leader later displaced is no longer the live question,
   *   and treating it as one reported an open question the tournament had in
   *   fact decided.
   * - Only contradictions count. Two compatible readings the rules cannot
   *   separate — wajib and mandub, say — is what a spread of scholarly opinion
   *   looks like; reporting no verdict there would refuse to answer a question
   *   on which both answers point the same way.
   */
  const deadlocked = groups.some(
    (g) =>
      g !== current &&
      axis.contradicts(current.outcome, g.outcome) &&
      adjudicate(current, g, evidence).step === undefined
  );

  const relatedOpinions = groups.filter(
    (g) => g !== current && !axis.contradicts(current.outcome, g.outcome)
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
export function summariseGroup<T extends string>(group: OutcomeGroup<T>): string {
  return `${group.outcome} (${group.confidence}% confidence, ${group.derivations.length} derivation${group.derivations.length === 1 ? "" : "s"})`;
}

/** Debug helper: renders a full tarjih result as readable text. */
export function tarjihToString<T extends string>(result: TarjihResult<T>): string {
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
