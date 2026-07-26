import React from "react";
import { Header } from "@/sections/header";
import { StudyClient } from "./study-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study & Derivation Dashboard",
  description:
    "Formulate legal ruling inquiries, run derivation pipeline executions, map reasoning trees, and examine conflicting evidence.",
  openGraph: {
    title: "Study & Derivation Dashboard | Tarjih",
    description: "Derive, weigh, and inspect juristic reasoning trees and verdicts.",
  },
};

/**
 * Server Component representing the `/study` route page.
 * Sets a fixed full-screen layout to prevent document-level scrolling and manage panels internally.
 */
export default function StudyPage() {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-1 min-h-0 relative max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 pb-6">
        <StudyClient />
      </main>
    </div>
  );
}
