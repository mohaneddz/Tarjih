import { describe, expect, it } from "vitest";

import { classifyNode } from "./proof-tree";
import type { ProofView } from "@/lib/pipeline/present";

function node(goal: string, kind: string, children: ProofView[] = []): ProofView {
  return {
    goal,
    clauseId: "test:1",
    evidence: {
      kind: kind as ProofView["evidence"]["kind"],
      reference: "ref",
      unreviewed: false,
      strength: 50,
    },
    children,
  };
}

describe("classifyNode", () => {
  it("classifies any ruling/2 goal as a conclusion, regardless of evidence kind", () => {
    expect(classifyNode(node("ruling(mistreat(aunt), haram)", "qiyas"))).toBe("conclusion");
    expect(classifyNode(node("ruling(mistreat(mother), haram)", "quran"))).toBe("conclusion");
  });

  it("classifies an intermediate ruling reached via qiyas as a conclusion too", () => {
    // The whole point: a sub-derivation that itself proves a ruling (on the
    // way to proving the outer one) is the same kind of claim as the root.
    expect(classifyNode(node("ruling(mistreat(mother), haram)", "qaida"))).toBe("conclusion");
  });

  it("classifies primary-text evidence as a source", () => {
    expect(classifyNode(node("causes(mistreat(mother), darar)", "quran"))).toBe("source");
    expect(classifyNode(node("kin(mother, ego)", "sunnah"))).toBe("source");
    expect(classifyNode(node("consensus(x)", "ijma"))).toBe("source");
  });

  it("classifies methodological machinery as a principle", () => {
    expect(classifyNode(node("illah(mistreat(aunt), qata_rahim)", "qiyas"))).toBe("principle");
    expect(classifyNode(node("some(x)", "qaida"))).toBe("principle");
    expect(classifyNode(node("some(x)", "usul"))).toBe("principle");
    expect(classifyNode(node("some(x)", "istihsan"))).toBe("principle");
    expect(classifyNode(node("some(x)", "urf"))).toBe("principle");
  });

  it("classifies definitional/taxonomic facts as a condition", () => {
    expect(classifyNode(node("instance_of(aunt_maternal, rahim)", "ontology"))).toBe("condition");
    expect(classifyNode(node("subclass_of(collateral_kin, rahim)", "ontology"))).toBe("condition");
  });
});
