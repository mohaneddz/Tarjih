/**
 * The Prolog console: a raw query against the knowledge base, with no LLM on
 * either side of it.
 *
 * `/study` hides the formal layer behind a question in English, which is the
 * right default for a reader and the wrong one for whoever is writing or
 * checking the KB. Here the query is typed as a goal, every derivation comes
 * back with its proof, the search trace is shown step by step, and a failed
 * query says where it stalled. It also works without a `GROQ_API_KEY`, so the
 * engine can be exercised when the narration model is rate-limited or absent.
 */

import { explainFailure } from "../engine/explain";
import { prove } from "../engine/prover";
import type { TraceEventType } from "../engine/prover";
import type { LoadedKb } from "../kb/entry";
import { findCircumstance } from "../kb/lexicon";
import { QUERY_SUPPLIED_PREDICATES } from "../kb/ontology";
import { withPremises } from "../kb/premises";
import { parseQuery, ParseError } from "../logic/parse";
import { atom, literalToString, termToString } from "../logic/term";
import type { Literal } from "../logic/types";
import { AHKAM_AXIS, VALIDITY_AXIS, weighRuling } from "../tarjih/weigh";
import type { OutcomeAxis } from "../tarjih/weigh";
import { humanizeLiteral } from "./humanize";
import { presentProof, presentStep } from "./present";
import type { ProofView, TarjihStepView } from "./present";

export interface ConsoleRequest {
  readonly query: string;
  /** Circumstance atoms to assume for this query, from the lexicon only. */
  readonly circumstances?: readonly string[];
  readonly maxSolutions?: number;
}

export interface ConsoleSolution {
  /** Query variables only; internal and anonymous variables are left out. */
  readonly bindings: Readonly<Record<string, string>>;
  readonly proofs: readonly ProofView[];
  readonly depth: number;
}

export interface ConsoleTraceEvent {
  readonly type: TraceEventType;
  readonly depth: number;
  readonly goal: string;
  readonly clauseId?: string;
}

export interface ConsoleWeighing {
  readonly axis: string;
  readonly verdict?: string;
  readonly contested: boolean;
  readonly unresolved: boolean;
  readonly groups: readonly {
    readonly outcome: string;
    readonly confidence: number;
    readonly derivationCount: number;
    readonly independentLines: number;
  }[];
  readonly resolution: readonly TarjihStepView[];
}

export interface ConsoleResult {
  readonly ok: true;
  readonly goals: string;
  readonly premises: readonly string[];
  readonly solutions: readonly ConsoleSolution[];
  readonly stats: {
    readonly steps: number;
    readonly loopCuts: number;
    readonly instantiationFaults: number;
    readonly truncated: boolean;
    readonly truncationReason?: string;
    readonly elapsedMs: number;
  };
  readonly explanation: {
    readonly frontier: readonly { goal: string; goalHuman: string; neededBy: readonly string[] }[];
    readonly unmetPremises: readonly { goal: string; neededBy: readonly string[] }[];
    readonly partial: boolean;
  };
  /** The first events of the search, capped; `traceTotal` says how many there were. */
  readonly trace: readonly ConsoleTraceEvent[];
  readonly traceTotal: number;
  /** Present when the query is a single `ruling/2` or `validity/2` goal with an open outcome. */
  readonly weighing?: ConsoleWeighing;
}

export interface ConsoleError {
  readonly ok: false;
  readonly error: {
    readonly kind: "parse" | "circumstance" | "empty";
    readonly message: string;
    readonly line?: number;
    readonly column?: number;
  };
}

const MAX_TRACE_EVENTS = 20_000;
const TRACE_SHOWN = 800;
const MAX_SOLUTIONS_CAP = 500;

