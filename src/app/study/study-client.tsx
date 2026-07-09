"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { AnswerData, ReasoningNode, NodeInspectorData } from "@/data/answers-data";
import { ReasoningTreeVisualizer } from "@/components/ui/reasoning-tree-visualizer";
import { cn } from "@/utils/cn";

interface StudyClientProps {
  answers: AnswerData[];
  defaultSelectedId?: string;
}

/**
 * Interactive Study Dashboard Client Container.
 * Formatted strictly to match the premium, academic, and legal design in example.png.
 */
export function StudyClient({ answers: initialAnswers, defaultSelectedId }: StudyClientProps) {
  const [answers, setAnswers] = useState<AnswerData[]>(initialAnswers);

  // Compute initial active answer to align states
  const initialActiveAnswer = useMemo(() => {
    return initialAnswers.find((a) => a.id === defaultSelectedId) ||
      initialAnswers.find((a) => a.id === "mistreating-aunts") ||
      initialAnswers[0] ||
      null;
  }, [initialAnswers, defaultSelectedId]);

  const [selectedId, setSelectedId] = useState<string>(initialActiveAnswer?.id || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"tree" | "trace" | "interpretation" | "sources" | "conflicts">("tree");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Sync selectedId & inputVal when defaultSelectedId changes (e.g. from URL search params)
  useEffect(() => {
    if (defaultSelectedId) {
      const match = answers.find((a) => a.id === defaultSelectedId);
      if (match) {
        setSelectedId(defaultSelectedId);
        setInputVal(match.question);
      }
    }
  }, [defaultSelectedId, answers]);

  // Selected node within the active reasoning tree (defaults to "conclusion")
  const [selectedNodeId, setSelectedNodeId] = useState<string>("conclusion");

  // Input states
  const [inputVal, setInputVal] = useState<string>(initialActiveAnswer?.question || "Is mistreating aunts haram?");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("Identifying core subjects...");

  // Dropdown states
  const [madhhab, setMadhhab] = useState<string>("Shafi'i");
  const [sourceSet, setSourceSet] = useState<string>("Qur'an & Sunnah + Fiqh");
  const [strictness, setStrictness] = useState<string>("Moderate");

  const historyListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSuggestionClick = (sug: string) => {
    setInputVal(sug);
    // Focus the input field after filling
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const handleHistoryItemClick = (ans: AnswerData) => {
    setSelectedId(ans.id);
    setInputVal(ans.question);
  };

  // Cycle through loading steps during resolution
  useEffect(() => {
    if (!isSubmitting) return;
    const steps = [
      "Identifying core subjects...",
      "Searching scriptural databases...",
      "Anchoring textual evidences...",
      "Weighing analogical extensions (Qiyas)...",
      "Analyzing conflicts and maxims...",
      "Formulating final juristic consensus..."
    ];
    let idx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setLoadingStep(steps[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Reset selected node to "conclusion" when the active answer changes
  useEffect(() => {
    setSelectedNodeId("conclusion");
  }, [selectedId]);

  // Filter list based on search query
  const filteredAnswers = useMemo(() => {
    if (!searchQuery.trim()) return answers;
    const q = searchQuery.toLowerCase();
    return answers.filter(
      (ans) =>
        ans.question.toLowerCase().includes(q) ||
        ans.category.toLowerCase().includes(q) ||
        ans.summary.toLowerCase().includes(q)
    );
  }, [answers, searchQuery]);

  // Selected Answer Object
  const selectedAnswer = useMemo(() => {
    return answers.find((ans) => ans.id === selectedId) || answers[0] || null;
  }, [answers, selectedId]);

  // Removed selectedAnswer inputVal auto-sync hook to prevent suggestion overrides

  // Active Reasoning Tree Data
  const activeTree = selectedAnswer?.reasoningTree;

  // Active Selected Node Data
  const activeNode = useMemo(() => {
    if (!activeTree) return null;
    return activeTree.nodes.find((n) => n.id === selectedNodeId) || activeTree.nodes[0] || null;
  }, [activeTree, selectedNodeId]);

  // Active Selected Node Inspector Data
  const activeInspectorData = useMemo(() => {
    if (!activeTree || !selectedNodeId) return null;
    return activeTree.inspectorData[selectedNodeId] || activeTree.inspectorData["conclusion"] || null;
  }, [activeTree, selectedNodeId]);

  // Handle Query Submission
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const question = inputVal.trim();

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          madhhab,
          sourceSet,
          strictness,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to resolve query.");
      }

      const newAnswer: AnswerData = await response.json();

      setAnswers((prev) => {
        // Exclude matching ids to avoid duplicates if re-evaluating
        const filtered = prev.filter((a) => a.question.toLowerCase() !== question.toLowerCase());
        return [newAnswer, ...filtered];
      });

      setSelectedId(newAnswer.id);

      if (historyListRef.current) {
        historyListRef.current.scrollTop = 0;
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error communicating with Tarjih resolution engine.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {/* Search Header */}
          <div className="p-5 flex flex-col gap-3.5 shrink-0 border-b border-border-warm-light">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <h2 className="text-xs lg:text-sm font-bold text-text-secondary uppercase tracking-widest font-sans">
                  Resolution History
                </h2>
                <span className="text-[10px] lg:text-xs bg-brand-gold-light border border-border-warm text-brand-gold px-2.5 py-0.5 rounded-full font-bold font-sans">
                  {answers.length}
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

            {/* Search bar styled to match the warm scholarly aesthetic */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 lg:h-12 pl-11 pr-5 text-sm rounded-xl border border-border-warm bg-card-warm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-brand-gold transition-all font-sans"
              />
              <svg
                className="absolute left-4 top-3.5 lg:top-4 h-4 w-4 lg:h-5 lg:w-5 text-text-secondary/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Scrollable History List */}
          <div
            ref={historyListRef}
            className="flex-grow overflow-y-auto custom-scrollbar p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 bg-background select-none"
          >
            {filteredAnswers.length === 0 ? (
              <div className="text-center py-12 text-text-secondary text-xs font-sans">
                No matching records.
              </div>
            ) : (
              filteredAnswers.map((ans) => {
                const isActive = ans.id === selectedId;
                return (
                  <button
                    key={ans.id}
                    onClick={() => handleHistoryItemClick(ans)}
                    className={cn(
                      "w-full text-left p-4 lg:p-5 rounded-2xl border transition-all text-sm select-none cursor-pointer flex flex-col gap-3 lg:gap-4",
                      isActive
                        ? "bg-card-warm border-border-warm shadow-sm ring-1 ring-brand-gold/10 text-text-primary"
                        : "bg-transparent border-transparent text-text-secondary hover:bg-card-warm hover:border-border-warm/50 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] lg:text-xs uppercase tracking-wider font-extrabold text-brand-green font-sans">
                        {ans.category}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] lg:text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold uppercase shrink-0 tracking-wider font-sans",
                          ans.confidence === "High"
                            ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                            : ans.confidence === "Medium"
                            ? "bg-[#D9A74A]/10 text-[#D9A74A] border-[#D9A74A]/20"
                            : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50"
                        )}
                      >
                        {ans.confidence}
                      </span>
                    </div>
                    <span className="font-serif font-bold text-sm lg:text-base text-text-primary leading-snug line-clamp-1">
                      {ans.question}
                    </span>
                    <p className="text-xs lg:text-sm text-text-secondary line-clamp-2 leading-relaxed font-sans">
                      {ans.summary}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-grow h-full flex flex-col min-h-0 overflow-hidden bg-background p-5 md:p-6">
        {/* Main white/cream container card */}
        <div className="relative flex-grow flex flex-col min-h-0 bg-card-warm border border-border-warm rounded-2xl shadow-premium overflow-hidden">
          {/* Dashboard Tabs Header */}
          <div className="h-18 lg:h-22 border-b border-border-warm-light flex items-center justify-between px-6 lg:px-8 bg-card-warm shrink-0 select-none">
            {/* Nav Tabs */}
            <div className="flex gap-8 h-full items-center">
              {isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-gold-light border border-border-warm text-brand-gold hover:bg-brand-gold/10 transition-all cursor-pointer font-sans font-extrabold text-xs mr-4 shrink-0"
                  title="Expand History"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <span>History</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab("tree")}
                className={cn(
                  "flex items-center gap-3 lg:gap-4 text-sm lg:text-base font-bold px-1 border-b-2 transition-all cursor-pointer font-sans",
                  activeTab === "tree"
                    ? "border-brand-green text-brand-green"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {/* Reasoning Tree Icon */}
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Reasoning Tree
              </button>

              <button
                onClick={() => setActiveTab("trace")}
                className={cn(
                  "flex items-center gap-3 lg:gap-4 text-sm lg:text-base font-bold px-1 border-b-2 transition-all cursor-pointer",
                  activeTab === "trace"
                    ? "border-brand-green text-brand-green"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {/* Resolution Trace Icon */}
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                Resolution Trace
              </button>

              <button
                onClick={() => setActiveTab("interpretation")}
                className={cn(
                  "flex items-center gap-3 lg:gap-4 text-sm lg:text-base font-bold px-1 border-b-2 transition-all cursor-pointer",
                  activeTab === "interpretation"
                    ? "border-brand-green text-brand-green"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {/* Interpretation Icon */}
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                Interpretation
              </button>

              <button
                onClick={() => setActiveTab("sources")}
                className={cn(
                  "flex items-center gap-3 lg:gap-4 text-sm lg:text-base font-bold px-1 border-b-2 transition-all cursor-pointer",
                  activeTab === "sources"
                    ? "border-brand-green text-brand-green"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {/* Sources Icon */}
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Sources
              </button>

              <button
                onClick={() => setActiveTab("conflicts")}
                className={cn(
                  "flex items-center gap-3 lg:gap-4 text-sm lg:text-base font-bold px-1 border-b-2 transition-all cursor-pointer",
                  activeTab === "conflicts"
                    ? "border-brand-green text-brand-green"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {/* Conflicts Icon */}
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                </svg>
                Conflicts
              </button>
            </div>
          </div>

          {/* Center Pane Split Layout */}
          <div className="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left/Middle Pane: Reasoning Tree Canvas or Onboarding Empty State */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 flex flex-col min-h-0 relative bg-card-warm select-none">
              {!selectedAnswer ? (
                <div className="flex-grow flex flex-col items-center justify-center text-text-secondary gap-4 p-8 select-text">
                  <svg className="h-16 w-16 text-brand-gold/45 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
                  </svg>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <h4 className="font-serif font-bold text-base text-text-primary">
                      Tarjih Resolution Workspace
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                      Enter a question below or click a suggestion to initiate live AI juristic resolution and view the logical reasoning path.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "tree" && activeTree ? (
                    <div className="flex-grow flex flex-col min-h-0">
                      {/* Status Badge Row */}
                      <div className="flex shrink-0 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 border border-border-warm rounded-full">
                          <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                          <span className="font-serif font-bold text-xs text-text-primary">
                            {activeTree.statusBadge}
                          </span>
                          <span className="text-[10px] text-text-secondary font-bold select-none">•</span>
                          <span className="text-[10px] text-brand-gold font-bold">
                            {activeTree.confidenceVal}% confidence
                          </span>
                          <button
                            onClick={() => alert("Confidence indicates consistency across juristic paths and supporting maxims.")}
                            className="text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Diagram Visualizer */}
                      <div className="flex-grow relative min-h-0">
                        <ReasoningTreeVisualizer
                          tree={activeTree}
                          selectedNodeId={selectedNodeId}
                          onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
                        />

                        {/* Dynamic Legend Box in bottom-left */}
                        <div className="absolute bottom-4 left-4 bg-card-warm border border-border-warm rounded-xl p-3.5 shadow-sm text-[10px] text-text-secondary font-semibold flex flex-col gap-2.5 z-20 w-44 select-none">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-0.5 bg-brand-gold shrink-0" />
                            <span>Direct Relation</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-8 border-t border-dashed border-brand-gold shrink-0" />
                            <span>Analogical Relation</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center w-8 shrink-0">
                              <span className="w-7 h-0.5 bg-brand-gold" />
                              <span className="w-1.5 h-1.5 border-t border-r border-brand-gold rotate-45 -ml-1" />
                            </div>
                            <span>Derivation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === "tree" ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                      No reasoning tree data loaded for this question.
                    </div>
                  ) : null}

                  {/* Resolution Trace Tab Content */}
                  {activeTab === "trace" && (
                    <div className="flex flex-col gap-6 select-text max-w-2xl">
                      <h3 className="font-serif text-lg font-bold text-text-primary border-b border-border-warm-light pb-2">
                        Juristic Resolution Trace
                      </h3>
                      <div className="relative border-l border-brand-gold/30 pl-5 ml-2.5 flex flex-col gap-8">
                        {activeTree?.nodes.map((node, index) => {
                          const inspector = activeTree.inspectorData[node.id];
                          return (
                            <div key={node.id} className="relative">
                              <span className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full bg-brand-gold-light border border-brand-gold flex items-center justify-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                              </span>
                              <h4 className="text-xs font-extrabold text-brand-green uppercase tracking-wider mb-1">
                                {index + 1}. {node.type}: {node.title}
                              </h4>
                              <p className="text-xs text-text-secondary leading-relaxed">
                                {inspector?.whyFired || node.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interpretation Tab Content */}
                  {activeTab === "interpretation" && (
                    <div className="flex flex-col gap-6 select-text max-w-3xl">
                      <h3 className="font-serif text-lg font-bold text-text-primary border-b border-border-warm-light pb-2">
                        Juristic Interpretation & Detailed Analysis
                      </h3>
                      <div className="rounded-2xl border-l-4 border-brand-green bg-brand-green-light/40 p-5 shrink-0">
                        <h4 className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-1.5">
                          Juristic Consensus Summary
                        </h4>
                        <p className="text-sm md:text-base text-text-primary leading-relaxed font-semibold">
                          {selectedAnswer?.summary}
                        </p>
                      </div>
                      <div className="flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Detailed Weighing (Tarjih al-Aqwal)
                        </h4>
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                          {selectedAnswer?.analysis}
                        </p>
                      </div>
                      {selectedAnswer?.notes && (
                        <div className="rounded-xl border border-border-warm bg-background p-4 flex gap-3.5 items-start">
                          <svg className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                          </svg>
                          <div>
                            <h5 className="text-xs font-bold text-text-primary mb-1">
                              Important Jurisprudential Notes
                            </h5>
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {selectedAnswer.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sources Tab Content */}
                  {activeTab === "sources" && (
                    <div className="flex flex-col gap-5 select-text max-w-2xl">
                      <h3 className="font-serif text-lg font-bold text-text-primary border-b border-border-warm-light pb-2">
                        Scholarly Sources & Textual Evidences
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        The following authoritative texts and scholarly resolutions were weighed to resolve this inquiry:
                      </p>
                      <ul className="flex flex-col gap-3">
                        {selectedAnswer?.references.map((ref, idx) => (
                          <li key={idx} className="flex gap-4 items-start bg-background/50 border border-border-warm/40 p-3 rounded-xl hover:border-brand-gold/30 transition-all">
                            <span className="h-6 w-6 rounded-full bg-brand-gold-light border border-border-warm text-[10px] font-bold text-brand-gold flex items-center justify-center shrink-0 select-none">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col">
                               <span className="text-xs font-semibold text-text-primary leading-relaxed">
                                {ref}
                              </span>
                              <span className="text-[9px] text-text-secondary mt-0.5">
                                Verified authentic and applicable as primary legal evidence.
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conflicts Tab Content */}
                  {activeTab === "conflicts" && (
                    <div className="flex flex-col gap-5 select-text max-w-2xl">
                      <h3 className="font-serif text-lg font-bold text-text-primary border-b border-border-warm-light pb-2">
                        Juristic Exceptions & Conflicting Maxims
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Dynamic assessment of potential conflicts, caveats, or alternative views within this derivation:
                      </p>
                      <div className="flex flex-col gap-4">
                        {activeTree && Object.entries(activeTree.inspectorData).some(([_, d]) => (d.exceptions && d.exceptions !== "None" && d.exceptions !== "none") || (d.relatedConflicts && d.relatedConflicts !== "None" && d.relatedConflicts !== "none")) ? (
                          Object.entries(activeTree.inspectorData).map(([nodeId, data]) => {
                            const node = activeTree.nodes.find(n => n.id === nodeId);
                            if (!node) return null;
                            return (
                              <React.Fragment key={nodeId}>
                                {data.exceptions && data.exceptions !== "None" && data.exceptions !== "none" && (
                                  <div className="bg-background/50 border border-border-warm/60 rounded-xl p-4 flex gap-4 items-start">
                                    <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-text-primary mb-1">Exception / Caveat ({node.title})</h4>
                                      <p className="text-[11px] text-text-secondary leading-relaxed">{data.exceptions}</p>
                                    </div>
                                  </div>
                                )}
                                {data.relatedConflicts && data.relatedConflicts !== "None" && data.relatedConflicts !== "none" && (
                                  <div className="bg-background/50 border border-border-warm/60 rounded-xl p-4 flex gap-4 items-start">
                                    <div className="h-8 w-8 rounded-full bg-brand-green-light/40 text-brand-green flex items-center justify-center shrink-0">
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-text-primary mb-1">Scholarly Conflict ({node.title})</h4>
                                      <p className="text-[11px] text-text-secondary leading-relaxed">{data.relatedConflicts}</p>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 text-text-secondary text-xs">
                            No active exceptions or conflicts reported for this reasoning tree.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Pane: INSPECTOR Sidebar */}
            <div className="w-full md:w-72 lg:w-80 xl:w-96 border-t md:border-t-0 md:border-l border-border-warm-light p-5 lg:p-6 flex flex-col gap-5 lg:gap-6 overflow-y-auto custom-scrollbar bg-card-warm select-none">
              {/* Inspector Header */}
              <div className="flex items-center justify-between border-b border-border-warm-light pb-4 shrink-0">
                <span className="text-xs lg:text-sm font-bold text-text-secondary uppercase tracking-widest">
                  INSPECTOR
                </span>
                {/* Close Button Icon */}
                <button
                  onClick={() => setSelectedNodeId("conclusion")}
                  className="text-text-secondary hover:text-text-primary cursor-pointer p-1.5"
                  title="Reset Selection"
                >
                  <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {activeNode && activeInspectorData ? (
                <div className="flex flex-col gap-6 lg:gap-8">
                  {/* Selected Node Preview Card */}
                  <div
                    className={cn(
                      "p-5 lg:p-6 rounded-2xl border flex flex-col gap-3.5 shadow-sm transition-all",
                      activeNode.type === "Conclusion"
                        ? "bg-brand-green-light border-brand-green/40"
                        : "bg-background border-border-warm"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            "h-8 w-8 lg:h-10 lg:w-10 rounded-full flex items-center justify-center shrink-0",
                            activeNode.type === "Conclusion"
                              ? "bg-brand-green text-background dark:text-black"
                              : "bg-brand-gold-light text-brand-gold border border-border-warm-light"
                          )}
                        >
                          {activeNode.icon === "user" && (
                            <svg className="h-4.5 w-4.5 lg:h-5.5 lg:w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          )}
                          {activeNode.icon === "scale" && (
                            <svg className="h-4.5 w-4.5 lg:h-5.5 lg:w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
                            </svg>
                          )}
                          {activeNode.icon === "book" && (
                            <svg className="h-4.5 w-4.5 lg:h-5.5 lg:w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                            </svg>
                          )}
                        </div>
                        <span className="font-serif font-bold text-sm lg:text-base text-text-primary">
                          {activeNode.title}
                        </span>
                      </div>

                      {/* Selected Badge */}
                      <span className="text-[10px] lg:text-xs px-2 py-0.5 rounded bg-brand-green/15 text-brand-green font-extrabold uppercase select-none tracking-wide shrink-0">
                        Selected
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-text-secondary leading-relaxed">
                      {activeNode.description || activeNode.subtitle}
                    </p>
                  </div>

                  {/* Tabular Properties */}
                  <div className="flex flex-col gap-4 text-sm lg:text-base">
                    <div className="flex justify-between border-b border-border-warm-light pb-3">
                      <span className="text-text-secondary font-semibold">Type</span>
                      <span className="font-bold text-text-primary">{activeInspectorData.type}</span>
                    </div>
                    
                    <div className="flex justify-between border-b border-border-warm-light pb-3">
                      <span className="text-text-secondary font-semibold">Source</span>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        {activeInspectorData.source}
                        <svg className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-border-warm-light pb-3 items-center">
                      <span className="text-text-secondary font-semibold">Strength</span>
                      <span className="text-amber-500 flex gap-0.5 font-bold text-base lg:text-lg">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < activeInspectorData.strength ? "text-brand-gold" : "text-text-secondary/20"}>
                            ★
                          </span>
                        ))}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 border-b border-border-warm-light pb-3">
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-semibold">Confidence</span>
                        <span className="font-bold text-brand-green">{activeInspectorData.confidence}%</span>
                      </div>
                      {/* Custom Progress Bar */}
                      <div className="h-2 lg:h-2.5 w-full bg-border-warm-light rounded-full overflow-hidden">
                        <div
                          style={{ width: `${activeInspectorData.confidence}%` }}
                          className="h-full bg-brand-green rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Why this node fired section */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] lg:text-xs font-bold text-text-secondary uppercase tracking-widest">
                      Why this node fired
                    </span>
                    <p className="text-xs lg:text-sm text-text-secondary leading-relaxed">
                      {activeInspectorData.whyFired}
                    </p>
                  </div>

                  {/* Exceptions / Conflicts */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] lg:text-xs font-bold text-text-secondary uppercase tracking-widest">
                      Exceptions / Conflicts
                    </span>
                    <p className="text-xs lg:text-sm text-text-secondary leading-relaxed">
                      {activeInspectorData.exceptions}
                    </p>
                  </div>

                  {/* Related Conflicts */}
                  <div className="flex flex-col gap-3.5 pt-3 border-t border-border-warm-light">
                    <div className="flex justify-between items-center text-sm lg:text-base">
                      <span className="text-text-secondary font-semibold">Related Conflicts</span>
                      <span className="font-bold text-text-secondary flex items-center gap-1.5 cursor-pointer">
                        {activeInspectorData.relatedConflicts}
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-text-secondary text-xs">
                  Select a node in the diagram to inspect its parameters.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="border-t border-border-warm-light px-8 py-5 lg:py-6 bg-card-warm shrink-0 select-none">
            {/* Suggestions Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5 max-w-5xl mx-auto w-full select-none">
              <span className="font-sans text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-widest mr-1.5">Suggestions:</span>
              {[
                "Is mistreating aunts haram?",
                "Is it permissible to combine prayers while traveling?",
                "Is lab-grown meat halal?"
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  className="text-xs px-3.5 py-1.5 rounded-full border border-border-warm bg-card-warm/50 text-text-secondary hover:border-brand-gold hover:text-text-primary transition-all cursor-pointer font-sans font-semibold shadow-sm"
                >
                  {sug}
                </button>
              ))}
            </div>

            <form onSubmit={handleQuerySubmit} className="w-full flex flex-col gap-4">
              {/* Question Input Group */}
              <div className="flex flex-col w-full max-w-5xl mx-auto">
                <label className="font-sans text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-widest mb-1.5 select-none">
                  Ask a ruling question
                </label>
                <div className="relative flex items-center w-full rounded-2xl border border-border-warm bg-card-warm p-1.5 shadow-sm focus-within:border-brand-gold transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask a new question to weigh juristic opinions..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-grow bg-transparent h-14 px-5 text-sm md:text-base lg:text-lg text-text-primary font-serif font-semibold placeholder-text-secondary/60 focus:outline-none disabled:opacity-50"
                  />
                  {inputVal && (
                    <button
                      type="button"
                      onClick={() => setInputVal("")}
                      className="text-text-secondary hover:text-text-primary p-3 mr-1 cursor-pointer"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || isSubmitting}
                    className="h-12 px-6 bg-brand-green hover:bg-brand-green-dark text-white dark:text-black rounded-xl text-xs lg:text-sm font-bold flex items-center gap-2 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {/* Evaluate Sparkle Icon */}
                    <svg className="h-4.5 w-4.5 lg:h-5 lg:w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904ZM18 10.5l-.5 2.5-.5-2.5-2.5-.5 2.5-.5.5-2.5.5 2.5 2.5.5-2.5.5ZM21 6l-.25 1.25-.25-1.25L19.25 5.5l1.25-.25.25-1.25.25 1.25 1.25.25-1.25.25Z" />
                    </svg>
                    <span>{isSubmitting ? "Weighing..." : "Evaluate"}</span>
                  </button>
                </div>
              </div>

              {/* Selector Dropdowns Group */}
              <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-5 text-sm text-text-secondary max-w-5xl mx-auto w-full">
                {/* Madhhab Selector */}
                <div className="flex items-center gap-2 bg-background/25 border border-border-warm/65 hover:border-brand-gold/40 hover:bg-background/40 transition-all rounded-xl px-4 py-2.5 lg:px-4.5 lg:py-3 shadow-sm">
                  <span className="font-sans text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-wider mr-1 select-none">Madhhab</span>
                  <select
                    value={madhhab}
                    onChange={(e) => setMadhhab(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-transparent font-sans font-bold text-text-primary focus:outline-none cursor-pointer text-xs lg:text-sm disabled:opacity-50"
                  >
                    <option value="Shafi'i">Shafi'i</option>
                    <option value="Hanafi">Hanafi</option>
                    <option value="Maliki">Maliki</option>
                    <option value="Hanbali">Hanbali</option>
                  </select>
                </div>

                {/* Source Set Selector */}
                <div className="flex items-center gap-2 bg-background/25 border border-border-warm/65 hover:border-brand-gold/40 hover:bg-background/40 transition-all rounded-xl px-4 py-2.5 lg:px-4.5 lg:py-3 shadow-sm">
                  <span className="font-sans text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-wider mr-1 select-none">Sources</span>
                  <select
                    value={sourceSet}
                    onChange={(e) => setSourceSet(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-transparent font-sans font-bold text-text-primary focus:outline-none cursor-pointer text-xs lg:text-sm disabled:opacity-50"
                  >
                    <option value="Qur'an & Sunnah + Fiqh">Qur&apos;an &amp; Sunnah + Fiqh</option>
                    <option value="Primary Sources Only">Primary Sources Only</option>
                    <option value="Juristic Analogy (Qiyas)">Juristic Analogy (Qiyas)</option>
                    <option value="Public Interest (Maslahah)">Public Interest (Maslahah)</option>
                  </select>
                </div>

                {/* Strictness Filter */}
                <div className="flex items-center gap-2 bg-background/25 border border-border-warm/65 hover:border-brand-gold/40 hover:bg-background/40 transition-all rounded-xl px-4 py-2.5 lg:px-4.5 lg:py-3 shadow-sm">
                  <span className="font-sans text-[10px] md:text-xs uppercase font-extrabold text-brand-gold tracking-wider mr-1 select-none">Strictness</span>
                  <select
                    value={strictness}
                    onChange={(e) => setStrictness(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-transparent font-sans font-bold text-text-primary focus:outline-none cursor-pointer text-xs lg:text-sm disabled:opacity-50"
                  >
                    <option value="Moderate">Moderate</option>
                    <option value="Strict">Strict (Azeemah)</option>
                    <option value="Concessive">Concessive (Rukhshah)</option>
                  </select>
                </div>

                {/* Slider Options Button */}
                <button
                  type="button"
                  onClick={() => alert("Custom derivation parameters opened.")}
                  className="bg-background/25 border border-border-warm/65 hover:border-brand-gold/40 hover:bg-background/40 transition-all rounded-xl p-3.5 lg:p-4 flex items-center justify-center shrink-0 cursor-pointer text-brand-gold shadow-sm"
                  title="Derivation Parameters"
                >
                  {/* Slider Icon */}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Premium Loading Overlay for Juristic Resolution */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-5 select-none">
              <div className="relative h-20 w-20 flex items-center justify-center">
                {/* Glowing spinner ring */}
                <div className="absolute inset-0 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
                {/* Floating scale icon */}
                <svg className="h-7 w-7 text-brand-gold animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 1 1 0 7.5m0-7.5a3.75 3.75 0 1 0 0 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25m-13.5 0v3a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-3" />
                </svg>
              </div>
              <div className="flex flex-col items-center text-center gap-2 max-w-sm px-6">
                <span className="font-serif font-bold text-base text-text-primary tracking-wide animate-pulse">
                  Tarjih Derivation Engine
                </span>
                <span className="text-xs text-brand-gold font-bold font-serif min-h-[1.5rem]">
                  {loadingStep}
                </span>
                <p className="text-[10px] text-text-secondary leading-relaxed mt-2">
                  Constructing high-fidelity reasoning graph and assessing textual anchors. This may take up to a few seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
