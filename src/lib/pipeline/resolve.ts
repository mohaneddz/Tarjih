/**
 * The full pipeline: natural language in, weighed and narrated verdict out.
 *
 * LLM(NL -> goal literal) -> prove() -> weighRuling() -> LLM(verdict -> prose)
 *
 * The two LLM calls bracket the reasoning; they do not participate in it.
 * Everything between them — which clauses fire, what the verdict is, why one
 * derivation beats another — is produced by `prove` and `weighRuling` alone,
 * and the narration call is explicitly told the verdict is final (see
 * `buildNarrationPrompt`). This is the whole point of the rewrite: the old
 * pipeline asked an LLM to invent both the reasoning and the answer.
 */

import { prove } from "../engine/prover";
import type { LoadedKb } from "../kb/entry";
import { groundGoal } from "./goal";
import type { GoalError, GroundedGoal } from "./goal";
import type { LlmClient } from "./llm";
import { presentGroup, presentStep } from "./present";
import type { OutcomeGroupView, TarjihStepView } from "./present";
import { buildGoalPrompt, buildNarrationPrompt } from "./prompts";
import { weighRuling } from "../tarjih/weigh";
import { literalToString } from "../logic/term";

export interface Narration {
  readonly summary: string;
  readonly analysis: string;
  readonly notes: string;
}

export interface ResolutionView {
  readonly question: string;
  readonly goalText: string;
  readonly madhhab?: string;
  readonly strictness?: string;

  readonly verdict?: string;
  readonly confidence?: number;
  readonly contested: boolean;
  readonly unresolved: boolean;
  readonly truncated: boolean;

  readonly groups: readonly OutcomeGroupView[];
  readonly resolution: readonly TarjihStepView[];
  readonly relatedOpinions: readonly OutcomeGroupView[];

  readonly narration: Narration;
}

export type ResolveError =
  | { readonly stage: "goal-grounding"; readonly error: GoalError }
  | { readonly stage: "no-derivation"; readonly goalText: string }
  | { readonly stage: "llm"; readonly message: string };

export type ResolveResult = { readonly ok: true; readonly view: ResolutionView } | { readonly ok: false; readonly error: ResolveError };

export interface ResolveOptions {
  readonly question: string;
  readonly madhhab?: string;
  readonly strictness?: string;
  readonly llm: LlmClient;
  readonly kb: LoadedKb;
  readonly maxSolutions?: number;
}

export type GroundError =
  | { readonly stage: "goal-grounding"; readonly error: GoalError }
  | { readonly stage: "llm"; readonly message: string };

export type GroundResult =
  | { readonly ok: true; readonly goal: GroundedGoal; readonly goalText: string }
  | { readonly ok: false; readonly error: GroundError };

/**
 * Runs stage 1 alone: translates a question into the goal literal the
 * prover would run, without proving or narrating anything.
 *
 * Exposed on its own — and reused by `resolveQuestion` below, so there is
 * exactly one code path for this stage — so the UI can offer a "grounding
 * preview": showing the user exactly what their question was translated to,
 * and letting them catch a bad translation, before committing to the full
 * (slower, two-LLM-call) pipeline.
 */
export async function groundQuestion(question: string, llm: LlmClient): Promise<GroundResult> {
  const goalPrompt = buildGoalPrompt(question);
  let rawGoal: string;
  try {
    rawGoal = await llm.complete(goalPrompt.system, goalPrompt.user, { temperature: 0 });
  } catch (e) {
    return { ok: false, error: { stage: "llm", message: e instanceof Error ? e.message : String(e) } };
  }

  const grounded = groundGoal(rawGoal);
  if (!grounded.ok) {
    return { ok: false, error: { stage: "goal-grounding", error: grounded.error } };
  }

  return { ok: true, goal: grounded.goal, goalText: literalToString(grounded.goal.literal) };
}

/** Best-effort JSON parse of the narration response; never throws. */
function parseNarration(raw: string, fallback: Narration): Narration {
  try {
    const parsed = JSON.parse(raw);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      analysis: typeof parsed.analysis === "string" ? parsed.analysis : fallback.analysis,
      notes: typeof parsed.notes === "string" ? parsed.notes : fallback.notes,
    };
  } catch {
    return fallback;
  }
}

/**
 * A narration built entirely from computed data, used whenever the LLM call
 * fails or returns something unusable. The request must never fail purely
 * because the prose-writing step had a bad day — the substantive answer is
 * already fully computed by this point.
 */
function computedFallbackNarration(groups: readonly OutcomeGroupView[], verdict: string | undefined): Narration {
  const top = groups[0];
  const summary = verdict
    ? `The engine's ruling is ${verdict}${top ? ` (${top.confidence}% confidence)` : ""}.`
    : "The engine could not determine a single verdict for this question.";
  const analysis = groups
    .map((g) => `${g.outcome}: supported by ${g.derivationCount} derivation(s), ${g.confidence}% confidence.`)
    .join(" ");
  return { summary, analysis, notes: "Narration could not be generated; this is a computed-only summary." };
}

export async function resolveQuestion(options: ResolveOptions): Promise<ResolveResult> {
  const { question, madhhab, strictness, llm, kb, maxSolutions = 200 } = options;

  // --- Stage 1: ground the question into a goal literal ---
  const grounded = await groundQuestion(question, llm);
  if (!grounded.ok) {
    return { ok: false, error: grounded.error };
  }
  const { goalText } = grounded;

  // --- Stage 2: prove ---
  const proveResult = prove([grounded.goal.literal], kb.kb, { maxSolutions });

  // --- Stage 3: weigh ---
  const tarjih = weighRuling(proveResult, kb.evidence);
  if (!tarjih) {
    return { ok: false, error: { stage: "no-derivation", goalText } };
  }

  const groups = tarjih.groups.map((g) => presentGroup(g, kb.evidence));
  const relatedOpinions = tarjih.relatedOpinions.map((g) => presentGroup(g, kb.evidence));
  const resolution = tarjih.resolution.map(presentStep);
  const topConfidence = tarjih.verdict
    ? tarjih.groups.find((g) => g.outcome === tarjih.verdict)?.confidence
    : undefined;

  // --- Stage 4: narrate ---
  const narrationPrompt = buildNarrationPrompt({
    question,
    goalText,
    madhhabRequested: madhhab,
    contested: tarjih.contested,
    unresolved: tarjih.unresolved,
    verdict: tarjih.verdict,
    groups,
    resolution,
    truncated: proveResult.truncated,
  });

  const fallback = computedFallbackNarration(groups, tarjih.verdict);
  let narration: Narration;
  try {
    const raw = await llm.complete(narrationPrompt.system, narrationPrompt.user, { json: true, temperature: 0.2 });
    narration = parseNarration(raw, fallback);
  } catch {
    narration = fallback;
  }

  return {
    ok: true,
    view: {
      question,
      goalText,
      madhhab,
      strictness,
      verdict: tarjih.verdict,
      confidence: topConfidence,
      contested: tarjih.contested,
      unresolved: tarjih.unresolved,
      truncated: proveResult.truncated,
      groups,
      resolution,
      relatedOpinions,
      narration,
    },
  };
}
