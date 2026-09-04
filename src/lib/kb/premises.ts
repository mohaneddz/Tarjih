/**
 * Premises the asker supplied about their own situation, injected into a
 * query-scoped copy of the knowledge base.
 *
 * The knowledge base holds what the law says. It must not hold what is true of
 * whoever is currently asking. Collapsing the two is not a tidiness question:
 * `necessity(starvation)` is a permanent fact about the law (starvation is a
 * darura) while `circumstance(starvation)` is a claim about one person at one
 * moment, and storing the second alongside the first made every concession in
 * the KB fire for every asker — the necessity exemption in Qur'an 2:173
 * answered "is pork permitted?" with "permitted".
 *
 * So premises live for exactly one query. They are given real clause ids and
 * evidence records rather than being smuggled in anonymously, because they
 * appear in the proof tree and the reader is entitled to see which step of the
 * reasoning rests on their own account of themselves rather than on a text.
 */

import { KnowledgeBase } from "../engine/kb";
import type { Clause, Literal } from "../logic/types";
import { literalToString } from "../logic/term";
import type { Evidence } from "./evidence";
import { EvidenceStore } from "./evidence";
import type { LoadedKb } from "./entry";

/** Clause ids for asker-supplied premises all carry this prefix. */
export const PREMISE_ID_PREFIX = "premise:";

export function isPremiseClauseId(clauseId: string): boolean {
  return clauseId.startsWith(PREMISE_ID_PREFIX);
}

function premiseId(literal: Literal): string {
  return `${PREMISE_ID_PREFIX}${literalToString(literal)}`;
}

/**
 * Evidence for a premise.
 *
 * `ontology` kind, so it scores zero and is skipped by the weakest-link
 * strength floor. That is the right call and worth stating plainly: the
 * premise is not evidence. A concession resting on it is exactly as strong as
 * the verse that grants the concession — no stronger for the asker having
 * asserted the situation, and no weaker either. What the asker's claim
 * actually bears on is whether the ruling applies *to them*, which is a
 * different question from how well-founded the ruling is, and belongs in front
 * of the reader rather than folded into a number.
 */
function premiseEvidence(literal: Literal): Evidence {
  return {
    clauseId: premiseId(literal),
    kind: "ontology",
    reference: "Stated in the question",
    notes:
      "Taken from the question as asked, not from any source. The ruling below " +
      "holds only so far as this is actually true of you.",
  };
}

/**
 * Returns `base` extended with the given ground premises, leaving `base`
 * untouched.
 *
 * The validation report is carried over rather than recomputed: it describes
 * the authored KB, which is what a KB-health surface should report on, and
 * re-linting on every query would flag nothing new — premises are ground facts
 * over a predicate the ontology already defines.
 */
export function withPremises(base: LoadedKb, premises: readonly Literal[]): LoadedKb {
  if (premises.length === 0) return base;

  const clauses: Clause[] = premises.map((head) => ({ id: premiseId(head), head, body: [] }));
  const evidence = new EvidenceStore(base.evidence.all()).addAll(premises.map(premiseEvidence));

  return {
    kb: new KnowledgeBase([...base.clauses, ...clauses]),
    evidence,
    clauses: [...base.clauses, ...clauses],
    report: base.report,
  };
}
