import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { chainStrength } from "../../tarjih/strength";
import { weighRuling } from "../../tarjih/weigh";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function verdicts(query: string): string[] {
  const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
  return [...new Set(result.solutions.map((s) => termToString(s.bindings.H)))].sort();
}

function clausesFor(query: string): Set<string> {
  const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
  const ids = new Set<string>();
  for (const s of result.solutions) for (const id of s.clauseIds) ids.add(id);
  return ids;
}

describe("intoxicants", () => {
  it("forbids khamr on the verse that names it", () => {
    expect(verdicts("ruling(consume(khamr), H)")).toEqual(["haram"]);
    expect(clausesFor("ruling(consume(khamr), H)")).toContain("quran:5-90:khamr");
  });

  it("forbids other intoxicants by the generalising text, not by analogy", () => {
    // "Every intoxicant is khamr" settles what khamr *is*, so beer arrives
    // under 5:90 directly. Routing it through qiyas instead would understate
    // a ruling the sunnah states outright.
    const clauses = clausesFor("ruling(consume(beer), H)");
    expect(verdicts("ruling(consume(beer), H)")).toEqual(["haram"]);
    expect(clauses).toContain("muslim:2003:every-intoxicant");
  });

  it("forbids a small quantity on the text that addresses quantity", () => {
    expect(verdicts("ruling(consume(sip_of_khamr), H)")).toEqual(["haram"]);
    expect(clausesFor("ruling(consume(sip_of_khamr), H)")).toContain("abudawud:3681:small-amount");
  });

  it("reaches an unnamed substance only through qiyas", () => {
    const clauses = clausesFor("ruling(consume(narcotic), H)");
    expect(verdicts("ruling(consume(narcotic), H)")).toEqual(["haram"]);
    expect(clauses).toContain("illah:narcotic");

    /*
     * Checked at the root of each derivation rather than anywhere in the
     * chain, and the distinction is the same one `buildRuleInput` makes. The
     * definitional hadith legitimately appears deeper down — it is how the
     * *source case* (khamr) is established in one of the two derivations —
     * but it must never be the clause that concludes the ruling here, or a
     * substance no text names would be presented as one the sunnah names.
     */
    const roots = prove(parseQuery("ruling(consume(narcotic), H)"), core.kb, { maxSolutions: 200 })
      .solutions.map((s) => s.proofs[0].clauseId);
    expect(roots.length).toBeGreaterThan(0);
    expect(new Set(roots)).toEqual(new Set(["usul:qiyas"]));
  });

  it("holds the analogical ruling more weakly than the stated one", () => {
    /*
     * The substantive claim of this whole domain: a ruling nobody wrote down
     * is not worth as much as one that is written down, and the engine has to
     * say so rather than presenting both at the same confidence.
     */
    const stated = weighRuling(
      prove(parseQuery("ruling(consume(khamr), H)"), core.kb, { maxSolutions: 200 }),
      core.evidence
    );
    const analogical = weighRuling(
      prove(parseQuery("ruling(consume(narcotic), H)"), core.kb, { maxSolutions: 200 }),
      core.evidence
    );
    expect(analogical!.groups[0].confidence).toBeLessThan(stated!.groups[0].confidence);
  });

  it("does not let the wisdom behind the prohibition found an analogy", () => {
    // hikma/2 is recorded but must never appear in a derivation: qiyas runs
    // on illah/2 alone. A `hikma`-driven analogy would forbid anything
    // arguably dulling to the intellect.
    expect(clausesFor("ruling(consume(narcotic), H)")).not.toContain("quran:5-90:hikma");
  });

  it("says nothing about a substance it has no attribute or 'illa for", () => {
    expect(prove(parseQuery("ruling(consume(bread), H)"), core.kb).solutions).toHaveLength(0);
  });

  it("keeps the analogy from running backwards into its own source", () => {
    const result = prove(parseQuery("ruling(consume(khamr), H)"), core.kb, { maxSolutions: 200 });
    for (const s of result.solutions) {
      // khamr's own ruling is stated; it must not be re-derived from a case
      // that only has the ruling because of khamr.
      if (s.clauseIds.includes("usul:qiyas")) {
        expect(s.clauseIds).not.toContain("illah:narcotic");
      }
    }
  });

  it("grades a chain that passes through the analogy below one that does not", () => {
    const result = prove(parseQuery("ruling(consume(narcotic), haram)"), core.kb, {
      maxSolutions: 200,
    });
    for (const s of result.solutions) {
      expect(chainStrength(s, core.evidence)).toBeLessThan(100);
    }
  });
});
