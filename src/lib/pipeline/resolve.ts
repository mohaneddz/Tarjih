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

import { explainFailure } from "../engine/explain";
import type { FailureExplanation } from "../engine/explain";
import { prove } from "../engine/prover";
import type { ProveResult } from "../engine/prover";
import type { LoadedKb } from "../kb/entry";
import { withPremises } from "../kb/premises";
import { groundGoal } from "./goal";
import type { GoalError, GroundedGoal } from "./goal";
import type { LlmClient } from "./llm";
import { presentGroup, presentStep } from "./present";
import type { OutcomeGroupView, TarjihStepView } from "./present";
import { buildGoalPrompt, buildNarrationPrompt } from "./prompts";
import { VALIDITY_AXIS, weighRuling } from "../tarjih/weigh";
import { literalToString, v } from "../logic/term";
import type { Literal, Term } from "../logic/types";
import { findCircumstance } from "../kb/lexicon";
import { QUERY_SUPPLIED_PREDICATES, VALIDITY_LABELS } from "../kb/ontology";
import type { Hukm } from "../kb/ontology";
import type { TarjihResult } from "../tarjih/weigh";
import { humanizeLiteral } from "./humanize";

export interface Narration {
  readonly summary: string;
  readonly analysis: string;
  readonly notes: string;
}

/** One situation the asker stated about themselves, as the UI shows it. */
export interface PremiseView {
  /** The circumstance atom, e.g. "starvation". */
  readonly situation: string;
  /** Readable form, e.g. "facing starvation — a genuine threat to life from lack of food". */
  readonly label: string;
}

export interface ResolutionView {
  readonly question: string;
  readonly goalText: string;
  readonly madhhab?: string;
  readonly strictness?: string;

  /**
   * Situations taken from the question rather than from any source.
   *
   * Surfaced separately from the proof because a reader needs to check them
   * differently: everything else in the result can be verified against a text,
   * while these can only be verified against their own situation. A concession
   * silently resting on a misread premise is the failure mode this guards.
   */
  readonly premises: readonly PremiseView[];

  readonly verdict?: string;
  readonly confidence?: number;
  readonly contested: boolean;
  readonly unresolved: boolean;
  readonly truncated: boolean;

  readonly groups: readonly OutcomeGroupView[];
  readonly resolution: readonly TarjihStepView[];
  readonly relatedOpinions: readonly OutcomeGroupView[];

  /**
   * The declaratory ruling (al-hukm al-wad'i), when the act is a transaction
   * the KB says something about. Absent for everything else.
   *
   * A separate answer, not a restatement of the verdict. "May I enter this
   * contract" and "does this contract transfer ownership" are different
   * questions whose answers routinely diverge — a sale can be sinful to enter
   * and still binding once entered — so someone acting on the result needs
   * both, and folding one into the other would leave them with whichever
   * question the engine happened to prove.
   */
  readonly declaratory?: DeclaratoryView;

  /**
   * The ruling with none of the asker's stated circumstances, present only
   * when they stated some. Without it, a reader sees "permitted" and cannot
   * tell whether that is the act's ruling or a concession that holds only
   * for them — the difference between 'azima and rukhsa.
   */
  readonly baseline?: BaselineView;
  /** Unstated situations that would change the verdict. See `ScenarioView`. */
  readonly whatIf: readonly ScenarioView[];
  readonly stats: SearchStatsView;

  readonly narration: Narration;
}

/** The same question answered without any of the asker's stated circumstances: the 'azima. */
export interface BaselineView {
  readonly verdict?: string;
  readonly confidence?: number;
  readonly contested: boolean;
  readonly unresolved: boolean;
}

/**
 * A situation the asker did not state that would change the answer, found
 * because a rule in the proof search stopped on it. Computed by actually
 * re-running the engine with the premise added, never guessed.
 */
export interface ScenarioView {
  readonly situation: string;
  readonly label: string;
  /** The ruling the engine reaches once the situation is added. */
  readonly verdict?: string;
  readonly confidence?: number;
  /** Citations of the rules that were waiting on it. */
  readonly unlockedBy: readonly string[];
}

/** A goal the search stopped on, for explaining a question with no derivation. */
export interface StalledGoalView {
  readonly goal: string;
  readonly goalHuman: string;
  /** Citations of the rules whose bodies needed it; empty for the question itself. */
  readonly neededBy: readonly string[];
}