/** Picks the weighing axis for a query, if it has the shape of a ruling question. */
function axisFor(goals: readonly Literal[]): OutcomeAxis<string> | undefined {
  if (goals.length !== 1) return undefined;
  const [goal] = goals;
  const outcome = goal.args[1];
  if (goal.args.length !== 2 || outcome?.kind !== "var") return undefined;
  const base =
    goal.predicate === "ruling"
      ? (AHKAM_AXIS as unknown as OutcomeAxis<string>)
      : goal.predicate === "validity"
        ? (VALIDITY_AXIS as unknown as OutcomeAxis<string>)
        : undefined;
  return base && { ...base, variable: outcome.name };
}

export function runConsoleQuery(request: ConsoleRequest, kb: LoadedKb): ConsoleResult | ConsoleError {
  const source = request.query.trim();
  if (!source) return { ok: false, error: { kind: "empty", message: "Type a goal to prove, e.g. ruling(consume(khamr), H)." } };

  let goals: readonly Literal[];
  try {
    goals = parseQuery(source);
  } catch (e) {
    if (e instanceof ParseError) {
      return { ok: false, error: { kind: "parse", message: e.message, line: e.line, column: e.column } };
    }
    throw e;
  }

  const premiseAtoms = [...new Set(request.circumstances ?? [])];
  const unknown = premiseAtoms.find((c) => !findCircumstance(c));
  if (unknown) {
    return {
      ok: false,
      error: {
        kind: "circumstance",
        message: `"${unknown}" is not a circumstance the lexicon defines, so it cannot be assumed.`,
      },
    };
  }
  const premises: Literal[] = premiseAtoms.map((c) => ({ predicate: "circumstance", args: [atom(c)] }));

  const maxSolutions = Math.min(Math.max(1, request.maxSolutions ?? 100), MAX_SOLUTIONS_CAP);
  const scoped = withPremises(kb, premises);
  const started = Date.now();
  const result = prove(goals, scoped.kb, { maxSolutions, trace: true, maxTraceEvents: MAX_TRACE_EVENTS });
  const elapsedMs = Date.now() - started;

  const explanation = explainFailure(result, {
    querySupplied: QUERY_SUPPLIED_PREDICATES,
    maxTraceEvents: MAX_TRACE_EVENTS,
  });
  const cite = (ids: readonly string[]) => ids.map((id) => `${id} — ${scoped.evidence.getOrUnknown(id).reference}`);

  const axis = axisFor(goals);
  const weighed = axis ? weighRuling(result, scoped.evidence, axis) : undefined;

  return {
    ok: true,
    goals: goals.map(literalToString).join(", "),
    premises: premises.map(literalToString),
    solutions: result.solutions.map((s) => ({
      bindings: Object.fromEntries(
        Object.entries(s.bindings)
          .filter(([name]) => !name.startsWith("_"))
          .map(([name, term]) => [name, termToString(term)])
      ),
      proofs: s.proofs.map((p) => presentProof(p, scoped.evidence)),
      depth: s.depth,
    })),
    stats: {
      steps: result.steps,
      loopCuts: result.loopCuts,
      instantiationFaults: result.instantiationFaults,
      truncated: result.truncated,
      truncationReason: result.truncationReason,
      elapsedMs,
    },
    explanation: {
      frontier: explanation.frontier.map((f) => ({
        goal: f.goal,
        goalHuman: humanizeLiteral(f.literal),
        neededBy: cite(f.neededBy),
      })),
      unmetPremises: explanation.unmetPremises.map((p) => ({ goal: p.goal, neededBy: cite(p.neededBy) })),
      partial: explanation.partial,
    },
    trace: result.trace.slice(0, TRACE_SHOWN).map(({ type, depth, goal, clauseId }) => ({ type, depth, goal, clauseId })),
    traceTotal: result.trace.length,
    weighing:
      axis && weighed
        ? {
            axis: axis.id,
            verdict: weighed.verdict,
            contested: weighed.contested,
            unresolved: weighed.unresolved,
            groups: weighed.groups.map((g) => ({
              outcome: g.outcome,
              confidence: g.confidence,
              derivationCount: g.derivations.length,
              independentLines: g.independentLines,
            })),
            resolution: weighed.resolution.map(presentStep),
          }
        : undefined,
  };
}
