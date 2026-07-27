"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HUKM_LABELS } from "@/lib/kb/ontology";
import type { Hukm } from "@/lib/kb/ontology";
import Link from "next/link";
import { VerdictBadge, WeighingScale, RulingRosette, EvidenceBadge } from "@/components/ui/asset-badge";

interface CaseRecord {
  id: string;
  title: string;
  madhhab: string;
  confidence: number | null;
  verdict: string | null;
  contested: boolean;
  status: "Resolved" | "Contested" | "Unresolved";
  date: string;
}

interface ResolutionSummary {
  id: string;
  question: string;
  madhhab: string | null;
  verdict: string | null;
  confidence: number | null;
  contested: boolean;
  createdAt: string;
}

function hukmLabel(h: string): string {
  return HUKM_LABELS[h as Hukm]?.en ?? h;
}

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
          madhhab: r.madhhab ?? "Madhhab-neutral",
          confidence: r.confidence,
          verdict: r.verdict,
          contested: r.contested,
          status: !r.verdict ? "Unresolved" : r.contested ? "Contested" : "Resolved",
          date: new Date(r.createdAt).toISOString().split("T")[0],
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
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.madhhab.toLowerCase().includes(searchQuery.toLowerCase());
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
              <div className="flex items-center gap-2">
                <RulingRosette size="sm" />
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
                  Resolved Cases Ledger
                </h1>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                A ledger of concluded analyses with traceable evidence.
              </p>
            </div>
          </div>

          <Link href="/study">
            <Button variant="primary" size="sm" className="h-10 px-5 text-xs font-bold shrink-0 shadow-sm">
              New Analysis
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search cases by question or madhhab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-red transition-all"
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

          <div className="flex bg-card-warm/80 p-1 rounded-xl text-[10px] font-bold border border-border-warm">
            {["All", "Resolved", "Contested", "Unresolved"].map((s) => (
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-warm bg-border-warm-light/60 text-[10px] font-bold text-text-secondary uppercase tracking-wider select-none">
                  <th className="p-4.5 pl-6">Question</th>
                  <th className="p-4.5">Madhhab / Usul</th>
                  <th className="p-4.5 text-center">Ruling</th>
                  <th className="p-4.5 text-center">Confidence</th>
                  <th className="p-4.5 text-center">Conflict</th>
                  <th className="p-4.5 text-center">Date</th>
                  <th className="p-4.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm bg-transparent">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-text-secondary">
                      Loading historical ledger records...
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-text-secondary">
                      No matching case records found.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-border-warm-light/30 transition-colors">
                      <td className="p-4.5 pl-6 font-serif font-bold text-text-primary text-sm leading-snug max-w-xs">
                        {c.title}
                      </td>
                      <td className="p-4.5 text-brand-red font-semibold">{c.madhhab}</td>
                      <td className="p-4.5 text-center">
                        {c.verdict ? (
                          <VerdictBadge verdict={c.verdict} size="sm" showLabel={false} />
                        ) : (
                          <EvidenceBadge grade="unverified" size="sm" showLabel={false} />
                        )}
                      </td>
                      <td className="p-4.5 text-center font-bold text-text-primary">
                        {c.confidence !== null ? `${c.confidence}%` : "—"}
                      </td>
                      <td className="p-4.5 text-center">
                        {c.contested ? (
                          <EvidenceBadge grade="disputed" size="sm" showLabel={false} />
                        ) : (
                          <EvidenceBadge grade="authentic" size="sm" showLabel={false} />
                        )}
                      </td>
                      <td className="p-4.5 text-center text-text-secondary">{c.date}</td>
                      <td className="p-4.5 pr-6 text-right">
                        <Link href="/study">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-4 text-[10px] font-bold border-brand-red/30 text-brand-red hover:bg-brand-red-light hover:text-brand-red"
                          >
                            Open in Study
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
