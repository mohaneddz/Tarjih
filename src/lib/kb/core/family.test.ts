import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { weighRuling } from "../../tarjih/weigh";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function verdict(query: string) {
  return weighRuling(prove(parseQuery(query), core.kb, { maxSolutions: 200 }), core.evidence)?.verdict;
}

function holds(query: string): boolean {
  return prove(parseQuery(query), core.kb).solutions.length > 0;
}

describe("marriage prohibitions follow mahram standing", () => {
  it("forbids marrying blood, milk and in-law mahram", () => {
    for (const relative of ["mother", "sister", "aunt_paternal", "niece", "milk_mother", "milk_sibling", "mother_in_law"]) {
      expect(verdict(`ruling(marry(${relative}), H)`)).toBe("haram");
    }
  });

  it("permits cousins, who are womb-relatives but not mahram", () => {
    expect(verdict("ruling(marry(cousin_paternal), H)")).toBe("mubah");
    expect(verdict("ruling(marry(cousin_maternal), H)")).toBe("mubah");
    expect(holds("mahram(cousin_paternal, ego)")).toBe(false);
  });

  it("still owes cousins the duties of kinship", () => {
    expect(verdict("ruling(maintain(cousin_maternal), H)")).toBe("wajib");
    expect(verdict("ruling(mistreat(cousin_paternal), H)")).toBe("haram");
  });

  it("forbids combining a wife with her sister or aunt without making them mahram", () => {
    expect(verdict("ruling(marry(wifes_sister), H)")).toBe("haram");
    expect(verdict("ruling(marry(wifes_aunt), H)")).toBe("haram");
    expect(holds("mahram(wifes_sister, ego)")).toBe(false);
  });
});

describe("milk kinship", () => {
  it("makes a person mahram without making them kin", () => {
    expect(holds("mahram(milk_mother, ego)")).toBe(true);
    expect(holds("kin(milk_mother, ego)")).toBe(false);
    // No duty of silat al-rahim is derived for them, since they are not rahim.
    expect(prove(parseQuery("ruling(maintain(milk_sibling), H)"), core.kb).solutions).toHaveLength(0);
  });
});
