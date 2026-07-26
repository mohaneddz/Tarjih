"use client";

import React, { useMemo } from "react";
import type { ProofView } from "@/lib/pipeline/present";
import { cn } from "@/utils/cn";

interface ProofTreeProps {
  readonly proof: ProofView;
  readonly selectedClauseId: string | null;
  readonly onSelectNode: (clauseId: string) => void;
}

// ---------------------------------------------------------------------------
// Node taxonomy
// ---------------------------------------------------------------------------

export type DisplayNodeType = "conclusion" | "principle" | "condition" | "source";

/**
 * Classifies a proof node into the four display roles used throughout the
 * design (design/study.png): Conclusion, Principle, Condition, Source.
 *
 * Purely a display-layer read of data the engine already computed — nothing
 * here is invented. A node is a Conclusion whenever its goal *is* a ruling
 * (the root always is one, but an intermediate qiyas step that itself proves
 * a ruling — e.g. "mistreating one's mother is haram" on the way to proving
 * the same about an aunt — is a Conclusion too, since it's the same kind of
 * claim). A Source is a node whose evidence is a primary text (Qur'an,
 * hadith, ijma). A Principle is the methodological machinery connecting them
 * (qiyas, a legal maxim, or another usul rule). Everything else — the
 * definitional/taxonomic facts a principle depends on, like "an aunt is
 * collateral kin" — is a Condition.
 */
export function classifyNode(view: ProofView): DisplayNodeType {
  const predicate = view.goal.slice(0, view.goal.indexOf("("));
  if (predicate === "ruling") return "conclusion";
  if (view.evidence.kind === "quran" || view.evidence.kind === "sunnah" || view.evidence.kind === "ijma") {
    return "source";
  }
  if (["qiyas", "qaida", "usul", "istihsan", "urf"].includes(view.evidence.kind)) return "principle";
  return "condition";
}

const TYPE_META: Record<DisplayNodeType, { label: string; icon: React.ReactNode }> = {
  conclusion: {
    label: "Conclusion",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.5l2 2 4-4.5" />
      </svg>
    ),
  },
  principle: {
    label: "Principle",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  condition: {
    label: "Condition",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 110 7.5m0-7.5a3.75 3.75 0 100 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25m-13.5 0v3a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-3" />
      </svg>
    ),
  },
  source: {
    label: "Source",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
};

const TYPE_CARD_STYLE: Record<DisplayNodeType, string> = {
  conclusion: "bg-brand-red-light/40 border-brand-red/30",
  principle: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40",
  condition: "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40",
  source: "bg-brand-green-light border-brand-green/30",
};

