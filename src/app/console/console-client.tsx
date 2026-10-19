"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import { ProofTree } from "@/components/ui/proof-tree";
import type { ConsoleError, ConsoleResult, ConsoleTraceEvent } from "@/lib/pipeline/console";
import type { ProofView } from "@/lib/pipeline/present";
import { HUKM_LABELS } from "@/lib/kb/ontology";
import type { Hukm } from "@/lib/kb/ontology";

export interface ReferenceEntry {
  readonly signature: string;
  readonly group: string;
  readonly meaning: string;
  readonly example: string;
}

interface ConsoleClientProps {
  readonly predicates: readonly ReferenceEntry[];
  readonly circumstances: readonly { atom: string; label: string }[];
  readonly atoms: readonly string[];
  readonly acts: readonly string[];
}

type Tab = "solutions" | "proof" | "trace" | "explain";

const EXAMPLES: { label: string; query: string; circumstances?: string[] }[] = [
  { label: "Wine", query: "ruling(consume(khamr), H)" },
  { label: "Narcotics (qiyas)", query: "ruling(consume(narcotic), H)" },
  { label: "Pork, starving", query: "ruling(consume(swine), H)", circumstances: ["starvation"] },
  { label: "Maternal aunt", query: "ruling(mistreat(aunt_maternal), H)" },
  { label: "Every womb-relative", query: "instance_of(X, rahim)" },
  { label: "Every ruling", query: "ruling(Act, H)" },
  { label: "Gharar sale", query: "validity(sell(unborn_calf), V)" },
  { label: "Tayammum (fails)", query: "ruling(perform(tayammum), H)" },
];

const HISTORY_KEY = "tarjih.console.history";
const HISTORY_LIMIT = 30;

const TRACE_STYLE: Record<ConsoleTraceEvent["type"], string> = {
  call: "text-text-primary",
  exit: "text-brand-green",
  fail: "text-brand-red",
  "unify-fail": "text-text-secondary/70",
  "depth-cut": "text-amber-600 dark:text-amber-400",
  "loop-cut": "text-amber-600 dark:text-amber-400",
  "budget-cut": "text-amber-600 dark:text-amber-400",
  builtin: "text-sky-700 dark:text-sky-300",
  instantiation: "text-amber-700 dark:text-amber-300 font-bold",
};

const TRACE_TYPES = Object.keys(TRACE_STYLE) as ConsoleTraceEvent["type"][];

function readHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string") : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: readonly string[]): void {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Private mode or blocked storage: history is a convenience, not state.
  }
}

function hukmLabel(value: string): string {
  return HUKM_LABELS[value as Hukm]?.en ?? value;
}

function proofToText(view: ProofView, indent = 0): string {
  const pad = "  ".repeat(indent);
  const cite = view.evidence.reference === "Definitional" ? "" : `  % ${view.evidence.reference}`;
  return [`${pad}${view.goal}${cite}`, ...view.children.map((c) => proofToText(c, indent + 1))].join("\n");
}

/** Last identifier fragment before the caret, for autocomplete. */
function wordAt(text: string, caret: number): { start: number; word: string } {
  let start = caret;
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) start--;
  return { start, word: text.slice(start, caret) };
}

