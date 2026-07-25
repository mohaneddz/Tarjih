/**
 * Turns the NL-parsing stage's raw text output into a validated goal the
 * prover can run.
 *
 * This is the one place an LLM's output is allowed to shape what gets proved,
 * so it is deliberately the most defensive code in the pipeline. Two
 * failure modes matter and are kept distinct:
 *
 * - A term the LLM invented (`camel_meat`, a typo, a synonym not in the
 *   lexicon) must be rejected with a specific "I don't have this term"
 *   error. If it were let through, the prover would just find zero
 *   derivations, which is indistinguishable from a real "the KB has no rule
 *   for this act" answer — a silent conflation between "unknown" and
 *   "known and unregulated" that would misrepresent the KB's actual
 *   coverage.
 * - Anything the prover itself decides (which clauses fire, what the
 *   verdict is) is completely out of this module's hands. It only builds
 *   the question; it never answers it.
 */

import { isVar, v } from "../logic/term";
import { parseQuery, ParseError } from "../logic/parse";
import type { Literal, Term } from "../logic/types";
import { findAct, findAtom } from "../kb/lexicon";

export type GoalError =
  | { readonly kind: "parse-error"; readonly message: string }
  | { readonly kind: "unsupported-shape"; readonly message: string }
  | { readonly kind: "unknown-term"; readonly term: string; readonly message: string };

export interface GroundedGoal {
  /** Always `ruling(<Act>, H)` with the ruling variable canonically named H. */
  readonly literal: Literal;
  readonly act: Term;
}

export type GoalResult = { readonly ok: true; readonly goal: GroundedGoal } | { readonly ok: false; readonly error: GoalError };

function ok(goal: GroundedGoal): GoalResult {
  return { ok: true, goal };
}
function fail(error: GoalError): GoalResult {
  return { ok: false, error };
}

/** Every atom appearing anywhere in a term must be in the lexicon. */
function checkTermGrounded(term: Term): GoalError | undefined {
  if (term.kind === "atom") {
    if (!findAtom(term.name)) {
      return {
        kind: "unknown-term",
        term: term.name,
        message: `"${term.name}" is not a term the knowledge base has an entry for yet.`,
      };
    }
    return undefined;
  }
  if (term.kind === "struct") {
    if (!findAct(term.functor, term.args.length)) {
      return {
        kind: "unknown-term",
        term: `${term.functor}/${term.args.length}`,
        message: `"${term.functor}" (with ${term.args.length} argument${term.args.length === 1 ? "" : "s"}) is not an act the knowledge base recognises.`,
      };
    }
    for (const arg of term.args) {
      const err = checkTermGrounded(arg);
      if (err) return err;
    }
    return undefined;
  }
  // A bare Lit (string/number) can never be a grounded fiqh term in this KB.
  return {
    kind: "unknown-term",
    term: String(term.kind === "lit" ? term.value : term),
    message: "the question must resolve to a known act over known entities, not a raw literal.",
  };
}

/**
 * Parses and validates the NL-parsing stage's raw output.
 *
 * Required shape: a single goal `ruling(<Act>, <AnyVar>)` where `<Act>` is
 * built entirely from acts and atoms in the lexicon. The ruling variable is
 * renamed to the canonical `H` regardless of what the model called it, since
 * every downstream consumer (`weighRuling`) depends on that name rather than
 * trusting the model to use it consistently.
 */
export function groundGoal(rawText: string): GoalResult {
  const trimmed = rawText.trim();

  let goals;
  try {
    goals = parseQuery(trimmed, "llm-goal");
  } catch (e) {
    return fail({
      kind: "parse-error",
      message: e instanceof ParseError ? e.message : String(e),
    });
  }

  if (goals.length !== 1) {
    return fail({
      kind: "unsupported-shape",
      message: `expected exactly one goal, got ${goals.length}.`,
    });
  }

  const [literal] = goals;
  if (literal.predicate !== "ruling" || literal.args.length !== 2) {
    return fail({
      kind: "unsupported-shape",
      message: `expected ruling(Act, H), got ${literal.predicate}/${literal.args.length}.`,
    });
  }

  const [act, rulingVar] = literal.args;
  if (!isVar(rulingVar)) {
    return fail({
      kind: "unsupported-shape",
      message: "the second argument of ruling/2 must be a variable, e.g. H.",
    });
  }

  const groundingError = checkTermGrounded(act);
  if (groundingError) return fail(groundingError);

  const canonical: Literal = { predicate: "ruling", args: [act, v("H")] };
  return ok({ literal: canonical, act });
}
