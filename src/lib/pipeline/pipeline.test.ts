import { describe, expect, it } from "vitest";

import { loadCoreKb } from "../kb/core";
import { groundGoal } from "./goal";
import type { LlmClient } from "./llm";
import { buildGoalPrompt, buildNarrationPrompt } from "./prompts";
import { presentGroup, presentProof, proofViewToText } from "./present";
import { groundQuestion, resolveQuestion } from "./resolve";
import { prove } from "../engine/prover";
import { withPremises } from "../kb/premises";
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

  it("rejects a goal alongside the ruling that is not a circumstance", () => {
    const result = groundGoal("ruling(mistreat(mother), H), kin(X, ego)");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unsupported-shape");
  });

  it("rejects a second ruling goal", () => {
    const result = groundGoal("ruling(mistreat(mother), H), ruling(consume(swine), H2)");
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

  describe("circumstances", () => {
    it("carries a known circumstance through alongside the goal", () => {
      const result = groundGoal("ruling(consume(carrion), H), circumstance(starvation)");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.goal.circumstances).toHaveLength(1);
        expect(result.goal.circumstances[0].args[0]).toEqual({ kind: "atom", name: "starvation" });
      }
    });

    it("leaves circumstances empty when the question claimed none", () => {
      const result = groundGoal("ruling(consume(carrion), H)");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.goal.circumstances).toEqual([]);
    });

    it("rejects a circumstance atom that is not in the vocabulary", () => {
      // Stricter than the act/entity check on purpose: a circumstance unlocks
      // a concession, so an atom arriving here by mis-parse would be a
      // fabricated exemption, not a harmless nonsense goal.
      const result = groundGoal("ruling(consume(carrion), H), circumstance(mild_hunger)");
      expect(result.ok).toBe(false);
      if (!result.ok && result.error.kind === "unknown-term") {
        expect(result.error.term).toBe("mild_hunger");
      } else {
        throw new Error("expected unknown-term");
      }
    });

    it("rejects an entity atom smuggled into the circumstance slot", () => {
      // `swine` is a perfectly good lexicon atom, which is exactly why the
      // circumstance check cannot just reuse the lexicon.
      const result = groundGoal("ruling(consume(swine), H), circumstance(swine)");
      expect(result.ok).toBe(false);
    });

    it("rejects a variable circumstance, which would match anything", () => {
      const result = groundGoal("ruling(consume(carrion), H), circumstance(S)");
      expect(result.ok).toBe(false);
    });

    it("deduplicates a repeated circumstance", () => {
      const result = groundGoal(
        "ruling(consume(carrion), H), circumstance(starvation), circumstance(starvation)"
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.goal.circumstances).toHaveLength(1);
    });
  });

  describe("the NONE sentinel (regression: force-fit guessing)", () => {
    // A question genuinely unrelated to anything in the lexicon (e.g. "is it
    // halal to fight back against an attacker?") has no correct mapping onto
    // mistreat/1 or consume/1. The model is instructed to answer NONE rather
    // than force a structurally-valid but wrong guess like
    // ruling(consume(swine), H) -- which would pass checkTermGrounded (every
    // atom in it really is known) and let the engine confidently answer a
    // completely different question. This must be caught before that check
    // ever runs.
    it("is accepted as a distinct, honest failure rather than parsed as a goal", () => {
      const result = groundGoal("NONE");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("not-covered");
    });

    it("is case-insensitive and tolerates surrounding whitespace", () => {
      expect(groundGoal("  none  ").ok).toBe(false);
      expect(groundGoal("None").ok).toBe(false);
    });

    it("gives a message naming the actual coverage gap, not a generic failure", () => {
      const result = groundGoal("NONE");
      if (result.ok) throw new Error("expected failure");
      expect(result.error.message).toMatch(/kinship|forbidden food/i);
    });

    it("does not treat a real goal that happens to contain the word none as the sentinel", () => {
      // Guard against over-matching: only an exact "NONE" (whole response) is
      // the sentinel, not any goal text that happens to include the letters.
      const result = groundGoal("ruling(mistreat(mother), H)");
      expect(result.ok).toBe(true);
    });
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
    // Under a claimed necessity, so both the prohibiting and the excusing
    // verse are in play and the citation list has something to prove.
    const g = groundGoal("ruling(consume(carrion), H), circumstance(starvation)");
    if (!g.ok) throw new Error("expected grounding to succeed");
    const scoped = withPremises(core, g.goal.circumstances);
    const proved = prove([g.goal.literal], scoped.kb);
    const tarjih = weighRuling(proved, scoped.evidence);
    if (!tarjih) throw new Error("expected a tarjih result");
    const groups = tarjih.groups.map((group) => presentGroup(group, scoped.evidence));
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

describe("groundQuestion (the grounding-preview stage)", () => {
  it("returns the same goal text resolveQuestion would prove against", async () => {
    const llm = new FakeLlm(["ruling(mistreat(aunt_maternal), H)"]);
    const result = await groundQuestion("Is mistreating my maternal aunt haram?", llm);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.goalText).toBe("ruling(mistreat(aunt_maternal), H)");
  });

  it("surfaces a grounding failure distinctly, without calling prove", async () => {
    const llm = new FakeLlm(["ruling(annihilate(mother), H)"]);
    const result = await groundQuestion("anything", llm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.stage).toBe("goal-grounding");
  });

  it("surfaces an LLM failure distinctly", async () => {
    const result = await groundQuestion("anything", new ThrowingLlm());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.stage).toBe("llm");
  });

  it("is the exact code path resolveQuestion uses for its own stage 1 (no duplicated logic to drift)", async () => {
    // Same scripted answer fed to both entry points must ground identically.
    const question = "Is mistreating my maternal aunt haram?";
    const preview = await groundQuestion(question, new FakeLlm(["ruling(mistreat(aunt_maternal), H)"]));
    const full = await resolveQuestion({
      question,
      llm: new FakeLlm(["ruling(mistreat(aunt_maternal), H)", JSON.stringify({ summary: "s", analysis: "a", notes: "n" })]),
      kb: core,
    });
    if (!preview.ok || !full.ok) throw new Error("expected both to succeed");
    expect(full.view.goalText).toBe(preview.goalText);
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

  it("resolves the carrion case as contested but decided once necessity is claimed", async () => {
    const llm = new FakeLlm([
      "ruling(consume(carrion), H), circumstance(starvation)",
      JSON.stringify({ summary: "s", analysis: "a", notes: "n" }),
    ]);
    const result = await resolveQuestion({ question: "Can I eat carrion if I'm starving?", llm, kb: core });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.view.verdict).toBe("mubah");
      expect(result.view.contested).toBe(true);
      expect(result.view.unresolved).toBe(false);
      expect(result.view.resolution).toHaveLength(1);
      expect(result.view.premises.map((p) => p.situation)).toEqual(["starvation"]);
    }
  });

  it("gives the plain prohibition when the same question claims no necessity", async () => {
    /*
     * "Is carrion permitted?" and "may I eat carrion, I am starving?" are
     * different questions with different answers, and the only thing telling
     * them apart is the circumstance the grounding stage did or did not
     * attach. Without that premise the concession in 2:173 fired for every
     * asker, so this query — the general one — answered "permitted".
     */
    const llm = new FakeLlm(["ruling(consume(carrion), H)", JSON.stringify({ summary: "s", analysis: "a", notes: "n" })]);
    const result = await resolveQuestion({ question: "Is eating carrion permitted?", llm, kb: core });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.view.verdict).toBe("haram");
      expect(result.view.contested).toBe(false);
      expect(result.view.premises).toEqual([]);
    }
  });

  it("refuses a circumstance the lexicon does not define, rather than proving without it", async () => {
    const llm = new FakeLlm(["ruling(consume(carrion), H), circumstance(mild_hunger)"]);
    const result = await resolveQuestion({ question: "q", llm, kb: core });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.stage === "goal-grounding") {
      expect(result.error.error.kind).toBe("unknown-term");
    }
  });

  it("does not let the asker's premise outlive the query that supplied it", async () => {
    const starvingLlm = new FakeLlm([
      "ruling(consume(swine), H), circumstance(starvation)",
      JSON.stringify({ summary: "s", analysis: "a", notes: "n" }),
    ]);
    const first = await resolveQuestion({ question: "starving", llm: starvingLlm, kb: core });
    expect(first.ok && first.view.verdict).toBe("mubah");

    // A second, unrelated asker must not inherit the first one's necessity.
    const plainLlm = new FakeLlm(["ruling(consume(swine), H)", JSON.stringify({ summary: "s", analysis: "a", notes: "n" })]);
    const second = await resolveQuestion({ question: "general", llm: plainLlm, kb: core });
    expect(second.ok && second.view.verdict).toBe("haram");
  });

  it("reports goal-grounding failure distinctly, without ever calling prove on garbage", async () => {
    const llm = new FakeLlm(["ruling(annihilate(mother), H)"]);
    const result = await resolveQuestion({ question: "anything", llm, kb: core });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.stage).toBe("goal-grounding");
  });

  it("reports a question outside the KB's vocabulary honestly, rather than proceeding on a forced guess", async () => {
    // Regression for a real reported bug: "is it halal to fight back against
    // an attacker?" is not a question about food or kinship, but every atom
    // in ruling(consume(swine), H) is individually known, so a forced guess
    // would have passed grounding and the engine would have confidently
    // answered a completely unrelated question. The model is now expected to
    // answer NONE for a question like this, and the pipeline must surface
    // that as a clean failure rather than resolve anything.
    const llm = new FakeLlm(["NONE"]);
    const result = await resolveQuestion({
      question: "Is it halal to fight back against attackers?",
      llm,
      kb: core,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.stage).toBe("goal-grounding");
      if (result.error.stage === "goal-grounding") expect(result.error.error.kind).toBe("not-covered");
    }
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
      "ruling(consume(carrion), H), circumstance(starvation)",
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
