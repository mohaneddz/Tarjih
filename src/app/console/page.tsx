import React, { Suspense } from "react";
import { Metadata } from "next";
import { Header } from "@/sections/header";
import { BUILTINS } from "@/lib/engine/builtins";
import { KNOWN_ACTS, KNOWN_ATOMS, KNOWN_CIRCUMSTANCES } from "@/lib/kb/lexicon";
import { PREDICATES } from "@/lib/kb/ontology";
import { ConsoleClient } from "./console-client";
import type { ReferenceEntry } from "./console-client";

export const metadata: Metadata = {
  title: "Prolog Console",
  description:
    "Query the knowledge base directly in Horn-clause syntax: every derivation with its proof, the step-by-step search trace, and where a failed query stalled.",
  openGraph: {
    title: "Prolog Console | Tarjih",
    description: "Run raw goals against the knowledge base and inspect proofs and traces.",
  },
};

export default function ConsolePage() {
  const predicates: ReferenceEntry[] = [
    ...PREDICATES.map((p) => ({
      signature: `${p.name}(${p.args.join(", ")})`,
      group: p.group,
      meaning: p.meaning,
      example: p.example,
    })),
    ...BUILTINS.map((b) => ({
      signature: `${b.name}(${b.args.join(", ")})`,
      group: "builtin",
      meaning: b.meaning,
      example: b.example,
    })),
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-1 w-full max-w-[110rem] mx-auto px-4 sm:px-6 pb-10">
        <Suspense fallback={null}>
          <ConsoleClient
            predicates={predicates}
            circumstances={KNOWN_CIRCUMSTANCES.map((c) => ({ atom: c.atom, label: c.label }))}
            atoms={KNOWN_ATOMS.map((a) => a.atom)}
            acts={KNOWN_ACTS.map((a) => a.functor)}
          />
        </Suspense>
      </main>
    </div>
  );
}
