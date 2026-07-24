/**
 * al-Murajjihat: the classical ordered rules for weighing between conflicting
 * evidences, applied here to weigh between conflicting *derivations*.
 *
 * Each rule looks at two competing sides and returns which one it prefers, or
 * "tie" if it has nothing to say. Rules are tried in order; the first
 * non-tie decides. That order is itself a substantive claim about usul
 * al-fiqh and is the main thing worth reviewing in this file — see the
 * comment on ordering below.
 *
 * A rule reasons over two different scopes, and mixing them up would produce
 * wrong answers:
 *
 * - "Chain-wide" rules (abrogation, thubut, dalala, specificity, restriction)
 *   ask whether *any* text feeding the derivation carries the attribute.
 *   These describe properties of the sources, which hold regardless of how
 *   deep in the proof they sit.
 * - "Mechanism" rules (directness / kind rank, transmission grade) ask how
 *   *this* conclusion was reached — by an explicit text, by analogy, by a
 *   maxim — and look only at the root clause, the one whose head is the
 *   ruling literal itself. Looking at the whole chain here would wrongly
 *   credit a qiyas-based conclusion with the authority of a Qur'anic verse
 *   used three steps earlier to identify an 'illa, which is not the same
 *   claim as the ruling being stated by that verse directly.
 */

import { EVIDENCE_KIND_RANK, GRADE_RANK } from "../kb/evidence";
import type { Certainty, Evidence, EvidenceStore, Restriction, Scope } from "../kb/evidence";
import type { Solution } from "../engine/prover";
import { chainStrength } from "./strength";

export type Side = "a" | "b";
export type Comparison = Side | "tie";

export interface RuleInput {
  readonly solution: Solution;
  /** Evidence for every clause touched anywhere in the derivation. */
  readonly chain: readonly Evidence[];
  /** Evidence for the clause whose head is the ruling literal itself. */
  readonly root: Evidence;
  /** Precomputed weakest-link strength (see `strength.ts`), for the final fallback rule. */
  readonly strength: number;
}

