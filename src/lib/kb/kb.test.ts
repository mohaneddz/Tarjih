import { describe, expect, it } from "vitest";

import { KnowledgeBase } from "../engine/kb";
import { parseClause, parseProgram } from "../logic/parse";
import { baseStrength, EvidenceStore } from "./evidence";
import type { Evidence } from "./evidence";
import {
  conflictSeverity,
  contradicts,
  isHukm,
  lookupPredicate,
  PREDICATES,
  predicateKeys,
} from "./ontology";
import { validateClause, validateKb } from "./validate";

function codes(issues: { code: string }[]): string[] {
  return issues.map((i) => i.code);
}

describe("ontology", () => {
  it("registers every predicate under name/arity", () => {
    expect(lookupPredicate("ruling", 2)?.group).toBe("deontic");
    expect(lookupPredicate("ruling", 3)).toBeUndefined();
  });

  it("has no duplicate predicate signatures", () => {
    const keys = predicateKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("documents every predicate with an example", () => {
    for (const p of PREDICATES) {
      expect(p.meaning.length, `${p.name}/${p.arity} meaning`).toBeGreaterThan(10);
      expect(p.example, `${p.name}/${p.arity} example`).toContain(p.name);
    }
  });

  it("keeps illah and hikma as separate predicates", () => {
    // Conflating them would let qiyas be built on the hidden wisdom of a
    // ruling, which most usulis reject.
    expect(lookupPredicate("illah", 2)).toBeDefined();
    expect(lookupPredicate("hikma", 2)).toBeDefined();
  });

  it("recognises the five ahkam and nothing else", () => {
    expect(isHukm("haram")).toBe(true);
    expect(isHukm("mubah")).toBe(true);
    expect(isHukm("forbidden")).toBe(false);
    expect(isHukm("sahih")).toBe(false);
  });

  describe("conflict severity", () => {
    it("is zero for identical rulings", () => {
      expect(conflictSeverity("haram", "haram")).toBe(0);
    });

    it("is maximal between obligatory and forbidden", () => {
      expect(conflictSeverity("wajib", "haram")).toBe(4);
    });

    it("is small between adjacent rulings", () => {
      expect(conflictSeverity("mubah", "makruh")).toBe(1);
    });

    it("treats only wide gaps as true contradictions", () => {
      // wajib vs haram must be resolved; mubah vs makruh is ordinary
      // scholarly spread and can be presented as a range.
      expect(contradicts("wajib", "haram")).toBe(true);
      expect(contradicts("mandub", "haram")).toBe(true);
      expect(contradicts("mubah", "makruh")).toBe(false);
      expect(contradicts("mandub", "mubah")).toBe(false);
    });

    it("is symmetric", () => {
      expect(conflictSeverity("wajib", "makruh")).toBe(conflictSeverity("makruh", "wajib"));
    });
  });
});

describe("evidence", () => {
  const base: Evidence = { clauseId: "c1", kind: "sunnah", reference: "Sahih al-Bukhari 1" };

  it("returns a neutral placeholder for an unknown clause rather than throwing", () => {
    const store = new EvidenceStore();
    const e = store.getOrUnknown("missing");
    expect(e.kind).toBe("ontology");
    expect(baseStrength(e)).toBe(0);
  });

  it("stores and retrieves records", () => {
    const store = new EvidenceStore([base]);
    expect(store.get("c1")?.reference).toBe("Sahih al-Bukhari 1");
    expect(store.has("c1")).toBe(true);
    expect(store.size).toBe(1);
  });

  describe("baseStrength", () => {
    it("ranks Qur'an above a sound hadith", () => {
      const quran = baseStrength({ clauseId: "q", kind: "quran", reference: "17:23" });
      const hadith = baseStrength({ ...base, grade: "sahih" });
      expect(quran).toBeGreaterThan(hadith);
    });

    it("ranks mutawatir above ahad", () => {
      expect(baseStrength({ ...base, grade: "mutawatir" })).toBeGreaterThan(
        baseStrength({ ...base, grade: "sahih" })
      );
    });

    it("ranks sahih above hasan above daif", () => {
      const s = baseStrength({ ...base, grade: "sahih" });
      const h = baseStrength({ ...base, grade: "hasan" });
      const d = baseStrength({ ...base, grade: "daif" });
      expect(s).toBeGreaterThan(h);
      expect(h).toBeGreaterThan(d);
    });

    it("gives a fabricated report zero weight regardless of anything else", () => {
      expect(baseStrength({ ...base, kind: "quran", grade: "mawdu" })).toBe(0);
    });

    it("gives an abrogated text zero weight", () => {
      expect(baseStrength({ ...base, grade: "sahih", abrogation: "mansukh" })).toBe(0);
    });

    it("discounts speculative transmission and speculative indication separately", () => {
      const full = baseStrength({ ...base, grade: "sahih" });
      const weakThubut = baseStrength({ ...base, grade: "sahih", thubut: "zanni" });
      const weakDalala = baseStrength({ ...base, grade: "sahih", dalala: "zanni" });
      expect(weakThubut).toBeLessThan(full);
      expect(weakDalala).toBeLessThan(full);
    });

    it("discounts unreviewed machine formalisations", () => {
      expect(baseStrength({ ...base, grade: "sahih", unreviewed: true })).toBeLessThan(
        baseStrength({ ...base, grade: "sahih" })
      );
    });

    it("gives ontology scaffolding no juristic weight", () => {
      expect(baseStrength({ clauseId: "o", kind: "ontology", reference: "definition" })).toBe(0);
    });

    it("stays within 0-100", () => {
      for (const e of [
        { ...base, kind: "quran" as const, grade: "mutawatir" as const },
        { ...base, grade: "daif" as const, thubut: "zanni" as const, dalala: "zanni" as const },
      ]) {
        const s = baseStrength(e);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    });
  });
});

describe("clause validation", () => {
  it("accepts a well-formed clause", () => {
    const c = parseClause("ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), darar).");
    expect(validateClause(c)).toEqual([]);
  });

  it("rejects an unknown predicate", () => {
    const c = parseClause("frobnicate(X) :- kin(X, ego).");
    expect(codes(validateClause(c))).toContain("unknown-predicate");
  });

  it("names the correct arity when only the arity is wrong", () => {
    const c = parseClause("ruling(mistreat(aunt)).");
    const issue = validateClause(c)[0];
    expect(issue.code).toBe("unknown-predicate");
    expect(issue.message).toContain("arity 2");
  });

  it("rejects a ruling value outside the five ahkam", () => {
    const c = parseClause("ruling(mistreat(aunt), forbidden).");
    expect(codes(validateClause(c))).toContain("invalid-hukm");
  });

  it("accepts a variable in the ruling position", () => {
    // Legitimate: this is how a query or a general transfer rule is written.
    const c = parseClause("ruling(X, H) :- illah(X, C), illah(Y, C), ruling(Y, H).");
    expect(codes(validateClause(c))).not.toContain("invalid-hukm");
  });

  it("rejects a rule whose head variable is never bound by the body", () => {
    // This would conclude a ruling about literally every act.
    const c = parseClause("ruling(X, haram) :- necessity(starvation).");
    expect(codes(validateClause(c))).toContain("unbound-head-variable");
  });

  it("allows unbound variables in a fact", () => {
    // A fact has no body, so there is nothing to bind against.
    const c = parseClause("subclass(X, X).");
    expect(codes(validateClause(c))).not.toContain("unbound-head-variable");
  });

  it("reports several issues at once", () => {
    const c = parseClause("ruling(X, verboten) :- nonsense(Y).");
    const found = codes(validateClause(c));
    expect(found).toContain("invalid-hukm");
    expect(found).toContain("unknown-predicate");
  });

  describe("query-supplied predicates", () => {
    /*
     * A clause may depend on the asker's circumstance but must never assert
     * one. `circumstance(starvation).` in the KB is not a fact about the law,
     * it is a claim that everyone who asks is starving — which hands every
     * concession keyed on it to every asker, the exact bug the predicate
     * exists to prevent. The formalisation pipeline is the likeliest source,
     * since it proposes clauses from text, but a hand-authored one would be
     * just as wrong, so the check lives with the other KB invariants.
     */
    it("refuses a clause that asserts a circumstance as a fact", () => {
      const c = parseClause("circumstance(starvation).");
      expect(codes(validateClause(c))).toContain("asserts-query-predicate");
    });

    it("refuses a rule that concludes one", () => {
      const c = parseClause("circumstance(S) :- necessity(S).");
      expect(codes(validateClause(c))).toContain("asserts-query-predicate");
    });

    it("allows a clause that merely depends on one", () => {
      const c = parseClause("ruling(consume(x), mubah) :- circumstance(starvation).");
      expect(codes(validateClause(c))).not.toContain("asserts-query-predicate");
    });
  });
});

describe("KB validation", () => {
  function kbOf(src: string) {
    return new KnowledgeBase(parseProgram(src, { sourceName: "kb" }));
  }

  it("passes a coherent KB", () => {
    const kb = kbOf(`
      ruling(mistreat(X), haram) :- kin(X, ego), causes(mistreat(X), darar).
      kin(aunt, ego).
      causes(mistreat(aunt), darar).
    `);
    const store = new EvidenceStore([
      { clauseId: "kb:0", kind: "qaida", reference: "la darar wa la dirar" },
      { clauseId: "kb:1", kind: "ontology", reference: "definition" },
      { clauseId: "kb:2", kind: "sunnah", reference: "Sahih al-Bukhari 5971", grade: "sahih" },
    ]);
    expect(validateKb(kb, store).ok).toBe(true);
  });

  it("warns about a body goal nothing defines", () => {
    const kb = kbOf("ruling(X, haram) :- kin(X, ego), causes_harmm(X, darar). kin(a, ego).");
    expect(codes([...validateKb(kb).warnings])).toContain("dangling-goal");
  });

  it("warns about clauses with no evidence record", () => {
    const kb = kbOf("kin(aunt, ego).");
    const result = validateKb(kb, new EvidenceStore());
    expect(codes([...result.warnings])).toContain("missing-evidence");
  });

  it("errors on a fabricated source present in the store", () => {
    const kb = kbOf("kin(aunt, ego).");
    const store = new EvidenceStore([
      { clauseId: "kb:0", kind: "sunnah", reference: "somewhere", grade: "mawdu" },
    ]);
    const result = validateKb(kb, store);
    expect(result.ok).toBe(false);
    expect(codes([...result.errors])).toContain("fabricated-source");
  });

  it("warns when an abrogated text does not say what abrogated it", () => {
    const kb = kbOf("kin(aunt, ego).");
    const store = new EvidenceStore([
      { clauseId: "kb:0", kind: "sunnah", reference: "x", abrogation: "mansukh" },
    ]);
    expect(codes([...validateKb(kb, store).warnings])).toContain("unlinked-abrogation");
  });

  it("visits every clause exactly once", () => {
    const kb = kbOf("kin(a, ego). kin(b, ego). kin(c, ego).");
    const result = validateKb(kb, new EvidenceStore());
    const missing = result.warnings.filter((w) => w.code === "missing-evidence");
    expect(missing).toHaveLength(3);
    expect(new Set(missing.map((m) => m.clauseId)).size).toBe(3);
  });
});
