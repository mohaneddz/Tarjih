import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import type { Solution } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { kbStatistics } from "../entry";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

/** Distinct rulings derived for a goal, with how many derivations reached each. */
function verdicts(query: string): Map<string, Solution[]> {
  const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
  const grouped = new Map<string, Solution[]>();
  for (const s of result.solutions) {
    const hukm = termToString(s.bindings.H);
    grouped.set(hukm, [...(grouped.get(hukm) ?? []), s]);
  }
  return grouped;
}

/** Every clause id used across all derivations of a query. */
function supportingClauses(query: string): Set<string> {
  const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
  const ids = new Set<string>();
  for (const s of result.solutions) for (const id of s.clauseIds) ids.add(id);
  return ids;
}

describe("core knowledge base", () => {
  it("loads and validates without errors", () => {
    expect(core.report.errors).toEqual([]);
  });

  it("has no dangling body goals", () => {
    const dangling = core.report.warnings.filter((w) => w.code === "dangling-goal");
    expect(dangling).toEqual([]);
  });

  it("gives every clause an evidence record", () => {
    const missing = core.report.warnings.filter((w) => w.code === "missing-evidence");
    expect(missing).toEqual([]);
  });

  it("is entirely human-reviewed", () => {
    expect(kbStatistics(core).unreviewed).toBe(0);
  });

  it("uses unique clause ids", () => {
    const ids = core.clauses.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("taxonomy", () => {
  it("derives inherited class membership through the hierarchy", () => {
    // aunt_maternal -> collateral_kin -> rahim -> kin, none of it asserted directly.
    const result = prove(parseQuery("instance_of(aunt_maternal, kin)"), core.kb);
    expect(result.solutions.length).toBeGreaterThan(0);
  });

  it("computes the transitive closure over subclasses", () => {
    const result = prove(parseQuery("subclass_of(collateral_kin, kin)"), core.kb);
    expect(result.solutions.length).toBeGreaterThan(0);
  });

  it("keeps relatives by marriage outside rahim", () => {
    // They are kin, but the severing-kinship texts address the womb-tie only.
    expect(prove(parseQuery("subclass_of(affinal_kin, kin)"), core.kb).solutions.length)
      .toBeGreaterThan(0);
    expect(prove(parseQuery("subclass_of(affinal_kin, rahim)"), core.kb).solutions).toHaveLength(0);
  });

  it("does not invent membership that was never asserted", () => {
    expect(prove(parseQuery("instance_of(stranger, rahim)"), core.kb).solutions).toHaveLength(0);
  });
});

describe("case: is mistreating a maternal aunt forbidden?", () => {
  const query = "ruling(mistreat(aunt_maternal), H)";

  it("concludes haram", () => {
    const found = verdicts(query);
    expect([...found.keys()]).toEqual(["haram"]);
  });

  it("reaches it by more than one independent route", () => {
    // This is the corroboration the tarjih layer is meant to recognise.
    expect(verdicts(query).get("haram")!.length).toBeGreaterThan(1);
  });

  it("derives it from the severing-kinship text", () => {
    expect(supportingClauses(query)).toContain("bukhari:5984:severing-kinship");
  });

  it("derives it by analogy from the ruling on parents", () => {
    const clauses = supportingClauses(query);
    expect(clauses).toContain("usul:qiyas");
    expect(clauses).toContain("quran:17-23:parents");
  });

  it("derives it from the no-harm maxim", () => {
    expect(supportingClauses(query)).toContain("qaida:la-darar");
  });

  it("does not reach the conclusion through an unguarded analogy", () => {
    // The qiyas rule requires generalisable/1 to be asserted for the source
    // case; every derivation using it must therefore include that assertion.
    const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
    for (const s of result.solutions) {
      if (s.clauseIds.includes("usul:qiyas")) {
        expect(s.clauseIds).toContain("quran:17-23:generalisable");
      }
    }
  });

  it("finds nothing for a person who is not a relative", () => {
    expect(prove(parseQuery("ruling(mistreat(stranger), H)"), core.kb).solutions).toHaveLength(0);
  });

  it("terminates without exhausting any budget", () => {
    const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
    expect(result.truncated).toBe(false);
  });
});

describe("case: eating carrion under starvation", () => {
  const query = "ruling(consume(carrion), H)";

  it("derives both the prohibition and the concession", () => {
    // Both are genuinely textual, from the same Qur'anic passage. The engine
    // must surface the tension rather than silently pick a side.
    const found = verdicts(query);
    expect([...found.keys()].sort()).toEqual(["haram", "mubah"]);
  });

  it("grounds the prohibition in the prohibiting verse", () => {
    expect(supportingClauses(query)).toContain("quran:5-3:forbidden-foods");
  });

  it("grounds the concession in the necessity verse", () => {
    const clauses = supportingClauses(query);
    expect(clauses).toContain("quran:2-173:necessity");
    expect(clauses).toContain("usul:darura-lifts-prohibition");
  });

  it("applies the same conflict to any forbidden food", () => {
    expect([...verdicts("ruling(consume(swine), H)").keys()].sort()).toEqual(["haram", "mubah"]);
  });

  it("permits nothing that is not a forbidden food to begin with", () => {
    expect(prove(parseQuery("ruling(consume(bread), H)"), core.kb).solutions).toHaveLength(0);
  });
});

describe("guards on derivation", () => {
  it("refuses an analogy whose source case is not marked generalisable", () => {
    // aunt_paternal has an 'illa asserted but is never marked generalisable,
    // so it must not itself serve as the source of a further analogy.
    const result = prove(parseQuery("generalisable(mistreat(aunt_paternal))"), core.kb);
    expect(result.solutions).toHaveLength(0);
  });

  it("does not let qiyas prove a ruling from itself", () => {
    // Guarded by the prover's variant loop check rather than an explicit
    // inequality; this pins the behaviour so a later change cannot lose it.
    const result = prove(parseQuery("ruling(mistreat(aunt_maternal), H)"), core.kb, {
      maxSolutions: 200,
    });
    for (const s of result.solutions) {
      // No derivation should use the qiyas rule more than once in a chain
      // that returns to the same act.
      const qiyasUses = countClause(s, "usul:qiyas");
      expect(qiyasUses).toBeLessThanOrEqual(1);
    }
  });

  it("requires a real necessity, not merely an asserted exception", () => {
    // `excepted/2` alone must not lift a prohibition.
    const result = prove(parseQuery("ruling(consume(carrion), mubah)"), core.kb, {
      maxSolutions: 50,
    });
    for (const s of result.solutions) {
      expect(s.clauseIds).toContain("fact:starvation-is-necessity");
    }
  });
});

function countClause(solution: Solution, clauseId: string): number {
  let count = 0;
  const walk = (node: { clauseId: string; children: readonly { clauseId: string; children: readonly unknown[] }[] }) => {
    if (node.clauseId === clauseId) count++;
    for (const c of node.children) walk(c as Parameters<typeof walk>[0]);
  };
  for (const p of solution.proofs) walk(p);
  return count;
}

describe("KB statistics", () => {
  it("reports a sane breakdown", () => {
    const stats = kbStatistics(core);
    expect(stats.clauses).toBe(core.clauses.length);
    expect(stats.facts + stats.rules).toBe(stats.clauses);
    expect(stats.byKind.quran).toBeGreaterThan(0);
    expect(stats.byKind.sunnah).toBeGreaterThan(0);
    expect(stats.byKind.qaida).toBeGreaterThan(0);
  });
});
