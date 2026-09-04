import { describe, expect, it } from "vitest";

import { prove } from "../engine/prover";
import { parseQuery } from "../logic/parse";
import { loadCoreKb } from "./core";
import { isPremiseClauseId, withPremises } from "./premises";

const core = loadCoreKb();
const starvation = parseQuery("circumstance(starvation)");

describe("withPremises", () => {
  it("returns the base KB untouched when there are no premises", () => {
    expect(withPremises(core, [])).toBe(core);
  });

  it("does not mutate the base KB", () => {
    const before = core.clauses.length;
    withPremises(core, starvation);
    expect(core.clauses).toHaveLength(before);
    expect(prove(starvation, core.kb).solutions).toHaveLength(0);
  });

  it("makes the premise provable in the scoped KB only", () => {
    const scoped = withPremises(core, starvation);
    expect(prove(starvation, scoped.kb).solutions.length).toBeGreaterThan(0);
    expect(prove(starvation, core.kb).solutions).toHaveLength(0);
  });

  it("gives the premise an evidence record that names the question as its source", () => {
    const scoped = withPremises(core, starvation);
    const id = scoped.clauses.find((c) => isPremiseClauseId(c.id))!.id;
    const record = scoped.evidence.get(id);
    expect(record?.reference).toBe("Stated in the question");
    // ontology-kind, so it adds no juristic weight of its own.
    expect(record?.kind).toBe("ontology");
  });

  it("keeps every clause of the base KB alongside the premise", () => {
    const scoped = withPremises(core, starvation);
    expect(scoped.clauses).toHaveLength(core.clauses.length + 1);
    for (const c of core.clauses) expect(scoped.kb.byClauseId(c.id)).toBeDefined();
  });

  it("keeps two scoped KBs from seeing each other's premises", () => {
    const a = withPremises(core, starvation);
    const b = withPremises(core, []);
    expect(prove(starvation, a.kb).solutions.length).toBeGreaterThan(0);
    expect(prove(starvation, b.kb).solutions).toHaveLength(0);
  });
});
