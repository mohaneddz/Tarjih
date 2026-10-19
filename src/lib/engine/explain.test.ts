import { describe, expect, it } from "vitest";

import { loadCoreKb } from "../kb/core";
import { QUERY_SUPPLIED_PREDICATES } from "../kb/ontology";
import { parseProgram, parseQuery } from "../logic/parse";
import { displayGoal, explainFailure, explanationToString } from "./explain";
import { KnowledgeBase } from "./kb";
import { prove } from "./prover";

function kbFrom(source: string): KnowledgeBase {
  return new KnowledgeBase(parseProgram(source, { sourceName: "t" }));
}

describe("explainFailure", () => {
  it("reports the missing fact a rule stalled on, and which rule needed it", () => {
    const kb = kbFrom("ruling(A, haram) :- causes(A, darar). causes(b, darar).");
    const result = prove(parseQuery("ruling(a, H)"), kb, { trace: true });
    expect(result.solutions).toHaveLength(0);

    const { frontier } = explainFailure(result);
    expect(frontier.map((f) => f.goal)).toEqual(["causes(a, darar)"]);
    expect(frontier[0].neededBy).toEqual(["t:0"]);
  });

  it("does not blame a goal whose rule matched; it blames what that rule was missing", () => {
    const kb = kbFrom("p(X) :- q(X). q(X) :- r(X). r(b).");
    const { frontier } = explainFailure(prove(parseQuery("p(a)"), kb, { trace: true }));
    expect(frontier.map((f) => f.goal)).toEqual(["r(a)"]);
  });

  it("reports a query whose predicate has no clauses at all", () => {
    const { frontier } = explainFailure(prove(parseQuery("nothing(a)"), kbFrom("p(a)."), { trace: true }));
    expect(frontier).toHaveLength(1);
    expect(frontier[0].neededBy).toEqual([]);
  });

  it("sets query-supplied premises apart as questions for the asker", () => {
    const kb = kbFrom("ruling(eat(x), mubah) :- circumstance(starvation).");
    const result = prove(parseQuery("ruling(eat(x), H)"), kb, { trace: true });
    const explanation = explainFailure(result, { querySupplied: new Set(["circumstance/1"]) });
    expect(explanation.frontier).toEqual([]);
    expect(explanation.unmetPremises.map((p) => p.goal)).toEqual(["circumstance(starvation)"]);
  });

  it("is empty for an untraced proof", () => {
    const explanation = explainFailure(prove(parseQuery("p(z)"), kbFrom("p(a).")));
    expect(explanation.frontier).toEqual([]);
    expect(explanation.partial).toBe(false);
  });

  it("renders as readable text", () => {
    const kb = kbFrom("ruling(A, haram) :- causes(A, darar).");
    const text = explanationToString(explainFailure(prove(parseQuery("ruling(a, H)"), kb, { trace: true })));
    expect(text).toContain("causes(a, darar)");
  });
});

describe("explainFailure on the core KB", () => {
  const core = loadCoreKb();
  const options = { querySupplied: QUERY_SUPPLIED_PREDICATES };

  it("finds the necessity concession waiting on starvation when asked about pork", () => {
    const result = prove(parseQuery("ruling(consume(swine), H)"), core.kb, { trace: true });
    expect(result.solutions.length).toBeGreaterThan(0);
    const { unmetPremises } = explainFailure(result, options);
    const starvation = unmetPremises.find((p) => p.goal === "circumstance(starvation)");
    expect(starvation?.neededBy).toContain("usul:darura-lifts-prohibition");
  });

  it("finds the travel concession waiting when asked about shortening the prayer", () => {
    const result = prove(parseQuery("ruling(shorten(obligatory_prayer), H)"), core.kb, { trace: true });
    const { unmetPremises } = explainFailure(result, options);
    expect(unmetPremises.map((p) => p.goal)).toContain("circumstance(travel)");
  });
});

describe("displayGoal", () => {
  it("strips the prover's renaming suffix from clause variables", () => {
    expect(displayGoal("illah(perform(tayammum), _Illa#96)")).toBe("illah(perform(tayammum), _Illa)");
  });

  it("merges the same open goal reached through two renamings", () => {
    const kb = kbFrom("p(X) :- q(X, Y). p(X) :- q(X, Z). q(b, c).");
    const { frontier } = explainFailure(prove(parseQuery("p(a)"), kb, { trace: true }));
    expect(frontier).toHaveLength(2);
    expect(new Set(frontier.map((f) => f.goal)).size).toBe(2);
    expect(frontier.every((f) => !f.goal.includes("#"))).toBe(true);
  });
});