/** How much work the engine did, for the reader who wants to see it. */
export interface SearchStatsView {
  readonly steps: number;
  readonly derivations: number;
  readonly loopCuts: number;
  readonly instantiationFaults: number;
  readonly elapsedMs: number;
}

export interface DeclaratoryView {
  /** sahih | fasid | batil. */
  readonly status: string;
  readonly label: string;
  readonly gloss: string;
  readonly confidence: number;
  readonly contested: boolean;
  readonly unresolved: boolean;
  readonly groups: readonly OutcomeGroupView[];
  readonly resolution: readonly TarjihStepView[];
}

export type ResolveError =
  | { readonly stage: "goal-grounding"; readonly error: GoalError }
  | {
      readonly stage: "no-derivation";
      readonly goalText: string;
      /** Where the search stopped, nearest the question first. */
      readonly stalled: readonly StalledGoalView[];
      /** Situations that, stated, would produce a ruling after all. */
      readonly whatIf: readonly ScenarioView[];
    }
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

  return { ok: true, goal: grounded.goal, goalText: goalToText(grounded.goal) };
}

/**
 * The goal as the grounding preview shows it, circumstances included.
 *
 * The preview exists so the asker can catch a bad translation before the
 * engine commits to it, and a wrongly-added circumstance is the translation
 * error with the worst consequences — so it has to be visible here, not just
 * in the proof afterwards.
 */
function goalToText(goal: GroundedGoal): string {
  return [goal.literal, ...goal.circumstances].map(literalToString).join(", ");
}

/**
 * Proves and weighs `validity(Act, V)` for the same act, if the KB has
 * anything to say about it.
 *
 * Run unconditionally rather than gated on the act "looking like" a contract:
 * whether a declaratory ruling exists is a fact about the KB, and the prover
 * answering with nothing is both cheap and the correct signal. Gating it on a
 * guess about the act would mean silently withholding an answer the KB holds.
 */
function resolveDeclaratory(
  act: Term,
  kb: LoadedKb,
  maxSolutions: number
): DeclaratoryView | undefined {
  const proved = prove([{ predicate: "validity", args: [act, v("V")] }], kb.kb, { maxSolutions });
  const weighed = weighRuling(proved, kb.evidence, VALIDITY_AXIS);
  if (!weighed || weighed.groups.length === 0) return undefined;

  const status = weighed.verdict ?? weighed.groups[0].outcome;
  const labels = VALIDITY_LABELS[status];
  return {
    status,
    label: labels.en,
    gloss: labels.gloss,
    confidence: weighed.groups.find((g) => g.outcome === status)?.confidence ?? 0,
    contested: weighed.contested,
    unresolved: weighed.unresolved,
    groups: weighed.groups.map((g) => presentGroup(g, kb.evidence)),
    resolution: weighed.resolution.map(presentStep),
  };
}

const MAX_TRACE_EVENTS = 20_000;

interface Analysis {
  readonly scoped: LoadedKb;
  readonly proved: ProveResult;
  readonly tarjih?: TarjihResult<Hukm>;
  readonly explanation: FailureExplanation;
}

/** Proves and weighs one goal against a query-scoped KB, with the trace kept for explanation. */
function analyse(goal: Literal, kb: LoadedKb, premises: readonly Literal[], maxSolutions: number): Analysis {
  const scoped = withPremises(kb, premises);
  const proved = prove([goal], scoped.kb, { maxSolutions, trace: true, maxTraceEvents: MAX_TRACE_EVENTS });
  return {
    scoped,
    proved,
    tarjih: weighRuling(proved, scoped.evidence),
    explanation: explainFailure(proved, {
      querySupplied: QUERY_SUPPLIED_PREDICATES,
      maxTraceEvents: MAX_TRACE_EVENTS,
    }),
  };
}

function citationsFor(clauseIds: readonly string[], kb: LoadedKb): string[] {
  return [...new Set(clauseIds.map((id) => kb.evidence.getOrUnknown(id).reference))];
}

function verdictConfidence(tarjih: TarjihResult<Hukm> | undefined): number | undefined {
  if (!tarjih?.verdict) return undefined;
  return tarjih.groups.find((g) => g.outcome === tarjih.verdict)?.confidence;
}

