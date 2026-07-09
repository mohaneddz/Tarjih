"use client";

import React, { useState, useMemo, useRef } from "react";
import { Header } from "@/sections/header";
import { Footer } from "@/sections/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { dbNodes, dbEdges, DBNode, DBEdge } from "@/data/knowledge-base";

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState<"graph" | "concepts" | "rules" | "relations">("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [conceptsSearch, setConceptsSearch] = useState("");
  const [rulesSearch, setRulesSearch] = useState("");
  const [relationsSearch, setRelationsSearch] = useState("");

  // Zoom and Pan states for the big graph canvas
  const [zoom, setZoom] = useState(0.85); // Default zoomed out slightly to see more
  const [pan, setPan] = useState({ x: 50, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Native non-passive scroll wheel listener to zoom canvas and prevent page scrolling
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent browser from scrolling the main page up/down
      e.preventDefault();

      // Zoom factor step
      const zoomStep = 0.05;
      // deltaY < 0 means scroll up (zoom in), deltaY > 0 means scroll down (zoom out)
      const direction = e.deltaY < 0 ? 1 : -1;

      setZoom((prevZoom) => {
        const nextZoom = prevZoom + direction * zoomStep;
        // Keep zoom between 0.4 and 1.5
        return Math.max(0.4, Math.min(1.5, nextZoom));
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Filter lists for the dictionary tabs
  const conceptsList = useMemo(() => dbNodes.filter((n) => n.type === "Concept"), []);
  const rulesList = useMemo(() => dbNodes.filter((n) => n.type === "Rule"), []);
  const relationsList = useMemo(() => dbNodes.filter((n) => n.type === "Relation"), []);

  const filteredConcepts = useMemo(() => {
    if (!conceptsSearch.trim()) return conceptsList;
    const q = conceptsSearch.toLowerCase();
    return conceptsList.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.subtitle && n.subtitle.toLowerCase().includes(q)) ||
      (n.linguistic && n.linguistic.toLowerCase().includes(q)) ||
      n.description.toLowerCase().includes(q) ||
      n.cluster.toLowerCase().includes(q)
    );
  }, [conceptsList, conceptsSearch]);

  const filteredRules = useMemo(() => {
    if (!rulesSearch.trim()) return rulesList;
    const q = rulesSearch.toLowerCase();
    return rulesList.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.subtitle && n.subtitle.toLowerCase().includes(q)) ||
      n.description.toLowerCase().includes(q) ||
      n.details.toLowerCase().includes(q) ||
      n.cluster.toLowerCase().includes(q)
    );
  }, [rulesList, rulesSearch]);

  const filteredRelations = useMemo(() => {
    if (!relationsSearch.trim()) return relationsList;
    const q = relationsSearch.toLowerCase();
    return relationsList.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.subtitle && n.subtitle.toLowerCase().includes(q)) ||
      n.description.toLowerCase().includes(q) ||
      n.details.toLowerCase().includes(q) ||
      n.cluster.toLowerCase().includes(q)
    );
  }, [relationsList, relationsSearch]);

  // Selected Node for Detail Sidebar
  const selectedNode = useMemo(() => {
    return dbNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  // STATEFUL PANNING HANDLERS
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard Panning support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 40;
    if (e.key === "ArrowUp") setPan((p) => ({ ...p, y: p.y + step }));
    if (e.key === "ArrowDown") setPan((p) => ({ ...p, y: p.y - step }));
    if (e.key === "ArrowLeft") setPan((p) => ({ ...p, x: p.x + step }));
    if (e.key === "ArrowRight") setPan((p) => ({ ...p, x: p.x - step }));
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.4));
  const resetZoom = () => {
    setZoom(0.85);
    setPan({ x: 50, y: 30 });
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Repeating Arabesque Geometric Pattern */}
      <div className="absolute inset-0 -z-20 bg-pattern-arabesque opacity-[0.03] dark:opacity-[0.012] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-[120rem] lg:max-w-[135rem] 2xl:max-w-none w-full mx-auto px-6 py-12 flex flex-col gap-8 select-none">
        {/* Page Header */}
        <div className="border-b border-border-warm pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
              Juristic Knowledge Database
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Explore the complete network of legal concepts, scriptural rules, and analogical relations in the Tarjih repository.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-card-warm/80 p-1 rounded-xl text-[10px] font-bold border border-border-warm">
            <button
              onClick={() => setActiveTab("graph")}
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", activeTab === "graph" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
            >
              Knowledge Graph
            </button>
            <button
              onClick={() => setActiveTab("concepts")}
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", activeTab === "concepts" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
            >
              Concepts ({conceptsList.length})
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", activeTab === "rules" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
            >
              Rules ({rulesList.length})
            </button>
            <button
              onClick={() => setActiveTab("relations")}
              className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", activeTab === "relations" ? "bg-background text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
            >
              Relations ({relationsList.length})
            </button>
          </div>
        </div>

        {/* Tab Contents: Knowledge Graph Canvas */}
        {activeTab === "graph" && (
          <div className="relative w-full h-[650px] bg-card-warm border border-border-warm rounded-2xl shadow-premium overflow-hidden flex">

            {/* Interactive Drag-to-Pan & Zoom Canvas Workspace */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              className="flex-grow h-full overflow-hidden relative cursor-grab active:cursor-grabbing outline-none focus:ring-1 focus:ring-brand-green/20"
            >
              {/* Transformable Canvas Layer */}
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "0 0",
                }}
                className="absolute w-[2000px] h-[1400px] transition-transform duration-75 ease-out"
              >
                {/* SVG Connections layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <marker
                      id="db-arrow"
                      markerWidth="8"
                      markerHeight="6"
                      refX="14" // Push arrow back so it sits precisely at card borders
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 8 3, 0 6" fill="#A37D4C" />
                    </marker>
                  </defs>

                  {/* Draw global lines */}
                  {dbEdges.map((edge, idx) => {
                    const fromNode = dbNodes.find((n) => n.id === edge.from);
                    const toNode = dbNodes.find((n) => n.id === edge.to);

                    if (!fromNode || !toNode) return null;

                    // Compute card port offsets
                    const cardW = 200;
                    const cardH = 80;

                    let x1 = fromNode.x + cardW / 2;
                    let y1 = fromNode.y + cardH / 2;
                    let x2 = toNode.x + cardW / 2;
                    let y2 = toNode.y + cardH / 2;

                    // Align ports based on hierarchy
                    if (fromNode.type === "Concept" && toNode.type === "Relation") {
                      y1 = fromNode.y + cardH; // bottom of concept
                      if (fromNode.x < toNode.x) {
                        x2 = toNode.x; // left port of relation
                        y2 = toNode.y + cardH / 2;
                      } else if (fromNode.x > toNode.x) {
                        x2 = toNode.x + cardW; // right port of relation
                        y2 = toNode.y + cardH / 2;
                      } else {
                        x2 = toNode.x + cardW / 2; // top port of relation
                        y2 = toNode.y;
                      }
                    } else if (fromNode.type === "Relation" && toNode.type === "Conclusion") {
                      y1 = fromNode.y + cardH; // bottom of relation
                      x2 = toNode.x + cardW / 2; // top of conclusion
                      y2 = toNode.y;
                    } else if (fromNode.type === "Rule" && toNode.type === "Conclusion") {
                      y1 = fromNode.y + cardH; // bottom of rule
                      x2 = toNode.x + cardW; // right port of conclusion
                      y2 = toNode.y + cardH / 2;
                    }

                    const isDotted = edge.type === "Analogical";
                    let pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                    if (fromNode.x !== toNode.x && fromNode.type === "Concept") {
                      // Curved diagonal paths
                      pathD = `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`;
                    }

                    return (
                      <path
                        key={idx}
                        d={pathD}
                        fill="none"
                        stroke="#A37D4C"
                        strokeWidth={1.5}
                        strokeDasharray={isDotted ? "4,4" : undefined}
                        markerEnd="url(#db-arrow)"
                        className="opacity-70"
                      />
                    );
                  })}
                </svg>

                {/* HTML Cards Layer */}
                {dbNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isConclusion = node.type === "Conclusion";

                  return (
                    <div
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: "200px",
                        height: "80px",
                      }}
                      className={cn(
                        "absolute rounded-xl p-3 text-left border flex flex-col justify-between transition-all duration-200 cursor-pointer pointer-events-auto select-none",
                        isConclusion
                          ? isSelected
                            ? "bg-brand-green-light border-brand-green shadow-md ring-2 ring-brand-green/10"
                            : "bg-card-warm border-brand-green/50 shadow-sm hover:border-brand-green hover:shadow-md"
                          : isSelected
                            ? "bg-card-warm border-brand-gold shadow-md ring-2 ring-brand-gold/10"
                            : "bg-card-warm border-border-warm shadow-sm hover:border-brand-gold/60 hover:shadow-md"
                      )}
                    >
                      <div className="flex gap-2 items-center min-w-0">
                        {/* Icon */}
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                            isConclusion ? "bg-brand-green text-background dark:text-black" : "bg-brand-gold-light text-brand-gold border border-border-warm"
                          )}
                        >
                          {node.icon === "user" && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          )}
                          {node.icon === "scale" && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
                            </svg>
                          )}
                          {node.icon === "book" && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-serif text-[11px] font-bold text-text-primary leading-tight truncate">
                            {node.title}
                          </span>
                          <span className="text-[8px] text-text-secondary font-medium leading-none truncate mt-0.5">
                            {node.subtitle}
                          </span>
                        </div>
                      </div>
                      <div className="w-full flex justify-between items-end mt-1 shrink-0 select-none">
                        <span className="text-[8px] text-brand-gold font-extrabold uppercase tracking-wider">
                          {node.cluster} CLUSTER
                        </span>
                        <span
                          className={cn(
                            "text-[7px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider",
                            isConclusion
                              ? "bg-brand-green/15 text-brand-green"
                              : node.type === "Relation"
                                ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                                : node.type === "Rule"
                                  ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                                  : "bg-brand-gold-light text-brand-gold border border-border-warm-light"
                          )}
                        >
                          {node.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Float Canvas Zoom & Pan Overlay Controls (Bottom Right) */}
            <div className="absolute bottom-6 left-6 bg-card-warm/95 border border-border-warm rounded-xl p-3 shadow-md flex items-center gap-3.5 z-20 text-[10px] text-text-secondary font-semibold select-none">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-gold shrink-0" />
                <span>Drag to Pan</span>
              </div>
              <span className="text-text-secondary/30">|</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-green shrink-0" />
                <span>Arrow Keys Support</span>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20 select-none">
              <button
                onClick={zoomOut}
                className="h-9 w-9 bg-card-warm border border-border-warm text-text-primary rounded-xl shadow-md flex items-center justify-center font-bold hover:border-brand-gold/40 cursor-pointer"
                title="Zoom Out"
              >
                —
              </button>
              <button
                onClick={resetZoom}
                className="h-9 px-3 bg-card-warm border border-border-warm text-text-primary rounded-xl shadow-md flex items-center justify-center text-[10px] font-bold hover:border-brand-gold/40 cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="h-9 w-9 bg-card-warm border border-border-warm text-text-primary rounded-xl shadow-md flex items-center justify-center font-bold hover:border-brand-gold/40 cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Sliding Academic Side Drawer Panel for Selected Node */}
            {selectedNode && (
              <div className="absolute top-0 right-0 h-full w-80 bg-card-warm/95 border-l border-border-warm shadow-premium p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5.5 z-30 animate-in slide-in-from-right duration-300 select-text">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border-warm pb-3.5 shrink-0 select-none">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    Node Details
                  </span>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Node Summary Card */}
                <div
                  className={cn(
                    "p-4 rounded-xl border flex flex-col gap-2 shadow-sm select-none",
                    selectedNode.type === "Conclusion" ? "bg-brand-green-light border-brand-green/40" : "bg-background border-border-warm"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-sm font-bold text-text-primary truncate">
                      {selectedNode.title}
                    </span>
                    <span
                      className={cn(
                        "text-[7px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider",
                        selectedNode.type === "Conclusion"
                          ? "bg-brand-green/15 text-brand-green"
                          : selectedNode.type === "Relation"
                            ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                            : selectedNode.type === "Rule"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                              : "bg-brand-gold-light text-brand-gold border border-border-warm-light"
                      )}
                    >
                      {selectedNode.type}
                    </span>
                  </div>
                  <span className="text-[8px] text-brand-gold font-bold font-serif leading-none uppercase tracking-wider">
                    {selectedNode.cluster} Cluster Node
                  </span>
                </div>

                {/* Tabular Details */}
                <div className="flex flex-col gap-3 text-xs border-b border-border-warm pb-4.5 select-none">
                  {selectedNode.linguistic && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-semibold">Linguistic Term</span>
                      <span className="font-serif font-bold text-brand-green">{selectedNode.linguistic}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary font-semibold">Authority Source</span>
                    <span className="font-bold text-text-primary text-right max-w-[150px] truncate" title={selectedNode.source}>
                      {selectedNode.source}
                    </span>
                  </div>
                </div>

                {/* Detailed Narrative Section */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest select-none">
                    Juristic Definition
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest select-none">
                    Scholarly Application
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {selectedNode.details}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Concepts Dictionary */}
        {activeTab === "concepts" && (
          <div className="flex flex-col gap-6">
            {/* Search and info header */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card-warm border border-border-warm p-4.5 rounded-2xl shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search concepts by title, cluster, or linguistic root..."
                  value={conceptsSearch}
                  onChange={(e) => setConceptsSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-border-warm bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-brand-gold transition-all"
                />
                <svg className="absolute left-3.5 top-3 h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider select-none">
                Showing {filteredConcepts.length} of {conceptsList.length} Concepts
              </span>
            </div>

            {/* Grid of small items */}
            {filteredConcepts.length === 0 ? (
              <div className="text-center py-12 text-text-secondary bg-card-warm border border-border-warm rounded-2xl text-xs">
                No matching juristic concepts found.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 select-text">
                {filteredConcepts.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    className="p-4 bg-card-warm border border-border-warm rounded-xl hover:border-brand-gold/60 transition-all text-left flex flex-col gap-1.5 shadow-sm hover:shadow-md cursor-pointer group select-none"
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                      <span className="font-serif text-[12px] font-bold text-text-primary group-hover:text-brand-gold transition-colors truncate w-full" title={n.title}>
                        {n.title}
                      </span>
                    </div>
                    {n.linguistic && (
                      <span className="text-[9px] text-brand-green font-bold font-serif leading-none truncate">
                        {n.linguistic}
                      </span>
                    )}
                    <p className="text-[10px] text-text-secondary line-clamp-2 leading-snug mt-0.5">
                      {n.description}
                    </p>
                    <div className="w-full flex justify-between items-center text-[8px] text-text-secondary font-extrabold uppercase tracking-wider mt-auto pt-2 border-t border-border-warm-light/40">
                      <span className="truncate max-w-[55px]">{n.cluster}</span>
                      <span className="text-[7px] text-brand-gold bg-brand-gold-light px-1 py-0.5 rounded leading-none shrink-0">
                        Concept
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Scriptural Rules */}
        {activeTab === "rules" && (
          <div className="flex flex-col gap-6">
            {/* Search and info header */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card-warm border border-border-warm p-4.5 rounded-2xl shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search rules, scriptures, or maxims..."
                  value={rulesSearch}
                  onChange={(e) => setRulesSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-border-warm bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-brand-gold transition-all"
                />
                <svg className="absolute left-3.5 top-3 h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider select-none">
                Showing {filteredRules.length} of {rulesList.length} Rules
              </span>
            </div>

            {filteredRules.length === 0 ? (
              <div className="text-center py-12 text-text-secondary bg-card-warm border border-border-warm rounded-2xl text-xs">
                No matching rules found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
                {filteredRules.map((n) => (
                  <Card key={n.id} hoverable className="p-6 flex flex-col gap-3.5 bg-card-warm border border-border-warm">
                    <div className="flex items-center justify-between border-b border-border-warm pb-3 select-none">
                      <div className="flex flex-col">
                        <h3 className="font-serif text-base font-bold text-text-primary">{n.title}</h3>
                        <span className="text-[9px] text-brand-gold font-bold font-serif mt-0.5">{n.subtitle}</span>
                      </div>
                      <span className="text-[8px] px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded font-bold uppercase tracking-wider">
                        {n.cluster} Cluster
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {n.details}
                    </p>
                    <div className="text-[10px] text-text-secondary mt-auto flex gap-1.5 items-center font-semibold border-t border-border-warm/50 pt-3 select-none">
                      <span className="text-brand-gold font-bold">Scriptural Source:</span>
                      <span className="italic">{n.source}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Juristic Relations */}
        {activeTab === "relations" && (
          <div className="flex flex-col gap-6">
            {/* Search and info header */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card-warm border border-border-warm p-4.5 rounded-2xl shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search connectives and legal relations..."
                  value={relationsSearch}
                  onChange={(e) => setRelationsSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-border-warm bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-brand-gold transition-all"
                />
                <svg className="absolute left-3.5 top-3 h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider select-none">
                Showing {filteredRelations.length} of {relationsList.length} Relations
              </span>
            </div>

            {filteredRelations.length === 0 ? (
              <div className="text-center py-12 text-text-secondary bg-card-warm border border-border-warm rounded-2xl text-xs">
                No matching relations found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
                {filteredRelations.map((n) => (
                  <Card key={n.id} hoverable className="p-6 flex flex-col gap-3.5 bg-card-warm border border-border-warm">
                    <div className="flex items-center justify-between border-b border-border-warm-light pb-3 select-none">
                      <div className="flex flex-col">
                        <h3 className="font-serif text-base font-bold text-text-primary">{n.title}</h3>
                        <span className="text-[9px] text-brand-gold font-bold font-serif mt-0.5">{n.subtitle}</span>
                      </div>
                      <span className="text-[8px] px-2 py-0.5 bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded font-bold uppercase tracking-wider">
                        {n.cluster} Cluster
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {n.details}
                    </p>
                    <div className="text-[10px] text-text-secondary mt-auto flex gap-1.5 items-center font-semibold border-t border-border-warm/50 pt-3 select-none">
                      <span className="text-brand-gold font-bold">Logical Connective:</span>
                      <span>{n.source}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
