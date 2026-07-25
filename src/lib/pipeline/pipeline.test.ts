import { describe, expect, it } from "vitest";

import { loadCoreKb } from "../kb/core";
import { groundGoal } from "./goal";
import type { LlmClient } from "./llm";
import { buildGoalPrompt, buildNarrationPrompt } from "./prompts";
import { presentGroup, presentProof, proofViewToText } from "./present";
import { resolveQuestion } from "./resolve";
import { prove } from "../engine/prover";
import { weighRuling } from "../tarjih/weigh";

const core = loadCoreKb();

/** A scripted LLM: returns canned answers in call order, records what it was asked. */
class FakeLlm implements LlmClient {
  calls: { system: string; user: string }[] = [];
  constructor(private readonly scripted: readonly string[]) {}

  async complete(system: string, user: string): Promise<string> {
    this.calls.push({ system, user });
    const next = this.scripted[this.calls.length - 1];
    if (next === undefined) throw new Error("FakeLlm ran out of scripted responses");
    return next;
  }
}

class ThrowingLlm implements LlmClient {
  async complete(): Promise<string> {
    throw new Error("simulated network failure");
  }
}

describe("groundGoal", () => {
  it("accepts a well-formed, fully known goal", () => {
    const result = groundGoal("ruling(mistreat(aunt_maternal), H)");
    expect(result.ok).toBe(true);
  });

  it("canonicalises the ruling variable name to H", () => {
    const result = groundGoal("ruling(mistreat(mother), Verdict)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const rulingArg = result.goal.literal.args[1];
      expect(rulingArg).toEqual({ kind: "var", name: "H" });
    }
  });

  it("rejects an unparseable line with a parse-error", () => {
    const result = groundGoal("this is not ruling( at all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("parse-error");
  });

  it("rejects a query with more than one goal", () => {
    const result = groundGoal("ruling(mistreat(mother), H), kin(X, ego)");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unsupported-shape");
  });

  it("rejects the wrong predicate", () => {
    const result = groundGoal("validity(sale(x), H)");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unsupported-shape");
  });

  it("rejects a ground second argument instead of a variable", () => {
    const result = groundGoal("ruling(mistreat(mother), haram)");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unsupported-shape");
  });

  it("rejects an act that is not in the lexicon", () => {
    const result = groundGoal("ruling(annihilate(mother), H)");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("unknown-term");
      if (result.error.kind === "unknown-term") expect(result.error.term).toContain("annihilate");
    }
  });

  it("rejects an entity that is not in the lexicon, distinctly from an unknown act", () => {
    const result = groundGoal("ruling(mistreat(camel), H)");
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "unknown-term") {
      expect(result.error.term).toBe("camel");
    } else {
      throw new Error("expected unknown-term");
    }
  });

  it("tolerates a trailing dot", () => {
    expect(groundGoal("ruling(mistreat(mother), H).").ok).toBe(true);
  });
});

describe("prompts", () => {
  it("goal prompt lists every known act and atom", () => {
    const { system } = buildGoalPrompt("Is mistreating my aunt haram?");
    expect(system).toContain("aunt_maternal");
    expect(system).toContain("mistreat");
    expect(system).toContain("consume");
  });

  it("goal prompt embeds the question", () => {
    const { user } = buildGoalPrompt("Is eating carrion allowed?");
    expect(user).toContain("Is eating carrion allowed?");
  });

  it("narration prompt states the verdict as final when resolved", () => {
    const { system } = buildNarrationPrompt({
      question: "q",
      goalText: "ruling(mistreat(mother), H)",
      contested: false,
      unresolved: false,
      verdict: "haram",
      groups: [],
      resolution: [],
      truncated: false,
    });
    expect(system).toMatch(/FINAL/);
    expect(system).toContain("haram");
  });

  it("narration prompt tells the model not to pick a side when unresolved", () => {
    const { system } = buildNarrationPrompt({
      question: "q",
      goalText: "g",
      contested: true,
      unresolved: true,
      groups: [],
      resolution: [],
      truncated: false,
    });
    expect(system).toMatch(/Do NOT pick a side/);
  });

  it("flags the madhhab-neutral limitation when a school is requested", () => {
    const { system } = buildNarrationPrompt({
      question: "q",
      goalText: "g",
      madhhabRequested: "Shafi'i",
      contested: false,
      unresolved: false,
      verdict: "haram",
      groups: [],
      resolution: [],
      truncated: false,
    });
    expect(system).toContain("madhhab-neutral");
  });

  it("flags truncation as a limitation to mention", () => {
    const { system } = buildNarrationPrompt({
      question: "q",
      goalText: "g",
      contested: false,
      unresolved: false,
      verdict: "haram",
      groups: [],
      resolution: [],
      truncated: true,
    });
    expect(system).toMatch(/resource budget/);
  });

  it("includes the actual citations so the model can quote them, not paraphrase blindly", () => {
    const g = groundGoal("ruling(consume(carrion), H)");
    if (!g.ok) throw new Error("expected grounding to succeed");
    const proved = prove([g.goal.literal], core.kb);
    const tarjih = weighRuling(proved, core.evidence);
    if (!tarjih) throw new Error("expected a tarjih result");
    const groups = tarjih.groups.map((group) => presentGroup(group, core.evidence));
    const { user } = buildNarrationPrompt({
      question: "q",
      goalText: "g",
      contested: tarjih.contested,
      unresolved: tarjih.unresolved,
      verdict: tarjih.verdict,
      groups,
      resolution: tarjih.resolution.map((s) => ({ rule: s.ruleLabel, winner: s.winner, loser: s.loser, explanation: s.explanation })),
      truncated: false,
    });
    expect(user).toContain("2:173");
    expect(user).toContain("5:3");
  });
});

