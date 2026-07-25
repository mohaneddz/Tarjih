import { Metadata } from "next";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { loadCoreKb } from "@/lib/kb/core";
import { kbStatistics } from "@/lib/kb/entry";
import { DatabaseClient } from "./database-client";
import type { CoreClauseView } from "./database-client";

export const metadata: Metadata = {
  title: "Knowledge Base | Tarjih",
  description: "Browse the hand-authored core knowledge base and review formalized hadith clauses awaiting approval.",
};

/**
 * Server component: the hand-authored core KB is code-defined and small, so
 * it is prepared once here rather than round-tripped through an API route.
 * The review queue (DB-backed, changes as scholars act on it) is fetched
 * client-side by `DatabaseClient` instead.
 */
export default function DatabasePage() {
  const core = loadCoreKb();
  const stats = kbStatistics(core);

  const clauses: CoreClauseView[] = core.clauses.map((clause) => {
    const evidence = core.evidence.getOrUnknown(clause.id);
    return {
      id: clause.id,
      head: `${clause.head.predicate}/${clause.head.args.length}`,
      isFact: clause.body.length === 0,
      kind: evidence.kind,
      reference: evidence.reference,
      text: evidence.text,
      grade: evidence.grade,
      scope: evidence.scope,
      restriction: evidence.restriction,
      notes: evidence.notes,
    };
  });

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-8">
        <div className="border-b border-border-warm pb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
            Knowledge Base
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {stats.clauses} hand-authored clause{stats.clauses === 1 ? "" : "s"} ({stats.facts} facts,{" "}
            {stats.rules} rules) power every live query. Formalized hadith clauses join the live KB only after
            a human approves them here.
          </p>
        </div>
        <DatabaseClient coreClauses={clauses} coreStats={stats} />
      </main>
      <Footer />
    </div>
  );
}
