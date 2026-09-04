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

function KindBadge({ kind }: { kind: string }) {
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0", KIND_BADGE[kind] ?? KIND_BADGE.ontology)}>
      {kind}
    </span>
  );
}

export function DatabaseClient({ coreClauses, coreStats }: DatabaseClientProps) {
  const [tab, setTab] = useState<Tab>("core");
  const [search, setSearch] = useState("");

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
    if (!search.trim()) return coreClauses;
    const q = search.toLowerCase();
    return coreClauses.filter(
      (c) => c.id.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q) || c.head.toLowerCase().includes(q)
    );
  }, [coreClauses, search]);

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
          <div className="flex flex-wrap gap-3 text-sm text-text-secondary items-center">
            <span className="bg-card-warm border border-border-warm rounded-lg px-3 py-1.5 flex items-center gap-2">
              <RulingRosette size="sm" />
              {coreStats.facts} facts · {coreStats.rules} rules
            </span>
            {Object.entries(coreStats.byKind).map(([kind, count]) => (
              <span key={kind} className="bg-card-warm border border-border-warm rounded-lg px-3 py-1.5 capitalize">
                {kind}: {count}
              </span>
            ))}
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
              <div key={c.id} className="bg-card-warm border border-border-warm rounded-xl p-4 flex flex-col gap-2 shadow-sm relative">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] text-text-secondary truncate" title={c.id}>{c.id}</span>
                  <KindBadge kind={c.kind} />
                </div>
                <span className="font-serif font-bold text-sm text-text-primary">{c.head}</span>
                <span className="text-sm text-brand-red font-semibold">{c.reference}</span>
                {c.text && <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{c.text}&rdquo;</p>}
                {c.notes && <p className="text-[13px] text-text-secondary leading-relaxed">{c.notes}</p>}
                <div className="flex items-center justify-between gap-1.5 flex-wrap mt-auto pt-2 border-t border-border-warm-light/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-border-warm-light/60 text-text-secondary font-bold uppercase">
                      {c.isFact ? "fact" : "rule"}
                    </span>
                    {c.scope && <span className="text-[11px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold uppercase">{c.scope}</span>}
                  </div>
                  <EvidenceBadge grade={c.grade || (c.kind === "quran" ? "authentic" : "unverified")} size="sm" showLabel={false} />
                </div>
              </div>
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
    </div>
  );
}
