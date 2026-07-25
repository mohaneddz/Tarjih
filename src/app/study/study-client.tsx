"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { ProofTree } from "@/components/ui/proof-tree";
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

function verdictBadgeClass(h?: string): string {
  switch (h) {
    case "haram":
      return "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50";
    case "makruh":
      return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50";
    case "mubah":
      return "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/50";
    case "mandub":
      return "bg-brand-green-light text-brand-green border-brand-green/20";
    case "wajib":
      return "bg-brand-green/15 text-brand-green border-brand-green/30";
    default:
      return "bg-[#EFEDE8] dark:bg-white/5 text-text-secondary border-border-warm";
  }
}

export function StudyClient() {
  const [history, setHistory] = useState<ResolutionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [inputVal, setInputVal] = useState(SUGGESTIONS[0]);
  const [madhhab, setMadhhab] = useState("Shafi'i");
  const [strictness, setStrictness] = useState("Moderate");

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

  function applyView(next: ResolutionView) {
    setView(next);
    setSelectedOutcome(next.verdict ?? next.groups[0]?.outcome ?? null);
    setSelectedClauseId(null);
    setActiveTab("tree");
    setErrorMessage(null);
  }

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    if (!inputVal.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: inputVal.trim(), madhhab, strictness }),
      });

      if (!res.ok) {
        const body: ApiErrorBody = await res.json();
        if (body.error === "no_derivation") {
          setErrorMessage(
            "The knowledge base has no rule covering this yet — that's a real gap in its current coverage, not a failure to understand the question."
          );
        } else if (body.error === "grounding_failed") {
          const term = body.detail?.term;
          setErrorMessage(
            term
              ? `"${term}" isn't a term the knowledge base recognises yet, so this can't be answered from what it currently knows.`
              : body.message
          );
        } else {
          setErrorMessage(body.message || "Something went wrong resolving this question.");
        }
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
                <span className="text-[10px] lg:text-xs bg-brand-gold-light border border-border-warm text-brand-gold px-2.5 py-0.5 rounded-full font-bold">
                  {history.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-card-warm-light border border-transparent hover:border-border-warm/50 text-text-secondary hover:text-text-primary cursor-pointer transition-all shrink-0"
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
                className="w-full h-11 lg:h-12 pl-11 pr-5 text-sm rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-gold transition-all"
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
                      ? "bg-card-warm border-border-warm shadow-sm ring-1 ring-brand-gold/10 text-text-primary"
                      : "bg-transparent border-transparent text-text-secondary hover:bg-card-warm hover:border-border-warm/50 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green truncate">
                      {h.contested ? "Contested" : "Resolved"}
                    </span>
                    {h.verdict && (
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full border font-extrabold uppercase shrink-0 tracking-wider", verdictBadgeClass(h.verdict))}>
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
      <div className="flex-grow h-full flex flex-col min-h-0 overflow-hidden bg-background p-5 md:p-6">
        <div className="relative flex-grow flex flex-col min-h-0 bg-card-warm border border-border-warm rounded-2xl shadow-premium overflow-hidden">
          {/* Tabs header */}
          <div className="min-h-18 lg:min-h-22 border-b border-border-warm-light flex flex-wrap items-center justify-between gap-3 px-6 lg:px-8 py-3 bg-card-warm shrink-0 select-none">
            <div className="flex gap-6 lg:gap-8 items-center flex-wrap">
              {isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-gold-light border border-border-warm text-brand-gold hover:bg-brand-gold/10 transition-all cursor-pointer font-extrabold text-xs mr-2 shrink-0"
                  title="Expand History"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <span>History</span>
                </button>
              )}
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "text-sm lg:text-base font-bold px-1 py-2 border-b-2 transition-all cursor-pointer",
                    activeTab === t.id ? "border-brand-green text-brand-green" : "border-transparent text-text-secondary hover:text-text-primary"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {view?.verdict && (
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-3 py-1 rounded-full border font-extrabold uppercase tracking-wider", verdictBadgeClass(view.verdict))}>
                  {hukmLabel(view.verdict)}
                </span>
                {view.confidence !== undefined && (
                  <span className="text-xs text-text-secondary font-semibold">{view.confidence}% confidence</span>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar p-6 lg:p-8">
            {!view && !errorMessage && (
              <div className="h-full flex items-center justify-center text-center text-text-secondary text-sm max-w-md mx-auto">
                Ask a question below to see the engine derive, weigh, and explain a ruling.
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
                                ? verdictBadgeClass(g.outcome)
                                : "bg-transparent border-border-warm text-text-secondary hover:border-brand-gold/40"
                            )}
                          >
                            {hukmLabel(g.outcome)} · {g.confidence}% · {g.derivationCount} derivation{g.derivationCount === 1 ? "" : "s"}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedGroup && (
                      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
                        <ProofTree proof={selectedGroup.proof} selectedClauseId={selectedClauseId} onSelectNode={setSelectedClauseId} />
                        <div className="bg-background/40 border border-border-warm-light rounded-2xl p-5 flex flex-col gap-4 text-xs">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Inspector</span>
                          {selectedEvidence ? (
                            <div className="flex flex-col gap-3">
                              <div>
                                <span className="text-text-secondary font-semibold">Kind</span>
                                <p className="font-bold text-text-primary capitalize">{selectedEvidence.kind}</p>
                              </div>
                              <div>
                                <span className="text-text-secondary font-semibold">Reference</span>
                                <p className="font-bold text-text-primary">{selectedEvidence.reference}</p>
                              </div>
                              {selectedEvidence.text && (
                                <div>
                                  <span className="text-text-secondary font-semibold">Text</span>
                                  <p className="text-text-secondary leading-relaxed italic">&ldquo;{selectedEvidence.text}&rdquo;</p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {selectedEvidence.grade && (
                                  <span className="px-2 py-0.5 rounded bg-brand-gold-light text-brand-gold font-bold uppercase text-[9px]">{selectedEvidence.grade}</span>
                                )}
                                {selectedEvidence.scope && (
                                  <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold uppercase text-[9px]">{selectedEvidence.scope}</span>
                                )}
                                {selectedEvidence.restriction && (
                                  <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold uppercase text-[9px]">{selectedEvidence.restriction}</span>
                                )}
                              </div>
                              <div>
                                <span className="text-text-secondary font-semibold">Strength</span>
                                <div className="h-2 w-full bg-border-warm-light rounded-full overflow-hidden mt-1">
                                  <div className="h-full bg-brand-green rounded-full" style={{ width: `${selectedEvidence.strength}%` }} />
                                </div>
                                <p className="text-right text-text-secondary mt-0.5">{selectedEvidence.strength}/100</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-text-secondary">Select a node in the tree to inspect its evidence.</p>
                          )}
                        </div>
                      </div>
                    )}
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
                            <span className="text-[9px] px-2 py-0.5 rounded bg-brand-gold-light text-brand-gold font-bold uppercase shrink-0">{r.evidence.kind}</span>
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
                              <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-extrabold uppercase", verdictBadgeClass(g.outcome))}>{hukmLabel(g.outcome)}</span>
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
                                <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">{step.rule}</span>
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
                                <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-extrabold uppercase", verdictBadgeClass(g.outcome))}>{hukmLabel(g.outcome)}</span>
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

          {/* Bottom Controls Bar */}
          <div className="border-t border-border-warm-light px-8 py-5 bg-card-warm shrink-0 select-none">
            <div className="flex flex-wrap items-center gap-2 mb-3.5 max-w-5xl mx-auto w-full">
              <span className="text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-widest mr-1.5">Suggestions:</span>
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setInputVal(sug);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3.5 py-1.5 rounded-full border border-border-warm bg-card-warm/50 text-text-secondary hover:border-brand-gold hover:text-text-primary transition-all cursor-pointer font-semibold shadow-sm"
                >
                  {sug}
                </button>
              ))}
            </div>

            <form onSubmit={handleEvaluate} className="w-full flex flex-col gap-4">
              <div className="flex flex-col w-full max-w-5xl mx-auto">
                <label className="text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-widest mb-1.5 select-none">
                  Ask a ruling question
                </label>
                <div className="relative flex items-center w-full rounded-2xl border border-border-warm bg-card-warm p-1.5 shadow-sm focus-within:border-brand-gold transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask a question the knowledge base can ground and weigh..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-grow bg-transparent h-14 px-5 text-sm md:text-base lg:text-lg text-text-primary font-serif font-semibold placeholder-text-secondary/60 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || isSubmitting}
                    className="h-12 px-6 bg-brand-green hover:bg-brand-green-dark text-white dark:text-black rounded-xl text-xs lg:text-sm font-bold flex items-center gap-2 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904ZM18 10.5l-.5 2.5-.5-2.5-2.5-.5 2.5-.5.5-2.5.5 2.5 2.5.5-2.5.5ZM21 6l-.25 1.25-.25-1.25L19.25 5.5l1.25-.25.25-1.25.25 1.25 1.25.25-1.25.25Z" />
                    </svg>
                    <span>{isSubmitting ? "Weighing..." : "Evaluate"}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-secondary max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-2 bg-background/25 border border-border-warm/65 hover:border-brand-gold/40 transition-all rounded-xl px-4 py-2.5 shadow-sm">
                  <span className="text-[10px] uppercase font-extrabold text-brand-gold tracking-wider mr-1 select-none">Madhhab</span>
                  <select value={madhhab} onChange={(e) => setMadhhab(e.target.value)} disabled={isSubmitting} className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-xs disabled:opacity-50">
                    <option value="Shafi'i">Shafi&apos;i</option>
                    <option value="Hanafi">Hanafi</option>
                    <option value="Maliki">Maliki</option>
                    <option value="Hanbali">Hanbali</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-background/25 border border-border-warm/65 hover:border-brand-gold/40 transition-all rounded-xl px-4 py-2.5 shadow-sm">
                  <span className="text-[10px] uppercase font-extrabold text-brand-gold tracking-wider mr-1 select-none">Strictness</span>
                  <select value={strictness} onChange={(e) => setStrictness(e.target.value)} disabled={isSubmitting} className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-xs disabled:opacity-50">
                    <option value="Moderate">Moderate</option>
                    <option value="Strict">Strict (Azeemah)</option>
                    <option value="Concessive">Concessive (Rukhshah)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {isSubmitting && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-5 select-none">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
                <svg className="h-7 w-7 text-brand-gold animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
                </svg>
              </div>
              <div className="flex flex-col items-center text-center gap-2 max-w-sm px-6">
                <span className="font-serif font-bold text-base text-text-primary tracking-wide animate-pulse">
                  Tarjih Resolution Engine
                </span>
                <span className="text-xs text-brand-gold font-bold font-serif min-h-[1.5rem]">{loadingStep}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
