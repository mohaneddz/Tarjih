"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VerdictBadge, WeighingScale } from "@/components/ui/asset-badge";
import { HUKM_LABELS } from "@/lib/kb/ontology";
import type { Hukm } from "@/lib/kb/ontology";

type CaseStatus = "Evidence agrees" | "Evidence weighed" | "Unresolved";

interface CaseRecord {
  id: string;
  title: string;
  confidence: number | null;
  verdict: string | null;
  validity: string | null;
  contested: boolean;
  status: CaseStatus;
  date: string;
}

interface ResolutionSummary {
  id: string;
  question: string;
  verdict: string | null;
  validity?: string | null;
  confidence: number | null;
  contested: boolean;
  createdAt: string;
}

const STATUS_STYLES: Record<CaseStatus, string> = {
  "Evidence agrees": "text-brand-green bg-brand-green-light/60 border-brand-green/30",
  "Evidence weighed": "text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/30 border-amber-300/60",
  Unresolved: "text-brand-red bg-brand-red-light border-brand-red/30",
};

export function CasesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetch("/api/resolutions");
        if (!res.ok) throw new Error("Failed to load");
        const data: ResolutionSummary[] = await res.json();

        const mapped: CaseRecord[] = data.map((r) => ({
          id: r.id,
          title: r.question,
          confidence: r.confidence,
          verdict: r.verdict,
          validity: r.validity ?? null,
          contested: r.contested,
          status: !r.verdict && r.contested ? "Unresolved" : r.contested ? "Evidence weighed" : "Evidence agrees",
          date: new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
        }));

        setCases(mapped);
      } catch (err) {
        console.error("Failed to load resolution ledger", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-8 select-none">
        <div className="border-b border-border-warm pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <WeighingScale size="sm" />
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
                Cases Ledger
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Every question the engine has answered, with the full proof kept so it can be re-opened and re-checked.
              </p>
            </div>
          </div>

          <Link href="/study">
            <Button variant="primary" size="sm" className="h-10 px-5 text-sm font-bold shrink-0 shadow-sm">
              New Analysis
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-red transition-all"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-brand-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap bg-card-warm/80 p-1 rounded-xl text-[12px] font-bold border border-border-warm">
            {["All", "Evidence agrees", "Evidence weighed", "Unresolved"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-background text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Card hoverable={false} className="p-0 overflow-hidden">
          {isLoading ? (
            <p className="text-center py-12 text-sm text-text-secondary">Loading cases…</p>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12 px-6 text-sm text-text-secondary flex flex-col items-center gap-3">
              <p>{cases.length === 0 ? "No questions have been answered yet." : "No cases match this search."}</p>
              {cases.length === 0 && (
                <Link href="/study" className="font-semibold text-brand-red hover:underline">
                  Ask the first one
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border-warm">
              {filteredCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/study?id=${c.id}`}
                    className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-5 md:px-6 py-4 hover:bg-border-warm-light/30 transition-colors"
                  >
                    <span className="font-serif font-bold text-text-primary text-[15px] leading-snug flex-1 min-w-0">
                      {c.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
                      <span className="flex items-center gap-2 md:w-48">
                        {c.verdict && <VerdictBadge verdict={c.verdict} size="sm" showLabel={false} />}
                        <span className="font-serif font-bold text-text-primary">
                          {c.verdict
                            ? HUKM_LABELS[c.verdict as Hukm]?.en ?? c.verdict
                            : c.validity
                              ? `Legal effect: ${c.validity}`
                              : "No single ruling"}
                        </span>
                      </span>
                      <span className="text-sm text-text-secondary md:w-32">
                        {c.confidence !== null && c.verdict ? `strength ${c.confidence}/100` : ""}
                      </span>
                      <span className="md:w-40">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status]}`}
                        >
                          {c.status}
                        </span>
                      </span>
                      <span className="text-sm text-text-secondary w-28 md:text-right">{c.date}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
