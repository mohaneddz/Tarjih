import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { withPremises } from "../premises";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function answers(query: string, variable: string, situations: readonly string[] = []): string[] {
  const kb = situations.length
    ? withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", "))).kb
    : core.kb;
  const result = prove(parseQuery(query), kb, { maxSolutions: 200 });
  return [...new Set(result.solutions.map((s) => termToString(s.bindings[variable])))].sort();
}

describe("who owes zakat", () => {
  it("falls only on someone who has held the nisab for a year", () => {
    expect(answers("ruling(perform(zakat), H)", "H")).toEqual([]);
    expect(answers("ruling(perform(zakat), H)", "H", ["nisab_held_for_year"])).toEqual(["wajib"]);
    expect(answers("ruling(omit(zakat), H)", "H", ["nisab_held_for_year"])).toEqual(["haram"]);
  });

  it("requires the intention like any other act of worship", () => {
    expect(answers("validity(perform(zakat), V)", "V", ["no_intention"])).toEqual(["batil"]);
  });
});

describe("to whom it may be given", () => {
  it("discharges the duty when given to one of the eight", () => {
    for (const recipient of ["the_poor", "the_needy", "debtor", "wayfarer"]) {
      expect(answers(`validity(give_zakat_to(${recipient}), V)`, "V")).toEqual(["sahih"]);
    }
  });

  it("does not discharge it when given to parents, grandparents or children", () => {
    for (const relative of ["mother", "father", "grandmother", "son", "daughter"]) {
      expect(answers(`validity(give_zakat_to(${relative}), V)`, "V")).toEqual(["batil"]);
    }
  });

  it("does not discharge it when given to the wealthy", () => {
    expect(answers("validity(give_zakat_to(wealthy_person), V)", "V")).toEqual(["batil"]);
  });

  it("says nothing about siblings rather than guessing", () => {
    expect(answers("validity(give_zakat_to(brother), V)", "V")).toEqual([]);
  });
});
