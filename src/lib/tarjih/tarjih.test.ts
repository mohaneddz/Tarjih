import { describe, expect, it } from "vitest";

import { prove } from "../engine/prover";
import { loadCoreKb } from "../kb/core";
import { EvidenceStore } from "../kb/evidence";
import { KnowledgeBase } from "../engine/kb";
import { parseProgram, parseQuery } from "../logic/parse";
import { withPremises } from "../kb/premises";
import { buildRuleInput, MURAJJIH_RULES, overallStrength } from "./murajjih";
import { chainStrength, combinedConfidence } from "./strength";
import { groupByOutcome, weighRuling } from "./weigh";

const core = loadCoreKb();

/**
 * The carrion conflict only exists once the asker has claimed necessity, so
 * the fixtures that exercise it prove against a query-scoped KB carrying that
 * premise — exactly as `resolveQuestion` assembles it. See `kb/premises.ts`.
 */
const starving = withPremises(core, parseQuery("circumstance(starvation)"));

function proveRuling(query: string, kb = core) {
  return prove(parseQuery(query), kb.kb, { maxSolutions: 200 });
}

describe("chainStrength", () => {
  it("excludes ontology-kind scaffolding from the weakest-link floor", () => {
    const kb = new KnowledgeBase(
      parseProgram("ruling(X, haram) :- causes(X, darar). causes(mistreat(a), darar).", {
        sourceName: "t",
      })
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "qaida", reference: "maxim", grade: "hasan" },
      { clauseId: "t:1", kind: "ontology", reference: "definition" },
    ]);
    const result = prove(parseQuery("ruling(mistreat(a), haram)"), kb);
    const strength = chainStrength(result.solutions[0], evidence);
    // Would be 0 if the ontology leaf's zero weight were included in the floor.
    expect(strength).toBeGreaterThan(0);
  });

  it("gives a chain with no real evidence at all a strength of zero", () => {
    const kb = new KnowledgeBase(parseProgram("instance_of(a, kin).", { sourceName: "t" }));
    const evidence = new EvidenceStore([{ clauseId: "t:0", kind: "ontology", reference: "def" }]);
    const result = prove(parseQuery("instance_of(a, kin)"), kb);
    expect(chainStrength(result.solutions[0], evidence)).toBe(0);
  });

  it("treats a genuinely missing evidence record as a hard zero, not as scaffolding", () => {
    const kb = new KnowledgeBase(parseProgram("p(a).", { sourceName: "t" }));
    const result = prove(parseQuery("p(a)"), kb);
    // No evidence record registered for t:0 at all.
    expect(chainStrength(result.solutions[0], new EvidenceStore())).toBe(0);
  });

  it("is bounded by the weakest link, not the average", () => {
    const kb = new KnowledgeBase(
      parseProgram("r(X) :- strong(X), weak(X). strong(a). weak(a).", { sourceName: "t" })
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "usul", reference: "rule" },
      { clauseId: "t:1", kind: "quran", reference: "strong text", thubut: "qati", dalala: "qati" },
      { clauseId: "t:2", kind: "qiyas", reference: "weak analogy", dalala: "zanni" },
    ]);
    const result = prove(parseQuery("r(a)"), kb);
    const strength = chainStrength(result.solutions[0], evidence);
    const weakAlone = chainStrength(prove(parseQuery("weak(a)"), kb).solutions[0], evidence);
    expect(strength).toBeLessThanOrEqual(weakAlone);
  });

  it("penalises stacking a derivation on a maxim relative to stacking it on an explicit text", () => {
    // Regression for the exact observation made reading the engine's own
    // output: qiyas built on la-darar should score lower than qiyas built
    // directly on the Qur'anic text about parents.
    const result = proveRuling("ruling(mistreat(aunt_maternal), haram)");
    const strengths = result.solutions.map((s) => chainStrength(s, core.evidence));
    expect(Math.max(...strengths)).toBeGreaterThan(Math.min(...strengths));
  });
});

