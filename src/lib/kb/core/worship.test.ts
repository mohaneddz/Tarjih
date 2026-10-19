import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { weighRuling } from "../../tarjih/weigh";
import { loadKbStrict } from "../entry";
import { withPremises } from "../premises";
import { CORE_ENTRIES, loadCoreKb } from "./index";

const core = loadCoreKb();

function kbFor(situations: readonly string[]) {
  if (situations.length === 0) return core.kb;
  return withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", "))).kb;
}

function verdicts(query: string, situations: readonly string[] = [], variable = "H"): string[] {
  const result = prove(parseQuery(query), kbFor(situations), { maxSolutions: 200 });
  return [...new Set(result.solutions.map((s) => termToString(s.bindings[variable])))].sort();
}

/** The prevailing ruling after tarjih, the way /study reports it. */
function weighed(query: string, situations: readonly string[] = []): string | undefined {
  const kb = situations.length
    ? withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", ")))
    : core;
  return weighRuling(prove(parseQuery(query), kb.kb, { maxSolutions: 200 }), kb.evidence)?.verdict;
}

function clausesFor(query: string, situations: readonly string[] = []): string[] {
  return prove(parseQuery(query), kbFor(situations), { maxSolutions: 200 }).solutions.flatMap(
    (s) => s.clauseIds
  );
}

describe("concessions are for the person, not the act", () => {
  it("says nothing about shortening the prayer when nobody is travelling", () => {
    expect(prove(parseQuery("ruling(shorten(obligatory_prayer), H)"), core.kb).solutions)
      .toHaveLength(0);
  });

  it("permits it once the asker says they are travelling", () => {
    expect(verdicts("ruling(shorten(obligatory_prayer), H)", ["travel"])).toEqual(["mubah"]);
  });

  it("does not let one asker's travel license a different concession", () => {
    // Travel excuses the fast and shortens the prayer. It has nothing to do
    // with forbidden food, and the two concession rules must not leak.
    expect(verdicts("ruling(consume(swine), H)", ["travel"])).toEqual(["haram"]);
  });

  it("excuses the fast for illness and for travel, on the same verse", () => {
    expect(weighed("ruling(omit(fasting), H)", ["illness"])).toBe("mubah");
    expect(weighed("ruling(omit(fasting), H)", ["travel"])).toBe("mubah");
    // With no excuse stated, omitting the fast is what it always was.
    expect(weighed("ruling(omit(fasting), H)")).toBe("haram");
  });

  it("excuses the fast through the hardship maxim alone, the specific verse qualifying 2:183", () => {
    /*
     * Without the clauses keyed on 2:184 directly, the concession rests on a
     * maxim of probable indication against a certain general obligation. The
     * khass verse in its chain qualifies that obligation (jam') before the
     * two are weighed on certainty, so the traveller is still excused.
     */
    const direct = new Set(["quran:2-184:travel-excuses-fast", "quran:2-184:illness-excuses-fast"]);
    const viaMaxim = loadKbStrict(CORE_ENTRIES.filter((e) => !direct.has(e.id)));
    for (const situation of ["travel", "illness"]) {
      const kb = withPremises(viaMaxim, parseQuery(`circumstance(${situation})`));
      const result = weighRuling(
        prove(parseQuery("ruling(omit(fasting), H)"), kb.kb, { maxSolutions: 200 }),
        kb.evidence
      );
      expect(result?.verdict).toBe("mubah");
      expect(result?.resolution.map((s) => s.rule)).toContain("specificity");
    }
  });
});

