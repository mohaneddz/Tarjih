"use client";

import React from "react";
import { ReasoningTree, ReasoningNode } from "@/data/answers-data";
import { cn } from "@/utils/cn";

interface ReasoningTreeVisualizerProps {
  tree: ReasoningTree;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

/**
 * Renders inline SVG icons for zero external dependencies.
 */
function VisualizerIcon({ name, className }: { name?: "user" | "scale" | "book"; className?: string }) {
  switch (name) {
    case "user":
      return (
        <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      );
    case "scale":
      return (
        <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
        </svg>
      );
    case "book":
      return (
        <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );
    default:
      return null;
  }
}

export function ReasoningTreeVisualizer({
  tree,
  selectedNodeId,
  onSelectNode,
}: ReasoningTreeVisualizerProps) {
  // Restructured to form a true vertical hierarchical tree matching CS tree layouts:
  // Row 1 (Top Inputs, y=20%): Concept 1 (left, x=20%), Concept 2 (center, x=50%), Rule (right, x=80%)
  // Row 2 (Middle Relation, y=52%): Relation (center, x=50%)
  // Row 3 (Bottom Root, y=82%): Conclusion (center, x=50%)
  const getPosition = (node: ReasoningNode, index: number) => {
    if (node.type === "Concept") {
      // First concept on the left, second in the center-top
      const isFirst = index === 0 || (index === 1 && tree.nodes[0].type !== "Concept");
      return isFirst ? { x: 20, y: 20 } : { x: 50, y: 20 };
    }
    if (node.type === "Rule") {
      return { x: 80, y: 20 };
    }
    if (node.type === "Relation") {
      return { x: 50, y: 52 };
    }
    if (node.type === "Conclusion") {
      return { x: 50, y: 82 };
    }
    return { x: 50, y: 50 };
  };

  // Map nodes to their positions for rendering and line calculations
  const nodesWithPositions = tree.nodes.map((node, idx) => ({
    node,
    pos: getPosition(node, idx),
  }));

  // Card half-dimensions in percentage
  const halfW = 12;
  const halfH = 10;

  return (
    <div className="relative w-full h-[550px] md:h-[680px] lg:h-[780px] xl:h-[880px] bg-background/30 rounded-2xl overflow-hidden select-none border border-border-warm-light/40">
      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          {/* Gold arrowhead marker (scaled in pixels because no viewBox scale stretches it) */}
          <marker
            id="arrowhead-gold"
            markerWidth="7"
            markerHeight="5"
            refX="6"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 7 2.5, 0 5" fill="#A37D4C" />
          </marker>
        </defs>

        {/* Draw edges */}
        {tree.edges.map((edge, idx) => {
          const fromNode = nodesWithPositions.find((n) => n.node.id === edge.from);
          const toNode = nodesWithPositions.find((n) => n.node.id === edge.to);

          if (!fromNode || !toNode) return null;

          let x1 = fromNode.pos.x;
          let y1 = fromNode.pos.y;
          let x2 = toNode.pos.x;
          let y2 = toNode.pos.y;

          // Perform smart port connection calculations based on relative positions
          if (fromNode.node.type === "Concept" && toNode.node.type === "Relation") {
            // Concept 1 (Top Left) or Concept 2 (Top Center) to Relation (Middle Center)
            y1 = y1 + halfH; // bottom of card
            if (fromNode.pos.x < toNode.pos.x) {
              // Left concept to left side of relation
              x2 = x2 - halfW;
            } else {
              // Center concept straight down to top of relation
              x2 = toNode.pos.x;
              y2 = y2 - halfH;
            }
          } else if (fromNode.node.type === "Relation" && toNode.node.type === "Conclusion") {
            // Relation (Middle Center) straight down to Conclusion (Bottom Center)
            y1 = y1 + halfH;
            y2 = y2 - halfH;
          } else if (fromNode.node.type === "Rule" && toNode.node.type === "Conclusion") {
            // Rule (Top Right) diagonally down to Conclusion (Bottom Center)
            y1 = y1 + halfH;
            x2 = x2 + halfW; // connect to right side of conclusion card
          } else if (fromNode.node.type === "Rule" && toNode.node.type === "Relation") {
            // Fallback: Rule (Top Right) to Relation (Middle Center)
            y1 = y1 + halfH;
            x2 = x2 + halfW;
          }

          const isDotted = edge.type === "Analogical";
          const hasArrow = true; // All lines in hierarchical trees have arrows to show flow direction

          return (
            <line
              key={idx}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="#A37D4C"
              strokeWidth={1.5}
              strokeDasharray={isDotted ? "4,4" : undefined}
              markerEnd={hasArrow ? "url(#arrowhead-gold)" : undefined}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* HTML Cards Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {nodesWithPositions.map(({ node, pos }) => {
          const isSelected = selectedNodeId === node.id;
          const isConclusion = node.type === "Conclusion";

          // Icons & styling details
          const iconName = node.icon;
          
          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: "24%",
                height: "20%",
              }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-xl p-4 lg:p-5 text-left border flex flex-col justify-between transition-all duration-200 cursor-pointer pointer-events-auto select-none",
                // Specific styles for selected, conclusion, or default cards
                isConclusion
                  ? isSelected
                    ? "bg-brand-green-light border-brand-green shadow-md ring-2 ring-brand-green/10"
                    : "bg-card-warm border-brand-green/60 shadow-sm hover:border-brand-green hover:shadow-md"
                  : isSelected
                  ? "bg-card-warm border-brand-gold shadow-md ring-2 ring-brand-gold/10"
                  : "bg-card-warm border-border-warm shadow-sm hover:border-brand-gold/60 hover:shadow-md"
              )}
            >
              {/* Card Header (Icon and Title) */}
              <div className="flex gap-3 lg:gap-4 items-center w-full min-w-0">
                {/* Icon Container */}
                <div
                  className={cn(
                    "h-9 w-9 lg:h-11 lg:w-11 rounded-full flex items-center justify-center shrink-0",
                    isConclusion
                      ? "bg-brand-green text-background dark:text-black"
                      : "bg-brand-gold-light text-brand-gold border border-border-warm-light"
                  )}
                >
                  <VisualizerIcon name={iconName} className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>

                {/* Typography */}
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-[12px] md:text-sm lg:text-base font-bold text-text-primary leading-tight truncate">
                    {node.title}
                  </span>
                  {node.subtitle && (
                    <span className="text-[9px] md:text-xs lg:text-sm text-text-secondary font-medium leading-none truncate mt-0.5">
                      {node.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body / Description */}
              {node.description ? (
                <p className="text-[9px] md:text-xs lg:text-sm text-text-secondary line-clamp-2 leading-snug mt-1 w-full">
                  {node.description}
                </p>
              ) : (
                <div className="flex-1" />
              )}

              {/* Bottom Badge */}
              <div className="w-full flex justify-end mt-1 shrink-0">
                <span
                  className={cn(
                    "text-[8px] md:text-[9px] lg:text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                    isConclusion
                      ? "bg-brand-green/10 text-brand-green"
                      : node.type === "Relation"
                      ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                      : node.type === "Rule"
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                      : "bg-brand-gold-light text-brand-gold border border-border-warm-light"
                  )}
                >
                  {node.badge || node.type}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
