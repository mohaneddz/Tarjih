import React from "react";
import { Header } from "@/sections/header";
import { Hero } from "@/sections/hero";
import { PipelineExample } from "@/sections/pipeline-example";
import { Architecture } from "@/sections/architecture";
import { Comparison } from "@/sections/comparison";
import { ReasoningSteps } from "@/sections/features";
import { Footer } from "@/sections/footer";
import { loadCoreKb } from "@/lib/kb/core";
import { prisma } from "@/data/db";

/**
 * Reviewed-clause count is best-effort: the query fails harmlessly to 0 if
 * the table isn't there in a given environment, same pattern as the
 * /api/resolutions route.
 */
async function countReviewedClauses(): Promise<number> {
  try {
    return await prisma.clause.count({ where: { unreviewed: false } });
  } catch {
    return 0;
  }
}

export default async function Home() {
  const core = loadCoreKb();
  const reviewedClauseCount = await countReviewedClauses();

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-1">
        <Hero />
        <PipelineExample />
        <Architecture />
        <ReasoningSteps coreClauseCount={core.clauses.length} reviewedClauseCount={reviewedClauseCount} />
        <Comparison />
      </main>

      <Footer />
    </div>
  );
}
