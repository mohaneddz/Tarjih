import { describe, expect, it } from "vitest";

import { parseClause, parseProgram, parseQuery, parseTerm, ParseError } from "./parse";
import {
  atom,
  clauseToString,
  collectClauseVars,
  goal,
  isGround,
  isStruct,
  isVar,
  literalToString,
  literalsEqual,
  renameClause,
  struct,
  termToString,
  v,
} from "./term";
import { mark, resolve, resolveLiteral, subsumes, undoTo, unify, unifyLiterals, walk } from "./unify";
import type { Substitution, Trail } from "./types";

function freshState(): { s: Substitution; trail: Trail } {
  return { s: new Map(), trail: [] };
}

describe("unification", () => {
  it("binds a variable to an atom", () => {
    const { s, trail } = freshState();
    expect(unify(v("X"), atom("mother"), s, trail)).toBe(true);
    expect(walk(v("X"), s)).toEqual(atom("mother"));
  });

  it("unifies two variables and propagates a later binding through the chain", () => {
    const { s, trail } = freshState();
    expect(unify(v("X"), v("Y"), s, trail)).toBe(true);
    expect(unify(v("Y"), atom("aunt"), s, trail)).toBe(true);
    expect(walk(v("X"), s)).toEqual(atom("aunt"));
  });

  it("unifies structures recursively", () => {
    const { s, trail } = freshState();
    const a = struct("kin", v("X"), atom("ego"));
    const b = struct("kin", atom("mother"), v("Y"));
    expect(unify(a, b, s, trail)).toBe(true);
    expect(walk(v("X"), s)).toEqual(atom("mother"));
    expect(walk(v("Y"), s)).toEqual(atom("ego"));
  });

  it("fails on functor mismatch", () => {
    const { s, trail } = freshState();
    expect(unify(struct("kin", atom("a")), struct("owns", atom("a")), s, trail)).toBe(false);
  });

  it("fails on arity mismatch", () => {
    const { s, trail } = freshState();
    expect(unify(struct("kin", atom("a")), struct("kin", atom("a"), atom("b")), s, trail)).toBe(
      false
    );
  });

  it("fails on differing atoms", () => {
    const { s, trail } = freshState();
    expect(unify(atom("haram"), atom("halal"), s, trail)).toBe(false);
  });

  it("never unifies across kinds", () => {
    const { s, trail } = freshState();
    expect(unify(atom("x"), struct("x", atom("y")), s, trail)).toBe(false);
  });

  describe("occurs check", () => {
    it("refuses X = f(X)", () => {
      const { s, trail } = freshState();
      expect(unify(v("X"), struct("f", v("X")), s, trail)).toBe(false);
    });

    it("refuses the cycle through an intermediate binding", () => {
      const { s, trail } = freshState();
      expect(unify(v("X"), v("Y"), s, trail)).toBe(true);
      expect(unify(v("Y"), struct("f", v("X")), s, trail)).toBe(false);
    });

    it("allows a nested binding that does not create a cycle", () => {
      const { s, trail } = freshState();
      expect(unify(v("X"), struct("f", v("Y")), s, trail)).toBe(true);
      expect(isGround(resolve(v("X"), s))).toBe(false);
    });
  });

  describe("trail backtracking", () => {
    it("undoes every binding made since the mark", () => {
      const { s, trail } = freshState();
      unify(v("A"), atom("keep"), s, trail);
      const m = mark(trail);
      unify(v("B"), atom("discard"), s, trail);
      unify(v("C"), atom("discard"), s, trail);
      expect(s.size).toBe(3);

      undoTo(m, s, trail);

      expect(s.size).toBe(1);
      expect(walk(v("A"), s)).toEqual(atom("keep"));
      expect(walk(v("B"), s)).toEqual(v("B"));
    });

    it("leaves no partial bindings behind when literal unification fails midway", () => {
      const { s, trail } = freshState();
      // First arg unifies, second does not; X must not stay bound.
      const ok = unifyLiterals(
        goal("ruling", v("X"), atom("haram")),
        goal("ruling", atom("riba"), atom("halal")),
        s,
        trail
      );
      expect(ok).toBe(false);
      expect(s.size).toBe(0);
      expect(trail.length).toBe(0);
    });
  });

  it("resolves deeply through nested structures", () => {
    const { s, trail } = freshState();
    unify(v("X"), struct("f", v("Y")), s, trail);
    unify(v("Y"), atom("done"), s, trail);
    expect(resolve(v("X"), s)).toEqual(struct("f", atom("done")));
  });

  it("resolveLiteral instantiates all arguments", () => {
    const { s, trail } = freshState();
    unify(v("Act"), struct("mistreat", atom("aunt")), s, trail);
    const out = resolveLiteral(goal("ruling", v("Act"), atom("haram")), s);
    expect(literalToString(out)).toBe("ruling(mistreat(aunt), haram)");
  });
});

describe("subsumption", () => {
  it("a general goal subsumes a specific one", () => {
    expect(subsumes(goal("ruling", v("X"), v("Y")), goal("ruling", atom("riba"), atom("haram")))).toBe(
      true
    );
  });

  it("a specific goal does not subsume a general one", () => {
    expect(subsumes(goal("ruling", atom("riba"), atom("haram")), goal("ruling", v("X"), v("Y")))).toBe(
      false
    );
  });

  it("respects repeated variables", () => {
    // ruling(X, X) must not subsume ruling(a, b).
    expect(subsumes(goal("ruling", v("X"), v("X")), goal("ruling", atom("a"), atom("b")))).toBe(false);
    expect(subsumes(goal("ruling", v("X"), v("X")), goal("ruling", atom("a"), atom("a")))).toBe(true);
  });

  it("is false across different predicates", () => {
    expect(subsumes(goal("ruling", v("X")), goal("kin", v("X")))).toBe(false);
  });
});