describe("the two concession mechanisms stay apart", () => {
  it("routes an ordinary hardship through mashaqqa, never through darura", () => {
    /*
     * The distinction the usulis guard hardest. Travel is difficulty, not a
     * threat to life; it may attach a lighter alternative to an obligation
     * but must never suspend a prohibition. If both rules fired on any
     * "hard situation", ordinary inconvenience would excuse the forbidden.
     */
    const clauses = clausesFor("ruling(shorten(obligatory_prayer), H)", ["travel"]);
    expect(clauses).toContain("usul:mashaqqa-brings-facility");
    expect(clauses).not.toContain("usul:darura-lifts-prohibition");
  });

  it("routes a threat to life through darura, never through mashaqqa", () => {
    const clauses = clausesFor("ruling(consume(carrion), H)", ["starvation"]);
    expect(clauses).toContain("usul:darura-lifts-prohibition");
    expect(clauses).not.toContain("usul:mashaqqa-brings-facility");
  });

  it("will not let mashaqqa lift a prohibition even with the situation asserted", () => {
    // No `hardship(starvation, ...)` and no `excepted(consume(carrion), travel)`
    // exist, so neither cross-pairing can produce a permission.
    expect(verdicts("ruling(consume(carrion), H)", ["travel", "illness"])).toEqual(["haram"]);
  });
});

describe("an impediment does more than excuse", () => {
  it("makes omitting the fast obligatory rather than merely permitted", () => {
    // A rukhsa yields mubah — you may take the lighter option. A mani' yields
    // wajib: the act is no longer lawfully performable at all.
    expect(verdicts("ruling(omit(fasting), H)", ["menstruation"])).toContain("wajib");
  });

  it("reaches that through the impediment rule, not the hardship one", () => {
    const clauses = clausesFor("ruling(omit(fasting), H)", ["menstruation"]);
    expect(clauses).toContain("usul:impediment-obliges-omission");
    expect(clauses).toContain("bukhari:304:menstruation-impediment");
  });
});

describe("conditions and validity", () => {
  it("voids the prayer when its condition is unmet", () => {
    expect(verdicts("validity(perform(obligatory_prayer), V)", ["ritual_impurity"], "V"))
      .toEqual(["batil"]);
  });

  it("shows the condition itself as a step in the reasoning", () => {
    // Stated as a rule over condition/2 rather than a bare fact about prayer,
    // so the proof reads: this is a condition, it is unmet, therefore void.
    expect(clausesFor("validity(perform(obligatory_prayer), V)", ["ritual_impurity"]))
      .toContain("muslim:224:purity-condition");
  });

  it("does not declare a prayer void merely because purity is a condition", () => {
    expect(prove(parseQuery("validity(perform(obligatory_prayer), V)"), core.kb).solutions)
      .toHaveLength(0);
  });
});

describe("tayammum", () => {
  it("is permitted where the verse names the situation directly", () => {
    expect(verdicts("ruling(perform(tayammum), H)", ["water_unavailable"])).toEqual(["mubah"]);
    expect(verdicts("ruling(perform(tayammum), H)", ["illness"])).toEqual(["mubah"]);
  });

  it("rests on the verse itself rather than on the hardship maxim", () => {
    // 4:43 names the absence of water as the trigger. Inferring it from a
    // general maxim instead would present the ruling as weaker than the plain
    // text it actually rests on.
    const clauses = clausesFor("ruling(perform(tayammum), H)", ["water_unavailable"]);
    expect(clauses).toContain("quran:4-43:tayammum-no-water");
    expect(clauses).not.toContain("usul:mashaqqa-brings-facility");
  });
});

describe("obligations and what qualifies them", () => {
  it("states the obligations the concessions relax", () => {
    expect(weighed("ruling(perform(obligatory_prayer), H)")).toBe("wajib");
    expect(weighed("ruling(perform(fasting), H)")).toBe("wajib");
    expect(weighed("ruling(omit(obligatory_prayer), H)")).toBe("haram");
  });

  it("lets the specific impediment qualify the general obligation, for the fast and the prayer", () => {
    expect(weighed("ruling(omit(fasting), H)", ["menstruation"])).toBe("wajib");
    expect(weighed("ruling(perform(fasting), H)", ["menstruation"])).toBe("haram");
    expect(weighed("ruling(omit(obligatory_prayer), H)", ["menstruation"])).toBe("wajib");
    expect(weighed("ruling(perform(obligatory_prayer), H)", ["menstruation"])).toBe("haram");
  });

  it("does not let travel touch the prayer obligation itself", () => {
    expect(weighed("ruling(omit(obligatory_prayer), H)", ["travel"])).toBe("haram");
  });
});
