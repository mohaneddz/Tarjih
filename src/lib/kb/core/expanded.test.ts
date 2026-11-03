import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { VALIDITY_AXIS, weighRuling } from "../../tarjih/weigh";
import { withPremises } from "../premises";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function scoped(situations: readonly string[]) {
  return situations.length
    ? withPremises(core, parseQuery(situations.map((s) => `circumstance(${s})`).join(", ")))
    : core;
}

function verdict(query: string, situations: readonly string[] = []) {
  const kb = scoped(situations);
  return weighRuling(prove(parseQuery(query), kb.kb, { maxSolutions: 200 }), kb.evidence)?.verdict;
}

function validity(query: string, situations: readonly string[] = []) {
  const kb = scoped(situations);
  return weighRuling(prove(parseQuery(query), kb.kb, { maxSolutions: 200 }), kb.evidence, VALIDITY_AXIS)?.verdict;
}

describe("prayer", () => {
  it("makes Friday prayer obligatory on men, not on women", () => {
    expect(verdict("ruling(perform(friday_prayer), H)", ["male"])).toBe("wajib");
    expect(verdict("ruling(perform(friday_prayer), H)", ["female"])).toBe("mubah");
    expect(verdict("ruling(perform(friday_prayer), H)")).toBeUndefined();
  });

  it("forbids a man to miss Friday prayer, unless he is ill", () => {
    expect(verdict("ruling(omit(friday_prayer), H)", ["male"])).toBe("haram");
    expect(verdict("ruling(omit(friday_prayer), H)", ["male", "illness"])).toBe("mubah");
    expect(verdict("ruling(perform(friday_prayer), H)", ["male", "illness"])).toBe("mubah");
  });

  it("lets the sick pray seated, and the prayer counts", () => {
    expect(verdict("ruling(perform(sitting_prayer), H)")).toBe("haram");
    expect(verdict("ruling(perform(sitting_prayer), H)", ["illness"])).toBe("mubah");
    expect(validity("validity(perform(sitting_prayer), V)", ["illness"])).toBe("sahih");
  });

  it("lets a traveller combine prayers, over the Hanafi reading", () => {
    const kb = scoped(["travel"]);
    const result = weighRuling(
      prove(parseQuery("ruling(perform(combined_prayers), H)"), kb.kb, { maxSolutions: 200 }),
      kb.evidence
    );
    expect(result?.verdict).toBe("mubah");
    expect(result?.contested).toBe(true);
    expect(result?.resolution[0]?.rule).toBe("specificity");
  });

  it("records witr and night prayer as recommended", () => {
    expect(verdict("ruling(perform(witr), H)")).toBe("mandub");
    expect(verdict("ruling(perform(night_prayer), H)")).toBe("mandub");
  });

  it("permits wiping over leather socks", () => {
    expect(verdict("ruling(perform(wiping_over_khuffs), H)")).toBe("mubah");
  });

  it("forbids touching the mushaf without purity, and says nothing without the premise", () => {
    expect(verdict("ruling(touch(mushaf), H)", ["ritual_impurity"])).toBe("haram");
    expect(verdict("ruling(touch(mushaf), H)")).toBeUndefined();
  });
});

describe("fasting", () => {
  it("keeps the fast of someone who ate forgetting they were fasting", () => {
    expect(validity("validity(perform(fasting), V)", ["ate_forgetfully"])).toBe("sahih");
    expect(validity("validity(perform(fasting), V)")).toBeUndefined();
  });

  it("permits a fasting spouse a kiss", () => {
    expect(verdict("ruling(kiss(spouse), H)", ["currently_fasting"])).toBe("mubah");
  });

  it("excuses the pregnant and the nursing from the fast", () => {
    expect(verdict("ruling(omit(fasting), H)", ["pregnant"])).toBe("mubah");
    expect(verdict("ruling(omit(fasting), H)", ["nursing"])).toBe("mubah");
    expect(verdict("ruling(omit(fasting), H)")).toBe("haram");
  });

  it("forbids fasting on Eid, and such a fast is void", () => {
    expect(verdict("ruling(perform(eid_fast), H)")).toBe("haram");
    expect(validity("validity(perform(eid_fast), V)")).toBe("batil");
  });

  it("recommends 'Arafa and 'Ashura, and dislikes Friday alone", () => {
    expect(verdict("ruling(perform(arafah_fast), H)")).toBe("mandub");
    expect(verdict("ruling(perform(ashura_fast), H)")).toBe("mandub");
    expect(verdict("ruling(perform(friday_only_fast), H)")).toBe("makruh");
  });
});