describe("renaming", () => {
  it("makes every variable fresh while preserving sharing within the clause", () => {
    const c = parseClause("ruling(mistreat(X), haram) :- kin(X, ego), harms(X, Y).");
    const r1 = renameClause(c);
    const r2 = renameClause(c);

    const v1 = [...collectClauseVars(r1)];
    const v2 = [...collectClauseVars(r2)];
    expect(v1.some((name) => v2.includes(name))).toBe(false);

    // X still appears in both head and body of the renamed clause.
    const mistreat = r1.head.args[0];
    if (!isStruct(mistreat)) throw new Error("expected mistreat(X) structure");
    expect(r1.body[0].args[0]).toEqual(mistreat.args[0]);
  });

  it("preserves the clause id so evidence can still be joined", () => {
    const c = parseClause("p(X).", "bukhari:12");
    expect(renameClause(c).id).toBe("bukhari:12");
  });
});

describe("parser", () => {
  it("parses a fact", () => {
    const c = parseClause("kin(mother, ego).");
    expect(c.head.predicate).toBe("kin");
    expect(c.body).toHaveLength(0);
  });

  it("parses a rule with several body goals", () => {
    const c = parseClause("ruling(A, haram) :- causes(A, harm), not_excused(A).");
    expect(c.body.map((b) => b.predicate)).toEqual(["causes", "not_excused"]);
  });

  it("distinguishes variables from atoms by case", () => {
    const c = parseClause("p(X, y, _Z).");
    expect(c.head.args.map((a) => a.kind)).toEqual(["var", "atom", "var"]);
  });

  it("gives each anonymous variable a distinct identity", () => {
    const c = parseClause("p(_, _).");
    const [a, b] = c.head.args;
    if (!isVar(a) || !isVar(b)) throw new Error("expected two variables");
    expect(a.name).not.toBe(b.name);
  });

  it("parses nested structures", () => {
    const t = parseTerm("ratio(harm(kin), severity(major))");
    expect(termToString(t)).toBe("ratio(harm(kin), severity(major))");
  });

  it("parses quoted atoms containing spaces", () => {
    const c = parseClause("source('Sahih al-Bukhari', 5971).");
    expect(c.head.args[0]).toEqual(atom("Sahih al-Bukhari"));
  });

  it("parses string and number literals", () => {
    const c = parseClause('grade("sahih", 5, -2, 1.5).');
    expect(c.head.args.map((a) => (a as { value: unknown }).value)).toEqual(["sahih", 5, -2, 1.5]);
  });

  it("does not mistake a decimal point for a clause terminator", () => {
    const c = parseClause("threshold(2.5).");
    expect(c.head.args[0]).toEqual({ kind: "lit", value: 2.5 });
  });

  it("skips line and block comments", () => {
    const clauses = parseProgram(`
      % a line comment
      p(a).
      /* a block
         comment */
      q(b).
    `);
    expect(clauses.map((c) => c.head.predicate)).toEqual(["p", "q"]);
  });

  it("parses zero-arity predicates", () => {
    const c = parseClause("contradiction :- p, q.");
    expect(c.head.args).toHaveLength(0);
    expect(c.body).toHaveLength(2);
  });

  it("assigns sequential ids across a program", () => {
    const clauses = parseProgram("p(a). p(b). p(c).", { sourceName: "qawaid" });
    expect(clauses.map((c) => c.id)).toEqual(["qawaid:0", "qawaid:1", "qawaid:2"]);
  });

  it("round-trips through clauseToString", () => {
    const src = "ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), harm).";
    const once = parseClause(src);
    const twice = parseClause(clauseToString(once));
    expect(literalsEqual(once.head, twice.head)).toBe(true);
    expect(once.body.every((b, i) => literalsEqual(b, twice.body[i]))).toBe(true);
  });

  describe("queries", () => {
    it("parses a single goal without a trailing dot", () => {
      const goals = parseQuery("ruling(mistreat(aunt), R)");
      expect(goals).toHaveLength(1);
      expect(goals[0].args[1]).toEqual(v("R"));
    });

    it("parses a conjunction of goals", () => {
      const goals = parseQuery("kin(X, ego), ruling(mistreat(X), R).");
      expect(goals.map((g) => g.predicate)).toEqual(["kin", "ruling"]);
    });
  });

  describe("errors", () => {
    it("reports line and column for an unexpected character", () => {
      let caught: ParseError | undefined;
      try {
        parseProgram("p(a).\nq(#).", { sourceName: "kb.pl" });
      } catch (e) {
        caught = e as ParseError;
      }
      expect(caught).toBeInstanceOf(ParseError);
      expect(caught!.line).toBe(2);
      expect(caught!.message).toContain("kb.pl:2:3");
    });

    it("rejects a missing clause terminator", () => {
      expect(() => parseProgram("p(a) q(b).")).toThrow(ParseError);
    });

    it("rejects a variable in predicate position", () => {
      expect(() => parseClause("X(a).")).toThrow(/must start with a predicate name/);
    });

    it("rejects an unterminated quoted atom", () => {
      expect(() => parseClause("p('unclosed).")).toThrow(/unterminated quoted atom/);
    });

    it("rejects an empty argument list", () => {
      expect(() => parseClause("p().")).toThrow(/empty argument list/);
    });
  });
});
