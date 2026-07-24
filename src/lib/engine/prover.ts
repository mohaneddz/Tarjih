/**
 * SLD resolution: backward chaining over Horn clauses, with full proof capture.
 *
 * The search finds *every* derivation of the query, not the first one. That is
 * the whole point for this application — a fiqh question typically has several
 * independent supporting evidences, and sometimes contradictory ones. Those
 * competing derivations are the raw material the tarjih layer weighs, so
 * stopping at the first proof (as a plain Prolog would) would throw away
 * exactly the information the product exists to present.
 */

import { renameClause } from "../logic/term";
import { collectLiteralVars } from "../logic/term";
import { isVariant, mark, resolve, resolveLiteral, undoTo, unifyLiterals } from "../logic/unify";
import { literalToString } from "../logic/term";
import type { Literal, Substitution, Term, Trail } from "../logic/types";
import type { KnowledgeBase } from "./kb";

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

/**
 * One node of a derivation: a goal, the clause that discharged it, and the
 * sub-derivations of that clause's body goals. Leaves are facts (no children).
 */
export interface ProofNode {
  /** Fully instantiated at materialisation time. */
  readonly goal: Literal;
  /** Which clause fired. Join key into the evidence store. */
  readonly clauseId: string;
  readonly children: readonly ProofNode[];
  readonly depth: number;
}

export interface Solution {
  /** The query goals, fully instantiated by this derivation. */
  readonly goals: readonly Literal[];
  /** One proof tree per query goal. */
  readonly proofs: readonly ProofNode[];
  /** Bindings for the variables the caller asked about. */
  readonly bindings: Readonly<Record<string, Term>>;
  /** Every clause id used anywhere in the derivation, deduplicated. */
  readonly clauseIds: readonly string[];
  /** Deepest node in this derivation. */
  readonly depth: number;
}

export type TraceEventType =
  | "call"
  | "exit"
  | "fail"
  | "unify-fail"
  | "depth-cut"
  | "loop-cut"
  | "budget-cut";

/** One step of the search, for the Resolution Trace view. */
export interface TraceEvent {
  readonly type: TraceEventType;
  readonly depth: number;
  readonly goal: string;
  readonly clauseId?: string;
}

export interface ProveResult {
  readonly solutions: readonly Solution[];
  /** Resolution steps performed (clause-head unification attempts). */
  readonly steps: number;
  /**
   * True when a budget stopped the search, meaning there may be further
   * derivations we never saw. The UI must not present results as exhaustive
   * when this is set — an unreported missing counter-evidence would be a
   * serious misrepresentation in a juristic tool.
   */
  readonly truncated: boolean;
  readonly truncationReason?: "steps" | "depth" | "solutions" | "time";
  /**
   * Branches abandoned because the goal repeated an ancestor. Sound for real
   * loops, but for a self-generating predicate it does mean unexplored
   * derivations, so it is reported rather than swallowed.
   */
  readonly loopCuts: number;
  readonly trace: readonly TraceEvent[];
}

export interface ProveOptions {
  /** Max derivations to collect. Default 64. */
  maxSolutions?: number;
  /** Max derivation depth. Default 24. */
  maxDepth?: number;
  /** Max resolution steps. Default 250_000. */
  maxSteps?: number;
  /** Wall-clock budget in ms. Default 10_000. */
  timeBudgetMs?: number;
  /** Record a step-by-step trace. Off by default; it is not free. */
  trace?: boolean;
  /** Cap on recorded trace events. Default 5_000. */
  maxTraceEvents?: number;
}

// ---------------------------------------------------------------------------
// Search state
// ---------------------------------------------------------------------------

/** Raw proof node during search; goal args still reference live variables. */
interface RawProofNode {
  goal: Literal;
  clauseId: string;
  children: RawProofNode[];
  depth: number;
}

