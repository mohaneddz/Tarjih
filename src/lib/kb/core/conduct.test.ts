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

describe("speech", () => {
  it("forbids backbiting, except to complain of a wrong", () => {
    expect(weigh("ruling(speak(backbiting), H)")?.verdict).toBe("haram");
    expect(weigh("ruling(speak(backbiting), H)", ["complaining_of_wrong"])?.verdict).toBe("mubah");
  });

  it("forbids lying, except to reconcile people", () => {
    expect(weigh("ruling(speak(lie), H)")?.verdict).toBe("haram");
    expect(weigh("ruling(speak(lie), H)", ["reconciling_people"])?.verdict).toBe("mubah");
  });

  it("does not let one exception open the other", () => {
    expect(weigh("ruling(speak(lie), H)", ["complaining_of_wrong"])?.verdict).toBe("haram");
  });
});

describe("gold and silk", () => {
  it("depends on who is asking, and assumes neither", () => {
    expect(weigh("ruling(wear(gold), H)")).toBeUndefined();
    expect(weigh("ruling(wear(gold), H)", ["male"])?.verdict).toBe("haram");
    expect(weigh("ruling(wear(gold), H)", ["female"])?.verdict).toBe("mubah");
  });

  it("permits silk to a man for a skin ailment, but not gold", () => {
    expect(weigh("ruling(wear(silk), H)", ["male", "skin_ailment"])?.verdict).toBe("mubah");
    expect(weigh("ruling(wear(gold), H)", ["male", "skin_ailment"])?.verdict).toBe("haram");
  });
});