const TYPE_ICON_STYLE: Record<DisplayNodeType, string> = {
  conclusion: "bg-brand-red text-white",
  principle: "bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200",
  condition: "bg-sky-200 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200",
  source: "bg-brand-green text-white",
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface LaidOutNode {
  readonly view: ProofView;
  readonly depth: number;
  readonly x: number;
  readonly number: number;
}

/**
 * Lays out a proof tree of arbitrary shape and depth, and assigns each node
 * a sequential display number in post-order (leaves first, root last) — the
 * same "build up to the conclusion" reading order the reference design uses.
 *
 * This is a standard tidy-tree pass: a node's width in "leaf units" is the
 * number of leaves beneath it (minimum 1), and its center is the midpoint of
 * the span its children occupy.
 */
function layoutTree(root: ProofView): { nodes: LaidOutNode[]; totalWidth: number; maxDepth: number } {
  const nodes: LaidOutNode[] = [];
  let maxDepth = 0;
  let counter = 1;

  function place(view: ProofView, depth: number, xOffset: number): number {
    maxDepth = Math.max(maxDepth, depth);
    if (view.children.length === 0) {
      nodes.push({ view, depth, x: xOffset + 0.5, number: counter++ });
      return xOffset + 1;
    }
    const childStart = xOffset;
    let cursor = xOffset;
    for (const child of view.children) {
      cursor = place(child, depth + 1, cursor);
    }
    const center = (childStart + cursor) / 2;
    nodes.push({ view, depth, x: center, number: counter++ });
    return cursor;
  }

  const totalWidth = place(root, 0, 0);
  return { nodes, totalWidth: Math.max(totalWidth, 1), maxDepth };
}

const COL_WIDTH = 240;
const CARD_W = 212;
/* Taller than before: the primary label is now a full readable sentence
   (goalHuman) rather than a short symbolic term, and can run up to 3 lines. */
const CARD_H = 136;
/** Fixed height for the optional note strip below a card, capped rather than left to grow with text length. */
const NOTE_H = 48;
const NOTE_GAP = 6;
/**
 * Vertical distance between successive depth rows.
 *
 * Must be at least CARD_H + NOTE_GAP + NOTE_H (the tallest a single node's
 * column can be, card plus its note) plus real breathing room to the row
 * below — this was previously 148, only ~40px more than the card alone,
 * which meant a node with a note collided with the row beneath it whenever
 * the note text ran two lines. Every node column has a bounded, known
 * height now, so this margin is guaranteed rather than hoped for.
 */
const ROW_HEIGHT = CARD_H + NOTE_GAP + NOTE_H + 56;

export function ProofTree({ proof, selectedClauseId, onSelectNode }: ProofTreeProps) {
  const { nodes, totalWidth, maxDepth } = useMemo(() => layoutTree(proof), [proof]);

  const width = totalWidth * COL_WIDTH;
  const height = (maxDepth + 1) * ROW_HEIGHT;

  const positionOf = (n: LaidOutNode) => ({
    cx: n.x * COL_WIDTH,
    cy: n.depth * ROW_HEIGHT + CARD_H / 2 + 16,
  });

  const byNode = new Map(nodes.map((n) => [n.view, n]));

  const edges: { x1: number; y1: number; x2: number; y2: number; weak: boolean }[] = [];
  const walkEdges = (view: ProofView) => {
    const parent = byNode.get(view);
    if (!parent) return;
    for (const child of view.children) {
      const c = byNode.get(child);
      if (!c) continue;
      const p1 = positionOf(parent);
      const p2 = positionOf(c);
      // A "weaker path": the child's own indication of the ruling is
      // probable (zanni) rather than certain, e.g. an identified 'illa or a
      // qiyas step — matches the dashed "weaker path" edges in the design.
      const weak = child.evidence.dalala === "zanni";
      edges.push({ x1: p1.cx, y1: p1.cy + CARD_H / 2, x2: p2.cx, y2: p2.cy - CARD_H / 2, weak });
      walkEdges(child);
    }
  };
  walkEdges(proof);

  return (
    <div className="relative w-full h-[560px] overflow-auto bg-background/30 rounded-2xl border border-border-warm-light/40 custom-scrollbar">
      <div className="relative" style={{ width: Math.max(width, 400), height: Math.max(height, 200), margin: "0 auto" }}>
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="var(--color-brand-red)"
              strokeWidth={1.5}
              strokeDasharray={e.weak ? "4,4" : undefined}
              opacity={0.55}
            />
          ))}
        </svg>

        {nodes.map((n) => {
          const { cx, cy } = positionOf(n);
          const type = classifyNode(n.view);
          const meta = TYPE_META[type];
          const isSelected = selectedClauseId === n.view.clauseId;
          const isOntology = n.view.evidence.kind === "ontology";
          // The readable sentence is always the primary label — never the
          // raw clause syntax (that stays available via the `title`
          // tooltip and the Evidence Inspector, for anyone who wants it).
          // A citation, when there is a real one, is secondary context.
          const title = n.view.goalHuman;
          const subtitle = isOntology ? "" : n.view.evidence.reference;
          const hasNote = Boolean(n.view.evidence.notes);

          return (
            <div
              key={`${n.view.clauseId}-${n.number}`}
              className="absolute flex flex-col items-center"
              style={{ left: cx - CARD_W / 2, top: cy - CARD_H / 2, width: CARD_W }}
            >
              <button
                onClick={() => onSelectNode(n.view.clauseId)}
                style={{ width: CARD_W, height: CARD_H }}
                className={cn(
                  "relative rounded-xl border p-3 text-left flex flex-col gap-1 transition-all cursor-pointer shadow-sm hover:shadow-md",
                  isSelected ? "ring-2 ring-brand-red/30 border-brand-red/50" : "hover:border-brand-red/40",
                  TYPE_CARD_STYLE[type]
                )}
              >
                {/* Sequence badge */}
                <span className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center shadow-sm border-2 border-background">
                  {n.number}
                </span>

                <div className="flex items-center justify-between gap-1">
                  <span className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0", TYPE_ICON_STYLE[type])}>
                    {meta.icon}
                  </span>
                  {n.view.evidence.unreviewed && (
                    <span className="text-[7px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold uppercase shrink-0">
                      unreviewed
                    </span>
                  )}
                </div>
                <span
                  className="font-serif text-[11px] font-bold text-text-primary leading-snug line-clamp-3"
                  title={`Formal goal: ${n.view.goal}`}
                >
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[9px] text-brand-red font-semibold leading-tight line-clamp-1" title={subtitle}>
                    {subtitle}
                  </span>
                )}
                {/* Type is already conveyed by the coloured icon above (see
                    the legend) — repeating it as text on every card was
                    redundant clutter, so only the strength meter remains
                    here. */}
                {!isOntology && (
                  <div className="h-1 w-full bg-border-warm-light/60 rounded-full overflow-hidden mt-auto">
                    <div className="h-full bg-brand-green/70" style={{ width: `${n.view.evidence.strength}%` }} />
                  </div>
                )}
              </button>

              {/* Real evidence note surfaced as an editor's-note style callout.
                  Height is capped explicitly (not just line-clamped) so this
                  box's contribution to the column's total height is bounded
                  and known — see ROW_HEIGHT — regardless of note length. */}
              {hasNote && (
                <div
                  style={{ marginTop: NOTE_GAP, maxHeight: NOTE_H }}
                  className="w-full text-[9px] leading-snug text-text-secondary bg-card-warm border border-dashed border-brand-red/40 rounded-lg px-2.5 py-1.5 line-clamp-2 overflow-hidden"
                  title={n.view.evidence.notes}
                >
                  {n.view.evidence.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProofTreeLegend() {
  const items: { label: string; render: React.ReactNode }[] = [
    { label: "Conclusion", render: <span className={cn("h-4 w-4 rounded-full flex items-center justify-center", TYPE_ICON_STYLE.conclusion)}>{TYPE_META.conclusion.icon}</span> },
    { label: "Principle", render: <span className={cn("h-4 w-4 rounded-full flex items-center justify-center", TYPE_ICON_STYLE.principle)}>{TYPE_META.principle.icon}</span> },
    { label: "Condition", render: <span className={cn("h-4 w-4 rounded-full flex items-center justify-center", TYPE_ICON_STYLE.condition)}>{TYPE_META.condition.icon}</span> },
    { label: "Source", render: <span className={cn("h-4 w-4 rounded-full flex items-center justify-center", TYPE_ICON_STYLE.source)}>{TYPE_META.source.icon}</span> },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 py-3 text-[10px] text-text-secondary border-t border-border-warm-light/60">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.render}
          <span>{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-px bg-brand-red opacity-55" />
        <span>Strong inference</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-px border-t border-dashed border-brand-red opacity-70" />
        <span>Weaker path</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-3 border border-dashed border-brand-red/40 rounded" />
        <span>Editor&rsquo;s note</span>
      </div>
    </div>
  );
}
