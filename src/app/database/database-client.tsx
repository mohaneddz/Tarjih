"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import type { kbStatistics } from "@/lib/kb/entry";
import type { ReviewQueueItem, ExcludedLiveEntry } from "@/app/api/kb/review-queue/route";
import { EvidenceBadge, RulingRosette, SourceBadge } from "@/components/ui/asset-badge";
import { KindBadge, KindIcon } from "./kindBadge";

export interface CoreClauseView {
  readonly id: string;
  /** The clause in the engine's surface syntax, as authored. */
  readonly source: string;
  /** The clause head as a goal, for trying it in the console. */
  readonly goal: string;
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

const REVIEW_TOKEN_KEY = "tarjih:reviewToken";

function readReviewToken(): string | null {
  try {
    return window.sessionStorage.getItem(REVIEW_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeReviewToken(token: string): void {
  try {
    window.sessionStorage.setItem(REVIEW_TOKEN_KEY, token);
  } catch {
    // Storage blocked: the reviewer is simply asked again next time.
  }
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
      <code className="font-mono text-[12px] text-text-primary bg-background/70 border border-border-warm-light rounded-lg px-2.5 py-2 whitespace-pre-wrap break-words line-clamp-4">
        {c.source}
      </code>
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
        <SourceBadge kind={c.kind} grade={c.grade} size="sm" showLabel={false} />
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
          <SourceBadge kind={clause.kind} grade={clause.grade} size="sm" />
        </div>

        <div>
          <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Clause</p>
          <pre className="font-mono text-[13px] text-text-primary bg-background border border-border-warm-light rounded-lg px-3 py-2.5 whitespace-pre-wrap break-words">
            {clause.source}
          </pre>
          <a
            href={`/console?${new URLSearchParams({ q: clause.goal }).toString()}`}
            className="inline-block mt-2 text-sm font-semibold text-brand-red hover:underline"
          >
            Try it in the console →
          </a>
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
  // `/database?q=...` (from the search palette) starts with that search. Read
  // after hydration rather than through useSearchParams, which would force
  // this statically rendered page to bail out to client rendering.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearch(q);
  }, []);
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
      return (
        c.id.toLowerCase().includes(q) ||
        c.reference.toLowerCase().includes(q) ||
        c.head.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q)
      );
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
      const send = (token: string | null) =>
        fetch(`/api/kb/review/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { "x-review-token": token } : {}) },
          body: JSON.stringify({ action, reason }),
        });
      let res = await send(readReviewToken());
      // The deployment may require a reviewer token (REVIEW_TOKEN). Ask once,
      // keep it for this tab, and retry.
      if (res.status === 401) {
        const token = window.prompt("Reviewer token:");
        if (!token) {
          setActionError("A reviewer token is required to change the knowledge base on this deployment.");
          return;
        }
        res = await send(token);
        if (res.ok) writeReviewToken(token);
      }
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
            placeholder="Search clauses — e.g. khamr, zakat, 2:173…"
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
