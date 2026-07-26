import { describe, expect, it } from "vitest";

import { humanizeLiteral, humanizeTerm } from "./humanize";
import { atom, goal, struct } from "../logic/term";

describe("humanizeTerm", () => {
  it("renders a known individual using its short lexicon label", () => {
    expect(humanizeTerm(atom("aunt_maternal"))).toBe("maternal aunt");
  });

  it("renders a hukm atom using its label", () => {
    expect(humanizeTerm(atom("haram"))).toBe("Forbidden");
  });

  it("renders a known act applied to a known entity as a phrase, using only the first gloss of a slash-separated act label", () => {
    expect(humanizeTerm(struct("mistreat", atom("aunt_maternal")))).toBe("mistreating maternal aunt");
  });

  it("falls back to a glossed class name for an atom not in the entity lexicon", () => {
    expect(humanizeTerm(atom("collateral_kin"))).toBe("collateral relative (sibling, aunt, uncle, or their children)");
  });

  it("falls back to prettified snake_case for a totally unglossed atom", () => {
    expect(humanizeTerm(atom("some_future_atom"))).toBe("some future atom");
  });
});

describe("humanizeLiteral", () => {
  it("renders ruling/2 as a plain sentence", () => {
    const lit = goal("ruling", struct("mistreat", atom("aunt_maternal")), atom("haram"));
    expect(humanizeLiteral(lit)).toBe("Mistreating maternal aunt is Forbidden");
  });

  it("renders instance/2 readably", () => {
    const lit = goal("instance", atom("aunt_maternal"), atom("collateral_kin"));
    expect(humanizeLiteral(lit)).toContain("is a");
    expect(humanizeLiteral(lit)).toContain("Maternal aunt");
  });

  it("renders subclass/2 as a universal statement", () => {
    const lit = goal("subclass", atom("collateral_kin"), atom("rahim"));
    expect(humanizeLiteral(lit)).toBe("Every collateral relative (sibling, aunt, uncle, or their children) is a womb-relative");
  });

  it("renders illah/2 naming the effective cause", () => {
    const lit = goal("illah", struct("mistreat", atom("aunt_maternal")), atom("qata_rahim"));
    expect(humanizeLiteral(lit)).toContain("effective cause");
    expect(humanizeLiteral(lit)).toContain("severance of the womb-tie");
  });

  it("renders necessity/1", () => {
    expect(humanizeLiteral(goal("necessity", atom("starvation")))).toBe(
      "Starvation constitutes a genuine necessity (darura)"
    );
  });

  it("falls back gracefully for a predicate with no template, without throwing", () => {
    const lit = goal("some_future_predicate", atom("x"), atom("y"));
    expect(() => humanizeLiteral(lit)).not.toThrow();
    expect(humanizeLiteral(lit)).toContain("some future predicate");
  });

  it("never leaves raw snake_case predicate syntax in the output for templated predicates", () => {
    const lit = goal("ruling", struct("consume", atom("carrion")), atom("mubah"));
    const rendered = humanizeLiteral(lit);
    expect(rendered).not.toMatch(/ruling\(/);
    expect(rendered).not.toContain("_");
  });
});
