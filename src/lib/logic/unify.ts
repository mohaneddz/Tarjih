/**
 * Unification with occurs check and trail-based backtracking.
 *
 * The substitution is mutated in place and every binding is recorded on a
 * trail. Backtracking rewinds the trail to a saved mark rather than copying
 * the substitution, which matters because unification is the inner loop of the
 * prover and a large KB means a lot of failed attempts.
 */

import { isVar, struct } from "./term";
import type { Literal, Substitution, Term, Trail, Var } from "./types";

/**
 * Follows a variable's binding chain one level at a time until reaching an
 * unbound variable or a non-variable term. Shallow by design — `resolve` does
 * the deep version.
 */
export function walk(t: Term, s: Substitution): Term {
  let current = t;
  // Bounded by chain length; cycles are impossible because the occurs check
  // refuses to create them.
  while (current.kind === "var") {
    const bound = s.get(current.name);
    if (bound === undefined) return current;
    current = bound;
  }
  return current;
}

/** Fully applies the substitution, recursively, producing a term with no bound variables left. */
export function resolve(t: Term, s: Substitution): Term {
  const w = walk(t, s);
  if (w.kind === "struct") {
    return struct(w.functor, ...w.args.map((a) => resolve(a, s)));
  }
  return w;
}

export function resolveLiteral(l: Literal, s: Substitution): Literal {
  return { predicate: l.predicate, args: l.args.map((a) => resolve(a, s)) };
}

/**
 * The occurs check: refuses to bind `X` to a term containing `X`, which would
 * create an infinite term (`X = f(X)`).
 *
 * Most Prolog implementations omit this for speed and accept unsoundness.
 * We keep it: a fiqh KB has recursive kinship and derivation rules where a
 * cyclic binding would produce a proof that renders as an infinitely nested
 * tree in the UI, and a wrong ruling is worse than a slow one.
 */
function occurs(name: string, t: Term, s: Substitution): boolean {
  const w = walk(t, s);
  if (w.kind === "var") return w.name === name;
  if (w.kind === "struct") return w.args.some((a) => occurs(name, a, s));
  return false;
}

function bind(variable: Var, value: Term, s: Substitution, trail: Trail): void {
  s.set(variable.name, value);
  trail.push(variable.name);
}

/**
 * Unifies two terms, mutating `s` and appending to `trail`.
 *
 * Returns false on failure. The caller is responsible for rewinding the trail
 * — partial bindings are left in place so callers can batch several
 * unifications behind a single mark (as `unifyLiterals` does).
 */
export function unify(a: Term, b: Term, s: Substitution, trail: Trail): boolean {
  const x = walk(a, s);
  const y = walk(b, s);

  if (isVar(x) && isVar(y)) {
    if (x.name === y.name) return true;
    bind(x, y, s, trail);
    return true;
  }
  if (isVar(x)) {
    if (occurs(x.name, y, s)) return false;
    bind(x, y, s, trail);
    return true;
  }
  if (isVar(y)) {
    if (occurs(y.name, x, s)) return false;
    bind(y, x, s, trail);
    return true;
  }

  if (x.kind === "atom" && y.kind === "atom") return x.name === y.name;
  if (x.kind === "lit" && y.kind === "lit") return x.value === y.value;

  if (x.kind === "struct" && y.kind === "struct") {
    if (x.functor !== y.functor || x.args.length !== y.args.length) return false;
    for (let i = 0; i < x.args.length; i++) {
      if (!unify(x.args[i], y.args[i], s, trail)) return false;
    }
    return true;
  }

  // Mismatched kinds (atom vs struct, lit vs atom, ...) never unify.
  return false;
}

export function unifyLiterals(
  a: Literal,
  b: Literal,
  s: Substitution,
  trail: Trail
): boolean {
  if (a.predicate !== b.predicate || a.args.length !== b.args.length) return false;
  const mark = trail.length;
  for (let i = 0; i < a.args.length; i++) {
    if (!unify(a.args[i], b.args[i], s, trail)) {
      undoTo(mark, s, trail);
      return false;
    }
  }
  return true;
}

/** Saves a backtracking point. */
export function mark(trail: Trail): number {
  return trail.length;
}

/** Removes every binding made since `markPoint`. */
export function undoTo(markPoint: number, s: Substitution, trail: Trail): void {
  while (trail.length > markPoint) {
    const name = trail.pop();
    if (name !== undefined) s.delete(name);
  }
}

/**
 * True when `a` is at least as general as `b` — i.e. `a` subsumes `b` under
 * some substitution of `a`'s variables alone.
 *
 * Used for loop detection: a goal that is subsumed by one of its own ancestors
 * cannot produce anything new, so that branch is cut.
 */
export function subsumes(a: Literal, b: Literal): boolean {
  if (a.predicate !== b.predicate || a.args.length !== b.args.length) return false;
  const bindings = new Map<string, Term>();
  const matchTerm = (pattern: Term, target: Term): boolean => {
    if (pattern.kind === "var") {
      const existing = bindings.get(pattern.name);
      if (existing) return termsIdentical(existing, target);
      bindings.set(pattern.name, target);
      return true;
    }
    if (pattern.kind === "atom") return target.kind === "atom" && pattern.name === target.name;
    if (pattern.kind === "lit") return target.kind === "lit" && pattern.value === target.value;
    if (target.kind !== "struct") return false;
    if (pattern.functor !== target.functor || pattern.args.length !== target.args.length) {
      return false;
    }
    return pattern.args.every((arg, i) => matchTerm(arg, target.args[i]));
  };
  return a.args.every((arg, i) => matchTerm(arg, b.args[i]));
}

function termsIdentical(a: Term, b: Term): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "var" && b.kind === "var") return a.name === b.name;
  if (a.kind === "atom" && b.kind === "atom") return a.name === b.name;
  if (a.kind === "lit" && b.kind === "lit") return a.value === b.value;
  if (a.kind === "struct" && b.kind === "struct") {
    return (
      a.functor === b.functor &&
      a.args.length === b.args.length &&
      a.args.every((arg, i) => termsIdentical(arg, b.args[i]))
    );
  }
  return false;
}
