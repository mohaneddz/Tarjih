"use client";

import React, { useMemo } from "react";
import type { ProofView } from "@/lib/pipeline/present";
import { cn } from "@/utils/cn";

interface ProofTreeProps {
  readonly proof: ProofView;
  readonly selectedClauseId: string | null;
  readonly onSelectNode: (clauseId: string) => void;
}

interface LaidOutNode {
  readonly view: ProofView;
  readonly depth: number;
  /** Center x, in leaf-units (not pixels — scaled at render time). */
  readonly x: number;
}

/**
 * Lays out a proof tree of arbitrary shape and depth.
 *
 * The old visualizer hardcoded exactly five nodes at fixed (x, y) positions
 * because the LLM it rendered always produced exactly five nodes. Real
 * derivations don't: they range from a single fact to a multi-level chain of
 * qiyas built on qiyas, so the layout has to be computed from whatever tree
 * actually comes back. This is a standard tidy-tree pass: each node's width
 * in "leaf units" is the number of leaves beneath it (minimum 1), and a
 * node's center is the midpoint of the span its children occupy.
 */
function layoutTree(root: ProofView): { nodes: LaidOutNode[]; totalWidth: number; maxDepth: number } {
  const nodes: LaidOutNode[] = [];
  let maxDepth = 0;

  function place(view: ProofView, depth: number, xOffset: number): number {
    maxDepth = Math.max(maxDepth, depth);
    if (view.children.length === 0) {
      nodes.push({ view, depth, x: xOffset + 0.5 });
      return xOffset + 1;
    }
    const childStart = xOffset;
    let cursor = xOffset;
    const childCenters: number[] = [];
    for (const child of view.children) {
      const before = cursor;
      cursor = place(child, depth + 1, cursor);
      childCenters.push((before + cursor) / 2);
    }
    const center = (childStart + cursor) / 2;
    nodes.push({ view, depth, x: center });
    return cursor;
  }

  const totalWidth = place(root, 0, 0);
  return { nodes, totalWidth: Math.max(totalWidth, 1), maxDepth };
}

const KIND_STYLE: Record<string, { badge: string; label: string }> = {
  quran: { badge: "bg-brand-green-light text-brand-green", label: "Qur'an" },
  sunnah: { badge: "bg-brand-gold-light text-brand-gold", label: "Sunnah" },
  ijma: { badge: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300", label: "Ijma'" },
  qiyas: { badge: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300", label: "Qiyas" },
  qaida: { badge: "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300", label: "Maxim" },
  usul: { badge: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300", label: "Usul" },
  istihsan: { badge: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300", label: "Istihsan" },
  urf: { badge: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300", label: "Custom" },
  ontology: { badge: "bg-[#EFEDE8] dark:bg-white/5 text-text-secondary", label: "Definition" },
};

/** Strips the outer wrapper off a goal string for a shorter card title, e.g. "ruling(mistreat(mother), haram)" -> "mistreat(mother) = haram". */
function shortGoal(goal: string): string {
  const match = goal.match(/^ruling\((.+), (\w+)\)$/);
  if (match) return `${match[1]} = ${match[2]}`;
  return goal;
}

const ROW_HEIGHT = 132;
const COL_WIDTH = 220;
const CARD_W = 196;
const CARD_H = 96;

export function ProofTree({ proof, selectedClauseId, onSelectNode }: ProofTreeProps) {
  const { nodes, totalWidth, maxDepth } = useMemo(() => layoutTree(proof), [proof]);

  const width = totalWidth * COL_WIDTH;
  const height = (maxDepth + 1) * ROW_HEIGHT;

  const positionOf = (n: LaidOutNode) => ({
    cx: n.x * COL_WIDTH,
    cy: n.depth * ROW_HEIGHT + CARD_H / 2 + 16,
  });

  const byNode = new Map(nodes.map((n) => [n.view, n]));

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const walkEdges = (view: ProofView) => {
    const parent = byNode.get(view);
    if (!parent) return;
    for (const child of view.children) {
      const c = byNode.get(child);
      if (!c) continue;
      const p1 = positionOf(parent);
      const p2 = positionOf(c);
      edges.push({ x1: p1.cx, y1: p1.cy + CARD_H / 2, x2: p2.cx, y2: p2.cy - CARD_H / 2 });
      walkEdges(child);
    }
  };
  walkEdges(proof);

  return (
    <div className="relative w-full h-[520px] overflow-auto bg-background/30 rounded-2xl border border-border-warm-light/40 custom-scrollbar">
      <div className="relative" style={{ width: Math.max(width, 400), height: Math.max(height, 200), margin: "0 auto" }}>
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="#A37D4C"
              strokeWidth={1.5}
              opacity={0.65}
            />
          ))}
        </svg>

        {nodes.map((n, i) => {
          const { cx, cy } = positionOf(n);
          const style = KIND_STYLE[n.view.evidence.kind] ?? KIND_STYLE.ontology;
          const isSelected = selectedClauseId === n.view.clauseId;
          const isOntology = n.view.evidence.kind === "ontology";
          const title = isOntology ? shortGoal(n.view.goal) : n.view.evidence.reference;
          const subtitle = isOntology ? "definition" : shortGoal(n.view.goal);

          return (
            <button
              key={`${n.view.clauseId}-${i}`}
              onClick={() => onSelectNode(n.view.clauseId)}
              style={{
                left: cx - CARD_W / 2,
                top: cy - CARD_H / 2,
                width: CARD_W,
                height: CARD_H,
              }}
              className={cn(
                "absolute rounded-xl border p-3 text-left flex flex-col gap-1 transition-all cursor-pointer shadow-sm hover:shadow-md",
                isSelected
                  ? "bg-brand-gold-light border-brand-gold ring-2 ring-brand-gold/15"
                  : "bg-card-warm border-border-warm hover:border-brand-gold/50"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0", style.badge)}>
                  {style.label}
                </span>
                {n.view.evidence.unreviewed && (
                  <span className="text-[7px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold uppercase">
                    unreviewed
                  </span>
                )}
              </div>
              <span className="font-serif text-[11px] font-bold text-text-primary leading-snug line-clamp-2" title={title}>
                {title}
              </span>
              <span className="text-[9px] text-text-secondary leading-tight line-clamp-2 mt-auto" title={subtitle}>
                {subtitle}
              </span>
              {!isOntology && (
                <div className="h-1 w-full bg-border-warm-light/60 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-brand-green/70"
                    style={{ width: `${n.view.evidence.strength}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