/**
 * Re-runs the question once per unstated situation a rule was waiting on, and
 * keeps the ones that change the answer.
 *
 * Restricted to situations in the lexicon — the same gate the grounding stage
 * applies — so a scenario can only ever be one the asker could actually have
 * stated. Bounded by that list, which is short.
 */
export function findScenarios(
  goal: Literal,
  kb: LoadedKb,
  premises: readonly Literal[],
  explanation: FailureExplanation,
  currentVerdict: string | undefined,
  maxSolutions: number
): ScenarioView[] {
  const out: ScenarioView[] = [];
  for (const unmet of explanation.unmetPremises) {
    const arg = unmet.literal.args[0];
    if (arg?.kind !== "atom") continue;
    const entry = findCircumstance(arg.name);
    if (!entry) continue;

    const { tarjih } = analyse(goal, kb, [...premises, unmet.literal], maxSolutions);
    if (!tarjih || tarjih.verdict === currentVerdict) continue;
    out.push({
      situation: entry.atom,
      label: entry.label,
      verdict: tarjih.verdict,
      confidence: verdictConfidence(tarjih),
      unlockedBy: citationsFor(unmet.neededBy, kb),
    });
  }
  return out;
}

function describePremises(circumstances: readonly Literal[]): PremiseView[] {
  return circumstances.map((c) => {
    const situation = c.args[0].kind === "atom" ? c.args[0].name : literalToString(c);
    return { situation, label: findCircumstance(situation)?.label ?? situation };
  });
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
  // Against a query-scoped KB: the asker's stated situation is a premise for
  // this question alone and must not outlive it. See `kb/premises.ts`.
  const started = Date.now();
  const premises = grounded.goal.circumstances;
  const goal = grounded.goal.literal;
  const { scoped, proved: proveResult, tarjih, explanation } = analyse(goal, kb, premises, maxSolutions);

  // --- Stage 3: weigh ---
  if (!tarjih) {
    return {
      ok: false,
      error: {
        stage: "no-derivation",
        goalText,
        stalled: explanation.frontier.map((f) => ({
          goal: f.goal,
          goalHuman: humanizeLiteral(f.literal),
          neededBy: citationsFor(f.neededBy, scoped),
        })),
        whatIf: findScenarios(goal, kb, premises, explanation, undefined, maxSolutions),
      },
    };
  }

  const groups = tarjih.groups.map((g) => presentGroup(g, scoped.evidence));
  const relatedOpinions = tarjih.relatedOpinions.map((g) => presentGroup(g, scoped.evidence));
  const resolution = tarjih.resolution.map(presentStep);
  const topConfidence = verdictConfidence(tarjih);

  const declaratory = resolveDeclaratory(grounded.goal.act, scoped, maxSolutions);

  let baseline: BaselineView | undefined;
  if (premises.length > 0) {
    const plain = analyse(goal, kb, [], maxSolutions).tarjih;
    baseline = {
      verdict: plain?.verdict,
      confidence: verdictConfidence(plain),
      contested: plain?.contested ?? false,
      unresolved: plain?.unresolved ?? false,
    };
  }
  const whatIf = findScenarios(goal, kb, premises, explanation, tarjih.verdict, maxSolutions);
  const stats: SearchStatsView = {
    steps: proveResult.steps,
    derivations: proveResult.solutions.length,
    loopCuts: proveResult.loopCuts,
    instantiationFaults: proveResult.instantiationFaults,
    elapsedMs: Date.now() - started,
  };

  // --- Stage 4: narrate ---
  const narrationPrompt = buildNarrationPrompt({
    question,
    goalText,
    madhhabRequested: madhhab,
    strictnessRequested: strictness,
    contested: tarjih.contested,
    unresolved: tarjih.unresolved,
    verdict: tarjih.verdict,
    groups,
    resolution,
    truncated: proveResult.truncated,
    declaratory: declaratory && {
      status: declaratory.status,
      label: declaratory.label,
      gloss: declaratory.gloss,
    },
    baselineVerdict: baseline?.verdict,
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
      premises: describePremises(grounded.goal.circumstances),
      verdict: tarjih.verdict,
      confidence: topConfidence,
      contested: tarjih.contested,
      unresolved: tarjih.unresolved,
      truncated: proveResult.truncated,
      groups,
      resolution,
      relatedOpinions,
      declaratory,
      baseline,
      whatIf,
      stats,
      narration,
    },
  };
}
