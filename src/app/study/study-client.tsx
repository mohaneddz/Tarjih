"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { ProofTree, ProofTreeLegend } from "@/components/ui/proof-tree";
import type { ResolutionView } from "@/lib/pipeline/resolve";
import type { EvidenceView, OutcomeGroupView } from "@/lib/pipeline/present";
import { HUKM_LABELS } from "@/lib/kb/ontology";
import type { Hukm } from "@/lib/kb/ontology";

interface ResolutionSummary {
  readonly id: string;
  readonly question: string;
  readonly goal: string;
  readonly madhhab: string | null;
  readonly verdict: string | null;
  readonly confidence: number | null;
  readonly contested: boolean;
  readonly truncated: boolean;
  readonly createdAt: string;
}

type Tab = "tree" | "interpretation" | "sources" | "conflicts";

interface ApiErrorBody {
  readonly error: string;
  readonly message: string;
  readonly detail?: { readonly term?: string };
}

const SUGGESTIONS = [
  "Is mistreating my maternal aunt haram?",
  "Can I eat carrion if I'm starving?",
  "Is eating swine forbidden?",
];

const LOADING_STEPS = [
  "Grounding the question in known terms...",
  "Searching the knowledge base for derivations...",
  "Running the resolution engine...",
  "Weighing conflicting evidence...",
  "Composing the explanation...",
];

function hukmLabel(h: string): string {
  return HUKM_LABELS[h as Hukm]?.en ?? h;
}

/** Certainty label from the raw dalala/thubut field, e.g. "qati" -> "Certain". */
function certaintyLabel(v?: string): string | undefined {
  if (v === "qati") return "Certain";
  if (v === "zanni") return "Probable";
  return undefined;
}

/** Counts how many nodes in this proof tree cite the given clause id. */
function countUses(proof: OutcomeGroupView["proof"], clauseId: string): number {
  let count = proof.clauseId === clauseId ? 1 : 0;
  for (const child of proof.children) count += countUses(child, clauseId);
  return count;
}

