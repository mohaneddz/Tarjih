import { describe, expect, it } from "vitest";

import { parseProgram, parseQuery } from "../logic/parse";
import { literalToString, termToString } from "../logic/term";
import { KnowledgeBase } from "./kb";
import { proofToString, prove, provable } from "./prover";
import type { ProofNode } from "./prover";

function kbFrom(source: string, name = "test"): KnowledgeBase {
  return new KnowledgeBase(parseProgram(source, { sourceName: name }));
}

function answersFor(source: string, query: string, varName: string): string[] {
  const result = prove(parseQuery(query), kbFrom(source));
  return result.solutions.map((s) => termToString(s.bindings[varName]));
}

describe("KnowledgeBase", () => {
  it("indexes clauses by predicate and arity", () => {
    const kb = kbFrom("p(a). p(b). q(a, b).");
    expect(kb.clausesFor(parseQuery("p(X)")[0])).toHaveLength(2);
    expect(kb.clausesFor(parseQuery("q(X, Y)")[0])).toHaveLength(1);
    // Same name, different arity, is a different predicate.
    expect(kb.clausesFor(parseQuery("p(X, Y)")[0])).toHaveLength(0);
  });

  it("rejects duplicate clause ids so evidence joins stay sound", () => {
    const kb = new KnowledgeBase(parseProgram("p(a).", { sourceName: "s" }));
    expect(() => kb.addAll(parseProgram("p(b).", { sourceName: "s" }))).toThrow(/duplicate clause id/);
  });

  it("finds body goals that no clause can ever satisfy", () => {
    const kb = kbFrom("p(X) :- q(X), typo_here(X). q(a).");
    expect(kb.danglingReferences()).toEqual([{ clauseId: "test:0", goal: "typo_here/1" }]);
  });

  it("reports no dangling references for a well-formed KB", () => {
    expect(kbFrom("p(X) :- q(X). q(a).").danglingReferences()).toEqual([]);
  });
});

