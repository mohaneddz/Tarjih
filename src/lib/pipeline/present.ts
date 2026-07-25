/**
 * Plain-data views of engine output.
 *
 * The engine's own types (`ProofNode`, `Solution`, `TarjihResult`) carry
 * `Term`/`Literal` structures and reference the evidence store by id. Neither
 * is what a prompt or an API response should serialize directly — the
 * narration LLM needs readable text, and the eventual UI needs a stable
 * contract that does not change every time something about term
 * representation changes internally. This module is that boundary.
 */

import type { ProofNode } from "../engine/prover";
import { literalToString } from "../logic/term";
import { baseStrength, EvidenceStore } from "../kb/evidence";
import type { Evidence } from "../kb/evidence";
import type { OutcomeGroup, TarjihStep } from "../tarjih/weigh";

export interface EvidenceView {
  readonly kind: Evidence["kind"];
  readonly reference: string;
  readonly text?: string;
  readonly textArabic?: string;
  readonly grade?: string;
  readonly scope?: string;
  readonly restriction?: string;
  /** Certainty of transmission: qati | zanni. */
  readonly thubut?: string;
  /** Certainty that the text indicates this particular ruling: qati | zanni. */
  readonly dalala?: string;
  readonly unreviewed: boolean;
  /** Human-authored rationale for this clause, when the KB records one. */
  readonly notes?: string;
  /** 0-100, this piece of evidence alone. See `baseStrength`. */
  readonly strength: number;
}

export interface ProofView {
  readonly goal: string;
  readonly clauseId: string;
  readonly evidence: EvidenceView;
  readonly children: readonly ProofView[];
}

function presentEvidence(record: Evidence): EvidenceView {
  return {
    kind: record.kind,
    reference: record.reference,
    text: record.text,
    textArabic: record.textArabic,
    grade: record.grade,
    scope: record.scope,
    restriction: record.restriction,
    thubut: record.thubut,
    dalala: record.dalala,
    unreviewed: record.unreviewed ?? false,
    notes: record.notes,
    strength: baseStrength(record),
  };
}

export function presentProof(node: ProofNode, evidence: EvidenceStore): ProofView {
  return {
    goal: literalToString(node.goal),
    clauseId: node.clauseId,
    evidence: presentEvidence(evidence.getOrUnknown(node.clauseId)),
    children: node.children.map((c) => presentProof(c, evidence)),
  };
}

export interface OutcomeGroupView {
  readonly outcome: string;
  readonly confidence: number;
  readonly derivationCount: number;
  /** Proof tree of the group's single strongest derivation. */
  readonly proof: ProofView;
}

export function presentGroup(group: OutcomeGroup, evidence: EvidenceStore): OutcomeGroupView {
  return {
    outcome: group.outcome,
    confidence: group.confidence,
    derivationCount: group.derivations.length,
    proof: presentProof(group.best.solution.proofs[0], evidence),
  };
}

export interface TarjihStepView {
  readonly rule: string;
  readonly winner: string;
  readonly loser: string;
  readonly explanation: string;
}

export function presentStep(step: TarjihStep): TarjihStepView {
  return { rule: step.ruleLabel, winner: step.winner, loser: step.loser, explanation: step.explanation };
}

/**
 * Flattens every evidence reference used anywhere in a proof, deduplicated,
 * for building the citation list the narration prompt is given.
 */
export function collectReferences(view: ProofView, into: Map<string, EvidenceView> = new Map()): Map<string, EvidenceView> {
  if (!into.has(view.clauseId)) into.set(view.clauseId, view.evidence);
  for (const child of view.children) collectReferences(child, into);
  return into;
}

/** Renders a proof tree as indented plain text, for the narration prompt. */
export function proofViewToText(view: ProofView, indent = 0): string {
  const pad = "  ".repeat(indent);
  const cite = view.evidence.reference !== "(no evidence record)" ? ` — ${view.evidence.reference}` : "";
  const line = `${pad}${view.goal}${cite}`;
  if (view.children.length === 0) return line;
  return [line, ...view.children.map((c) => proofViewToText(c, indent + 1))].join("\n");
}