export function StudyClient() {
  const [history, setHistory] = useState<ResolutionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [inputVal, setInputVal] = useState(SUGGESTIONS[0]);
  const [madhhab, setMadhhab] = useState("Shafi'i");
  const [strictness, setStrictness] = useState("Moderate");
  const [showSettings, setShowSettings] = useState(false);

  const [groundingPreviewOn, setGroundingPreviewOn] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(LOADING_STEPS[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [view, setView] = useState<ResolutionView | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tree");
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);

  const historyListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/resolutions");
      if (!res.ok) return;
      setHistory(await res.json());
    } catch {
      // History is a convenience; a failed fetch just leaves the list empty.
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!isSubmitting) return;
    let idx = 0;
    setLoadingStep(LOADING_STEPS[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_STEPS.length;
      setLoadingStep(LOADING_STEPS[idx]);
    }, 1400);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter((h) => h.question.toLowerCase().includes(q));
  }, [history, searchQuery]);

  const allGroups: readonly OutcomeGroupView[] = useMemo(() => {
    if (!view) return [];
    return [...view.groups].sort((a, b) => b.confidence - a.confidence);
  }, [view]);

  const selectedGroup = useMemo(
    () => allGroups.find((g) => g.outcome === selectedOutcome) ?? allGroups[0] ?? null,
    [allGroups, selectedOutcome]
  );

  // The strongest group actually contesting the verdict (i.e. not the winner,
  // and not merely a related, non-contradicting opinion the backend already
  // separated out) — the real "Path B" for the Compare Paths panel.
  const contestingLoser = useMemo(() => {
    if (!view || !view.contested) return null;
    const relatedOutcomes = new Set(view.relatedOpinions.map((g) => g.outcome));
    return allGroups.find((g) => g.outcome !== view.verdict && !relatedOutcomes.has(g.outcome)) ?? null;
  }, [view, allGroups]);

  const winnerGroup = useMemo(
    () => (view?.verdict ? allGroups.find((g) => g.outcome === view.verdict) ?? null : null),
    [view, allGroups]
  );

  const references = useMemo(() => {
    if (!view) return [] as { clauseId: string; evidence: EvidenceView }[];
    const seen = new Map<string, EvidenceView>();
    const walk = (node: OutcomeGroupView["proof"]) => {
      if (!seen.has(node.clauseId)) seen.set(node.clauseId, node.evidence);
      node.children.forEach(walk);
    };
    view.groups.forEach((g) => walk(g.proof));
    return [...seen.entries()].map(([clauseId, evidence]) => ({ clauseId, evidence }));
  }, [view]);

  const selectedEvidence = useMemo(() => {
    if (!view || !selectedClauseId) return null;
    return references.find((r) => r.clauseId === selectedClauseId)?.evidence ?? null;
  }, [view, references, selectedClauseId]);

  const selectedUseCount = useMemo(() => {
    if (!selectedGroup || !selectedClauseId) return 0;
    return countUses(selectedGroup.proof, selectedClauseId);
  }, [selectedGroup, selectedClauseId]);

  function applyView(next: ResolutionView) {
    setView(next);
    setSelectedOutcome(next.verdict ?? next.groups[0]?.outcome ?? null);
    setSelectedClauseId(null);
    setActiveTab("tree");
    setErrorMessage(null);
    setPendingPreview(null);
  }

  function describeError(body: ApiErrorBody): string {
    if (body.error === "no_derivation") {
      return "The knowledge base has no rule covering this yet — that's a real gap in its current coverage, not a failure to understand the question.";
    }
    if (body.error === "grounding_failed") {
      const term = body.detail?.term;
      return term
        ? `"${term}" isn't a term the knowledge base recognises yet, so this can't be answered from what it currently knows.`
        : body.message;
    }
    return body.message || "Something went wrong.";
  }

  async function runFullResolve(question: string) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, madhhab, strictness }),
      });
      if (!res.ok) {
        setErrorMessage(describeError(await res.json()));
        return;
      }
      const data: ResolutionView = await res.json();
      applyView(data);
      loadHistory();
      if (historyListRef.current) historyListRef.current.scrollTop = 0;
    } catch {
      setErrorMessage("Could not reach the resolution engine. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePreview(question: string) {
    setPreviewLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/ground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        setErrorMessage(describeError(await res.json()));
        return;
      }
      const data: { goalText: string } = await res.json();
      setPendingPreview(data.goalText);
    } catch {
      setErrorMessage("Could not reach the grounding preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = inputVal.trim();
    if (!question || isSubmitting || previewLoading) return;
    if (groundingPreviewOn && !pendingPreview) {
      await handlePreview(question);
      return;
    }
    await runFullResolve(question);
  }

  async function handleHistoryClick(id: string) {
    try {
      const res = await fetch(`/api/resolutions/${id}`);
      if (!res.ok) return;
      const data: ResolutionView = await res.json();
      applyView(data);
      setInputVal(data.question);
    } catch {
      // Leave the current view untouched on failure.
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "tree", label: "Reasoning Tree" },
    { id: "interpretation", label: "Interpretation" },
    { id: "sources", label: "Sources" },
    { id: "conflicts", label: "Conflicts" },
  ];

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row min-h-0 overflow-hidden bg-background">
      {/* Left Sidebar (Resolution History) */}
      <div
        className={cn(
          "border-b md:border-b-0 md:border-r border-border-warm bg-background flex flex-col shrink-0 min-h-0 transition-all duration-300 ease-in-out relative overflow-hidden",
          isSidebarCollapsed
            ? "w-0 h-0 md:h-full md:w-0 border-b-0 md:border-r-0 opacity-0"
            : "w-full h-[320px] md:h-full md:w-72 lg:w-80 xl:w-[350px] opacity-100"
        )}
      >
        <div className="w-full md:w-72 lg:w-80 xl:w-[350px] h-full flex flex-col shrink-0">
          <div className="p-5 flex flex-col gap-3.5 shrink-0 border-b border-border-warm-light">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <h2 className="text-xs lg:text-sm font-bold text-text-secondary uppercase tracking-widest">
                  Resolution History
                </h2>
                <span className="text-[10px] lg:text-xs bg-brand-red-light border border-border-warm text-brand-red px-2.5 py-0.5 rounded-full font-bold">
                  {history.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-border-warm-light border border-transparent text-text-secondary hover:text-text-primary cursor-pointer transition-all shrink-0"
                title="Collapse History"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 lg:h-12 pl-11 pr-5 text-sm rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-red transition-all"
              />
              <svg className="absolute left-4 top-3.5 lg:top-4 h-4 w-4 lg:h-5 lg:w-5 text-text-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div ref={historyListRef} className="flex-grow overflow-y-auto custom-scrollbar p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 bg-background select-none">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-text-secondary text-xs">
                No resolution history yet. Ask a question below to start.
              </div>
            ) : (
              filteredHistory.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleHistoryClick(h.id)}
                  className={cn(
                    "w-full text-left p-4 lg:p-5 rounded-2xl border transition-all text-sm select-none cursor-pointer flex flex-col gap-3",
                    view?.question === h.question
                      ? "bg-card-warm border-border-warm shadow-sm ring-1 ring-brand-red/10 text-text-primary"
                      : "bg-transparent border-transparent text-text-secondary hover:bg-card-warm hover:border-border-warm/50 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green truncate">
                      {h.contested ? "Contested" : "Resolved"}
                    </span>
                    {h.verdict && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full border border-brand-red/30 bg-brand-red-light text-brand-red font-extrabold uppercase shrink-0 tracking-wider">
                        {h.verdict}
                      </span>
                    )}
                  </div>
                  <span className="font-serif font-bold text-sm text-text-primary leading-snug line-clamp-2">
                    {h.question}
                  </span>
                  {h.confidence !== null && (
                    <span className="text-xs text-text-secondary">{h.confidence}% confidence</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-grow h-full flex flex-col min-h-0 overflow-hidden bg-background p-5 md:p-6 gap-4">
        {/* Question bar */}
        <div className="shrink-0 bg-card-warm border border-border-warm rounded-2xl shadow-premium p-3 flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="flex items-center justify-center h-11 w-11 shrink-0 rounded-xl bg-brand-red-light text-brand-red hover:bg-brand-red/15 transition-all cursor-pointer"
                title="Expand History"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
            <span className="h-11 w-11 shrink-0 rounded-xl bg-brand-red text-white flex items-center justify-center font-serif font-bold text-lg">
              Q
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a question the knowledge base can ground and weigh..."
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setPendingPreview(null);
              }}
              disabled={isSubmitting}
              className="flex-grow bg-transparent h-11 px-1 text-sm md:text-base text-text-primary font-serif font-semibold placeholder-text-secondary/60 focus:outline-none disabled:opacity-50 min-w-0"
            />
            <label className="hidden lg:flex items-center gap-2 text-xs text-text-secondary shrink-0 select-none cursor-pointer">
              Grounding preview
              <button
                type="button"
                role="switch"
                aria-checked={groundingPreviewOn}
                onClick={() => {
                  setGroundingPreviewOn((v) => !v);
                  setPendingPreview(null);
                }}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors cursor-pointer shrink-0",
                  groundingPreviewOn ? "bg-brand-red" : "bg-border-warm"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    groundingPreviewOn ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
            </label>
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className="h-11 w-11 shrink-0 rounded-xl border border-border-warm text-text-secondary hover:text-brand-red hover:border-brand-red/40 transition-all cursor-pointer flex items-center justify-center"
              title="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={!inputVal.trim() || isSubmitting || previewLoading}
              className="h-11 px-6 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
            >
              {previewLoading ? "Grounding..." : isSubmitting ? "Weighing..." : pendingPreview ? "Confirm & Analyze" : "Analyze"}
            </button>
          </form>

          {showSettings && (
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border-warm-light text-sm text-text-secondary">
              <div className="flex items-center gap-2 bg-background/50 border border-border-warm/65 rounded-xl px-3 py-2">
                <span className="text-[10px] uppercase font-extrabold text-brand-red tracking-wider">Madhhab</span>
                <select value={madhhab} onChange={(e) => setMadhhab(e.target.value)} className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-xs">
                  <option value="Shafi'i">Shafi&apos;i</option>
                  <option value="Hanafi">Hanafi</option>
                  <option value="Maliki">Maliki</option>
                  <option value="Hanbali">Hanbali</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-background/50 border border-border-warm/65 rounded-xl px-3 py-2">
                <span className="text-[10px] uppercase font-extrabold text-brand-red tracking-wider">Strictness</span>
                <select value={strictness} onChange={(e) => setStrictness(e.target.value)} className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-xs">
                  <option value="Moderate">Moderate</option>
                  <option value="Strict">Strict (Azeemah)</option>
                  <option value="Concessive">Concessive (Rukhshah)</option>
                </select>
              </div>
            </div>
          )}

          {pendingPreview && (
            <div className="flex items-center gap-3 bg-brand-red-light/60 border border-brand-red/25 rounded-xl px-4 py-2.5 text-xs">
              <span className="font-bold text-brand-red uppercase tracking-wider shrink-0">Grounded as</span>
              <code className="font-mono text-text-primary truncate">{pendingPreview}</code>
              <button
                type="button"
                onClick={() => setPendingPreview(null)}
                className="ml-auto text-text-secondary hover:text-text-primary shrink-0 cursor-pointer font-semibold"
              >
                Edit question
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold text-brand-red tracking-widest mr-1">Try:</span>
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  setInputVal(sug);
                  setPendingPreview(null);
                  inputRef.current?.focus();
                }}
                className="text-xs px-3 py-1 rounded-full border border-border-warm text-text-secondary hover:border-brand-red hover:text-text-primary transition-all cursor-pointer font-semibold"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Verdict banner */}
        {view?.verdict && (
          <div className="shrink-0 bg-card-warm border border-border-warm rounded-2xl shadow-premium px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-text-secondary font-semibold">Verdict:</span>
              <span className="font-serif text-2xl font-bold text-brand-red">{hukmLabel(view.verdict)}</span>
              {view.confidence !== undefined && (
                <span className="text-xs text-text-secondary">{view.confidence}% confidence</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("interpretation")}
              className="text-xs font-bold text-brand-red hover:underline cursor-pointer shrink-0 flex items-center gap-1"
            >
              View summary
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}

        <div className="relative flex-grow flex flex-col min-h-0 bg-card-warm border border-border-warm rounded-2xl shadow-premium overflow-hidden">
          {/* Tabs header */}
          <div className="min-h-14 border-b border-border-warm-light flex flex-wrap items-center gap-6 px-6 lg:px-8 py-2 bg-card-warm shrink-0 select-none">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "text-sm font-bold px-1 py-2 border-b-2 transition-all cursor-pointer",
                  activeTab === t.id ? "border-brand-red text-brand-red" : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar p-6 lg:p-8">
            {!view && !errorMessage && (
              <div className="h-full flex items-center justify-center text-center text-text-secondary text-sm max-w-md mx-auto">
                Ask a question above to see the engine derive, weigh, and explain a ruling.
              </div>
            )}

            {errorMessage && (
              <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 text-sm text-amber-900 dark:text-amber-200">
                {errorMessage}
              </div>
            )}

            {view && !errorMessage && (
              <>
                {view.truncated && (
                  <div className="mb-6 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3">
                    The search hit a resource budget and may not have found every derivation. Treat this result as partial.
                  </div>
                )}
                {view.unresolved && (
                  <div className="mb-6 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 rounded-xl px-4 py-3">
                    The engine found genuinely conflicting rulings that its weighing rules could not separate. No single
                    verdict is reported — see the Conflicts tab.
                  </div>
                )}

                {activeTab === "tree" && (
                  <div className="flex flex-col gap-4">
                    {allGroups.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {allGroups.map((g) => (
                          <button
                            key={g.outcome}
                            onClick={() => setSelectedOutcome(g.outcome)}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-full border font-bold transition-all cursor-pointer",
                              selectedGroup?.outcome === g.outcome
                                ? "bg-brand-red-light border-brand-red/40 text-brand-red"
                                : "bg-transparent border-border-warm text-text-secondary hover:border-brand-red/40"
                            )}
                          >
                            {hukmLabel(g.outcome)} · {g.confidence}% · {g.derivationCount} derivation{g.derivationCount === 1 ? "" : "s"}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={cn(
                        "grid grid-cols-1 gap-5",
                        winnerGroup && contestingLoser ? "xl:grid-cols-[220px_1fr_280px]" : "xl:grid-cols-[1fr_280px]"
                      )}
                    >
                      {/* Compare Paths */}
                      {winnerGroup && contestingLoser && (
                        <div className="bg-background/40 border border-border-warm-light rounded-2xl p-4 flex flex-col gap-4 text-xs">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Compare Paths</span>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-text-primary">Path A</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-brand-red text-white font-bold uppercase">Wins</span>
                            </div>
                            <span className="font-serif font-bold text-brand-red">{hukmLabel(winnerGroup.outcome)}</span>
                            <span className="text-text-secondary">{winnerGroup.confidence}% confidence, {winnerGroup.derivationCount} derivation{winnerGroup.derivationCount === 1 ? "" : "s"}</span>
                          </div>
                          <div className="text-center text-text-secondary/60 text-[10px] font-bold">vs</div>
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-text-primary">Path B</span>
                            <span className="font-serif font-bold text-text-secondary">{hukmLabel(contestingLoser.outcome)}</span>
                            <span className="text-text-secondary">{contestingLoser.confidence}% confidence, {contestingLoser.derivationCount} derivation{contestingLoser.derivationCount === 1 ? "" : "s"}</span>
                          </div>
                          {view.resolution.length > 0 && (
                            <div className="flex flex-col gap-2 pt-2 border-t border-border-warm-light">
                              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Why Path A prevails</span>
                              <ol className="flex flex-col gap-2">
                                {view.resolution.map((step, i) => (
                                  <li key={i} className="flex gap-1.5">
                                    <span className="text-brand-red font-bold shrink-0">{i + 1}.</span>
                                    <span className="text-text-secondary leading-relaxed">{step.explanation}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedGroup && (
                        <div className="flex flex-col gap-2 min-w-0">
                          <ProofTree proof={selectedGroup.proof} selectedClauseId={selectedClauseId} onSelectNode={setSelectedClauseId} />
                          <ProofTreeLegend />
                        </div>
                      )}

                      {/* Evidence Inspector */}
                      <div className="bg-background/40 border border-border-warm-light rounded-2xl p-5 flex flex-col gap-4 text-xs">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Evidence Inspector</span>
                        {selectedEvidence ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-serif font-bold text-text-primary text-sm">{selectedEvidence.reference}</p>
                              {(selectedEvidence.grade === "sahih" || selectedEvidence.grade === "mutawatir") && (
                                <span className="shrink-0 text-[8px] px-2 py-1 rounded-full border border-brand-green/40 text-brand-green font-extrabold uppercase tracking-wider">
                                  ✓ Authentic
                                </span>
                              )}
                            </div>

                            {selectedEvidence.textArabic && (
                              <div>
                                <span className="text-text-secondary font-semibold">Original text (Arabic)</span>
                                <p dir="rtl" className="font-serif text-sm text-text-primary leading-relaxed mt-1">
                                  {selectedEvidence.textArabic}
                                </p>
                              </div>
                            )}
                            {selectedEvidence.text && (
                              <div>
                                <span className="text-text-secondary font-semibold">Translation</span>
                                <p className="text-text-secondary leading-relaxed italic mt-1">&ldquo;{selectedEvidence.text}&rdquo;</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2 border-t border-border-warm-light">
                              {selectedEvidence.grade && (
                                <div>
                                  <span className="text-text-secondary block">Authenticity grade</span>
                                  <span className="font-bold text-text-primary capitalize">{selectedEvidence.grade}</span>
                                </div>
                              )}
                              {selectedEvidence.scope && (
                                <div>
                                  <span className="text-text-secondary block">Scope</span>
                                  <span className="font-bold text-text-primary capitalize">{selectedEvidence.scope === "khass" ? "Specific" : "General"}</span>
                                </div>
                              )}
                              {certaintyLabel(selectedEvidence.dalala) && (
                                <div>
                                  <span className="text-text-secondary block">Certainty</span>
                                  <span className="font-bold text-text-primary">{certaintyLabel(selectedEvidence.dalala)}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-text-secondary block">Evidence type</span>
                                <span className="font-bold text-text-primary capitalize">{selectedEvidence.kind}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-text-secondary font-semibold">Strength</span>
                              <div className="h-2 w-full bg-border-warm-light rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-brand-green rounded-full" style={{ width: `${selectedEvidence.strength}%` }} />
                              </div>
                              <p className="text-right text-text-secondary mt-0.5">{selectedEvidence.strength}/100</p>
                            </div>

                            {selectedEvidence.notes && (
                              <div className="pt-2 border-t border-border-warm-light">
                                <span className="text-text-secondary font-semibold">Why this node fired</span>
                                <p className="text-text-secondary leading-relaxed mt-1">{selectedEvidence.notes}</p>
                              </div>
                            )}

                            <div className="pt-2 border-t border-border-warm-light flex items-center justify-between">
                              <span className="text-text-secondary">Used in this analysis</span>
                              <span className="font-bold text-text-primary">{selectedUseCount} time{selectedUseCount === 1 ? "" : "s"}</span>
                            </div>
                            {selectedEvidence.unreviewed && (
                              <div className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold">
                                Unreviewed: this clause was formalised by the LLM pipeline and has not yet been checked by a human.
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-text-secondary">Select a node in the tree to inspect its evidence.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "interpretation" && (
                  <div className="max-w-3xl flex flex-col gap-5">
                    <div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Summary</span>
                      <p className="font-serif text-lg text-text-primary mt-1 leading-relaxed">{view.narration.summary}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Analysis</span>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed whitespace-pre-line">{view.narration.analysis}</p>
                    </div>
                    {view.narration.notes && (
                      <div className="bg-background/40 border border-border-warm-light rounded-xl p-4">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Notes</span>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{view.narration.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sources" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {references
                      .filter((r) => r.evidence.kind !== "ontology")
                      .map((r) => (
                        <div key={r.clauseId} className="bg-background/40 border border-border-warm-light rounded-xl p-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-serif font-bold text-sm text-text-primary">{r.evidence.reference}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-brand-red-light text-brand-red font-bold uppercase shrink-0">{r.evidence.kind}</span>
                          </div>
                          {r.evidence.text && <p className="text-xs text-text-secondary italic leading-relaxed">&ldquo;{r.evidence.text}&rdquo;</p>}
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {r.evidence.grade && <span className="text-[9px] px-1.5 py-0.5 rounded bg-border-warm-light/60 text-text-secondary font-bold uppercase">{r.evidence.grade}</span>}
                            {r.evidence.unreviewed && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold uppercase">unreviewed</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {activeTab === "conflicts" && (
                  <div className="max-w-3xl flex flex-col gap-5">
                    {!view.contested ? (
                      <p className="text-sm text-text-secondary">
                        No genuinely conflicting rulings were found for this question — every derivation reached the same conclusion.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Competing rulings</span>
                          {allGroups.map((g) => (
                            <div key={g.outcome} className="flex items-center justify-between bg-background/40 border border-border-warm-light rounded-xl px-4 py-3">
                              <span className="text-xs px-2.5 py-0.5 rounded-full border border-brand-red/30 bg-brand-red-light text-brand-red font-extrabold uppercase">{hukmLabel(g.outcome)}</span>
                              <span className="text-xs text-text-secondary">{g.confidence}% confidence · {g.derivationCount} derivation{g.derivationCount === 1 ? "" : "s"}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Tarjih (weighing) applied</span>
                          {view.resolution.length === 0 ? (
                            <p className="text-sm text-text-secondary">No weighing rule could separate the competing rulings.</p>
                          ) : (
                            view.resolution.map((step, i) => (
                              <div key={i} className="bg-background/40 border border-border-warm-light rounded-xl p-4">
                                <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider">{step.rule}</span>
                                <p className="text-sm text-text-primary mt-1">
                                  <strong>{hukmLabel(step.winner)}</strong> preferred over <strong>{hukmLabel(step.loser)}</strong>
                                </p>
                                <p className="text-xs text-text-secondary mt-1 leading-relaxed">{step.explanation}</p>
                              </div>
                            ))
                          )}
                        </div>
                        {view.relatedOpinions.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Related, non-contradicting opinions</span>
                            {view.relatedOpinions.map((g) => (
                              <div key={g.outcome} className="flex items-center justify-between bg-background/40 border border-border-warm-light rounded-xl px-4 py-3">
                                <span className="text-xs px-2.5 py-0.5 rounded-full border border-brand-red/30 bg-brand-red-light text-brand-red font-extrabold uppercase">{hukmLabel(g.outcome)}</span>
                                <span className="text-xs text-text-secondary">{g.confidence}% confidence</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-5 select-none">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-brand-red/20 border-t-brand-red animate-spin" />
            <svg className="h-7 w-7 text-brand-red animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center gap-2 max-w-sm px-6">
            <span className="font-serif font-bold text-base text-text-primary tracking-wide animate-pulse">
              Tarjih Resolution Engine
            </span>
            <span className="text-xs text-brand-red font-bold font-serif min-h-[1.5rem]">{loadingStep}</span>
          </div>
        </div>
      )}
    </div>
  );
}
