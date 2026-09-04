"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import { ProofTree, ProofTreeLegend } from "@/components/ui/proof-tree";
import type { ResolutionView } from "@/lib/pipeline/resolve";
import type { EvidenceView, OutcomeGroupView } from "@/lib/pipeline/present";
import { HUKM_LABELS } from "@/lib/kb/ontology";
import type { Hukm } from "@/lib/kb/ontology";
import { VerdictBadge, EvidenceBadge, RulingRosette, WeighingScale, AuthenticStamp } from "@/components/ui/asset-badge";
import { getSavedCases, toggleSavedCase } from "@/lib/saved-cases";

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
  readonly detail?: { readonly term?: string; readonly kind?: string };
}

interface ErrorInfo {
  readonly message: string;
  /**
   * True when the question itself was the problem — not a yes/no ruling
   * question, unrelated to fiqh, or too malformed to parse — as opposed to
   * a well-formed question the KB simply has no rule for yet. These get a
   * "please ask it like this" panel with examples instead of a bare error
   * line, since telling someone their phrasing was wrong is only useful if
   * it also shows the right shape.
   */
  readonly isFormatIssue: boolean;
}

/** Goal-grounding failures caused by how the question was asked, not by a real KB coverage gap. */
const FORMAT_ISSUE_KINDS = new Set(["not-covered", "unsupported-shape", "parse-error"]);

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

/**
 * Fetches past resolutions, returning null on any failure.
 *
 * Returns the rows rather than setting state itself so the caller owns the
 * write. History is a convenience: a failed fetch leaves whatever is already
 * on screen, and never surfaces an error.
 */
async function fetchHistory(): Promise<ResolutionSummary[] | null> {
  try {
    const res = await fetch("/api/resolutions");
    if (!res.ok) return null;
    return (await res.json()) as ResolutionSummary[];
  } catch {
    return null;
  }
}

interface HistoryCardProps {
  readonly entry: ResolutionSummary;
  readonly isActive: boolean;
  readonly isSaved: boolean;
  readonly onSelect: () => void;
  readonly onToggleSave: () => void;
}

function HistoryCard({ entry, isActive, isSaved, onSelect, onToggleSave }: HistoryCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full text-left p-4 lg:p-5 rounded-2xl border transition-all text-sm select-none cursor-pointer flex flex-col gap-3",
        isActive
          ? "bg-card-warm border-border-warm shadow-sm ring-1 ring-brand-red/10 text-text-primary"
          : "bg-transparent border-transparent text-text-secondary hover:bg-card-warm hover:border-border-warm/50 hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <span className="text-[12px] uppercase tracking-wider font-extrabold text-brand-green truncate">
          {entry.contested ? "Contested" : "Resolved"}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {entry.verdict && <VerdictBadge verdict={entry.verdict} size="sm" showLabel={false} />}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            title={isSaved ? "Remove from saved cases" : "Save this case"}
            className="p-1 rounded-md text-text-secondary hover:text-brand-red transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" fill={isSaved ? "currentColor" : "none"}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </button>
        </div>
      </div>
      <span className="font-serif font-bold text-sm text-text-primary leading-snug line-clamp-2">{entry.question}</span>
      {entry.confidence !== null && <span className="text-sm text-text-secondary">{entry.confidence}% confidence</span>}
    </div>
  );
}

