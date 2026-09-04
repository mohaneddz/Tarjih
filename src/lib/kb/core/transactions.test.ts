import { describe, expect, it } from "vitest";

import { prove } from "../../engine/prover";
import { parseQuery } from "../../logic/parse";
import { termToString } from "../../logic/term";
import { VALIDITY_AXIS, weighRuling } from "../../tarjih/weigh";
import { loadCoreKb } from "./index";

const core = loadCoreKb();

function verdicts(query: string, variable = "H"): string[] {
  const result = prove(parseQuery(query), core.kb, { maxSolutions: 200 });
  return [...new Set(result.solutions.map((s) => termToString(s.bindings[variable])))].sort();
}

function statusOf(act: string): string | undefined {
  const proved = prove(parseQuery(`validity(${act}, V)`), core.kb, { maxSolutions: 200 });
  return weighRuling(proved, core.evidence, VALIDITY_AXIS)?.verdict;
}

describe("riba", () => {
  it("forbids a loan repaid with stipulated interest", () => {
    expect(verdicts("ruling(lend(interest_loan), H)")).toEqual(["haram"]);
  });

  it("forbids excess in a same-genus exchange, on its own report", () => {
    const clauses = prove(parseQuery("ruling(sell(unequal_gold_exchange), H)"), core.kb, {
      maxSolutions: 200,
    }).solutions.flatMap((s) => s.clauseIds);
    expect(verdicts("ruling(sell(unequal_gold_exchange), H)")).toEqual(["haram"]);
    // riba al-fadl and the riba of a loan rest on different texts and must not
    // be collapsed into one clause.
    expect(clauses).toContain("bukhari:2178:riba-exchange");
    expect(clauses).not.toContain("muslim:1598:riba-loan");
  });

  it("voids the contract as a separate claim from forbidding the act", () => {
    expect(statusOf("lend(interest_loan)")).toBe("batil");
  });
});

describe("gharar", () => {
  it("forbids a sale whose object is not established", () => {
    expect(verdicts("ruling(sell(unborn_calf), H)")).toEqual(["haram"]);
    expect(statusOf("sell(unborn_calf)")).toBe("batil");
  });

  it("covers gambling through the same defect", () => {
    expect(verdicts("ruling(play(maysir), H)")).toEqual(["haram"]);
  });
});

describe("the two ruling axes", () => {
  it("answers the permissibility and the validity questions separately", () => {
    /*
     * The reason the ontology carries both. A reader who only learned that a
     * riba loan is forbidden still does not know whether the excess is theirs
     * to keep; a reader who only learned the contract is void does not know
     * whether entering it was sinful.
     */
    expect(verdicts("ruling(lend(interest_loan), H)")).toEqual(["haram"]);
    expect(verdicts("validity(lend(interest_loan), V)", "V")).toEqual(["batil"]);
  });

  it("leaves validity unanswered where the KB only speaks to permissibility", () => {
    // Mistreating a relative is forbidden; it is not a transaction, and the
    // engine must not invent a declaratory status for it.
    expect(verdicts("ruling(mistreat(mother), H)")).toEqual(["haram"]);
    expect(prove(parseQuery("validity(mistreat(mother), V)"), core.kb).solutions).toHaveLength(0);
  });
});

describe("permitted trade", () => {
  it("permits a sale the KB has positively marked sound", () => {
    expect(verdicts("ruling(sell(spot_sale), H)")).toEqual(["mubah"]);
  });

  it("permits salam, the case that shows the defect is uncertainty and not deferral", () => {
    expect(verdicts("ruling(sell(salam_contract), H)")).toEqual(["mubah"]);
  });

  it("does not read its own silence as permission", () => {
    /*
     * The engine has no negation-as-failure and must not acquire it by the
     * back door. An unfamiliar contract is unknown, not permitted, and the
     * difference is what stops the KB's gaps from being served as rulings.
     */
    expect(prove(parseQuery("ruling(sell(some_novel_derivative), H)"), core.kb).solutions)
      .toHaveLength(0);
  });

  it("does not let a sound sale and a named defect both fire for one contract", () => {
    // A contract marked sound must not also be reachable as haram, or every
    // ordinary sale would present as a contested question.
    expect(verdicts("ruling(sell(spot_sale), H)")).not.toContain("haram");
  });
});
