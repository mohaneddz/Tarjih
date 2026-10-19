import { describe, expect, it } from "vitest";

import { loadCoreKb } from "../kb/core";
import { validateClause } from "../kb/validate";
import { parseClause, parseProgram, parseQuery } from "../logic/parse";
import { termToString } from "../logic/term";
import { isBuiltinClauseId } from "./builtins";
import { KnowledgeBase } from "./kb";
import { prove, provable } from "./prover";

function kbFrom(source: string): KnowledgeBase {
  return new KnowledgeBase(parseProgram(source, { sourceName: "t" }));
}

describe("dif/2", () => {
  it("succeeds on distinct ground terms and fails on identical ones", () => {
    const kb = kbFrom("p(a).");
    expect(provable(parseQuery("dif(a, b)"), kb)).toBe(true);
    expect(provable(parseQuery("dif(a, a)"), kb)).toBe(false);
    expect(provable(parseQuery("dif(f(a), f(b))"), kb)).toBe(true);
  });

  it("decides non-ground terms that can never unify", () => {
    const result = prove(parseQuery("dif(f(X), g(Y))"), kbFrom("p(a)."));
    expect(result.solutions).toHaveLength(1);
    expect(result.instantiationFaults).toBe(0);
  });

  it("fails closed, and says so, when the answer depends on a later binding", () => {
    const result = prove(parseQuery("dif(X, a)"), kbFrom("p(a)."));
    expect(result.solutions).toHaveLength(0);
    expect(result.instantiationFaults).toBe(1);
  });

  it("filters solutions once its arguments are bound", () => {
    const kb = kbFrom("rel(mother). rel(aunt). other(X) :- rel(X), dif(X, mother).");
    const answers = prove(parseQuery("other(X)"), kb).solutions.map((s) => termToString(s.bindings.X));
    expect(answers).toEqual(["aunt"]);
  });

  it("never binds a variable", () => {
    const result = prove(parseQuery("dif(f(X), g(a)), eq(X)"), kbFrom("eq(b)."));
    expect(result.solutions.map((s) => termToString(s.bindings.X))).toEqual(["b"]);
  });
});

describe("numeric comparison", () => {
  const kb = kbFrom("journey(trip_a, 120). journey(trip_b, 40). long(T) :- journey(T, Km), ge(Km, 80).");

  it("compares bound numbers", () => {
    expect(provable(parseQuery("gt(3, 2)"), kb)).toBe(true);
    expect(provable(parseQuery("gt(2, 2)"), kb)).toBe(false);
    expect(provable(parseQuery("ge(2, 2)"), kb)).toBe(true);
    expect(provable(parseQuery("lt(1.5, 2)"), kb)).toBe(true);
    expect(provable(parseQuery("le(3, 2)"), kb)).toBe(false);
  });

  it("selects only the rows that pass the threshold", () => {
    const answers = prove(parseQuery("long(T)"), kb).solutions.map((s) => termToString(s.bindings.T));
    expect(answers).toEqual(["trip_a"]);
  });

  it("treats a non-number as plainly false rather than undecided", () => {
    const result = prove(parseQuery("gt(far, 2)"), kb);
    expect(result.solutions).toHaveLength(0);
    expect(result.instantiationFaults).toBe(0);
  });

  it("fails closed on an unbound argument", () => {
    const result = prove(parseQuery("gt(X, 2)"), kb);
    expect(result.solutions).toHaveLength(0);
    expect(result.instantiationFaults).toBe(1);
  });

  it("shows up in the proof tree as a computed step", () => {
    const [solution] = prove(parseQuery("long(trip_a)"), kb).solutions;
    const ids = solution.clauseIds;
    expect(ids.some(isBuiltinClauseId)).toBe(true);
  });
});

describe("builtin linting", () => {
  it("flags a builtin placed before the goal that binds its variable", () => {
    const issues = validateClause(
      parseClause("ruling(consume(X), mubah) :- dif(X, swine), instance_of(X, forbidden_food).")
    );
    expect(issues.map((i) => i.code)).toContain("unsafe-builtin");
  });

  it("accepts the same builtin once its variable is bound", () => {
    const issues = validateClause(
      parseClause("ruling(consume(X), mubah) :- instance_of(X, forbidden_food), dif(X, swine).")
    );
    expect(issues).toEqual([]);
  });

  it("refuses a clause that tries to define a builtin", () => {
    expect(validateClause(parseClause("dif(a, a).")).map((i) => i.code)).toContain("defines-builtin");
  });

  it("does not report builtin goals as dangling", () => {
    expect(kbFrom("p(X) :- q(X), dif(X, a). q(b).").danglingReferences()).toEqual([]);
  });
});

describe("qiyas with an explicit dif guard", () => {
  const core = loadCoreKb();

  it("does not derive a case by analogy to itself when the act is left open", () => {
    const result = prove(parseQuery("ruling(A, H)"), core.kb, { maxSolutions: 500 });
    for (const s of result.solutions) {
      const root = s.proofs[0];
      if (root.clauseId !== "usul:qiyas") continue;
      const [newCase] = root.goal.args;
      const asl = root.children.at(-1)!.goal.args[0];
      expect(termToString(asl)).not.toBe(termToString(newCase));
    }
  });

  it("no longer spends loop cuts on self-analogy for a bound act", () => {
    const result = prove(parseQuery("ruling(consume(narcotic), H)"), core.kb);
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.instantiationFaults).toBe(0);
  });
});