describe("prover", () => {
  describe("basic resolution", () => {
    it("proves a fact directly", () => {
      expect(provable(parseQuery("kin(mother, ego)"), kbFrom("kin(mother, ego)."))).toBe(true);
    });

    it("fails on an unprovable goal", () => {
      expect(provable(parseQuery("kin(stranger, ego)"), kbFrom("kin(mother, ego)."))).toBe(false);
    });

    it("fails when the predicate is unknown entirely", () => {
      expect(provable(parseQuery("unknown(x)"), kbFrom("p(a)."))).toBe(false);
    });

    it("binds a query variable from a fact", () => {
      const result = prove(parseQuery("kin(X, ego)"), kbFrom("kin(mother, ego)."));
      expect(result.solutions).toHaveLength(1);
      expect(result.solutions[0].bindings.X).toEqual({ kind: "atom", name: "mother" });
    });

    it("returns one solution per matching fact", () => {
      expect(answersFor("kin(mother, ego). kin(father, ego). kin(aunt, ego).", "kin(X, ego)", "X")).toEqual([
        "mother",
        "father",
        "aunt",
      ]);
    });

    it("chains through a rule body", () => {
      const src = `
        ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), harm).
        kin(aunt, ego).
        causes(mistreat(aunt), harm).
      `;
      expect(provable(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src))).toBe(true);
    });

    it("fails the rule when one body goal is unmet", () => {
      const src = `
        ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), harm).
        kin(aunt, ego).
      `;
      expect(provable(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src))).toBe(false);
    });
  });

  describe("backtracking", () => {
    const family = `
      parent(hashim, abdulmuttalib).
      parent(abdulmuttalib, abdullah).
      parent(abdullah, muhammad).
      ancestor(X, Y) :- parent(X, Y).
      ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
    `;

    it("computes a transitive closure across all depths", () => {
      expect(answersFor(family, "ancestor(hashim, Y)", "Y")).toEqual([
        "abdulmuttalib",
        "abdullah",
        "muhammad",
      ]);
    });

    it("searches backwards too", () => {
      // Depth-first order: the direct parent via the base rule, then the
      // recursive rule walking the parent facts in KB order.
      expect(answersFor(family, "ancestor(X, muhammad)", "X")).toEqual([
        "abdullah",
        "hashim",
        "abdulmuttalib",
      ]);
    });

    it("undoes bindings between alternative branches", () => {
      // If the trail were not rewound, the first branch's X=a would poison the second.
      const src = "p(a). p(b). q(b). r(X) :- p(X), q(X).";
      expect(answersFor(src, "r(X)", "X")).toEqual(["b"]);
    });

    it("enumerates the cross product of independent goals", () => {
      const result = prove(parseQuery("p(X), q(Y)"), kbFrom("p(1). p(2). q(a). q(b)."));
      expect(result.solutions).toHaveLength(4);
    });
  });

  describe("termination", () => {
    it("cuts a symmetric rule that would otherwise recurse forever", () => {
      const src = "sibling(X, Y) :- sibling(Y, X). sibling(hasan, husayn).";
      const result = prove(parseQuery("sibling(hasan, husayn)"), kbFrom(src));
      expect(result.solutions).toHaveLength(1);
      expect(result.truncated).toBe(false);
    });

    it("cuts a directly left-recursive rule", () => {
      const src = "p(X) :- p(X). p(a).";
      const result = prove(parseQuery("p(a)"), kbFrom(src));
      expect(result.solutions).toHaveLength(1);
      expect(result.truncated).toBe(false);
    });

    it("stops at the depth budget and flags truncation", () => {
      // Each subgoal is ground and distinct, so the loop check never fires and
      // only the depth budget can stop the descent.
      const src = "p(f(X)) :- p(X). p(a).";
      const result = prove(parseQuery("p(f(f(f(f(a)))))"), kbFrom(src), { maxDepth: 2 });
      expect(result.solutions).toHaveLength(0);
      expect(result.truncated).toBe(true);
      expect(result.truncationReason).toBe("depth");
    });

    it("proves the same goal when the depth budget allows it", () => {
      const src = "p(f(X)) :- p(X). p(a).";
      const result = prove(parseQuery("p(f(f(f(f(a)))))"), kbFrom(src), { maxDepth: 10 });
      expect(result.solutions).toHaveLength(1);
      expect(result.truncated).toBe(false);
    });

    it("stops at the solution cap and flags truncation", () => {
      const result = prove(parseQuery("p(X)"), kbFrom("p(a). p(b). p(c). p(d)."), {
        maxSolutions: 2,
      });
      expect(result.solutions).toHaveLength(2);
      expect(result.truncated).toBe(true);
      expect(result.truncationReason).toBe("solutions");
    });

    it("stops at the step budget and flags truncation", () => {
      const src = "p(f(X)) :- p(X). p(a).";
      const result = prove(parseQuery("p(f(f(f(f(a)))))"), kbFrom(src), {
        maxSteps: 3,
        maxDepth: 1000,
      });
      expect(result.truncated).toBe(true);
      expect(result.truncationReason).toBe("steps");
    });

    it("does not flag truncation on an exhaustive search", () => {
      const result = prove(parseQuery("p(X)"), kbFrom("p(a). p(b)."));
      expect(result.truncated).toBe(false);
      expect(result.truncationReason).toBeUndefined();
    });
  });

  describe("loop check", () => {
    const family = `
      parent(hashim, abdulmuttalib).
      parent(abdulmuttalib, abdullah).
      parent(abdullah, muhammad).
      ancestor(X, Y) :- parent(X, Y).
      ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
    `;

    /*
     * Regression: the loop check originally cut on subsumption. A goal posed
     * with an unbound argument subsumes every ground instance it is trying to
     * derive, so `ancestor(X, muhammad)` cut its own recursive branch and
     * returned 1 of 3 answers. In this application a silently dropped
     * derivation is a dropped piece of evidence, which is the worst class of
     * bug the engine can have.
     */
    it("does not cut a recursive branch merely because the parent goal was more general", () => {
      expect(answersFor(family, "ancestor(X, muhammad)", "X")).toHaveLength(3);
    });

    it("still cuts a true variant repeat", () => {
      const result = prove(parseQuery("p(a)"), kbFrom("p(X) :- p(X). p(a)."));
      expect(result.loopCuts).toBeGreaterThan(0);
      expect(result.solutions).toHaveLength(1);
    });

    it("reports zero loop cuts when none were needed", () => {
      expect(prove(parseQuery("p(X)"), kbFrom("p(a). p(b).")).loopCuts).toBe(0);
    });

    it("treats goals differing only in variable names as the same goal", () => {
      // p(X) calls q(Y) calls p(Z): the third goal is a variant of the first.
      const result = prove(parseQuery("p(W)"), kbFrom("p(X) :- q(X). q(Y) :- p(Y)."), {
        maxDepth: 50,
      });
      expect(result.loopCuts).toBeGreaterThan(0);
      expect(result.truncated).toBe(false);
    });
  });

  describe("proof capture", () => {
    const src = `
      ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), harm).
      kin(aunt, ego).
      causes(mistreat(aunt), harm).
    `;

    it("records the clause that discharged each goal", () => {
      const result = prove(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src));
      const root = result.solutions[0].proofs[0];
      expect(root.clauseId).toBe("test:0");
      expect(root.children.map((c) => c.clauseId)).toEqual(["test:1", "test:2"]);
    });

    it("fully instantiates goals in the proof tree", () => {
      const result = prove(parseQuery("ruling(mistreat(X), haram)"), kbFrom(src));
      const root = result.solutions[0].proofs[0];
      // X must be resolved to `aunt`, not left as a variable.
      expect(literalToString(root.goal)).toBe("ruling(mistreat(aunt), haram)");
      expect(literalToString(root.children[0].goal)).toBe("kin(aunt, ego)");
    });

    it("instantiates bindings made after the goal was first posed", () => {
      // `kin(X, ego)` is posed with X unbound and only bound by the child proof;
      // the captured tree must show the final value, not the state at call time.
      const result = prove(parseQuery("ruling(mistreat(X), haram)"), kbFrom(src));
      const kinGoal = result.solutions[0].proofs[0].children[0];
      expect(literalToString(kinGoal.goal)).not.toContain("X");
    });

    it("marks facts as leaves", () => {
      const result = prove(parseQuery("kin(aunt, ego)"), kbFrom(src));
      expect(result.solutions[0].proofs[0].children).toEqual([]);
    });

    it("collects every clause id used in the derivation", () => {
      const result = prove(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src));
      expect([...result.solutions[0].clauseIds].sort()).toEqual(["test:0", "test:1", "test:2"]);
    });

    it("reports derivation depth", () => {
      const result = prove(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src));
      expect(result.solutions[0].depth).toBe(1);
    });

    it("renders a readable proof tree", () => {
      const result = prove(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src));
      expect(proofToString(result.solutions[0].proofs[0])).toBe(
        [
          "ruling(mistreat(aunt), haram)  [test:0]",
          "  kin(aunt, ego)  [test:1]",
          "  causes(mistreat(aunt), harm)  [test:2]",
        ].join("\n")
      );
    });

    it("keeps proof trees independent across solutions", () => {
      const src2 = "p(X) :- q(X). q(a). q(b).";
      const result = prove(parseQuery("p(X)"), kbFrom(src2));
      expect(result.solutions).toHaveLength(2);
      expect(literalToString(result.solutions[0].proofs[0].goal)).toBe("p(a)");
      expect(literalToString(result.solutions[1].proofs[0].goal)).toBe("p(b)");
    });
  });

  describe("multiple independent derivations", () => {
    /*
     * The case the tarjih layer exists to handle: one conclusion, reached both
     * by analogy from an established ruling and by a general legal maxim.
     * Both must survive to be weighed.
     */
    const src = `
      ruling(mistreat(A), haram) :- analogous(A, B), ruling(mistreat(B), haram).
      ruling(mistreat(A), haram) :- causes(mistreat(A), harm).
      analogous(aunt, mother).
      ruling(mistreat(mother), haram).
      causes(mistreat(aunt), harm).
    `;

    it("returns every route to the same conclusion", () => {
      const result = prove(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src));
      expect(result.solutions).toHaveLength(2);
    });

    it("gives each route a distinct supporting clause set", () => {
      const result = prove(parseQuery("ruling(mistreat(aunt), haram)"), kbFrom(src));
      const [byQiyas, byMaxim] = result.solutions;
      expect(byQiyas.clauseIds).toContain("test:2"); // analogous/2
      expect(byMaxim.clauseIds).toContain("test:4"); // causes/2
      expect(byQiyas.clauseIds).not.toEqual(byMaxim.clauseIds);
    });

    it("surfaces contradictory rulings rather than picking one", () => {
      const conflicting = `
        ruling(X, haram) :- causes(X, harm).
        ruling(X, mubah) :- customary(X).
        causes(trade_option, harm).
        customary(trade_option).
      `;
      const result = prove(parseQuery("ruling(trade_option, R)"), kbFrom(conflicting));
      const verdicts = result.solutions.map((s) => (s.bindings.R as { name: string }).name);
      expect(verdicts.sort()).toEqual(["haram", "mubah"]);
    });
  });

  describe("trace", () => {
    it("is empty unless requested", () => {
      expect(prove(parseQuery("p(a)"), kbFrom("p(a).")).trace).toEqual([]);
    });

    it("records calls and exits", () => {
      const result = prove(parseQuery("p(X) "), kbFrom("p(X) :- q(X). q(a)."), { trace: true });
      const types = result.trace.map((e) => e.type);
      expect(types).toContain("call");
      expect(types).toContain("exit");
    });

    it("records failures", () => {
      const result = prove(parseQuery("p(a)"), kbFrom("p(X) :- q(X). q(b)."), { trace: true });
      expect(result.trace.map((e) => e.type)).toContain("fail");
    });

    it("records loop cuts", () => {
      const src = "p(X) :- p(X). p(a).";
      const result = prove(parseQuery("p(a)"), kbFrom(src), { trace: true });
      expect(result.trace.map((e) => e.type)).toContain("loop-cut");
    });

    it("respects the trace event cap", () => {
      const src = "nat(s(X)) :- nat(X). nat(z).";
      const result = prove(parseQuery("nat(Y)"), kbFrom(src), {
        trace: true,
        maxTraceEvents: 20,
        maxDepth: 50,
        maxSolutions: 50,
      });
      expect(result.trace.length).toBeLessThanOrEqual(20);
    });
  });

  describe("counters", () => {
    it("counts resolution steps", () => {
      const result = prove(parseQuery("p(X)"), kbFrom("p(a). p(b). p(c)."));
      expect(result.steps).toBe(3);
    });
  });
});

describe("occurs check in proof search", () => {
  it("does not build a cyclic term when a rule would create one", () => {
    // Without the occurs check this unifies X with f(X) and loops on rendering.
    const result = prove(parseQuery("p(X, f(X))"), kbFrom("p(Y, Y)."));
    expect(result.solutions).toHaveLength(0);
  });
});

describe("depth accounting", () => {
  it("increments depth once per rule expansion", () => {
    const src = "a(X) :- b(X). b(X) :- c(X). c(z).";
    const result = prove(parseQuery("a(Z)"), kbFrom(src));
    const depths: number[] = [];
    const walk = (n: ProofNode) => {
      depths.push(n.depth);
      n.children.forEach(walk);
    };
    walk(result.solutions[0].proofs[0]);
    expect(depths).toEqual([0, 1, 2]);
  });
});