export function ConsoleClient({ predicates, circumstances, atoms, acts }: ConsoleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? EXAMPLES[0].query);
  const [assumed, setAssumed] = useState<string[]>(() =>
    (searchParams.get("c") ?? "").split(",").filter(Boolean)
  );
  const [maxSolutions, setMaxSolutions] = useState(100);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ConsoleResult | null>(null);
  const [error, setError] = useState<ConsoleError["error"] | null>(null);
  const [tab, setTab] = useState<Tab>("solutions");
  const [selected, setSelected] = useState(0);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [traceFilter, setTraceFilter] = useState<Set<ConsoleTraceEvent["type"]>>(
    () => new Set(TRACE_TYPES.filter((t) => t !== "unify-fail"))
  );
  const [traceSearch, setTraceSearch] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [copied, setCopied] = useState(false);
  const [suggestion, setSuggestion] = useState<{ start: number; options: string[] } | null>(null);

  useEffect(() => {
    // localStorage is only readable after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(readHistory());
  }, []);

  const vocabulary = useMemo(() => {
    const names = new Set<string>([...atoms, ...acts, ...circumstances.map((c) => c.atom)]);
    for (const p of predicates) names.add(p.signature.split("(")[0]);
    return [...names].sort();
  }, [atoms, acts, circumstances, predicates]);

  const solution = result?.solutions[selected];

  const filteredTrace = useMemo(() => {
    if (!result) return [];
    const needle = traceSearch.trim().toLowerCase();
    return result.trace.filter(
      (e) => traceFilter.has(e.type) && (!needle || e.goal.toLowerCase().includes(needle))
    );
  }, [result, traceFilter, traceSearch]);

  const filteredReference = useMemo(() => {
    const needle = referenceFilter.trim().toLowerCase();
    if (!needle) return predicates;
    return predicates.filter(
      (p) => p.signature.toLowerCase().includes(needle) || p.meaning.toLowerCase().includes(needle)
    );
  }, [predicates, referenceFilter]);

  async function run(nextQuery = query, nextAssumed = assumed) {
    if (running) return;
    setRunning(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuery, circumstances: nextAssumed, maxSolutions }),
      });
      const body = (await res.json()) as ConsoleResult | ConsoleError;
      if (!body.ok) {
        setError(body.error);
        setResult(null);
        return;
      }
      setResult(body);
      setSelected(0);
      setSelectedClauseId(null);
      setTab(body.solutions.length === 0 ? "explain" : "solutions");

      const nextHistory = [nextQuery.trim(), ...history.filter((h) => h !== nextQuery.trim())].slice(0, HISTORY_LIMIT);
      setHistory(nextHistory);
      writeHistory(nextHistory);
      setHistoryCursor(-1);

      const params = new URLSearchParams({ q: nextQuery.trim() });
      if (nextAssumed.length) params.set("c", nextAssumed.join(","));
      router.replace(`/console?${params.toString()}`, { scroll: false });
    } catch {
      setError({ kind: "parse", message: "Could not reach the engine. Is the dev server running?" });
    } finally {
      setRunning(false);
    }
  }

  function loadExample(example: (typeof EXAMPLES)[number]) {
    const nextAssumed = example.circumstances ?? [];
    setQuery(example.query);
    setAssumed(nextAssumed);
    void run(example.query, nextAssumed);
  }

  function toggleAssumed(atom: string, rerun = false) {
    const next = assumed.includes(atom) ? assumed.filter((a) => a !== atom) : [...assumed, atom];
    setAssumed(next);
    if (rerun) void run(query, next);
  }

  function insertAtCaret(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setQuery((q) => q + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = query.slice(0, start) + text + query.slice(end);
    setQuery(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function applySuggestion(option: string) {
    const el = textareaRef.current;
    if (!el || !suggestion) return;
    const caret = el.selectionStart;
    const next = query.slice(0, suggestion.start) + option + query.slice(caret);
    setQuery(next);
    setSuggestion(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = suggestion.start + option.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function onQueryChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value);
    setHistoryCursor(-1);
    const { start, word } = wordAt(e.target.value, e.target.selectionStart);
    if (word.length >= 2 && /^[a-z]/.test(word)) {
      const options = vocabulary.filter((v) => v.startsWith(word) && v !== word).slice(0, 6);
      setSuggestion(options.length ? { start, options } : null);
    } else {
      setSuggestion(null);
    }
  }

  function onQueryKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void run();
      return;
    }
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      applySuggestion(suggestion.options[0]);
      return;
    }
    if (e.key === "Escape") {
      setSuggestion(null);
      return;
    }
    // Shell-style history recall, only when the caret is at the very start or
    // end so ordinary multi-line editing keeps its arrow keys.
    const el = e.currentTarget;
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const atEnd = el.selectionStart === query.length;
    if (e.key === "ArrowUp" && atStart && history.length) {
      e.preventDefault();
      const next = Math.min(historyCursor + 1, history.length - 1);
      setHistoryCursor(next);
      setQuery(history[next]);
    } else if (e.key === "ArrowDown" && atEnd && historyCursor >= 0) {
      e.preventDefault();
      const next = historyCursor - 1;
      setHistoryCursor(next);
      setQuery(next < 0 ? "" : history[next]);
    }
  }

  async function copyProof() {
    if (!solution) return;
    const text = [
      `?- ${result?.goals}.`,
      ...Object.entries(solution.bindings).map(([k, v]) => `%  ${k} = ${v}`),
      ...solution.proofs.map((p) => proofToText(p)),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; nothing useful to do about it here.
    }
  }

  const selectedEvidence = useMemo(() => {
    if (!solution || !selectedClauseId) return null;
    const find = (node: ProofView): ProofView | null =>
      node.clauseId === selectedClauseId ? node : node.children.map(find).find(Boolean) ?? null;
    for (const p of solution.proofs) {
      const hit = find(p);
      if (hit) return hit;
    }
    return null;
  }, [solution, selectedClauseId]);

  return (
    <div className="pt-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold text-text-primary">Prolog Console</h1>
        <p className="text-sm text-text-secondary max-w-3xl">
          Query the knowledge base directly. Every derivation comes back with its proof; the trace shows each
          step of the search; a query that fails says where it stalled. No language model is involved here.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-6 items-start">
        {/* ---------------- Left: editor and controls ---------------- */}
        <section className="flex flex-col gap-4 min-w-0">
          <div className="rounded-2xl border border-border-warm bg-card-warm p-4 flex flex-col gap-3 shadow-sm">
            <label htmlFor="console-query" className="text-[12px] font-extrabold uppercase tracking-wider text-text-secondary">
              Goal
            </label>
            <div className="relative">
              <div className="flex items-start gap-2 rounded-xl border border-border-warm bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-brand-red/30">
                <span className="font-mono text-sm text-brand-red select-none pt-[1px]">?-</span>
                <textarea
                  id="console-query"
                  ref={textareaRef}
                  value={query}
                  onChange={onQueryChange}
                  onKeyDown={onQueryKeyDown}
                  onBlur={() => setTimeout(() => setSuggestion(null), 150)}
                  spellCheck={false}
                  rows={3}
                  className="flex-1 min-w-0 resize-y bg-transparent font-mono text-sm text-text-primary outline-none"
                  placeholder="ruling(consume(khamr), H)"
                />
              </div>
              {suggestion && (
                <ul className="absolute z-20 left-8 top-full mt-1 rounded-lg border border-border-warm bg-card-warm shadow-lg py-1 text-sm font-mono">
                  {suggestion.options.map((o, i) => (
                    <li key={o}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applySuggestion(o);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-1 hover:bg-border-warm-light cursor-pointer",
                          i === 0 && "bg-border-warm-light"
                        )}
                      >
                        {o}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-brand-red font-mono break-words">
                {error.message}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void run()}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-sm font-bold text-white hover:bg-brand-red-dark disabled:opacity-60 cursor-pointer"
              >
                {running ? "Proving…" : "Prove"}
                <kbd className="hidden sm:inline text-[11px] font-mono opacity-80">Ctrl ⏎</kbd>
              </button>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                Max
                <select
                  value={maxSolutions}
                  onChange={(e) => setMaxSolutions(Number(e.target.value))}
                  className="rounded-lg border border-border-warm bg-background px-2 py-1 text-sm text-text-primary"
                >
                  {[10, 50, 100, 250, 500].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                solutions
              </label>
            </div>
            <p className="text-[12px] text-text-secondary">
              <kbd className="font-mono">Tab</kbd> completes a term · <kbd className="font-mono">↑</kbd>/<kbd className="font-mono">↓</kbd> at the
              edges recalls history · uppercase names are variables
            </p>
          </div>

          <div className="rounded-2xl border border-border-warm bg-card-warm p-4 flex flex-col gap-3 shadow-sm">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-text-secondary">Assume about the asker</h2>
            <div className="flex flex-wrap gap-2">
              {circumstances.map((c) => (
                <button
                  key={c.atom}
                  type="button"
                  title={c.label}
                  onClick={() => toggleAssumed(c.atom)}
                  aria-pressed={assumed.includes(c.atom)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[13px] font-mono transition-colors cursor-pointer",
                    assumed.includes(c.atom)
                      ? "border-brand-green bg-brand-green-light text-brand-green"
                      : "border-border-warm text-text-secondary hover:text-text-primary"
                  )}
                >
                  {c.atom}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-text-secondary">
              Injected as <code className="font-mono">circumstance/1</code> for this query only, exactly as /study does with what the
              question states.
            </p>
          </div>

          <div className="rounded-2xl border border-border-warm bg-card-warm p-4 flex flex-col gap-3 shadow-sm">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-text-secondary">Examples</h2>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => loadExample(ex)}
                  className="rounded-lg border border-border-warm px-2.5 py-1 text-[13px] text-text-primary hover:border-brand-red/50 hover:text-brand-red transition-colors cursor-pointer"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            {history.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-text-secondary">Recent queries ({history.length})</summary>
                <ul className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {history.map((h) => (
                    <li key={h}>
                      <button
                        type="button"
                        onClick={() => setQuery(h)}
                        className="w-full truncate text-left font-mono text-[12px] text-text-secondary hover:text-text-primary cursor-pointer"
                        title={h}
                      >
                        {h}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    writeHistory([]);
                  }}
                  className="mt-2 text-[12px] text-brand-red hover:underline cursor-pointer"
                >
                  Clear history
                </button>
              </details>
            )}
          </div>

          <div className="rounded-2xl border border-border-warm bg-card-warm p-4 flex flex-col gap-3 shadow-sm">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-text-secondary">Predicates</h2>
            <input
              value={referenceFilter}
              onChange={(e) => setReferenceFilter(e.target.value)}
              placeholder="Filter…"
              className="rounded-lg border border-border-warm bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/30"
            />
            <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {filteredReference.map((p) => (
                <li key={p.signature} className="text-sm">
                  <button
                    type="button"
                    onClick={() => insertAtCaret(p.example)}
                    title="Insert the example at the caret"
                    className="font-mono text-[13px] text-text-primary hover:text-brand-red cursor-pointer text-left"
                  >
                    {p.signature}
                  </button>
                  <span className="ml-2 text-[11px] uppercase tracking-wider text-text-secondary">{p.group}</span>
                  <p className="text-[12px] text-text-secondary leading-snug line-clamp-2" title={p.meaning}>
                    {p.meaning}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- Right: results ---------------- */}
        <section className="flex flex-col gap-4 min-w-0">
          {!result && !error && (
            <div className="rounded-2xl border border-dashed border-border-warm p-10 text-center text-text-secondary">
              Write a goal and press <span className="font-semibold text-text-primary">Prove</span>, or pick an example.
            </div>
          )}

          {result && (
            <>
              <div className="rounded-2xl border border-border-warm bg-card-warm p-4 shadow-sm flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <code className="font-mono text-sm text-text-primary break-all">?- {result.goals}.</code>
                  {result.premises.length > 0 && (
                    <span className="text-[12px] text-brand-green font-mono">assuming {result.premises.join(", ")}</span>
                  )}
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <Stat label="Solutions" value={String(result.solutions.length)} tone={result.solutions.length ? "good" : "bad"} />
                  <Stat label="Steps" value={result.stats.steps.toLocaleString()} />
                  <Stat label="Time" value={`${result.stats.elapsedMs} ms`} />
                  <Stat label="Loop cuts" value={String(result.stats.loopCuts)} />
                  <Stat
                    label="Unbound checks"
                    value={String(result.stats.instantiationFaults)}
                    tone={result.stats.instantiationFaults ? "warn" : undefined}
                  />
                </dl>
                {result.stats.truncated && (
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    The search stopped at its {result.stats.truncationReason} budget, so there may be derivations not shown.
                  </p>
                )}
                {result.weighing && (
                  <div className="rounded-xl bg-background border border-border-warm-light p-3 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-[12px] font-extrabold uppercase tracking-wider text-text-secondary">Weighed</span>
                      {result.weighing.verdict ? (
                        <span className="font-bold text-text-primary">
                          {hukmLabel(result.weighing.verdict)} <span className="font-mono text-text-secondary">({result.weighing.verdict})</span>
                        </span>
                      ) : (
                        <span className="font-bold text-brand-red">Unresolved</span>
                      )}
                      {result.weighing.contested && (
                        <span className="rounded-full bg-brand-red-light text-brand-red px-2 py-0.5 text-[11px] font-bold">Contested</span>
                      )}
                    </div>
                    <ul className="flex flex-wrap gap-2 text-[12px]">
                      {result.weighing.groups.map((g) => (
                        <li key={g.outcome} className="rounded-lg border border-border-warm px-2 py-1 font-mono">
                          {g.outcome} · {g.confidence}% · {g.independentLines}/{g.derivationCount} lines
                        </li>
                      ))}
                    </ul>
                    {result.weighing.resolution.map((s, i) => (
                      <p key={i} className="text-[13px] text-text-secondary">
                        <span className="font-semibold text-text-primary">{s.rule}:</span> {s.winner} over {s.loser}. {s.explanation}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div role="tablist" className="flex gap-1 border-b border-border-warm">
                {(
                  [
                    ["solutions", `Solutions (${result.solutions.length})`],
                    ["proof", "Proof"],
                    ["trace", `Trace (${result.traceTotal.toLocaleString()})`],
                    ["explain", "Why / what if"],
                  ] as [Tab, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer",
                      tab === id ? "border-brand-red text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "solutions" && (
                <div className="rounded-2xl border border-border-warm bg-card-warm shadow-sm overflow-hidden">
                  {result.solutions.length === 0 ? (
                    <p className="p-6 text-text-secondary">
                      <span className="font-mono text-brand-red">false.</span> No derivation. See{" "}
                      <button type="button" onClick={() => setTab("explain")} className="underline cursor-pointer">
                        why
                      </button>
                      .
                    </p>
                  ) : (
                    <ol className="divide-y divide-border-warm-light max-h-[32rem] overflow-y-auto">
                      {result.solutions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(i);
                              setSelectedClauseId(null);
                              setTab("proof");
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 flex items-center gap-4 hover:bg-background cursor-pointer",
                              i === selected && "bg-background"
                            )}
                          >
                            <span className="w-8 shrink-0 text-[12px] text-text-secondary tabular-nums">#{i + 1}</span>
                            <span className="font-mono text-sm text-text-primary flex-1 min-w-0 truncate">
                              {Object.keys(s.bindings).length === 0
                                ? "true."
                                : Object.entries(s.bindings)
                                    .map(([k, v]) => `${k} = ${v}`)
                                    .join(", ")}
                            </span>
                            <span className="text-[12px] text-text-secondary shrink-0">
                              via {s.proofs[0]?.clauseId} · depth {s.depth}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {tab === "proof" && (
                <div className="flex flex-col gap-3">
                  {!solution ? (
                    <p className="text-text-secondary">No solution to show.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm text-text-secondary flex items-center gap-2">
                          Solution
                          <select
                            value={selected}
                            onChange={(e) => {
                              setSelected(Number(e.target.value));
                              setSelectedClauseId(null);
                            }}
                            className="rounded-lg border border-border-warm bg-background px-2 py-1 text-sm text-text-primary"
                          >
                            {result.solutions.map((s, i) => (
                              <option key={i} value={i}>
                                #{i + 1} {Object.values(s.bindings).join(", ")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => void copyProof()}
                          className="rounded-lg border border-border-warm px-3 py-1 text-sm hover:border-brand-red/50 cursor-pointer"
                        >
                          {copied ? "Copied" : "Copy as text"}
                        </button>
                      </div>
                      {solution.proofs.map((p, i) => (
                        <div key={i} className="h-[30rem] rounded-2xl border border-border-warm bg-card-warm overflow-hidden">
                          <ProofTree proof={p} selectedClauseId={selectedClauseId} onSelectNode={setSelectedClauseId} />
                        </div>
                      ))}
                      {selectedEvidence && (
                        <div className="rounded-2xl border border-border-warm bg-card-warm p-4 text-sm flex flex-col gap-1">
                          <code className="font-mono text-text-primary break-all">{selectedEvidence.goal}</code>
                          <span className="text-text-secondary">
                            <span className="font-mono">{selectedEvidence.clauseId}</span> · {selectedEvidence.evidence.kind} ·{" "}
                            {selectedEvidence.evidence.reference} · strength {selectedEvidence.evidence.strength}
                          </span>
                          {selectedEvidence.evidence.text && <p className="font-serif italic">{selectedEvidence.evidence.text}</p>}
                          {selectedEvidence.evidence.notes && <p className="text-text-secondary">{selectedEvidence.evidence.notes}</p>}
                        </div>
                      )}
                      <pre className="rounded-2xl border border-border-warm bg-card-warm p-4 text-[12px] font-mono overflow-x-auto text-text-primary">
                        {solution.proofs.map((p) => proofToText(p)).join("\n\n")}
                      </pre>
                    </>
                  )}
                </div>
              )}

              {tab === "trace" && (
                <div className="rounded-2xl border border-border-warm bg-card-warm shadow-sm flex flex-col">
                  <div className="p-3 border-b border-border-warm-light flex flex-wrap gap-2 items-center">
                    <input
                      value={traceSearch}
                      onChange={(e) => setTraceSearch(e.target.value)}
                      placeholder="Search goals…"
                      className="rounded-lg border border-border-warm bg-background px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-brand-red/30"
                    />
                    {TRACE_TYPES.map((t) => (
                      <label key={t} className={cn("flex items-center gap-1 text-[12px] font-mono", TRACE_STYLE[t])}>
                        <input
                          type="checkbox"
                          checked={traceFilter.has(t)}
                          onChange={() =>
                            setTraceFilter((prev) => {
                              const next = new Set(prev);
                              if (next.has(t)) next.delete(t);
                              else next.add(t);
                              return next;
                            })
                          }
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                  <ol className="max-h-[36rem] overflow-y-auto font-mono text-[12px] py-2">
                    {filteredTrace.map((e, i) => (
                      <li key={i} className="px-3 py-0.5 flex gap-2 hover:bg-background" style={{ paddingLeft: `${12 + e.depth * 14}px` }}>
                        <span className={cn("w-20 shrink-0 uppercase text-[10px] pt-[2px]", TRACE_STYLE[e.type])}>{e.type}</span>
                        <span className="text-text-primary break-all">{e.goal}</span>
                        {e.clauseId && <span className="text-text-secondary shrink-0">[{e.clauseId}]</span>}
                      </li>
                    ))}
                  </ol>
                  {result.traceTotal > result.trace.length && (
                    <p className="px-3 py-2 border-t border-border-warm-light text-[12px] text-text-secondary">
                      Showing the first {result.trace.length.toLocaleString()} of {result.traceTotal.toLocaleString()} events.
                    </p>
                  )}
                </div>
              )}

              {tab === "explain" && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-border-warm bg-card-warm p-4 shadow-sm flex flex-col gap-3">
                    <h3 className="font-serif text-lg font-bold">Waiting on the asker</h3>
                    {result.explanation.unmetPremises.length === 0 ? (
                      <p className="text-sm text-text-secondary">No rule in this search was waiting on a stated circumstance.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {result.explanation.unmetPremises.map((p) => {
                          const atom = p.goal.match(/^circumstance\((\w+)\)$/)?.[1];
                          const assumable = atom && circumstances.some((c) => c.atom === atom);
                          return (
                            <li key={p.goal} className="flex flex-wrap items-start gap-3 text-sm">
                              <code className="font-mono text-brand-green">{p.goal}</code>
                              <span className="text-text-secondary flex-1 min-w-0">would let {p.neededBy.join("; ")} continue</span>
                              {assumable && (
                                <button
                                  type="button"
                                  onClick={() => toggleAssumed(atom, true)}
                                  className="rounded-lg border border-brand-green/50 text-brand-green px-2 py-0.5 text-[12px] font-semibold hover:bg-brand-green-light cursor-pointer"
                                >
                                  {assumed.includes(atom) ? "Stop assuming" : "Assume and re-run"}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border-warm bg-card-warm p-4 shadow-sm flex flex-col gap-3">
                    <h3 className="font-serif text-lg font-bold">Where the search stalled</h3>
                    {result.explanation.frontier.length === 0 ? (
                      <p className="text-sm text-text-secondary">Nothing stalled.</p>
                    ) : (
                      <ul className="flex flex-col gap-2 text-sm">
                        {result.explanation.frontier.map((f) => (
                          <li key={f.goal} className="flex flex-col">
                            <code className="font-mono text-brand-red break-all">{f.goal}</code>
                            <span className="text-text-secondary">
                              {f.goalHuman}
                              {f.neededBy.length > 0 ? ` — needed by ${f.neededBy.join("; ")}` : " — the query itself"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {result.solutions.length > 0 && result.explanation.frontier.length > 0 && (
                      <p className="text-[12px] text-text-secondary">
                        The query did succeed; these are the other branches the search tried and abandoned.
                      </p>
                    )}
                    {result.explanation.partial && (
                      <p className="text-[12px] text-amber-700 dark:text-amber-300">The trace was capped, so this list may be incomplete.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  return (
    <div className="rounded-xl bg-background border border-border-warm-light px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd
        className={cn(
          "font-mono font-bold text-text-primary tabular-nums",
          tone === "good" && "text-brand-green",
          tone === "bad" && "text-brand-red",
          tone === "warn" && "text-amber-700 dark:text-amber-300"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
