import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { weighRuling } from "../../tarjih/weigh";
import { withPremises } from "../premises";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function weigh(query: string, situations: readonly string[] = []) {
  const kb = situations.length
    ? withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", ")))
    : core;
  return weighRuling(prove(parseQuery(query), kb.kb, { maxSolutions: 200 }), kb.evidence);
}

describe("hajj is owed by the able", () => {
  it("derives no obligation until the asker says they are able", () => {
    expect(weigh("ruling(perform(hajj), H)")).toBeUndefined();
    expect(weigh("ruling(perform(hajj), H)", ["able_to_perform_hajj"])?.verdict).toBe("wajib");
  });

  it("forbids neglecting it only for the able", () => {
    expect(weigh("ruling(omit(hajj), H)")).toBeUndefined();
    expect(weigh("ruling(omit(hajj), H)", ["able_to_perform_hajj"])?.verdict).toBe("haram");
  });

  it("owes it once; more is voluntary", () => {
    expect(weigh("ruling(perform(additional_hajj), H)")?.verdict).toBe("mandub");
  });
});

describe("tawaf and menstruation", () => {
  it("forbids the tawaf until she is pure without telling her to drop it", () => {
    expect(weigh("ruling(perform(tawaf), H)", ["menstruation"])?.verdict).toBe("haram");
    expect(weigh("ruling(omit(tawaf), H)", ["menstruation"])).toBeUndefined();
  });
});

describe("hunting and ihram", () => {
  it("permits hunting, and forbids land game in ihram", () => {
    expect(weigh("ruling(hunt(land_game), H)")?.verdict).toBe("mubah");
    const inIhram = weigh("ruling(hunt(land_game), H)", ["ihram"]);
    expect(inIhram?.verdict).toBe("haram");
    expect(inIhram?.resolution[0]?.rule).toBe("specificity");
  });

  it("leaves sea game lawful in ihram", () => {
    expect(weigh("ruling(hunt(sea_game), H)", ["ihram"])?.verdict).toBe("mubah");
  });
});