describe("marriage", () => {
  it("permits marrying a woman of the Book, forbids a Muslim woman a non-Muslim husband", () => {
    expect(verdict("ruling(marry(christian_or_jewish_woman), H)")).toBe("mubah");
    expect(verdict("ruling(marry(non_muslim_man), H)")).toBe("haram");
    expect(validity("validity(marry(non_muslim_man), V)")).toBe("batil");
  });

  it("forbids a polytheist, a fifth wife, and a woman in her waiting period — and voids each", () => {
    for (const who of ["polytheist_woman", "fifth_wife", "woman_in_iddah"]) {
      expect(verdict(`ruling(marry(${who}), H)`), who).toBe("haram");
      expect(validity(`validity(marry(${who}), V)`), who).toBe("batil");
    }
  });

  it("permits divorce, and lets the weak 'most hated' report stand only as a related opinion", () => {
    const result = weighRuling(prove(parseQuery("ruling(divorce(wife), H)"), core.kb, { maxSolutions: 200 }), core.evidence);
    expect(result?.verdict).toBe("mubah");
    expect(result?.relatedOpinions.map((g) => g.outcome)).toEqual(["makruh"]);
  });

  it("forbids divorce during menstruation, which still takes effect", () => {
    expect(verdict("ruling(divorce(wife_during_menstruation), H)")).toBe("haram");
    expect(validity("validity(divorce(wife_during_menstruation), V)")).toBe("sahih");
  });

  it("permits contraception, recommends caring for an orphan, forbids taking over their lineage", () => {
    expect(verdict("ruling(use(contraception), H)")).toBe("mubah");
    expect(verdict("ruling(care_for(orphan), H)")).toBe("mandub");
    expect(verdict("ruling(give_surname_to(adopted_child), H)")).toBe("haram");
  });
});

describe("ethics", () => {
  it("forbids the grave sins against life and property", () => {
    for (const act of ["suicide", "murder", "theft"]) {
      expect(verdict(`ruling(commit(${act}), H)`), act).toBe("haram");
    }
  });

  it("forbids magic, fortune-tellers, spying, mockery, tattoos, and gold or silver vessels", () => {
    expect(verdict("ruling(practise(magic), H)")).toBe("haram");
    expect(verdict("ruling(consult(fortune_teller), H)")).toBe("haram");
    expect(verdict("ruling(spy_on(someone), H)")).toBe("haram");
    expect(verdict("ruling(mock(someone), H)")).toBe("haram");
    expect(verdict("ruling(get(tattoo), H)")).toBe("haram");
    expect(verdict("ruling(use(gold_or_silver_vessel), H)")).toBe("haram");
  });

  it("obliges returning salam, and recommends offering it", () => {
    expect(verdict("ruling(return(greeting_of_peace), H)")).toBe("wajib");
    expect(verdict("ruling(give(greeting_of_peace), H)")).toBe("mandub");
  });

  it("obliges fulfilling contracts, and expiation only once an oath is broken", () => {
    expect(verdict("ruling(fulfil(contract), H)")).toBe("wajib");
    expect(verdict("ruling(pay(oath_expiation), H)", ["broke_oath"])).toBe("wajib");
    expect(verdict("ruling(pay(oath_expiation), H)")).toBeUndefined();
  });

  it("reaches tobacco through the harm maxim, and shows that it is reasoned", () => {
    const result = weighRuling(prove(parseQuery("ruling(consume(tobacco), H)"), core.kb, { maxSolutions: 200 }), core.evidence);
    expect(result?.verdict).toBe("haram");
    expect(result?.groups[0].derivations[0].solution.clauseIds).toContain("qaida:la-darar");
    expect(result?.groups[0].confidence).toBeLessThan(60);
  });
});

