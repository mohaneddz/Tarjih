/**
 * Built-in predicates: goals the prover decides by computation rather than by
 * looking up clauses.
 *
 * Kept to the smallest set a fiqh KB actually needs — disequality and numeric
 * comparison — and every one of them is *fail-closed*. A Prolog builtin called
 * with an argument it cannot decide yet either throws or, worse, quietly
 * answers as though the unbound variable were some particular value. Neither
 * is acceptable here:
 *
 * - Throwing would abort a whole query over one badly ordered rule body.
 * - Guessing is unsound. `\=(X, mother)` with X unbound is false in standard
 *   Prolog — X *could* be mother — so a rule reading "a relative other than the
 *   mother" would silently never fire, and nothing would say why.
 *
 * So an undecidable call fails *and is counted*. The prover reports the count
 * as `instantiationFaults`, the trace records which goal it was, and the KB
 * linter's `unsafe-builtin` check catches the usual cause — a builtin placed
 * before the body goal that binds its variables — at load time, before any
 * query runs.
 *
 * Builtins never bind variables. That keeps them deterministic (zero or one
 * answer, no choicepoints) and means a proof tree can show them as checked
 * conditions rather than as steps that produced anything.
 */

import { isGround } from "../logic/term";
import { resolve, undoTo, unify } from "../logic/unify";
import { predicateKey } from "../logic/types";
import type { Literal, PredicateKey, Substitution, Term, Trail } from "../logic/types";

/** Outcome of running a builtin: decided, or not decidable with the bindings available. */
export type BuiltinOutcome = "true" | "false" | "instantiation";

export interface BuiltinSpec {
  readonly name: string;
  readonly arity: number;
  readonly args: readonly string[];
  readonly meaning: string;
  readonly example: string;
  run(args: readonly Term[], subst: Substitution): BuiltinOutcome;
}

/** Clause ids for builtin steps in a proof all carry this prefix. */
export const BUILTIN_ID_PREFIX = "builtin:";

export function isBuiltinClauseId(clauseId: string): boolean {
  return clauseId.startsWith(BUILTIN_ID_PREFIX);
}

export function builtinClauseId(spec: Pick<BuiltinSpec, "name" | "arity">): string {
  return `${BUILTIN_ID_PREFIX}${predicateKey(spec.name, spec.arity)}`;
}

/**
 * Sound disequality without coroutining.
 *
 * Two terms that cannot unify under any bindings are certainly different —
 * `f(X)` and `g(Y)` — so that is decided even when they are not ground. Two
 * that are already identical are certainly equal. Only the middle case, where
 * the answer depends on how a variable is later bound, is undecidable, and it
 * fails closed.
 */
function dif(args: readonly Term[], subst: Substitution): BuiltinOutcome {
  const trail: Trail = [];
  const unifiable = unify(args[0], args[1], subst, trail);
  const boundSomething = trail.length > 0;
  undoTo(0, subst, trail);
  if (!unifiable) return "true";
  if (!boundSomething) return "false";
  return "instantiation";
}

function numeric(
  compare: (a: number, b: number) => boolean
): (args: readonly Term[], subst: Substitution) => BuiltinOutcome {
  return (args, subst) => {
    const a = resolve(args[0], subst);
    const b = resolve(args[1], subst);
    if (!isGround(a) || !isGround(b)) return "instantiation";
    // A non-number compared numerically is a type error in the rule, not an
    // open question: it can never become true, so it is plainly false.
    if (a.kind !== "lit" || b.kind !== "lit") return "false";
    if (typeof a.value !== "number" || typeof b.value !== "number") return "false";
    return compare(a.value, b.value) ? "true" : "false";
  };
}

export const BUILTINS: readonly BuiltinSpec[] = [
  {
    name: "dif",
    arity: 2,
    args: ["A", "B"],
    meaning:
      "A and B are different terms. Decided only when the answer cannot change " +
      "under later bindings; otherwise the goal fails and is reported.",
    example: "dif(New, Asl)",
    run: dif,
  },
  {
    name: "gt",
    arity: 2,
    args: ["A", "B"],
    meaning: "Number A is greater than number B. Both must be bound.",
    example: "gt(Km, 80)",
    run: numeric((a, b) => a > b),
  },
  {
    name: "ge",
    arity: 2,
    args: ["A", "B"],
    meaning: "Number A is greater than or equal to number B. Both must be bound.",
    example: "ge(Km, 80)",
    run: numeric((a, b) => a >= b),
  },
  {
    name: "lt",
    arity: 2,
    args: ["A", "B"],
    meaning: "Number A is less than number B. Both must be bound.",
    example: "lt(Days, 4)",
    run: numeric((a, b) => a < b),
  },
  {
    name: "le",
    arity: 2,
    args: ["A", "B"],
    meaning: "Number A is less than or equal to number B. Both must be bound.",
    example: "le(Days, 15)",
    run: numeric((a, b) => a <= b),
  },
];

const BY_KEY = new Map<PredicateKey, BuiltinSpec>(BUILTINS.map((b) => [predicateKey(b.name, b.arity), b]));

export function lookupBuiltin(literal: Pick<Literal, "predicate" | "args">): BuiltinSpec | undefined {
  return BY_KEY.get(predicateKey(literal.predicate, literal.args.length));
}

export function isBuiltinKey(key: PredicateKey): boolean {
  return BY_KEY.has(key);
}
