/**
 * Term constructors, traversal, and rendering.
 */

import type { Atom, Clause, Lit, Literal, Struct, Term, Var } from "./types";

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

export function v(name: string): Var {
  return { kind: "var", name };
}

export function atom(name: string): Atom {
  return { kind: "atom", name };
}

export function struct(functor: string, ...args: Term[]): Struct {
  return { kind: "struct", functor, args };
}

export function lit(value: string | number): Lit {
  return { kind: "lit", value };
}

export function goal(predicate: string, ...args: Term[]): Literal {
  return { predicate, args };
}

export function fact(id: string, head: Literal): Clause {
  return { id, head, body: [] };
}

export function rule(id: string, head: Literal, body: Literal[]): Clause {
  return { id, head, body };
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export const isVar = (t: Term): t is Var => t.kind === "var";
export const isAtom = (t: Term): t is Atom => t.kind === "atom";
export const isStruct = (t: Term): t is Struct => t.kind === "struct";
export const isLit = (t: Term): t is Lit => t.kind === "lit";

/** True when the term contains no variables at any depth. */
export function isGround(t: Term): boolean {
  switch (t.kind) {
    case "var":
      return false;
    case "atom":
    case "lit":
      return true;
    case "struct":
      return t.args.every(isGround);
  }
}

export function isGroundLiteral(l: Literal): boolean {
  return l.args.every(isGround);
}

// ---------------------------------------------------------------------------
// Variable collection
// ---------------------------------------------------------------------------

export function collectVars(t: Term, into: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case "var":
      into.add(t.name);
      break;
    case "struct":
      for (const arg of t.args) collectVars(arg, into);
      break;
  }
  return into;
}

export function collectLiteralVars(l: Literal, into: Set<string> = new Set()): Set<string> {
  for (const arg of l.args) collectVars(arg, into);
  return into;
}

export function collectClauseVars(c: Clause): Set<string> {
  const vars = collectLiteralVars(c.head);
  for (const b of c.body) collectLiteralVars(b, vars);
  return vars;
}

// ---------------------------------------------------------------------------
// Renaming (standardising apart)
// ---------------------------------------------------------------------------

let renameCounter = 0;

/** Test hook. Production code should never need to reset the counter. */
export function resetRenameCounter(): void {
  renameCounter = 0;
}

function renameTerm(t: Term, mapping: Map<string, Var>): Term {
  switch (t.kind) {
    case "var": {
      let fresh = mapping.get(t.name);
      if (!fresh) {
        fresh = v(`_${t.name}#${renameCounter++}`);
        mapping.set(t.name, fresh);
      }
      return fresh;
    }
    case "struct":
      return struct(t.functor, ...t.args.map((a) => renameTerm(a, mapping)));
    default:
      return t;
  }
}

function renameLiteral(l: Literal, mapping: Map<string, Var>): Literal {
  return { predicate: l.predicate, args: l.args.map((a) => renameTerm(a, mapping)) };
}

/**
 * Returns a copy of the clause with every variable replaced by a fresh one.
 *
 * Without this, reusing a clause twice in one proof would alias its variables
 * across both uses and silently over-constrain the search — the classic
 * "standardise apart" requirement of resolution.
 */
export function renameClause(c: Clause): Clause {
  const mapping = new Map<string, Var>();
  return {
    id: c.id,
    head: renameLiteral(c.head, mapping),
    body: c.body.map((b) => renameLiteral(b, mapping)),
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Atoms needing quotes in source form: anything not `[a-z][A-Za-z0-9_]*`. */
const PLAIN_ATOM = /^[a-z][A-Za-z0-9_]*$/;

function formatAtomName(name: string): string {
  return PLAIN_ATOM.test(name) ? name : `'${name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

export function termToString(t: Term): string {
  switch (t.kind) {
    case "var":
      return t.name;
    case "atom":
      return formatAtomName(t.name);
    case "lit":
      return typeof t.value === "number"
        ? String(t.value)
        : `"${t.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    case "struct":
      return `${formatAtomName(t.functor)}(${t.args.map(termToString).join(", ")})`;
  }
}

export function literalToString(l: Literal): string {
  if (l.args.length === 0) return formatAtomName(l.predicate);
  return `${formatAtomName(l.predicate)}(${l.args.map(termToString).join(", ")})`;
}

export function clauseToString(c: Clause): string {
  const head = literalToString(c.head);
  if (c.body.length === 0) return `${head}.`;
  return `${head} :-\n    ${c.body.map(literalToString).join(",\n    ")}.`;
}

// ---------------------------------------------------------------------------
// Structural equality
// ---------------------------------------------------------------------------

export function termsEqual(a: Term, b: Term): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "var":
      return a.name === (b as Var).name;
    case "atom":
      return a.name === (b as Atom).name;
    case "lit":
      return a.value === (b as Lit).value;
    case "struct": {
      const s = b as Struct;
      return (
        a.functor === s.functor &&
        a.args.length === s.args.length &&
        a.args.every((arg, i) => termsEqual(arg, s.args[i]))
      );
    }
  }
}

export function literalsEqual(a: Literal, b: Literal): boolean {
  return (
    a.predicate === b.predicate &&
    a.args.length === b.args.length &&
    a.args.every((arg, i) => termsEqual(arg, b.args[i]))
  );
}