describe("trade", () => {
  it("forbids selling wine, swine and carrion; a sale of wine is void", () => {
    for (const item of ["khamr", "swine", "carrion"]) {
      expect(verdict(`ruling(sell(${item}), H)`), item).toBe("haram");
    }
    expect(validity("validity(sell(khamr), V)")).toBe("batil");
  });

  it("forbids selling what one does not have, but not salam", () => {
    expect(verdict("ruling(sell(goods_not_owned), H)")).toBe("haram");
    expect(verdict("ruling(sell(salam_contract), H)")).toBe("mubah");
  });

  it("forbids hoarding, hiding defects, and cutting in on another's sale", () => {
    expect(verdict("ruling(hoard(staple_food), H)")).toBe("haram");
    expect(verdict("ruling(sell(goods_with_concealed_defect), H)")).toBe("haram");
    expect(verdict("ruling(sell(offer_undercutting_a_sale), H)")).toBe("haram");
  });
});

describe("animals", () => {
  it("permits livestock, chicken, rabbit and dabb", () => {
    for (const animal of ["camel", "cow", "sheep", "goat", "chicken", "rabbit", "dabb_lizard"]) {
      expect(verdict(`ruling(consume(${animal}), H)`), animal).toBe("mubah");
    }
  });

  it("forbids birds of prey and more predators, with the necessity exception reaching them", () => {
    for (const animal of ["eagle", "hawk", "falcon", "vulture", "tiger", "leopard"]) {
      expect(verdict(`ruling(consume(${animal}), H)`), animal).toBe("haram");
    }
    expect(verdict("ruling(consume(eagle), H)", ["starvation"])).toBe("mubah");
  });

  it("permits the meat of the People of the Book", () => {
    expect(verdict("ruling(consume(ahl_al_kitab_meat), H)")).toBe("mubah");
  });

  it("permits shrimp, with the Hanafi dislike beside it", () => {
    const result = weighRuling(prove(parseQuery("ruling(consume(shrimp), H)"), core.kb, { maxSolutions: 200 }), core.evidence);
    expect(result?.verdict).toBe("mubah");
    expect(result?.relatedOpinions.map((g) => g.outcome)).toEqual(["makruh"]);
  });
});

describe("charity", () => {
  it("obliges zakat al-fitr and recommends voluntary charity", () => {
    expect(verdict("ruling(pay(zakat_al_fitr), H)")).toBe("wajib");
    expect(verdict("ruling(give(voluntary_charity), H)")).toBe("mandub");
  });
});

describe("second batch", () => {
  it("voids a prayer without purity while the duty to pray stands", () => {
    expect(validity("validity(perform(obligatory_prayer), V)", ["ritual_impurity"])).toBe("batil");
    expect(verdict("ruling(perform(obligatory_prayer), H)", ["ritual_impurity"])).toBe("wajib");
  });

  it("obliges making up a missed prayer, recommends congregation and the voluntary fasts", () => {
    expect(verdict("ruling(make_up(obligatory_prayer), H)", ["missed_prayer"])).toBe("wajib");
    expect(verdict("ruling(perform(congregational_prayer), H)")).toBe("mandub");
    expect(verdict("ruling(perform(shawwal_fast), H)")).toBe("mandub");
    expect(verdict("ruling(perform(monday_thursday_fast), H)")).toBe("mandub");
  });

  it("obliges obeying parents, except in sin", () => {
    expect(verdict("ruling(obey(parents), H)")).toBe("wajib");
    expect(verdict("ruling(obey(parents), H)", ["parents_command_sin"])).toBe("haram");
  });

  it("covers slander, hijab, imitation, the left hand, visiting the sick and cats", () => {
    expect(verdict("ruling(speak(slander), H)")).toBe("haram");
    expect(verdict("ruling(wear(hijab), H)", ["female"])).toBe("wajib");
    expect(verdict("ruling(imitate(opposite_sex), H)")).toBe("haram");
    expect(verdict("ruling(eat_with(left_hand), H)")).toBe("makruh");
    expect(verdict("ruling(visit(sick_person), H)")).toBe("mandub");
    expect(verdict("ruling(keep(cat), H)")).toBe("mubah");
  });

  it("forbids perfume and haircuts only in ihram", () => {
    expect(verdict("ruling(use(perfume), H)", ["ihram"])).toBe("haram");
    expect(verdict("ruling(get(haircut), H)", ["ihram"])).toBe("haram");
    expect(verdict("ruling(get(haircut), H)")).toBeUndefined();
  });

  it("permits fowl and fish", () => {
    for (const food of ["duck", "turkey", "pigeon", "quail", "fish"]) {
      expect(verdict(`ruling(consume(${food}), H)`), food).toBe("mubah");
    }
  });
});
