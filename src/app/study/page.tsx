import React from "react";
import { Header } from "@/sections/header";
import { StudyClient } from "./study-client";
import { getAnswers } from "@/data/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Dashboard | Tarjih",
  description: "Explore juristic weights, scholarly references, and response contract schemas.",
};

/**
 * Server Component representing the `/study` route page.
 * Sets a fixed full-screen layout to prevent document-level scrolling and manage panels internally.
 */
export default async function StudyPage(props: {
  searchParams: Promise<{ case?: string }>;
}) {
  // Await the search parameters prop as required in Next.js 15+
  const resolvedSearchParams = await props.searchParams;
  const caseParam = resolvedSearchParams.case;
  
  // Fetch data on the server.
  const answers = await getAnswers();

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Pinned header navigation */}
      <Header />

      {/* Screen-bounded workspace panel */}
      <main className="flex-1 min-h-0 relative max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 pb-6">
        <StudyClient answers={answers} defaultSelectedId={caseParam} />
      </main>
    </div>
  );
}
