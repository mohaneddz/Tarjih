/**
 * Offline hadith formalisation: converts a scraped text into a candidate
 * clause the engine can actually reason over.
 *
 * This is the highest-risk step in the whole system. Every other LLM call in
 * the project either only narrows a question (`goal.ts`) or narrates an
 * already-computed answer (`resolve.ts`); this one proposes new logical
 * content that, if accepted uncritically, becomes something the prover
 * treats as ground truth for every future query. Three separate gates exist
 * because of that:
 *
 * 1. The clause must parse.
 * 2. The clause must pass `validateClause` — every predicate and every
 *    ruling value must be from the fixed ontology, so a hallucinated
 *    predicate is caught here rather than silently sitting in the KB as a
 *    rule that can never fire (or worse, one that happens to collide with a
 *    real predicate name and fires wrongly).
 * 3. Regardless of (1) and (2) passing, the result is stored with
 *    `unreviewed: true` and is never merged into the live KB automatically.
 *    A human has to look at it. This module produces candidates, not
 *    accepted clauses.
 */

import { validateClause } from "../kb/validate";
import { parseClause, ParseError } from "../logic/parse";
import { literalKey } from "../logic/types";
import { lexiconPromptBlock } from "../kb/lexicon";
import { AHKAM_TAKLIFIYYA, PREDICATES } from "../kb/ontology";
import type { HadithGrade } from "../kb/evidence";
import type { KbIssue } from "../kb/validate";
import type { LlmClient } from "./llm";
import type { LlmMessages } from "./prompts";

export interface FormalizeInput {
  readonly clauseId: string;
  readonly reference: string;
  readonly textEn: string;
  readonly grade: HadithGrade | undefined;
}

export interface FormalizeCandidate {
  readonly clauseId: string;
  readonly clauseSource: string;
  /** "predicate/arity" of the clause head, e.g. "ruling/2" — for storage diagnostics. */
  readonly head: string;
  readonly evidenceKind: "sunnah";
  readonly reference: string;
  readonly text: string;
  readonly grade: HadithGrade | undefined;
  readonly scope: "amm" | "khass" | undefined;
  readonly dalala: "qati" | "zanni" | undefined;
  readonly rationale: string;
}

export type FormalizeResult =
  | { readonly ok: true; readonly candidate: FormalizeCandidate }
  | { readonly ok: false; readonly reason: "not-a-ruling"; readonly rationale: string }
  | { readonly ok: false; readonly reason: "parse-error"; readonly message: string; readonly raw: string }
  | { readonly ok: false; readonly reason: "validation-failed"; readonly issues: readonly KbIssue[]; readonly raw: string }
  | { readonly ok: false; readonly reason: "llm-error"; readonly message: string };

function predicateReference(): string {
  return PREDICATES.filter((p) => p.group !== "derivational")
    .map((p) => `  - ${p.name}/${p.arity}: ${p.meaning}`)
    .join("\n");
}

export function buildFormalizationPrompt(input: FormalizeInput): LlmMessages {
  const system = `You are the offline formalisation stage of Tarjih, a symbolic Islamic legal reasoning engine.

Your job is to read ONE hadith text and decide whether it directly establishes a
legal ruling (a hukm) about some act, and if so, express that as ONE Horn clause
in a fixed logical vocabulary. You are not asked whether the ruling is correct or
to derive anything by analogy — only whether THIS text, read plainly, states a
ruling, and if so, which one.

Many hadiths do not state a ruling at all (they narrate an event, describe the
Prophet's character, or record a supplication) — for those, say so honestly
rather than inventing a rule that is not there.

Available predicates (use ONLY these; do not invent new ones):
${predicateReference()}

${lexiconPromptBlock()}

If the act or entity the hadith concerns is not in the known-entities list above,
introduce a new lowercase snake_case atom for it rather than forcing it into an
existing one that means something different.

Ruling values: ${AHKAM_TAKLIFIYYA.join(", ")}.

Respond with a single JSON object, no markdown fences:
{
  "isRuling": true | false,
  "rationale": "one sentence: what the hadith says and why it does or does not state a ruling",
  "clause": "the clause in surface syntax, e.g. ruling(consume(alcohol), haram). Omit or empty string if isRuling is false.",
  "scope": "amm" | "khass" | null,  // is the ruling general or does it address a specific case?
  "dalala": "qati" | "zanni" | null  // does the wording unambiguously indicate this ruling, or does it require interpretation?
}

If isRuling is true, "clause" MUST be present and MUST be a single valid clause
ending in a period. Prefer a plain fact (no body) unless the hadith itself states
a conditional ("whoever does X, then Y").`;

  const user = `Reference: ${input.reference}
Grade: ${input.grade ?? "ungraded"}
Text: ${input.textEn}`;

  return { system, user };
}

interface RawFormalization {
  isRuling?: boolean;
  rationale?: string;
  clause?: string;
  scope?: "amm" | "khass" | null;
  dalala?: "qati" | "zanni" | null;
}

/**
 * Runs one hadith through the formalisation LLM call and every validation
 * gate. Never throws — every failure mode is a `FormalizeResult` variant so a
 * batch run can log and continue rather than crashing on one bad hadith.
 */
export async function formalizeHadith(input: FormalizeInput, llm: LlmClient): Promise<FormalizeResult> {
  const prompt = buildFormalizationPrompt(input);

  let raw: string;
  try {
    raw = await llm.complete(prompt.system, prompt.user, { json: true, temperature: 0 });
  } catch (e) {
    return { ok: false, reason: "llm-error", message: e instanceof Error ? e.message : String(e) };
  }

  let parsed: RawFormalization;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "llm-error", message: `LLM did not return valid JSON: ${raw.slice(0, 200)}` };
  }

  if (!parsed.isRuling || !parsed.clause || !parsed.clause.trim()) {
    return {
      ok: false,
      reason: "not-a-ruling",
      rationale: parsed.rationale ?? "The model did not identify a ruling in this text.",
    };
  }

  let clause;
  try {
    clause = parseClause(parsed.clause.trim(), input.clauseId);
  } catch (e) {
    return {
      ok: false,
      reason: "parse-error",
      message: e instanceof ParseError ? e.message : String(e),
      raw: parsed.clause,
    };
  }

  const issues = validateClause(clause);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return { ok: false, reason: "validation-failed", issues, raw: parsed.clause };
  }

  return {
    ok: true,
    candidate: {
      clauseId: input.clauseId,
      clauseSource: parsed.clause.trim(),
      head: literalKey(clause.head),
      evidenceKind: "sunnah",
      reference: input.reference,
      text: input.textEn,
      grade: input.grade,
      scope: parsed.scope ?? undefined,
      dalala: parsed.dalala ?? undefined,
      rationale: parsed.rationale ?? "",
    },
  };
}
