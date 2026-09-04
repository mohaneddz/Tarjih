"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

interface PaletteItem {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly keywords?: readonly string[];
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ITEMS: readonly PaletteItem[] = [
  {
    id: "study",
    label: "Study",
    hint: "Ask a question and derive a ruling",
    href: "/study",
    keywords: ["ask", "question", "derive", "resolve"],
    icon: <NavIcon d="M8.25 4.5l7.5 7.5-7.5 7.5" />,
  },
  {
    id: "database",
    label: "Knowledge Base",
    hint: "Browse the clauses that power every ruling",
    href: "/database",
    keywords: ["kb", "clauses", "facts", "rules"],
    icon: <NavIcon d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
  },
  {
    id: "cases",
    label: "Cases",
    hint: "Worked examples of the engine in action",
    href: "/cases",
    keywords: ["examples", "worked"],
    icon: <NavIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    id: "saved",
    label: "Saved Cases",
    hint: "Rulings you've bookmarked on this device",
    href: "/saved",
    keywords: ["bookmarks", "starred"],
    icon: <NavIcon d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />,
  },
  {
    id: "settings",
    label: "Settings",
    hint: "Default madhhab and derivation strictness",
    href: "/settings",
    keywords: ["preferences", "madhhab", "strictness", "config"],
    icon: <NavIcon d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />,
  },
  {
    id: "profile",
    label: "Profile",
    hint: "Your activity on this device",
    href: "/profile",
    keywords: ["account", "activity"],
    icon: <NavIcon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  },
];

interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q))
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Wait a frame so the element exists post-mount before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function go(item: PaletteItem) {
    router.push(item.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) go(item);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl bg-card-warm border border-border-warm rounded-2xl shadow-xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border-warm">
          <svg className="h-4.5 w-4.5 text-text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Go to a page..."
            className="w-full h-14 bg-transparent text-text-primary placeholder-text-secondary/60 focus:outline-none text-sm"
          />
          <kbd className="shrink-0 text-[11px] text-text-secondary border border-border-warm rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scrollbar py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">No matches.</div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors",
                  i === activeIndex ? "bg-border-warm-light" : "hover:bg-border-warm-light/60"
                )}
              >
                <span className="h-8 w-8 rounded-lg bg-background border border-border-warm flex items-center justify-center text-text-secondary shrink-0">
                  {item.icon}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-text-primary truncate">{item.label}</span>
                  <span className="text-[12px] text-text-secondary truncate">{item.hint}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
