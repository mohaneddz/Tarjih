"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CaseRecord {
  id: string;
  title: string;
  madhhab: string;
  confidence: number;
  status: "Resolved" | "Disputed" | "Unresolved";
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

export default function CasesPage() {
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
          confidence: r.confidence ?? 0,
          status: r.contested ? (r.verdict ? "Disputed" : "Unresolved") : "Resolved",
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

  // Filter cases based on search and status
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.madhhab.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Repeating Arabesque Geometric Pattern */}
      <div className="absolute inset-0 -z-20 bg-pattern-arabesque opacity-[0.03] dark:opacity-[0.012] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-8 select-none">
        {/* Page Header */}
        <div className="border-b border-border-warm pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
              Resolved Cases Ledger
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Browse historical inquiries, consensus records, and active juristic disputes.
            </p>
          </div>
          
          {/* New Case Button */}
          <Link href="/study">
            <Button variant="primary" size="sm" className="h-10 px-5 text-xs font-bold shrink-0 shadow-sm">
              Evaluate New Inquiry
            </Button>
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search ledger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-[#A39F97] focus:outline-none focus:border-brand-gold transition-all"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-brand-gold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex bg-card-warm/80 p-1 rounded-xl text-[10px] font-bold border border-border-warm">
            {["All", "Resolved", "Disputed", "Unresolved"].map((s) => (
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

        {/* Ledger Table */}
        <Card hoverable={false} className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-warm bg-[#FAF8F5]/60 dark:bg-[#121E19]/35 text-[10px] font-bold text-text-secondary uppercase tracking-wider select-none">
                  <th className="p-4.5 pl-6">Case Title</th>
                  <th className="p-4.5">Madhhab / Usul</th>
                  <th className="p-4.5 text-center">Confidence</th>
                  <th className="p-4.5 text-center">Status</th>
                  <th className="p-4.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm bg-transparent">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-secondary">
                      Loading historical ledger records...
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-secondary">
                      No matching case records found.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-[#FAF8F5]/30 dark:hover:bg-[#121E19]/10 transition-colors"
                    >
                      <td className="p-4.5 pl-6 font-serif font-bold text-[#1E2A22] dark:text-[#E2E8E5] text-sm leading-snug">
                        {c.title}
                      </td>
                      <td className="p-4.5 text-brand-gold font-semibold">
                        {c.madhhab}
                      </td>
                      <td className="p-4.5 text-center font-bold text-text-primary">
                        {c.confidence}%
                      </td>
                      <td className="p-4.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            c.status === "Resolved"
                              ? "bg-brand-green-light text-brand-green"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/40"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4.5 pr-6 text-right">
                        <Link href="/study">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-4 text-[10px] font-bold border-brand-green/30 text-brand-green hover:bg-brand-green-light hover:text-brand-green"
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
