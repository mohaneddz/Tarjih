"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { kbStatistics } from "@/lib/kb/entry";
import type { ReviewQueueItem, ExcludedLiveEntry } from "@/app/api/kb/review-queue/route";
import { EvidenceBadge, RulingRosette } from "@/components/ui/asset-badge";

export interface CoreClauseView {
  readonly id: string;
  readonly head: string;
  readonly isFact: boolean;
  readonly kind: string;
  readonly reference: string;
  readonly text?: string;
  readonly grade?: string;
  readonly scope?: string;
  readonly restriction?: string;
  readonly notes?: string;
}

interface DatabaseClientProps {
  readonly coreClauses: readonly CoreClauseView[];
  readonly coreStats: ReturnType<typeof kbStatistics>;
}

type Tab = "core" | "queue";

const KIND_BADGE: Record<string, string> = {
  quran: "bg-brand-green-light text-brand-green",
  sunnah: "bg-brand-red-light text-brand-red",
  ijma: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
  qiyas: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  qaida: "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
  usul: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  istihsan: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300",
  urf: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
  ontology: "bg-border-warm-light text-text-secondary",
};

const KIND_ICON_PATH: Record<string, string> = {
  // Open book — a primary scriptural text.
  quran: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  // Speech bubble — a narrated saying.
  sunnah: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  // People — the scholarly consensus of a generation.
  ijma: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  // Crossed arrows — reasoning by analogy from one case to another.
  qiyas: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  // Ruler/document — a codified legal maxim.
  qaida: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  // Academic cap — foundational methodology (usul al-fiqh).
  usul: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443",
  // Sparkles — juristic preference, a discretionary departure from strict analogy.
  istihsan: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
  // Globe — recognised custom of a people (urf).
  urf: "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3s4.5 4.03 4.5 9-2.015 9-4.5 9zM3.6 9h16.8M3.6 15h16.8",
  // Branching hierarchy — structural ontology (subclass/instance links).
  ontology: "M13.5 4.5L21 12l-7.5 7.5M3 12h18M3 6h6M3 18h6",
};

function KindIcon({ kind, className }: { kind: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={KIND_ICON_PATH[kind] ?? KIND_ICON_PATH.ontology} />
    </svg>
  );
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0", KIND_BADGE[kind] ?? KIND_BADGE.ontology)}>
      <KindIcon kind={kind} className="h-3 w-3 shrink-0" />
      {kind}
    </span>
  );
}

