import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { weighRuling } from "../../tarjih/weigh";
import { withPremises } from "../premises";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function kbFor(situations: readonly string[]) {
  if (situations.length === 0) return core.kb;
  return withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", "))).kb;
}

function verdicts(query: string, situations: readonly string[] = [], variable = "H"): string[] {
  const result = prove(parseQuery(query), kbFor(situations), { maxSolutions: 200 });
  return [...new Set(result.solutions.map((s) => termToString(s.bindings[variable])))].sort();
}

function holds(query: string, situations: readonly string[] = []): boolean {
  return prove(parseQuery(query), kbFor(situations), { maxSolutions: 20 }).solutions.length > 0;
}

describe("kinship standing follows the hierarchy", () => {
  it("derives blood relation from womb-relation rather than listing it", () => {
    expect(holds("kin(aunt_maternal, ego)")).toBe(true);
    expect(holds("kin(mother, ego)")).toBe(true);
  });

  it("does not extend the marriage prohibition to cousins", () => {
    /*
     * The one place in this file where `instance` and `instance_of` are not
     * interchangeable. Qur'an 4:23 names siblings, aunts and uncles
     * individually — not their children, who are collateral relatives too and
     * are famously not mahram. Keying the sibling clause on inherited
     * membership would have quietly made cousins unmarriageable.
     */
    expect(holds("mahram(sister, ego)")).toBe(true);
    expect(holds("mahram(aunt_maternal, ego)")).toBe(true);
    expect(holds("mahram(mother, ego)")).toBe(true);
    expect(holds("mahram(son, ego)")).toBe(true);
  });

  it("keeps relatives by marriage outside the derived kin relation", () => {
    expect(holds("kin(stranger, ego)")).toBe(false);
  });
});

describe("the positive kinship duty", () => {
  it("obliges keeping ties, which is not the same as forbidding mistreatment", () => {
    // A duty to refrain is not a duty to act, so both texts earn their place.
    expect(verdicts("ruling(maintain(aunt_maternal), H)")).toEqual(["wajib"]);
    expect(verdicts("ruling(mistreat(aunt_maternal), H)")).toEqual(["haram"]);
  });

  it("derives the duty of birr for grandparents, not just the named parents", () => {
    expect(holds("obligation_toward(ego, grandmother, birr)")).toBe(true);
  });
});

describe("blocking the means", () => {
  it("derives a ruling for an act no text rules on, from what the act averts", () => {
    expect(verdicts("ruling(document(debt), H)")).toContain("mandub");
  });

  it("presents the Zahiri and majority readings as a spread, not a crisis", () => {
    /*
     * wajib and mandub are one step apart: both tell you to write the debt
     * down, differing only on whether you are bound to. Reporting that as a
     * contested question would manufacture a crisis out of the ordinary
     * texture of scholarly disagreement.
     */
    const result = weighRuling(
      prove(parseQuery("ruling(document(debt), H)"), core.kb, { maxSolutions: 200 }),
      core.evidence
    );
    expect(result?.contested).toBe(false);
    expect(result?.groups.map((g) => g.outcome).sort()).toEqual(["mandub", "wajib"]);
    expect(result?.relatedOpinions.length).toBeGreaterThan(0);
  });

  it("settles the spread on specificity rather than on which source scores higher", () => {
    /*
     * Both readings rest on a verse; 2:283 addresses the narrower case, so
     * khass over amm decides it and the majority position prevails.
     *
     * This is the case that showed weighing must not be skipped for
     * non-contradicting groups. Left to raw confidence, the general verse
     * outscored the specific one and the engine reported the Zahiri minority
     * as its verdict — an answer arrived at by score, in a tool whose claim is
     * that it does not answer by score.
     */
    const result = weighRuling(
      prove(parseQuery("ruling(document(debt), H)"), core.kb, { maxSolutions: 200 }),
      core.evidence
    );
    expect(result?.verdict).toBe("mandub");
    expect(result?.resolution.map((s) => s.rule)).toContain("specificity");
  });
});

describe("custom", () => {
  it("lets settled trade practice reach the permission in the verse on trade", () => {
    // The cross-domain link: custom concludes soundness, and soundness is what
    // Qur'an 2:275 keys on, so an instalment sale arrives at mubah through the
    // same clause an ordinary spot sale does.
    expect(verdicts("ruling(sell(instalment_sale), H)")).toEqual(["mubah"]);
    const clauses = prove(parseQuery("ruling(sell(instalment_sale), H)"), core.kb, {
      maxSolutions: 200,
    }).solutions.flatMap((s) => s.clauseIds);
    expect(clauses).toContain("qaida:al-ada-muhakkama");
    expect(clauses).toContain("quran:2-275:trade-permitted");
  });

  it("does not let custom override a named defect", () => {
    // Custom settles what the parties are taken to have agreed. It does not
    // make riba lawful, and the riba rule keys on the defect regardless.
    expect(verdicts("ruling(sell(unequal_gold_exchange), H)")).toEqual(["haram"]);
  });
});

describe("presumption of continuity", () => {
  it("does not displace a certainty with a doubt", () => {
    expect(
      verdicts(
        "validity(perform(obligatory_prayer), V)",
        ["certain_prior_purity", "doubt_about_breaking_purity"],
        "V"
      )
    ).toEqual(["sahih"]);
  });

  it("requires the asker to assert both halves, and produces nothing otherwise", () => {
    /*
     * The maxim in the only form this engine can state honestly. Expressed as
     * "nothing contradicts the earlier state" it would need
     * negation-as-failure, and an engine with that converts its own gaps into
     * permissions. Requiring both premises means silence produces nothing.
     */
    expect(holds("validity(perform(obligatory_prayer), sahih)", ["certain_prior_purity"])).toBe(false);
    expect(holds("validity(perform(obligatory_prayer), sahih)", ["doubt_about_breaking_purity"]))
      .toBe(false);
    expect(holds("validity(perform(obligatory_prayer), sahih)")).toBe(false);
  });

  it("still voids the prayer where impurity is asserted outright", () => {
    expect(verdicts("validity(perform(obligatory_prayer), V)", ["ritual_impurity"], "V"))
      .toEqual(["batil"]);
  });
});
