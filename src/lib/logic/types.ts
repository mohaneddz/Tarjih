/**
 * Core term language for the Tarjih inference engine.
 *
 * This layer is deliberately domain-agnostic: it knows nothing about fiqh,
 * hadith, or evidence grading. It is plain first-order logic over Horn
 * clauses, which keeps it unit-testable in isolation and keeps the juristic
 * vocabulary confined to `src/lib/kb/`.
 */

/** A logic variable. Unifies with anything (subject to the occurs check). */
export interface Var {
  readonly kind: "var";
  /** Variable names are scoped per-clause and are freshened on each use. */
  readonly name: string;
}

/** A nullary constant, e.g. `mother`, `haram`. */
export interface Atom {
  readonly kind: "atom";
  readonly name: string;
}

/** A compound term, e.g. `mistreat(aunt)` or `ratio(harm, kin)`. */
export interface Struct {
  readonly kind: "struct";
  readonly functor: string;
  readonly args: readonly Term[];
}

/** A literal string or number carried through unchanged. Compared by value. */
export interface Lit {
  readonly kind: "lit";
  readonly value: string | number;
}

export type Term = Var | Atom | Struct | Lit;

/**
 * A predicate application. Structurally the same as `Struct`, but kept as a
 * distinct type so the type system stops us from putting a bare term where a
 * goal belongs (a mistake that is otherwise silent and very hard to debug).
 */
export interface Literal {
  readonly predicate: string;
  readonly args: readonly Term[];
}

/**
 * A definite (Horn) clause: `head :- body[0], body[1], ...`.
 * An empty body makes it a fact.
 *
 * `id` is the join key into the evidence store. The prover never looks at
 * evidence itself — it only reports which clause ids participated in a proof,
 * and the tarjih layer resolves those ids to sources and gradings. That
 * separation is what keeps the prover honest: it cannot be swayed by how
 * authoritative a clause claims to be.
 */
export interface Clause {
  readonly id: string;
  readonly head: Literal;
  readonly body: readonly Literal[];
}

/**
 * Variable bindings. Values may themselves contain variables, so reading a
 * binding requires walking the chain — see `walk` / `resolve` in `unify.ts`.
 */
export type Substitution = Map<string, Term>;

/**
 * Records every binding made since a checkpoint so failed unifications can be
 * undone without copying the whole substitution. Backtracking is the inner
 * loop of SLD resolution, so this matters for performance on a large KB.
 */
export type Trail = string[];

/** Predicate name plus arity, e.g. `ruling/2`. The standard indexing key. */
export type PredicateKey = string;

export function predicateKey(predicate: string, arity: number): PredicateKey {
  return `${predicate}/${arity}`;
}

export function literalKey(literal: Literal): PredicateKey {
  return predicateKey(literal.predicate, literal.args.length);
}
