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

describe("the sea and the locust", () => {
  it("permits what the sea yields dead, and locusts", () => {
    expect(weigh("ruling(consume(dead_fish), H)")?.verdict).toBe("mubah");
    expect(weigh("ruling(consume(locust), H)")?.verdict).toBe("mubah");
  });

  it("does not let a da'if report carve the floating fish out of a sound permission", () => {
    const result = weigh("ruling(consume(floating_dead_fish), H)");
    expect(result?.groups.map((g) => g.outcome).sort()).toEqual(["haram", "mubah"]);
    expect(result?.verdict).toBe("mubah");
  });

  it("keeps sea carrion clear of the rules that chain on forbidden food", () => {
    // Had dead fish been classed as forbidden food and then overridden, the
    // extent-of-necessity rule would forbid eating one's fill of it.
    expect(prove(parseQuery("ruling(consume_beyond_need(dead_fish), H)"), core.kb).solutions).toHaveLength(0);
  });
});

describe("blood: the restricted text qualifies the unrestricted", () => {
  it("permits the blood left in meat, on 6:145's 'blood poured forth'", () => {
    const result = weigh("ruling(consume(residual_blood), H)");
    expect(result?.verdict).toBe("mubah");
    expect(result?.resolution[0]?.rule).toBe("restriction");
  });

  it("leaves flowing blood forbidden", () => {
    expect(weigh("ruling(consume(blood), H)")?.verdict).toBe("haram");
  });
});

describe("animals the sunnah adds", () => {
  it("forbids fanged predators, with the Maliki makruh beside it", () => {
    const result = weigh("ruling(consume(wolf), H)");
    expect(result?.verdict).toBe("haram");
    expect(result?.relatedOpinions.map((g) => g.outcome)).toEqual(["makruh"]);
  });

  it("forbids domestic donkeys and permits horse meat over the Hanafi makruh", () => {
    expect(weigh("ruling(consume(domestic_donkey), H)")?.verdict).toBe("haram");
    const horse = weigh("ruling(consume(horse_meat), H)");
    expect(horse?.verdict).toBe("mubah");
    expect(horse?.relatedOpinions.map((g) => g.outcome)).toEqual(["makruh"]);
  });

  it("lifts these prohibitions for the starving as it does carrion", () => {
    expect(weigh("ruling(consume(wolf), H)", ["starvation"])?.verdict).toBe("mubah");
    expect(weigh("ruling(consume(domestic_donkey), H)", ["starvation"])?.verdict).toBe("mubah");
  });
});