function ClauseCard({ clause: c, onOpen }: { clause: CoreClauseView; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left bg-card-warm border border-border-warm rounded-xl p-4 flex flex-col gap-2 shadow-sm relative cursor-pointer transition-all hover:border-brand-red/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-text-secondary truncate" title={c.id}>{c.id}</span>
        <KindBadge kind={c.kind} />
      </div>
      <span className="font-serif font-bold text-sm text-text-primary">{c.head}</span>
      <span className="text-sm text-brand-red font-semibold">{c.reference}</span>
      {c.text && <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{c.text}&rdquo;</p>}
      {c.notes && <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">{c.notes}</p>}
      <div className="flex items-center justify-between gap-1.5 flex-wrap mt-auto pt-2 border-t border-border-warm-light/50">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-border-warm-light/60 text-text-secondary font-bold uppercase">
            {c.isFact ? "fact" : "rule"}
          </span>
          {c.scope && <span className="text-[11px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold uppercase">{c.scope}</span>}
        </div>
        <EvidenceBadge grade={c.grade || (c.kind === "quran" ? "authentic" : "unverified")} size="sm" showLabel={false} />
      </div>
    </button>
  );
}

function ClauseModal({ clause, onClose }: { clause: CoreClauseView; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar bg-card-warm border border-border-warm rounded-2xl shadow-xl p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[12px] text-text-secondary">{clause.id}</span>
            <span className="font-serif font-bold text-lg text-text-primary">{clause.head}</span>
          </div>
          <button type="button" onClick={onClose} title="Close" className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-warm-light transition-colors cursor-pointer shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <KindBadge kind={clause.kind} />
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-border-warm-light/60 text-text-secondary font-bold uppercase">
            {clause.isFact ? "fact" : "rule"}
          </span>
          {clause.scope && <span className="text-[11px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold uppercase">{clause.scope}</span>}
          {clause.restriction && <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold uppercase">{clause.restriction}</span>}
          <EvidenceBadge grade={clause.grade || (clause.kind === "quran" ? "authentic" : "unverified")} size="sm" />
        </div>

        <div>
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Reference</p>
          <p className="text-sm text-brand-red font-semibold">{clause.reference}</p>
        </div>

        {clause.text && (
          <div>
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Text</p>
            <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{clause.text}&rdquo;</p>
          </div>
        )}

        {clause.notes && (
          <div>
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Notes</p>
            <p className="text-sm text-text-secondary leading-relaxed">{clause.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

type TypeFilter = "all" | "fact" | "rule";

export function DatabaseClient({ coreClauses, coreStats }: DatabaseClientProps) {
  const [tab, setTab] = useState<Tab>("core");
  const [search, setSearch] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<string>>(() => new Set());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [openClause, setOpenClause] = useState<CoreClauseView | null>(null);

  // `null` means "not fetched yet", which is also what makes the queue
  // loading. Deriving the flag from the data rather than tracking it removes
  // the only synchronous setState in the effect below, and stops the spinner
  // flashing over an already-populated list on every approve.
  const [queue, setQueue] = useState<ReviewQueueItem[] | null>(null);
  const [excludedLive, setExcludedLive] = useState<ExcludedLiveEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const queueLoading = queue === null;
  const queueItems = queue ?? [];

  useEffect(() => {
    if (tab !== "queue") return;
    // Guarded against a stale response landing after the tab has moved on or
    // a newer reload has been requested.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/kb/review-queue");
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setQueue(data.items ?? []);
        setExcludedLive(data.excluded ?? []);
      } catch {
        // Leave the previous list in place; the review queue is not worth
        // blanking the page over.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, reloadToken]);

  const filteredCore = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coreClauses.filter((c) => {
      if (activeKinds.size > 0 && !activeKinds.has(c.kind)) return false;
      if (typeFilter === "fact" && !c.isFact) return false;
      if (typeFilter === "rule" && c.isFact) return false;
      if (!q) return true;
      return c.id.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q) || c.head.toLowerCase().includes(q);
    });
  }, [coreClauses, search, activeKinds, typeFilter]);

  function toggleKind(kind: string) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  async function act(id: string, action: "approve" | "reject" | "revoke", reason?: string) {
    setActioningId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/kb/review/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) {
        const body = await res.json();
        setActionError(body.message || "Action failed.");
        return;
      }
      setReloadToken((t) => t + 1);
    } catch {
      setActionError("Could not reach the server.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex bg-card-warm/80 p-1 rounded-xl text-[12px] font-bold border border-border-warm w-fit">
        <button
          onClick={() => setTab("core")}
          className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", tab === "core" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
        >
          Core KB ({coreStats.clauses})
        </button>
        <button
          onClick={() => setTab("queue")}
          className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", tab === "queue" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
        >
          Review Queue {queueItems.length > 0 && `(${queueItems.length})`}
        </button>
      </div>

      {tab === "core" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2 text-sm items-center">
            {(["all", "fact", "rule"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 border font-semibold transition-colors cursor-pointer",
                  typeFilter === t
                    ? "bg-brand-red text-white border-brand-red"
                    : "bg-card-warm border-border-warm text-text-secondary hover:border-brand-red/40 hover:text-text-primary"
                )}
              >
                {t === "all" && <RulingRosette size="sm" />}
                {t === "all" ? `${coreStats.facts} facts · ${coreStats.rules} rules` : t === "fact" ? `Facts only (${coreStats.facts})` : `Rules only (${coreStats.rules})`}
              </button>
            ))}
            <span className="w-px self-stretch bg-border-warm mx-1" aria-hidden="true" />
            {Object.entries(coreStats.byKind).map(([kind, count]) => {
              const active = activeKinds.has(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => toggleKind(kind)}
                  title={active ? `Remove ${kind} filter` : `Show only ${kind}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 border capitalize transition-colors cursor-pointer",
                    active
                      ? "bg-brand-red text-white border-brand-red font-bold"
                      : "bg-card-warm border-border-warm text-text-secondary hover:border-brand-red/40 hover:text-text-primary"
                  )}
                >
                  <KindIcon kind={kind} className="h-3.5 w-3.5 shrink-0" />
                  {kind}: {count}
                </button>
              );
            })}
            {(activeKinds.size > 0 || typeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setActiveKinds(new Set());
                  setTypeFilter("all");
                }}
                className="text-[12px] font-bold text-text-secondary hover:text-brand-red transition-colors cursor-pointer px-2"
              >
                Clear filters
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search by id, predicate, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md h-10 px-4 text-sm rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-brand-red transition-all"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCore.map((c) => (
              <ClauseCard key={c.id} clause={c} onOpen={() => setOpenClause(c)} />
            ))}
          </div>
          {filteredCore.length === 0 && (
            <div className="text-center py-12 text-text-secondary text-sm bg-card-warm border border-border-warm rounded-2xl">
              No matching clauses.
            </div>
          )}
        </div>
      )}

      {tab === "queue" && (
        <div className="flex flex-col gap-5">
          {actionError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 rounded-xl px-4 py-3 text-sm">
              {actionError}
            </div>
          )}

          {excludedLive.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[12px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                Live KB health: {excludedLive.length} approved clause{excludedLive.length === 1 ? "" : "s"} currently excluded
              </span>
              {excludedLive.map((e) => (
                <div key={e.clauseId} className="text-sm text-amber-900 dark:text-amber-200">
                  <span className="font-mono">{e.clauseId}</span>: {e.reasons.join("; ")}
                </div>
              ))}
            </div>
          )}

          {queueLoading ? (
            <div className="text-center py-12 text-text-secondary text-sm">Loading review queue...</div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-sm bg-card-warm border border-border-warm rounded-2xl">
              Nothing awaiting review. Run the formalization pipeline to generate candidates.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {queueItems.map((item) => (
                <div key={item.id} className="bg-card-warm border border-border-warm rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <KindBadge kind={item.kind} />
                      <span className="font-serif font-bold text-sm text-text-primary">{item.reference}</span>
                      <EvidenceBadge grade={item.grade || "unverified"} size="sm" showLabel={false} />
                    </div>
                    <span className="font-mono text-[12px] text-text-secondary">{item.head}</span>
                  </div>

                  {item.sourceText?.textEn && (
                    <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{item.sourceText.textEn}&rdquo;</p>
                  )}

                  <div className="bg-background/50 border border-border-warm-light rounded-lg px-3 py-2 font-mono text-sm text-text-primary">
                    {item.source}
                  </div>

                  {item.notes && <p className="text-[13px] text-text-secondary leading-relaxed">{item.notes}</p>}

                  <div className="flex gap-2 pt-2 border-t border-border-warm-light/50">
                    <button
                      onClick={() => act(item.id, "approve")}
                      disabled={actioningId === item.id}
                      className="h-9 px-4 bg-brand-green hover:bg-brand-green-dark text-white dark:text-black rounded-lg text-sm font-bold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("Reason for rejecting (optional):") ?? undefined;
                        act(item.id, "reject", reason);
                      }}
                      disabled={actioningId === item.id}
                      className="h-9 px-4 border border-red-300 dark:border-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-sm font-bold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {openClause && <ClauseModal clause={openClause} onClose={() => setOpenClause(null)} />}
    </div>
  );
}
