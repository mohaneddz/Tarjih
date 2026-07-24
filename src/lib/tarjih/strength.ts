/**
 * Chain strength: how much a single derivation is actually worth.
 *
 * A proof is a conjunction of sub-derivations, so its evidentiary value is
 * bounded by its weakest link, not its average or its conclusion's face
 * value. A five-step chain of analogies each resting on a shaky premise is
 * not made strong by its length, and stacking a qiyas on top of a maxim
 * (rather than on an explicit text) really is weaker than the same qiyas
 * built directly on a nass — the point noted while reading the engine's own
 * output on the aunt case. This module is what makes that distinction real
 * rather than a comment.
 */

import type { ProofNode, Solution } from "../engine/prover";
import { baseStrength, EvidenceStore } from "../kb/evidence";

/**
 * Collects the strength of every juristically meaningful clause touched by a
 * proof.
 *
 * Two kinds of node are deliberately excluded from the "meaningful" set even
 * though they still contribute 0 under `baseStrength`:
 *
 * - Deliberate `ontology` evidence: definitional scaffolding ("an aunt is
 *   kin") that lets a real argument connect but asserts nothing on its own.
 *   Nearly every proof touches several of these, so including them in a
 *   weakest-link computation would floor every derivation in the KB at 0 and
 *   the whole exercise would be pointless.
 * - Nothing else. A clause id with *no* evidence record at all is not treated
 *   as scaffolding — that is a real authoring gap (the KB linter should have
 *   caught it, but this is the query-time backstop) — so it is included and
 *   contributes a hard 0, correctly punishing a chain that silently relies on
 *   an unweighted clause.
 */
function collectMeaningfulStrengths(node: ProofNode, evidence: EvidenceStore, out: number[]): void {
  const record = evidence.get(node.clauseId);
  if (record === undefined) {
    out.push(0);
  } else if (record.kind !== "ontology") {
    out.push(baseStrength(record));
  }
  for (const child of node.children) collectMeaningfulStrengths(child, evidence, out);
}

/**
 * The weakest-link strength of one derivation, 0-100.
 *
 * A derivation with no juristically meaningful evidence at all (a pure
 * taxonomy fact, say) scores 0 — correctly, since it asserts nothing a
 * ruling could rest on.
 */
export function chainStrength(solution: Solution, evidence: EvidenceStore): number {
  const strengths: number[] = [];
  for (const proof of solution.proofs) collectMeaningfulStrengths(proof, evidence, strengths);
  if (strengths.length === 0) return 0;
  return Math.min(...strengths);
}

/**
 * Combines several independent derivations of the same conclusion into one
 * confidence figure.
 *
 * Deliberately not a probabilistic combination (e.g. `1 - Π(1 - p_i)`): the
 * per-derivation strengths are not independent probabilities in any rigorous
 * sense, and presenting a combined figure with that much apparent precision
 * would be exactly the kind of fabricated confidence this engine exists to
 * replace. Instead: take the strongest single chain as the primary figure —
 * that chain alone already supports the conclusion — and allow a small,
 * capped bump for genuine corroboration by additional derivations. The bump
 * saturates quickly (diminishing returns) so ten weak, similar analogies
 * cannot manufacture the confidence of one strong text.
 */
export function combinedConfidence(chainStrengths: readonly number[]): number {
  if (chainStrengths.length === 0) return 0;
  const primary = Math.max(...chainStrengths);
  const n = chainStrengths.length;
  const corroborationBonus = n > 1 ? Math.round(10 * (1 - 1 / n)) : 0;
  return Math.max(0, Math.min(100, Math.round(primary + corroborationBonus)));
}
