import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { withPremises } from "../premises";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function kbFor(situations: readonly string[]) {
  if (situations.length === 0) return core.kb;
  return withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", "))).kb;
}

function answers(query: string, variable: string, situations: readonly string[] = []): string[] {
  const result = prove(parseQuery(query), kbFor(situations), { maxSolutions: 200 });
  return [...new Set(result.solutions.map((s) => termToString(s.bindings[variable])))].sort();
}

describe("al-umur bi-maqasidiha", () => {
  it("voids a fast or a prayer done without the intention to perform it", () => {
    expect(answers("validity(perform(fasting), V)", "V", ["no_intention"])).toEqual(["batil"]);
    expect(answers("validity(perform(obligatory_prayer), V)", "V", ["no_intention"])).toEqual(["batil"]);
  });

  it("says nothing about validity when the asker did not say the intention was missing", () => {
    expect(prove(parseQuery("validity(perform(fasting), V)"), core.kb).solutions).toHaveLength(0);
  });

  it("does not reach acts outside the class of worship", () => {
    expect(answers("validity(perform(tayammum), V)", "V", ["no_intention"])).toEqual([]);
  });
});

describe("al-darura tuqaddar bi-qadariha", () => {
  it("permits the starving what keeps them alive and no more", () => {
    expect(answers("ruling(consume(carrion), H)", "H", ["starvation"])).toContain("mubah");
    expect(answers("ruling(consume_beyond_need(carrion), H)", "H", ["starvation"])).toEqual(["haram"]);
  });
});