export function StudyClient() {
  // React Compiler's memoization of the deeply-nested history-list JSX below
  // (a ternary inside a mapped conditional) has been observed to drop
  // references to identifiers defined outside that region — it threw
  // "X is not defined" at runtime for two unrelated identifiers in a row
  // while the component itself compiled cleanly. Opting this component out
  // is the documented escape hatch rather than restructuring working JSX
  // around a compiler bug.
  "use no memo";
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<ResolutionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const [inputVal, setInputVal] = useState(SUGGESTIONS[0]);
  const [madhhab, setMadhhab] = useState("Shafi'i");
  const [strictness, setStrictness] = useState("Moderate");
  const [showSettings, setShowSettings] = useState(false);

  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  const [view, setView] = useState<ResolutionView | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tree");
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);

  const historyListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistory().then((rows) => {
      if (!cancelled && rows) setHistory(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSavedIds(new Set(getSavedCases().map((c) => c.id)));
  }, []);

  // Arriving from the Saved Cases page (`/study?id=...`) loads that
  // resolution straight away, the same as clicking it in the sidebar would.
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) handleHistoryClick(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /*
   * Advances the loading caption. Held as an index rather than the string so
   * the first step can be shown by resetting the index alongside
   * `setIsSubmitting(true)` in the event handler, instead of being pushed in
   * synchronously from here — a setState in an effect body forces a second
   * render pass before anything is painted.
   */
  useEffect(() => {
    if (!isSubmitting) return;
    const interval = setInterval(() => {
      setLoadingStepIndex((i) => (i + 1) % LOADING_STEPS.length);
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
    setErrorInfo(null);
    setPendingPreview(null);
  }

  function describeError(body: ApiErrorBody): ErrorInfo {
    if (body.error === "no_derivation") {
      return {
        message: "The knowledge base has no rule covering this yet — that's a real gap in its current coverage, not a failure to understand the question.",
        isFormatIssue: false,
      };
    }
    if (body.error === "grounding_failed") {
      const kind = body.detail?.kind;
      if (kind && FORMAT_ISSUE_KINDS.has(kind)) {
        return { message: body.message, isFormatIssue: true };
      }
      const term = body.detail?.term;
      return {
        message: term
          ? `"${term}" isn't a term the knowledge base recognises yet, so this can't be answered from what it currently knows.`
          : body.message,
        isFormatIssue: false,
      };
    }
    return { message: body.message || "Something went wrong.", isFormatIssue: false };
  }

  async function runFullResolve(question: string) {
    setIsSubmitting(true);
    setLoadingStepIndex(0);
    setErrorInfo(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, madhhab, strictness }),
      });
      if (!res.ok) {
        setErrorInfo(describeError(await res.json()));
        return;
      }
      const data: ResolutionView = await res.json();
      applyView(data);
      const rows = await fetchHistory();
      if (rows) setHistory(rows);
      if (historyListRef.current) historyListRef.current.scrollTop = 0;
    } catch {
      setErrorInfo({ message: "Could not reach the resolution engine. Check your connection and try again.", isFormatIssue: false });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePreview(question: string) {
    setPreviewLoading(true);
    setErrorInfo(null);
    try {
      const res = await fetch("/api/ground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        setErrorInfo(describeError(await res.json()));
        return;
      }
      const data: { goalText: string } = await res.json();
      setPendingPreview(data.goalText);
    } catch {
      setErrorInfo({ message: "Could not reach the grounding preview.", isFormatIssue: false });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = inputVal.trim();
    if (!question || isSubmitting || previewLoading) return;
    if (!pendingPreview) {
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
                <h2 className="text-sm lg:text-sm font-bold text-text-secondary uppercase tracking-widest">
                  Resolution History
                </h2>
                <span className="text-[12px] lg:text-sm bg-brand-red-light border border-border-warm text-brand-red px-2.5 py-0.5 rounded-full font-bold">
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
              <div className="text-center py-12 text-text-secondary text-sm">
                No resolution history yet. Ask a question below to start.
              </div>
            ) : (
              filteredHistory.map((h) => (
                <HistoryCard
                  key={h.id}
                  entry={h}
                  isActive={view?.question === h.question}
                  isSaved={savedIds.has(h.id)}
                  onSelect={() => handleHistoryClick(h.id)}
                  onToggleSave={() => {
                    const saved = toggleSavedCase({
                      id: h.id,
                      question: h.question,
                      verdict: h.verdict,
                      confidence: h.confidence,
                      contested: h.contested,
                    });
                    setSavedIds((prev) => {
                      const next = new Set(prev);
                      if (saved) next.add(h.id);
                      else next.delete(h.id);
                      return next;
                    });
                  }}
                />
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
                <span className="text-[12px] uppercase font-extrabold text-brand-red tracking-wider">Madhhab</span>
                <select value={madhhab} onChange={(e) => setMadhhab(e.target.value)} className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-sm">
                  <option value="Shafi'i">Shafi&apos;i</option>
                  <option value="Hanafi">Hanafi</option>
                  <option value="Maliki">Maliki</option>
                  <option value="Hanbali">Hanbali</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-background/50 border border-border-warm/65 rounded-xl px-3 py-2">
                <span className="text-[12px] uppercase font-extrabold text-brand-red tracking-wider">Strictness</span>
                <select value={strictness} onChange={(e) => setStrictness(e.target.value)} className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer text-sm">
                  <option value="Moderate">Moderate</option>
                  <option value="Strict">Strict (Azeemah)</option>
                  <option value="Concessive">Concessive (Rukhshah)</option>
                </select>
              </div>
              {/*
                * Both controls are recorded with the question and neither
                * changes what the engine derives yet. Saying so here is the
                * point: a setting that looks live and is quietly ignored is
                * worse than one that is absent, because it lends the answer a
                * precision nobody computed.
                */}
              <span className="text-[12px] text-text-secondary/80 basis-full">
                Recorded with the question, but not yet used in the reasoning — the knowledge
                base is madhhab-neutral, and every applicable concession is applied regardless of
                strictness. The answer will say so.
              </span>
            </div>
          )}

          {pendingPreview && (
            <div className="flex items-center gap-3 bg-background border border-border-warm rounded-xl px-4 py-2.5 text-sm">
              <span className="font-bold text-text-secondary uppercase tracking-wider shrink-0">Grounded as</span>
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
            <span className="text-[12px] uppercase font-extrabold text-brand-red tracking-widest mr-1">Try:</span>
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  setInputVal(sug);
                  setPendingPreview(null);
                  inputRef.current?.focus();
                }}
                className="text-sm px-3 py-1 rounded-full border border-border-warm text-text-secondary hover:border-brand-red hover:text-text-primary transition-all cursor-pointer font-semibold"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Verdict banner */}
        {view?.verdict && (
          <div className="shrink-0 bg-card-warm border border-border-warm rounded-2xl shadow-premium px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RulingRosette size="md" />
              <span className="text-sm text-text-secondary font-semibold">Verdict:</span>
              <VerdictBadge verdict={view.verdict} size="md" showLabel={false} />
              <span className="font-serif text-2xl font-bold text-brand-red">{hukmLabel(view.verdict)}</span>
              {view.confidence !== undefined && (
                <span className="text-sm text-text-secondary">({view.confidence}% confidence)</span>
              )}
            </div>
            {/*
              * A second answer to a second question, not a restatement.
              * "May I enter this?" and "does this take effect?" diverge often
              * enough that showing only the first would leave someone acting
              * on a contract they think is void, or vice versa.
              */}
            {view.declaratory && (
              <div className="flex items-center gap-2 border-l border-border-warm pl-4">
                <span className="text-sm text-text-secondary font-semibold">Contract:</span>
                <span className="font-serif text-lg font-bold text-text-primary">
                  {view.declaratory.label}
                </span>
                <span className="text-sm text-text-secondary">({view.declaratory.confidence}%)</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("interpretation")}
              className="text-sm font-bold text-brand-red hover:underline cursor-pointer shrink-0 flex items-center gap-1"
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
          <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
            {!view && !errorInfo && (
              <div className="h-full flex items-center justify-center text-center text-text-secondary text-sm max-w-md mx-auto p-6 lg:p-8">
                Ask a question above to see the engine derive, weigh, and explain a ruling.
              </div>
            )}

            {errorInfo && errorInfo.isFormatIssue && (
              <div className="max-w-2xl mx-auto m-6 lg:m-8 flex flex-col gap-5">
                <div className="bg-card-warm border border-border-warm rounded-2xl p-6 flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Please ask a ruling question</span>
                  <p className="text-sm text-text-primary leading-relaxed">
                    Tarjih answers yes/no questions about whether a specific act is permitted, forbidden, or
                    something in between — not open-ended, unrelated, or ambiguous questions. {errorInfo.message}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Try one of these instead</span>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setInputVal(s);
                          setPendingPreview(null);
                          setErrorInfo(null);
                          inputRef.current?.focus();
                        }}
                        className="text-left text-sm font-semibold text-text-primary bg-card-warm border border-border-warm rounded-xl px-4 py-3 hover:border-brand-red/40 hover:text-brand-red transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {errorInfo && !errorInfo.isFormatIssue && (
              <div className="max-w-2xl mx-auto bg-card-warm border border-border-warm rounded-2xl p-6 text-sm text-text-primary m-6 lg:m-8">
                {errorInfo.message}
              </div>
            )}

            {view && !errorInfo && (
              <div className={cn(activeTab === "tree" ? "px-3 pt-3 pb-4 lg:px-4" : "p-6 lg:p-8")}>
                {view.truncated && (
                  <div className="mb-6 text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3">
                    The search hit a resource budget and may not have found every derivation. Treat this result as partial.
                  </div>
                )}
                {view.premises.length > 0 && (
                  /*
                   * The one part of the result a reader cannot check against a
                   * source. Everything else here traces to a text; these are
                   * what the engine understood about *them*, and a concession
                   * resting on a misread one is the failure worth catching, so
                   * it sits above the answer rather than inside the proof.
                   */
                  <div className="mb-6 text-sm bg-background border border-border-warm rounded-xl px-4 py-3 flex flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">
                      Taken from your question
                    </span>
                    <ul className="flex flex-col gap-1 text-text-secondary">
                      {view.premises.map((p) => (
                        <li key={p.situation}>{p.label}</li>
                      ))}
                    </ul>
                    <span className="text-text-secondary/80">
                      The ruling below holds only so far as this is true of you. Without it, the
                      general ruling applies instead.
                    </span>
                  </div>
                )}
                {view.unresolved && (
                  <div className="mb-6 text-sm bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 rounded-xl px-4 py-3">
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
                              "text-sm px-3 py-1.5 rounded-full border font-bold transition-all cursor-pointer",
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
                        winnerGroup && contestingLoser ? "xl:grid-cols-[220px_1fr]" : "grid-cols-1"
                      )}
                    >
                      {/* Compare Paths */}
                      {winnerGroup && contestingLoser && (
                        <div className="bg-background/40 border border-border-warm-light rounded-2xl p-4 flex flex-col gap-4 text-sm">
                          <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Compare Paths</span>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-text-primary">Path A</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-red text-white font-bold uppercase">Wins</span>
                            </div>
                            <span className="font-serif font-bold text-brand-red">{hukmLabel(winnerGroup.outcome)}</span>
                            <span className="text-text-secondary">{winnerGroup.confidence}% confidence, {winnerGroup.derivationCount} derivation{winnerGroup.derivationCount === 1 ? "" : "s"}</span>
                          </div>
                          <div className="text-center text-text-secondary/60 text-[12px] font-bold">vs</div>
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-text-primary">Path B</span>
                            <span className="font-serif font-bold text-text-secondary">{hukmLabel(contestingLoser.outcome)}</span>
                            <span className="text-text-secondary">{contestingLoser.confidence}% confidence, {contestingLoser.derivationCount} derivation{contestingLoser.derivationCount === 1 ? "" : "s"}</span>
                          </div>
                          {view.resolution.length > 0 && (
                            <div className="flex flex-col gap-2 pt-2 border-t border-border-warm-light">
                              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Why Path A prevails</span>
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
                        <div className="relative flex flex-col gap-2 min-w-0">
                          <ProofTree proof={selectedGroup.proof} selectedClauseId={selectedClauseId} onSelectNode={setSelectedClauseId} />
                          <ProofTreeLegend />

                          {/* Evidence Inspector — floats over the canvas once a node is selected */}
                          {selectedClauseId && selectedEvidence && (
                            <div className="absolute top-4 right-4 z-20 w-[min(360px,calc(100%-2rem))] max-h-[calc(75vh-2rem)] overflow-y-auto custom-scrollbar bg-card-warm border border-border-warm-light rounded-2xl p-5 flex flex-col gap-4 text-sm shadow-xl">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Evidence Inspector</span>
                                <button
                                  onClick={() => setSelectedClauseId(null)}
                                  className="text-text-secondary hover:text-text-primary cursor-pointer rounded-full h-6 w-6 flex items-center justify-center shrink-0"
                                  aria-label="Close evidence inspector"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-serif font-bold text-text-primary text-sm">{selectedEvidence.reference}</p>
                                  {(selectedEvidence.grade === "sahih" || selectedEvidence.grade === "mutawatir") && (
                                    <AuthenticStamp size="sm" showLabel={false} />
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
                                    <div className="flex flex-col gap-1">
                                      <span className="text-text-secondary block">Authenticity grade</span>
                                      <EvidenceBadge grade={selectedEvidence.grade} size="sm" />
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
                                  <div className="text-[12px] px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold">
                                    Unreviewed: this clause was formalised by the LLM pipeline and has not yet been checked by a human.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "interpretation" && (
                  <div className="max-w-3xl flex flex-col gap-5">
                    <div>
                      <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Summary</span>
                      <p className="font-serif text-lg text-text-primary mt-1 leading-relaxed">{view.narration.summary}</p>
                    </div>
                    {view.declaratory && (
                      <div className="bg-background/40 border border-border-warm-light rounded-xl p-4 flex flex-col gap-1">
                        <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">
                          Declaratory ruling (al-hukm al-wad&apos;i)
                        </span>
                        <p className="font-serif text-base font-bold text-text-primary">
                          {view.declaratory.label}
                          {view.declaratory.contested && " — contested"}
                        </p>
                        <p className="text-sm text-text-secondary leading-relaxed">{view.declaratory.gloss}</p>
                        <p className="text-sm text-text-secondary/80 leading-relaxed mt-1">
                          Whether the act is permitted and whether the contract takes legal effect are
                          separate questions; this answers the second.
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Analysis</span>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed whitespace-pre-line">{view.narration.analysis}</p>
                    </div>
                    {view.narration.notes && (
                      <div className="bg-background/40 border border-border-warm-light rounded-xl p-4">
                        <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Notes</span>
                        <p className="text-sm text-text-secondary mt-1 leading-relaxed">{view.narration.notes}</p>
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
                            <span className="text-[11px] px-2 py-0.5 rounded bg-brand-red-light text-brand-red font-bold uppercase shrink-0">{r.evidence.kind}</span>
                          </div>
                          {r.evidence.text && <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{r.evidence.text}&rdquo;</p>}
                          <div className="flex gap-2 flex-wrap items-center mt-1">
                            <EvidenceBadge grade={r.evidence.grade || (r.evidence.kind === "quran" ? "authentic" : "unverified")} size="sm" />
                            {r.evidence.unreviewed && (
                              <EvidenceBadge grade="unverified" size="sm" showLabel={false} />
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
                          <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Competing rulings</span>
                          {allGroups.map((g) => (
                            <div key={g.outcome} className="flex items-center justify-between bg-background/40 border border-border-warm-light rounded-xl px-4 py-3">
                              <VerdictBadge verdict={g.outcome} size="sm" />
                              <span className="text-sm text-text-secondary">{g.confidence}% confidence · {g.derivationCount} derivation{g.derivationCount === 1 ? "" : "s"}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <WeighingScale size="sm" />
                            <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Tarjih (weighing) applied</span>
                          </div>
                          {view.resolution.length === 0 ? (
                            <p className="text-sm text-text-secondary">No weighing rule could separate the competing rulings.</p>
                          ) : (
                            view.resolution.map((step, i) => (
                              <div key={i} className="bg-background/40 border border-border-warm-light rounded-xl p-4">
                                <span className="text-[12px] font-bold text-brand-red uppercase tracking-wider">{step.rule}</span>
                                <p className="text-sm text-text-primary mt-1">
                                  <strong>{hukmLabel(step.winner)}</strong> preferred over <strong>{hukmLabel(step.loser)}</strong>
                                </p>
                                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{step.explanation}</p>
                              </div>
                            ))
                          )}
                        </div>
                        {view.relatedOpinions.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Related, non-contradicting opinions</span>
                            {view.relatedOpinions.map((g) => (
                              <div key={g.outcome} className="flex items-center justify-between bg-background/40 border border-border-warm-light rounded-xl px-4 py-3">
                                <span className="text-sm px-2.5 py-0.5 rounded-full border border-brand-red/30 bg-brand-red-light text-brand-red font-extrabold uppercase">{hukmLabel(g.outcome)}</span>
                                <span className="text-sm text-text-secondary">{g.confidence}% confidence</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
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
            <span className="text-sm text-brand-red font-bold font-serif min-h-[1.5rem]">{LOADING_STEPS[loadingStepIndex]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