describe("combinedConfidence", () => {
  it("equals the single strength when there is only one derivation", () => {
    expect(combinedConfidence([60])).toBe(60);
  });

  it("gives a modest, capped bump for corroboration", () => {
    const one = combinedConfidence([60]);
    const many = combinedConfidence([60, 55, 50, 45, 40]);
    expect(many).toBeGreaterThan(one);
    expect(many - one).toBeLessThanOrEqual(10);
  });

  it("never lets corroboration alone reach certainty from weak evidence", () => {
    const manyWeak = combinedConfidence(Array(20).fill(20));
    expect(manyWeak).toBeLessThan(40);
  });

  it("stays within 0-100", () => {
    expect(combinedConfidence([100, 100, 100])).toBeLessThanOrEqual(100);
    expect(combinedConfidence([0])).toBeGreaterThanOrEqual(0);
  });

  it("returns zero for no derivations", () => {
    expect(combinedConfidence([])).toBe(0);
  });
});

describe("groupByOutcome", () => {
  it("buckets solutions by their bound ruling value", () => {
    const groups = groupByOutcome(proveRuling("ruling(mistreat(aunt_maternal), H)"), core.evidence);
    expect(groups).toHaveLength(1);
    expect(groups[0].outcome).toBe("haram");
    expect(groups[0].derivations).toHaveLength(5);
  });

  it("sorts groups by confidence descending", () => {
    const groups = groupByOutcome(proveRuling("ruling(consume(carrion), H)", starving), starving.evidence);
    expect(groups[0].confidence).toBeGreaterThanOrEqual(groups[1].confidence);
  });

  it("picks the strongest derivation as the group representative", () => {
    const groups = groupByOutcome(proveRuling("ruling(mistreat(aunt_maternal), H)"), core.evidence);
    const strengths = groups[0].derivations.map((d) => d.strength);
    expect(groups[0].best.strength).toBe(Math.max(...strengths));
  });

  it("ignores solutions that do not bind H to a hukm", () => {
    const groups = groupByOutcome(proveRuling("kin(mother, ego)"), core.evidence);
    expect(groups).toHaveLength(0);
  });
});