describe("present", () => {
  it("renders a readable proof tree with citations", () => {
    const g = groundGoal("ruling(mistreat(aunt_maternal), H)");
    if (!g.ok) throw new Error("expected grounding to succeed");
    const proved = prove([g.goal.literal], core.kb);
    const view = presentProof(proved.solutions[0].proofs[0], core.evidence);
    const text = proofViewToText(view);
    expect(text).toContain("ruling(mistreat(aunt_maternal)");
  });

  it("marks unreviewed evidence in the view (none in the hand-authored core KB)", () => {
    const g = groundGoal("ruling(mistreat(mother), H)");
    if (!g.ok) throw new Error("expected grounding to succeed");
    const proved = prove([g.goal.literal], core.kb);
    const view = presentProof(proved.solutions[0].proofs[0], core.evidence);
    expect(view.evidence.unreviewed).toBe(false);
  });
});

describe("resolveQuestion end to end (LLM mocked)", () => {
  it("resolves the aunt case using only computed data, LLM only for framing", async () => {
    const llm = new FakeLlm(["ruling(mistreat(aunt_maternal), H)", JSON.stringify({ summary: "s", analysis: "a", notes: "n" })]);
    const result = await resolveQuestion({ question: "Is mistreating my maternal aunt haram?", llm, kb: core });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.view.verdict).toBe("haram");
      expect(result.view.contested).toBe(false);
      expect(result.view.narration.summary).toBe("s");
    }
  });

  it("resolves the carrion case as contested but decided", async () => {
    const llm = new FakeLlm(["ruling(consume(carrion), H)", JSON.stringify({ summary: "s", analysis: "a", notes: "n" })]);
    const result = await resolveQuestion({ question: "Can I eat carrion if I'm starving?", llm, kb: core });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.view.verdict).toBe("mubah");
      expect(result.view.contested).toBe(true);
      expect(result.view.unresolved).toBe(false);
      expect(result.view.resolution).toHaveLength(1);
    }
  });

  it("reports goal-grounding failure distinctly, without ever calling prove on garbage", async () => {
    const llm = new FakeLlm(["ruling(annihilate(mother), H)"]);
    const result = await resolveQuestion({ question: "anything", llm, kb: core });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.stage).toBe("goal-grounding");
  });

  it("reports no-derivation distinctly from a grounding failure", async () => {
    // Both terms are known to the lexicon (this is not a grounding failure),
    // but "mother" is not an instance of forbidden_food, so no rule in the
    // vertical slice concludes anything about consuming her.
    const llm = new FakeLlm(["ruling(consume(mother), H)"]);
    const result = await resolveQuestion({ question: "anything", llm, kb: core });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.stage).toBe("no-derivation");
  });

  it("falls back to a computed-only narration when the narration call fails, without failing the request", async () => {
    class PartialLlm implements LlmClient {
      calls = 0;
      async complete(): Promise<string> {
        this.calls++;
        if (this.calls === 1) return "ruling(mistreat(aunt_maternal), H)";
        throw new Error("narration provider is down");
      }
    }
    const result = await resolveQuestion({ question: "q", llm: new PartialLlm(), kb: core });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.view.verdict).toBe("haram");
      expect(result.view.narration.notes).toContain("could not be generated");
    }
  });

  it("fails the whole request when the goal-parsing call itself fails", async () => {
    const result = await resolveQuestion({ question: "q", llm: new ThrowingLlm(), kb: core });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.stage).toBe("llm");
  });

  it("never lets the narration call override the computed verdict even if it tries to", async () => {
    const llm = new FakeLlm([
      "ruling(consume(carrion), H)",
      JSON.stringify({ summary: "Actually this is haram, not mubah!", analysis: "a", notes: "n" }),
    ]);
    const result = await resolveQuestion({ question: "q", llm, kb: core });
    expect(result.ok).toBe(true);
    // The narration text can say anything, but the structured verdict field
    // is untouched by it -- this is what the UI must trust, not the prose.
    if (result.ok) expect(result.view.verdict).toBe("mubah");
  });

  it("passes madhhab and strictness through to the response for display", async () => {
    const llm = new FakeLlm(["ruling(mistreat(mother), H)", JSON.stringify({ summary: "s", analysis: "a", notes: "n" })]);
    const result = await resolveQuestion({
      question: "q",
      madhhab: "Hanafi",
      strictness: "Strict",
      llm,
      kb: core,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.view.madhhab).toBe("Hanafi");
      expect(result.view.strictness).toBe("Strict");
    }
  });
});
