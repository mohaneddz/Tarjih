/**
 * Why a proof failed, read off the search trace.
 *
 * "No derivation" is the least informative answer the engine can give, and
 * the one a reader is least able to act on: it does not say whether the KB
 * has never heard of the act, has rules for it that stalled one fact short,
 * or has a concession that was waiting on a situation nobody stated. Those
 * are different situations with different remedies — add a fact, rephrase
 * the question, state the circumstance — and the trace already knows which
 * one it is.
 *
 * The explanation is built from *leaf failures*: goals where not a single
 * clause head matched, so the search stopped there rather than somewhere
 * below. A goal whose rule matched but whose body failed is not reported
 * itself; its own leaf failures are, which is where the missing piece
 * actually is.
 */

import { isGround, literalToString } from "../logic/term";
import { literalKey } from "../logic/types";
import type { Literal } from "../logic/types";
import type { ProveResult } from "./prover";

export interface FrontierGoal {
  /** The goal as it stood when it failed, e.g. `illah(consume(coffee), _G12)`. */
  readonly goal: string;
  readonly literal: Literal;
  /** Rules whose bodies needed this goal. Empty for a top-level query goal. */
  readonly neededBy: readonly string[];
  /** Shallowest depth it failed at; shallower is closer to the question. */
  readonly depth: number;
}

export interface FailureExplanation {
  /**
   * Leaf failures, excluding the query-supplied ones below, nearest the
   * question first.
   */
  readonly frontier: readonly FrontierGoal[];
  /**
   * Query-supplied premises a rule was waiting on: situations which, had the
   * asker stated them, would have let that rule continue. These are not
   * gaps in the KB — the KB is right not to assume them — so they are kept
   * apart from the frontier and presented as questions back to the asker.
   */
  readonly unmetPremises: readonly FrontierGoal[];
  /** True when the trace hit its event cap, so the explanation may be partial. */
  readonly partial: boolean;
}

/**
 * Strips the renaming suffix the prover gives clause variables, so that
 * `illah(perform(x), _Illa#96)` and `illah(perform(x), _Illa#241)` — the same
 * open goal reached twice — read and group as one, and a reader is not shown
 * internal bookkeeping.
 */
export function displayGoal(rendered: string): string {
  return rendered.replace(/_+([A-Za-z]\w*)#\d+/g, "_$1");
}

export interface ExplainOptions {
  /** Predicate keys whose facts come from the question, e.g. `circumstance/1`. */
  readonly querySupplied?: ReadonlySet<string>;
  /** Cap on frontier entries returned. Default 12. */
  readonly limit?: number;
  /** The trace cap the proof ran with, to detect a truncated trace. Default 5000. */
  readonly maxTraceEvents?: number;
}

/**
 * Explains a proof's dead ends. Requires the proof to have been run with
 * `trace: true`; on an untraced result it returns an empty explanation.
 *
 * Meaningful on a successful proof too: a query that did derive a ruling may
 * still have had a concession stall on an unstated circumstance, and that is
 * exactly the "would this change if…" a reader wants to see.
 */
export function explainFailure(result: ProveResult, options: ExplainOptions = {}): FailureExplanation {
  const { querySupplied = new Set<string>(), limit = 12, maxTraceEvents = 5_000 } = options;

  const byGoal = new Map<string, { literal: Literal; neededBy: Set<string>; depth: number }>();
  for (const event of result.trace) {
    if (event.type !== "fail" || !event.leaf || !event.literal) continue;
    const goal = displayGoal(event.goal);
    const entry = byGoal.get(goal);
    if (entry) {
      if (event.clauseId) entry.neededBy.add(event.clauseId);
      entry.depth = Math.min(entry.depth, event.depth);
    } else {
      byGoal.set(goal, {
        literal: event.literal,
        neededBy: new Set(event.clauseId ? [event.clauseId] : []),
        depth: event.depth,
      });
    }
  }

  const frontier: FrontierGoal[] = [];
  const unmetPremises: FrontierGoal[] = [];
  for (const [goal, { literal, neededBy, depth }] of byGoal) {
    const item: FrontierGoal = { goal, literal, neededBy: [...neededBy].sort(), depth };
    // Only a ground premise is a question back to the asker. An open one
    // (`circumstance(X)`) is a rule asking "is anything at all the case?",
    // which no single answer settles.
    if (querySupplied.has(literalKey(literal)) && literal.args.every(isGround)) {
      unmetPremises.push(item);
    } else {
      frontier.push(item);
    }
  }

  const order = (a: FrontierGoal, b: FrontierGoal) => a.depth - b.depth || a.goal.localeCompare(b.goal);
  return {
    frontier: frontier.sort(order).slice(0, limit),
    unmetPremises: unmetPremises.sort(order),
    partial: result.trace.length >= maxTraceEvents,
  };
}

/** One-line rendering for logs and CLI output. */
export function explanationToString(explanation: FailureExplanation): string {
  const lines = explanation.frontier.map(
    (f) => `  ${literalToString(f.literal)}${f.neededBy.length ? `  (needed by ${f.neededBy.join(", ")})` : ""}`
  );
  const premises = explanation.unmetPremises.map((p) => `  ${p.goal}  (would unlock ${p.neededBy.join(", ")})`);
  return [
    "Stalled on:",
    ...(lines.length ? lines : ["  (nothing — no clause was even attempted)"]),
    ...(premises.length ? ["Waiting on the asker:", ...premises] : []),
    ...(explanation.partial ? ["(trace was capped; this list may be incomplete)"] : []),
  ].join("\n");
}