export interface MurajjihRule {
  readonly id: string;
  readonly label: string;
  compare(a: RuleInput, b: RuleInput): Comparison;
  /** Human explanation of a decision this rule made, for the Conflicts tab. */
  explain(a: RuleInput, b: RuleInput, winner: Side): string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function has(chain: readonly Evidence[], pred: (e: Evidence) => boolean): boolean {
  return chain.some(pred);
}

/** The worst (least certain) value of a certainty attribute present in the chain, or undefined if never marked. */
function certaintyFloor(chain: readonly Evidence[], pick: (e: Evidence) => Certainty | undefined): Certainty | undefined {
  const marked = chain.map(pick).filter((c): c is Certainty => c !== undefined);
  if (marked.length === 0) return undefined;
  return marked.includes("zanni") ? "zanni" : "qati";
}

function referenceOf(e: Evidence): string {
  return e.reference;
}

// ---------------------------------------------------------------------------
// Rules, in application order
// ---------------------------------------------------------------------------

const abrogation: MurajjihRule = {
  id: "abrogation",
  label: "Abrogation (naskh)",
  compare(a, b) {
    const aAbrogatesB = a.chain.some(
      (e) => e.abrogation === "nasikh" && b.solution.clauseIds.includes(e.abrogates ?? "")
    );
    const bAbrogatesA = b.chain.some(
      (e) => e.abrogation === "nasikh" && a.solution.clauseIds.includes(e.abrogates ?? "")
    );
    if (aAbrogatesB && !bAbrogatesA) return "a";
    if (bAbrogatesA && !aAbrogatesB) return "b";
    return "tie";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    const abrogator = side.chain.find((e) => e.abrogation === "nasikh");
    return `${referenceOf(abrogator ?? side.root)} abrogates a text underlying the other position, so it takes precedence over ${referenceOf(other.root)}.`;
  },
};

const thubut: MurajjihRule = {
  id: "thubut",
  label: "Certainty of transmission (thubut)",
  compare(a, b) {
    const fa = certaintyFloor(a.chain, (e) => e.thubut);
    const fb = certaintyFloor(b.chain, (e) => e.thubut);
    if (fa === "qati" && fb === "zanni") return "a";
    if (fb === "qati" && fa === "zanni") return "b";
    return "tie";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    return `${referenceOf(side.root)} is certainly transmitted (qat'i al-thubut), while ${referenceOf(other.root)}'s supporting text is not.`;
  },
};

const dalala: MurajjihRule = {
  id: "dalala",
  label: "Certainty of indication (dalala)",
  compare(a, b) {
    const fa = certaintyFloor(a.chain, (e) => e.dalala);
    const fb = certaintyFloor(b.chain, (e) => e.dalala);
    if (fa === "qati" && fb === "zanni") return "a";
    if (fb === "qati" && fa === "zanni") return "b";
    return "tie";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    return `${referenceOf(side.root)} indicates its ruling unambiguously (qat'i al-dalala), while ${referenceOf(other.root)} leaves room for interpretation.`;
  },
};

function hasScope(chain: readonly Evidence[], scope: Scope): boolean {
  return has(chain, (e) => e.scope === scope);
}

const specificity: MurajjihRule = {
  id: "specificity",
  label: "Specific over general (khass over amm)",
  compare(a, b) {
    const aKhass = hasScope(a.chain, "khass");
    const bKhass = hasScope(b.chain, "khass");
    if (aKhass && !bKhass) return "a";
    if (bKhass && !aKhass) return "b";
    return "tie";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    const specific = side.chain.find((e) => e.scope === "khass");
    return `${referenceOf(specific ?? side.root)} addresses this case specifically (khass), which qualifies the general ruling in ${referenceOf(other.root)} rather than being overridden by it.`;
  },
};

function hasRestriction(chain: readonly Evidence[], restriction: Restriction): boolean {
  return has(chain, (e) => e.restriction === restriction);
}

const restriction: MurajjihRule = {
  id: "restriction",
  label: "Restricted over unrestricted (muqayyad over mutlaq)",
  compare(a, b) {
    const aMuqayyad = hasRestriction(a.chain, "muqayyad");
    const bMuqayyad = hasRestriction(b.chain, "muqayyad");
    if (aMuqayyad && !bMuqayyad) return "a";
    if (bMuqayyad && !aMuqayyad) return "b";
    return "tie";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    const restricted = side.chain.find((e) => e.restriction === "muqayyad");
    return `${referenceOf(restricted ?? side.root)} carries an explicit qualification (muqayyad) that ${referenceOf(other.root)} lacks.`;
  },
};

/** How this conclusion was reached: an explicit text outranks a maxim, which outranks unaided analogy. */
const directness: MurajjihRule = {
  id: "directness",
  label: "Directness of derivation (nass over qiyas)",
  compare(a, b) {
    const ra = EVIDENCE_KIND_RANK[a.root.kind];
    const rb = EVIDENCE_KIND_RANK[b.root.kind];
    if (ra === rb) return "tie";
    return ra > rb ? "a" : "b";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    return `${referenceOf(side.root)} states this ruling directly (${side.root.kind}), a more direct derivation than ${other.root.kind} in ${referenceOf(other.root)}.`;
  },
};

/** Only decisive when both roots are graded reports (sunnah); otherwise the ranks are equal or absent. */
const transmissionGrade: MurajjihRule = {
  id: "transmission-grade",
  label: "Transmission grade (mutawatir > sahih > hasan > da'if)",
  compare(a, b) {
    if (!a.root.grade || !b.root.grade) return "tie";
    const ra = GRADE_RANK[a.root.grade];
    const rb = GRADE_RANK[b.root.grade];
    if (ra === rb) return "tie";
    return ra > rb ? "a" : "b";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    return `${referenceOf(side.root)} (${side.root.grade}) is more strongly transmitted than ${referenceOf(other.root)} (${other.root.grade}).`;
  },
};

const MARGIN = 8;

/**
 * Last resort: overall computed strength. Requires a real margin, not just
 * any difference, since the earlier rules already handle the distinctions
 * that usul al-fiqh treats as decisive — by the time the search reaches here,
 * a small numeric gap usually reflects modelling noise rather than a
 * genuine juristic preference, and should be reported as unresolved rather
 * than manufacture false confidence in a coin-flip margin.
 */
const overallStrength: MurajjihRule = {
  id: "overall-strength",
  label: "Overall evidentiary strength",
  compare(a, b) {
    if (Math.abs(a.strength - b.strength) < MARGIN) return "tie";
    return a.strength > b.strength ? "a" : "b";
  },
  explain(a, b, winner) {
    const [side, other] = winner === "a" ? [a, b] : [b, a];
    return `${referenceOf(side.root)} has the higher overall computed strength (${side.strength} vs ${other.strength}).`;
  },
};

/**
 * Applied in this order. See the module comment for why chain-wide rules
 * (properties of the texts) precede mechanism rules (how the ruling was
 * derived): specificity overrides generality regardless of how authoritative
 * the general text's source is, so it must be checked before directness or
 * kind rank ever get a say.
 */
export const MURAJJIH_RULES: readonly MurajjihRule[] = [
  abrogation,
  thubut,
  dalala,
  specificity,
  restriction,
  directness,
  transmissionGrade,
];

export { overallStrength };

/** Root clause of a solution: the clause whose head is the queried literal. */
export function rootClauseId(solution: Solution): string {
  return solution.proofs[0].clauseId;
}

export function buildRuleInput(solution: Solution, evidence: EvidenceStore): RuleInput {
  const chain = solution.clauseIds
    .map((id) => evidence.get(id))
    .filter((e): e is Evidence => e !== undefined);
  return {
    solution,
    chain,
    root: evidence.getOrUnknown(rootClauseId(solution)),
    strength: chainStrength(solution, evidence),
  };
}