interface SearchState {
  readonly kb: KnowledgeBase;
  readonly subst: Substitution;
  readonly trail: Trail;
  steps: number;
  loopCuts: number;
  readonly maxSteps: number;
  readonly maxDepth: number;
  readonly deadline: number;
  truncated: boolean;
  truncationReason?: "steps" | "depth" | "solutions" | "time";
  readonly trace: TraceEvent[] | null;
  readonly maxTraceEvents: number;
}

function record(state: SearchState, event: TraceEvent): void {
  if (state.trace && state.trace.length < state.maxTraceEvents) {
    state.trace.push(event);
  }
}

function overBudget(state: SearchState): boolean {
  if (state.steps >= state.maxSteps) {
    state.truncated = true;
    state.truncationReason ??= "steps";
    return true;
  }
  // Checking the clock every step would dominate the inner loop, so sample it.
  if ((state.steps & 0x3ff) === 0 && Date.now() > state.deadline) {
    state.truncated = true;
    state.truncationReason ??= "time";
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Core search
// ---------------------------------------------------------------------------

/**
 * Proves a conjunction of goals left to right, yielding once per combination
 * of sub-derivations.
 *
 * Bindings made for a yielded solution stay live only until the consumer asks
 * for the next one, so the top-level driver materialises each solution the
 * moment it arrives.
 */
function* proveConjunction(
  goals: readonly Literal[],
  index: number,
  state: SearchState,
  ancestors: readonly Literal[],
  depth: number
): Generator<RawProofNode[]> {
  if (index >= goals.length) {
    yield [];
    return;
  }

  for (const head of proveGoal(goals[index], state, ancestors, depth)) {
    for (const rest of proveConjunction(goals, index + 1, state, ancestors, depth)) {
      yield [head, ...rest];
    }
    if (overBudget(state)) return;
  }
}

/** Proves a single goal, yielding one proof node per successful derivation. */
function* proveGoal(
  goal: Literal,
  state: SearchState,
  ancestors: readonly Literal[],
  depth: number
): Generator<RawProofNode> {
  if (depth >= state.maxDepth) {
    state.truncated = true;
    state.truncationReason ??= "depth";
    record(state, { type: "depth-cut", depth, goal: literalToString(goal) });
    return;
  }
  if (overBudget(state)) {
    record(state, { type: "budget-cut", depth, goal: literalToString(goal) });
    return;
  }

  const current = resolveLiteral(goal, state.subst);
  const rendered = state.trace ? literalToString(current) : "";

  /*
   * Loop check. A goal that is a variant of one of its own ancestors is a
   * genuine repeat, so the branch is cut. Without this, a symmetric rule such
   * as
   *   sibling(X, Y) :- sibling(Y, X).
   * — entirely natural to write in a kinship KB — would recurse until the
   * depth budget, spending it on nothing.
   *
   * The test is variant, not subsumption: see `isVariant`. Cutting on
   * subsumption would prune real derivations of any goal posed with an
   * unbound argument, which is most of them.
   */
  for (const a of ancestors) {
    if (isVariant(a, current)) {
      state.loopCuts++;
      record(state, { type: "loop-cut", depth, goal: rendered });
      return;
    }
  }

  record(state, { type: "call", depth, goal: rendered });

  const nextAncestors = [...ancestors, current];
  let succeeded = false;

  for (const clause of state.kb.clausesFor(current)) {
    if (overBudget(state)) {
      record(state, { type: "budget-cut", depth, goal: rendered });
      return;
    }

    state.steps++;
    const checkpoint = mark(state.trail);
    const renamed = renameClause(clause);

    if (!unifyLiterals(current, renamed.head, state.subst, state.trail)) {
      record(state, { type: "unify-fail", depth, goal: rendered, clauseId: clause.id });
      undoTo(checkpoint, state.subst, state.trail);
      continue;
    }

    for (const children of proveConjunction(renamed.body, 0, state, nextAncestors, depth + 1)) {
      succeeded = true;
      record(state, { type: "exit", depth, goal: rendered, clauseId: clause.id });
      yield { goal: current, clauseId: clause.id, children, depth };
    }

    // Rewind before trying the next clause so alternatives start clean.
    undoTo(checkpoint, state.subst, state.trail);
  }

  if (!succeeded) {
    record(state, { type: "fail", depth, goal: rendered });
  }
}

// ---------------------------------------------------------------------------
// Materialisation
// ---------------------------------------------------------------------------

function materialise(node: RawProofNode, subst: Substitution): ProofNode {
  return {
    goal: resolveLiteral(node.goal, subst),
    clauseId: node.clauseId,
    children: node.children.map((c) => materialise(c, subst)),
    depth: node.depth,
  };
}

function collectClauseIds(node: ProofNode, into: Set<string>): Set<string> {
  into.add(node.clauseId);
  for (const c of node.children) collectClauseIds(c, into);
  return into;
}

function maxDepthOf(node: ProofNode): number {
  return node.children.reduce((acc, c) => Math.max(acc, maxDepthOf(c)), node.depth);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Proves `goals` against `kb`, collecting up to `maxSolutions` derivations.
 *
 * Every derivation is returned, including several that reach the same
 * conclusion by different routes — that redundancy is meaningful here, since
 * independent corroboration strengthens a ruling under tarjih.
 */
export function prove(
  goals: readonly Literal[],
  kb: KnowledgeBase,
  options: ProveOptions = {}
): ProveResult {
  const {
    maxSolutions = 64,
    maxDepth = 24,
    maxSteps = 250_000,
    timeBudgetMs = 10_000,
    trace = false,
    maxTraceEvents = 5_000,
  } = options;

  const state: SearchState = {
    kb,
    subst: new Map(),
    trail: [],
    steps: 0,
    loopCuts: 0,
    maxSteps,
    maxDepth,
    deadline: Date.now() + timeBudgetMs,
    truncated: false,
    trace: trace ? [] : null,
    maxTraceEvents,
  };

  // The variables the caller cares about are those written in the query.
  const queryVars = new Set<string>();
  for (const g of goals) collectLiteralVars(g, queryVars);

  const solutions: Solution[] = [];

  for (const rawProofs of proveConjunction(goals, 0, state, [], 0)) {
    // Materialise immediately: these bindings are unwound on the next request.
    const proofs = rawProofs.map((p) => materialise(p, state.subst));

    const bindings: Record<string, Term> = {};
    for (const name of queryVars) {
      bindings[name] = resolve({ kind: "var", name }, state.subst);
    }

    const clauseIds = new Set<string>();
    for (const p of proofs) collectClauseIds(p, clauseIds);

    solutions.push({
      goals: goals.map((g) => resolveLiteral(g, state.subst)),
      proofs,
      bindings,
      clauseIds: [...clauseIds],
      depth: proofs.reduce((acc, p) => Math.max(acc, maxDepthOf(p)), 0),
    });

    if (solutions.length >= maxSolutions) {
      state.truncated = true;
      state.truncationReason ??= "solutions";
      break;
    }
  }

  return {
    solutions,
    steps: state.steps,
    truncated: state.truncated,
    truncationReason: state.truncationReason,
    loopCuts: state.loopCuts,
    trace: state.trace ?? [],
  };
}

/** Convenience for yes/no checks and tests. */
export function provable(
  goals: readonly Literal[],
  kb: KnowledgeBase,
  options: ProveOptions = {}
): boolean {
  return prove(goals, kb, { ...options, maxSolutions: 1 }).solutions.length > 0;
}

/** Renders a proof tree as indented text. For debugging and CLI output. */
export function proofToString(node: ProofNode, indent = 0): string {
  const pad = "  ".repeat(indent);
  const line = `${pad}${literalToString(node.goal)}  [${node.clauseId}]`;
  if (node.children.length === 0) return line;
  return [line, ...node.children.map((c) => proofToString(c, indent + 1))].join("\n");
}
