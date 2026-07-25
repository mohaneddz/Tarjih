import { describe, expect, it } from "vitest";

import type { LlmClient } from "./llm";
import { buildFormalizationPrompt, formalizeHadith } from "./formalize";
import type { FormalizeInput } from "./formalize";

class ScriptedLlm implements LlmClient {
  constructor(private readonly response: string) {}
  async complete(): Promise<string> {
    return this.response;
  }
}

class ThrowingLlm implements LlmClient {
  async complete(): Promise<string> {
    throw new Error("provider unavailable");
  }
}

const baseInput: FormalizeInput = {
  clauseId: "sunnah:tirmidhi:1",
  reference: "Jami` at-Tirmidhi 1",
  textEn: "Salat will not be accepted without purification.",
  grade: "sahih",
};

describe("buildFormalizationPrompt", () => {
  it("lists the ontology predicates so the model cannot invent one", () => {
    const { system } = buildFormalizationPrompt(baseInput);
    expect(system).toContain("ruling/2");
    expect(system).toContain("illah/2");
    expect(system).toContain("causes/2");
  });

  it("embeds the hadith text, reference, and grade", () => {
    const { user } = buildFormalizationPrompt(baseInput);
    expect(user).toContain("Jami` at-Tirmidhi 1");
    expect(user).toContain("Salat will not be accepted without purification.");
    expect(user).toContain("sahih");
  });

  it("tells the model it is fine, even expected, for many hadiths to state no ruling", () => {
    const { system } = buildFormalizationPrompt(baseInput);
    expect(system).toMatch(/do not state a ruling/);
  });
});

describe("formalizeHadith", () => {
  it("accepts a well-formed ruling clause", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({
        isRuling: true,
        rationale: "States that purification is a precondition for valid prayer.",
        clause: "condition(prayer, purity).",
        scope: "amm",
        dalala: "qati",
      })
    );
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.candidate.clauseSource).toBe("condition(prayer, purity).");
      expect(result.candidate.head).toBe("condition/2");
      expect(result.candidate.scope).toBe("amm");
      expect(result.candidate.dalala).toBe("qati");
      expect(result.candidate.grade).toBe("sahih");
    }
  });

  it("passes through the reference and text unchanged for the evidence record", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({ isRuling: true, clause: "condition(prayer, purity).", rationale: "r" })
    );
    const result = await formalizeHadith(baseInput, llm);
    if (!result.ok) throw new Error("expected success");
    expect(result.candidate.reference).toBe(baseInput.reference);
    expect(result.candidate.text).toBe(baseInput.textEn);
  });

  it("reports not-a-ruling for a narrative hadith without forcing a rule", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({
        isRuling: false,
        rationale: "This hadith narrates an event and states no legal ruling.",
      })
    );
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not-a-ruling");
      if (result.reason === "not-a-ruling") expect(result.rationale).toContain("narrates an event");
    }
  });

  it("treats a missing clause as not-a-ruling even if isRuling was true", async () => {
    // A malformed model response should fail closed, not crash or fabricate a clause.
    const llm = new ScriptedLlm(JSON.stringify({ isRuling: true, rationale: "r" }));
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-a-ruling");
  });

  it("rejects an unparseable clause distinctly from a validation failure", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({ isRuling: true, clause: "this is not( valid syntax at all", rationale: "r" })
    );
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("parse-error");
  });

  it("rejects a clause using a predicate outside the ontology", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({ isRuling: true, clause: "frobnicate(prayer, purity).", rationale: "r" })
    );
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("validation-failed");
      if (result.reason === "validation-failed") {
        expect(result.issues.some((i) => i.code === "unknown-predicate")).toBe(true);
      }
    }
  });

  it("rejects a ruling value outside the five ahkam", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({ isRuling: true, clause: "ruling(consume(alcohol), forbidden).", rationale: "r" })
    );
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("validation-failed");
      if (result.reason === "validation-failed") {
        expect(result.issues.some((i) => i.code === "invalid-hukm")).toBe(true);
      }
    }
  });

  it("rejects a rule whose head variable is unbound by its body", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({ isRuling: true, clause: "ruling(X, haram) :- necessity(starvation).", rationale: "r" })
    );
    const result = await formalizeHadith(baseInput, llm);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("validation-failed");
  });

  it("reports llm-error when the completion call throws", async () => {
    const result = await formalizeHadith(baseInput, new ThrowingLlm());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("llm-error");
  });

  it("reports llm-error when the response is not valid JSON", async () => {
    const result = await formalizeHadith(baseInput, new ScriptedLlm("not json at all"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("llm-error");
  });

  it("carries the clause id through to the parsed clause so evidence stays joinable", async () => {
    const llm = new ScriptedLlm(
      JSON.stringify({ isRuling: true, clause: "condition(prayer, purity).", rationale: "r" })
    );
    const result = await formalizeHadith(baseInput, llm);
    if (!result.ok) throw new Error("expected success");
    expect(result.candidate.clauseId).toBe(baseInput.clauseId);
  });
});