describe("murajjihat", () => {
  it("prefers a khass text over an amm text", () => {
    const kb = new KnowledgeBase(
      parseProgram(
        `
        ruling(act, haram) :- general_rule.
        ruling(act, mubah) :- specific_rule.
        general_rule.
        specific_rule.
        `,
        { sourceName: "t" }
      )
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "quran", reference: "general verse", scope: "amm" },
      { clauseId: "t:1", kind: "quran", reference: "specific verse", scope: "khass" },
      { clauseId: "t:2", kind: "ontology", reference: "x" },
      { clauseId: "t:3", kind: "ontology", reference: "x" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
    expect(result?.verdict).toBe("mubah");
    expect(result?.resolution[0].rule).toBe("specificity");
  });

  it("prefers qati thubut over zanni thubut before considering source rank", () => {
    const kb = new KnowledgeBase(
      parseProgram("ruling(act, haram) :- r1. ruling(act, mubah) :- r2. r1. r2.", {
        sourceName: "t",
      })
    );
    // Deliberately give the weaker-thubut side the higher-ranked source kind,
    // so a correct implementation must check thubut first.
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "quran", reference: "a", thubut: "zanni" },
      { clauseId: "t:1", kind: "qiyas", reference: "b", thubut: "qati" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
    expect(result?.verdict).toBe("mubah");
    expect(result?.resolution[0].rule).toBe("thubut");
  });

  it("falls back to source kind rank (directness) when no textual attribute decides", () => {
    const kb = new KnowledgeBase(
      parseProgram("ruling(act, haram) :- r1. ruling(act, mubah) :- r2. r1. r2.", {
        sourceName: "t",
      })
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "quran", reference: "a" },
      { clauseId: "t:1", kind: "qiyas", reference: "b" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
    expect(result?.verdict).toBe("haram");
    expect(result?.resolution[0].rule).toBe("directness");
  });

  it("reports unresolved when every rule ties", () => {
    const kb = new KnowledgeBase(
      parseProgram("ruling(act, haram) :- r1. ruling(act, mubah) :- r2. r1. r2.", {
        sourceName: "t",
      })
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "qiyas", reference: "a" },
      { clauseId: "t:1", kind: "qiyas", reference: "b" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
    expect(result?.contested).toBe(true);
    expect(result?.unresolved).toBe(true);
    expect(result?.verdict).toBeUndefined();
  });

  it("lets a real margin in overall strength decide as the final fallback", () => {
    const kb = new KnowledgeBase(
      parseProgram("ruling(act, haram) :- r1. ruling(act, mubah) :- r2. r1. r2.", {
        sourceName: "t",
      })
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "sunnah", reference: "a", grade: "sahih" },
      { clauseId: "t:1", kind: "sunnah", reference: "b", grade: "daif" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
    expect(result?.resolution.at(-1)?.rule).toBe("transmission-grade");
    expect(result?.verdict).toBe("haram");
  });

  describe("abrogation", () => {
    it("lets a nasikh text override the text it names as abrogated", () => {
      const kb = new KnowledgeBase(
        parseProgram("ruling(act, haram) :- old_rule. ruling(act, mubah) :- new_rule. old_rule. new_rule.", {
          sourceName: "t",
        })
      );
      const evidence = new EvidenceStore([
        { clauseId: "t:0", kind: "quran", reference: "earlier verse" },
        { clauseId: "t:1", kind: "quran", reference: "later verse", abrogation: "nasikh", abrogates: "t:0" },
      ]);
      const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
      expect(result?.verdict).toBe("mubah");
      expect(result?.resolution[0].rule).toBe("abrogation");
    });
  });
});

describe("uncontested and related-opinion handling", () => {
  it("does not contest a mild disagreement (mubah vs makruh)", () => {
    const kb = new KnowledgeBase(
      parseProgram("ruling(act, mubah) :- r1. ruling(act, makruh) :- r2. r1. r2.", {
        sourceName: "t",
      })
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "qiyas", reference: "a" },
      { clauseId: "t:1", kind: "qiyas", reference: "b" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);
    expect(result?.contested).toBe(false);
    expect(result?.relatedOpinions).toHaveLength(1);
  });

  it("has a single confident verdict for the aunt case with no contest", () => {
    const result = weighRuling(proveRuling("ruling(mistreat(aunt_maternal), H)"), core.evidence);
    expect(result?.contested).toBe(false);
    expect(result?.verdict).toBe("haram");
    expect(result?.groups[0].confidence).toBeGreaterThan(50);
  });

  it("classifies related opinions against the surviving verdict, not the opening leader", () => {
    /*
     * wajib leads on confidence, mandub sits one step from it (not a
     * contradiction) and haram sits four steps away (a contradiction that
     * haram goes on to win). Splitting contested from related against the
     * opening leader filed mandub as "related" and left it there, so the
     * result advertised "do this, it's rewarded" as compatible with a haram
     * verdict three steps away from it.
     */
    const kb = new KnowledgeBase(
      parseProgram(
        "ruling(act, wajib) :- r1. ruling(act, mandub) :- r2. ruling(act, haram) :- r3. r1. r2. r3.",
        { sourceName: "t" }
      )
    );
    const evidence = new EvidenceStore([
      // Leads on confidence (77) but is only probably transmitted.
      { clauseId: "t:0", kind: "sunnah", reference: "wajib report", grade: "sahih", thubut: "zanni" },
      // Second on confidence (63); one step from wajib, three from haram.
      { clauseId: "t:1", kind: "istihsan", reference: "mandub position", grade: "sahih" },
      // Last on confidence (60), but certainly transmitted, which decides it.
      { clauseId: "t:2", kind: "qaida", reference: "prohibition maxim", grade: "hasan", thubut: "qati" },
      { clauseId: "t:3", kind: "ontology", reference: "def" },
      { clauseId: "t:4", kind: "ontology", reference: "def" },
      { clauseId: "t:5", kind: "ontology", reference: "def" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);

    expect(result?.groups[0].outcome).toBe("wajib"); // pins the fixture's ordering
    expect(result?.verdict).toBe("haram");
    // mandub contradicts haram, so it must not be presented as merely related.
    expect(result?.relatedOpinions.map((g) => g.outcome)).not.toContain("mandub");
  });

  it("does not stay unresolved once a later challenger settles the question", () => {
    /*
     * mubah and wajib are backed by identical evidence, so every murajjih rule
     * ties between them and the first comparison deadlocks. The specific text
     * behind haram then beats both, and nothing that contradicts haram ties
     * with it — so the question is decided. Latching `unresolved` on that
     * first tie reported an open question the tournament had already settled.
     */
    const kb = new KnowledgeBase(
      parseProgram(
        "ruling(act, mubah) :- r1. ruling(act, wajib) :- r2. ruling(act, haram) :- r3. r1. r2. r3.",
        { sourceName: "t" }
      )
    );
    const evidence = new EvidenceStore([
      { clauseId: "t:0", kind: "sunnah", reference: "general report A", grade: "sahih", scope: "amm" },
      { clauseId: "t:1", kind: "sunnah", reference: "general report B", grade: "sahih", scope: "amm" },
      { clauseId: "t:2", kind: "sunnah", reference: "specific report", grade: "hasan", scope: "khass" },
      { clauseId: "t:3", kind: "ontology", reference: "def" },
      { clauseId: "t:4", kind: "ontology", reference: "def" },
      { clauseId: "t:5", kind: "ontology", reference: "def" },
    ]);
    const result = weighRuling(prove(parseQuery("ruling(act, H)"), kb), evidence);

    // The deadlocked pair leads on confidence; the decisive text is last.
    expect(result?.groups.at(-1)?.outcome).toBe("haram");
    expect(result?.verdict).toBe("haram");
    expect(result?.unresolved).toBe(false);
  });

  it("records each pairwise comparison once, despite the rematch after a displacement", () => {
    const result = weighRuling(proveRuling("ruling(consume(carrion), H)", starving), starving.evidence);
    const pairings = result!.resolution.map((s) => [s.winner, s.loser].sort().join("|"));
    expect(new Set(pairings).size).toBe(pairings.length);
  });
});

describe("end to end: the carrion conflict", () => {
  it("surfaces the real haram/mubah tension and resolves it correctly", () => {
    const result = weighRuling(proveRuling("ruling(consume(carrion), H)", starving), starving.evidence);
    expect(result?.contested).toBe(true);
    expect(result?.unresolved).toBe(false);
    // The classical, agreed answer: necessity permits it.
    expect(result?.verdict).toBe("mubah");
  });

  it("wins on specificity, not on raw strength", () => {
    // Sanity check on the fixture: haram's root text is 'amm and mubah's
    // chain is textually weaker at the mechanism level, so a naive strength
    // comparison would (wrongly) favour haram. This pins that specificity
    // is what actually decides it.
    const result = weighRuling(proveRuling("ruling(consume(carrion), H)", starving), starving.evidence);
    expect(result?.resolution).toHaveLength(1);
    expect(result?.resolution[0].rule).toBe("specificity");
  });

  it("names the actual verses in the explanation", () => {
    const result = weighRuling(proveRuling("ruling(consume(carrion), H)", starving), starving.evidence);
    const explanation = result?.resolution[0].explanation ?? "";
    expect(explanation).toContain("2:173");
    expect(explanation).toContain("5:3");
  });
});

describe("murajjih rule set shape", () => {
  it("orders chain-wide textual rules before mechanism rules", () => {
    const ids = MURAJJIH_RULES.map((r) => r.id);
    expect(ids.indexOf("specificity")).toBeLessThan(ids.indexOf("directness"));
    expect(ids.indexOf("thubut")).toBeLessThan(ids.indexOf("directness"));
  });

  it("does not include the overall-strength fallback in the main list", () => {
    // It must run strictly last, so it is applied separately by the caller.
    expect(MURAJJIH_RULES.map((r) => r.id)).not.toContain("overall-strength");
  });

  it("buildRuleInput resolves the root to the derivation's own mechanism, not a nested premise", () => {
    const result = proveRuling("ruling(consume(carrion), H)", starving);
    const mubah = result.solutions.find((s) => s.bindings.H && "name" in s.bindings.H && s.bindings.H.name === "mubah");
    const input = buildRuleInput(mubah!, core.evidence);
    // The root is the usul rule that concludes the ruling directly; the
    // necessity verse (2:173) is a body premise one level deeper, and is
    // picked up by the chain-wide scan instead, not the root-only one.
    expect(input.root.reference).toBe("al-darurat tubih al-mahzurat");
    expect(input.chain.some((e) => e.reference.includes("2:173"))).toBe(true);
  });

  it("overallStrength ties within the margin", () => {
    const a = { strength: 50 } as ReturnType<typeof buildRuleInput>;
    const b = { strength: 55 } as ReturnType<typeof buildRuleInput>;
    expect(overallStrength.compare(a, b)).toBe("tie");
  });

  it("overallStrength decides beyond the margin", () => {
    const a = { strength: 50 } as ReturnType<typeof buildRuleInput>;
    const b = { strength: 90 } as ReturnType<typeof buildRuleInput>;
    expect(overallStrength.compare(a, b)).toBe("b");
  });
});
