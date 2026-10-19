import { describe, expect, it } from "vitest";

import { loadCoreKb } from "../kb/core";
import { runConsoleQuery } from "./console";

const core = loadCoreKb();

describe("runConsoleQuery", () => {
  it("proves a ruling question and weighs it on the axis of the variable used", () => {
    const result = runConsoleQuery({ query: "ruling(consume(khamr), Hukm)" }, core);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.solutions[0].bindings).toEqual({ Hukm: "haram" });
    expect(result.weighing?.verdict).toBe("haram");
  });

  it("leaves internal variables out of the bindings", () => {
    const result = runConsoleQuery({ query: "instance_of(X, rahim), instance_of(X, _)" }, core);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const s of result.solutions) expect(Object.keys(s.bindings)).toEqual(["X"]);
    }
  });

  it("reports a parse error with its position", () => {
    const result = runConsoleQuery({ query: "ruling(consume(khamr), H" }, core);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("parse");
      expect(result.error.column).toBeDefined();
    }
  });

  it("assumes a lexicon circumstance for this query only", () => {
    const with_ = runConsoleQuery({ query: "ruling(consume(swine), H)", circumstances: ["starvation"] }, core);
    const without = runConsoleQuery({ query: "ruling(consume(swine), H)" }, core);
    expect(with_.ok && with_.weighing?.verdict).toBe("mubah");
    expect(without.ok && without.weighing?.verdict).toBe("haram");
  });

  it("refuses a circumstance the lexicon does not define", () => {
    const result = runConsoleQuery({ query: "ruling(consume(swine), H)", circumstances: ["mild_hunger"] }, core);
    expect(!result.ok && result.error.kind).toBe("circumstance");
  });

  it("explains a failed query and lists the premises rules were waiting on", () => {
    const result = runConsoleQuery({ query: "ruling(perform(tayammum), H)" }, core);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.solutions).toHaveLength(0);
      expect(result.explanation.unmetPremises.map((p) => p.goal)).toContain("circumstance(water_unavailable)");
    }
  });

  it("returns the search trace", () => {
    const result = runConsoleQuery({ query: "kin(mother, ego)" }, core);
    expect(result.ok && result.trace.some((e) => e.type === "call")).toBe(true);
  });
});
