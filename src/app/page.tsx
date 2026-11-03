import React from "react";
import { Header } from "@/sections/header";
import { Hero } from "@/sections/hero";
import { PipelineExample } from "@/sections/pipeline-example";
import { Architecture } from "@/sections/architecture";
import { Comparison } from "@/sections/comparison";
import { ReasoningSteps } from "@/sections/features";
import { Footer } from "@/sections/footer";
import { loadCoreKb } from "@/lib/kb/core";
import * as domains from "@/lib/kb/core";

/** The named domain modules the core KB is assembled from (taxonomy, food, zakat, ...). */
const DOMAIN_COUNT = Object.values(domains).filter((v) => Array.isArray(v) && v !== domains.CORE_ENTRIES).length;

export default function Home() {
  const core = loadCoreKb();
  // Distinct scriptural citations, not clauses: several clauses often rest on one verse.
  const scriptureSourceCount = new Set(
    core.clauses
      .map((c) => core.evidence.getOrUnknown(c.id))
      .filter((e) => e.kind === "quran" || e.kind === "sunnah")
      .map((e) => e.reference)
  ).size;

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-1">
        <Hero />
        <PipelineExample />
        <Architecture />
        <ReasoningSteps
          coreClauseCount={core.clauses.length}
          scriptureSourceCount={scriptureSourceCount}
          domainCount={DOMAIN_COUNT}
        />
        <Comparison />
      </main>

      <Footer />
    </div>
  );
}
