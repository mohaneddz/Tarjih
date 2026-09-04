"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { RulingRosette, VerdictBadge } from "@/components/ui/asset-badge";
import { getSavedCases, unsaveCase, type SavedCase } from "@/lib/saved-cases";

export function SavedClient() {
  const [cases, setCases] = useState<SavedCase[] | null>(null);

  useEffect(() => {
    function load() {
      setCases(getSavedCases());
    }
    load();
    window.addEventListener("tarjih:saved-cases-changed", load);
    return () => window.removeEventListener("tarjih:saved-cases-changed", load);
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="absolute inset-0 -z-20 bg-pattern-arabesque opacity-[0.03] dark:opacity-[0.012] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-10 select-none">
        <div className="border-b border-border-warm pb-6">
          <div className="flex items-center gap-2">
            <RulingRosette size="md" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">Saved Cases</h1>
          </div>
          <p className="text-text-secondary mt-2 max-w-2xl">
            Bookmarked on this device — there's no account, so this list lives in this browser only and won't follow
            you to another one.
          </p>
        </div>

        {cases === null ? null : cases.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm bg-card-warm border border-border-warm rounded-2xl">
            Nothing saved yet. Open a resolved question in{" "}
            <Link href="/study" className="text-brand-red font-semibold hover:underline">
              Study
            </Link>{" "}
            and use the bookmark on a result to keep it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cases.map((c) => (
              <div
                key={c.id}
                className="bg-card-warm border border-border-warm rounded-2xl p-5 flex flex-col gap-3 shadow-sm relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] uppercase tracking-wider font-extrabold text-brand-green">
                    {c.contested ? "Contested" : "Resolved"}
                  </span>
                  {c.verdict && <VerdictBadge verdict={c.verdict} size="sm" showLabel={false} />}
                </div>
                <Link href={`/study?id=${c.id}`} className="font-serif font-bold text-sm text-text-primary leading-snug hover:text-brand-red transition-colors">
                  {c.question}
                </Link>
                {c.confidence !== null && (
                  <span className="text-sm text-text-secondary">{c.confidence}% confidence</span>
                )}
                <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border-warm-light/50">
                  <span className="text-[12px] text-text-secondary">
                    Saved {new Date(c.savedAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => unsaveCase(c.id)}
                    className="text-[12px] font-bold text-text-secondary hover:text-brand-red transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
