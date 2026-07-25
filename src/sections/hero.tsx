import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Hero section matching design/home.png: a plain white background, a large
 * serif headline with the key claim picked out in red, and a direct
 * statement of the mechanism rather than vague "AI-powered" marketing copy.
 */
export function Hero() {
  return (
    <section className="relative py-20 md:py-28 select-none">
      <div className="mx-auto max-w-[92rem] px-6 flex flex-col">
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight max-w-2xl leading-[1.1] text-text-primary">
          A ruling should be <span className="text-brand-red">proven,</span> not predicted.
        </h1>

        <p className="mt-6 text-sm md:text-base text-text-secondary max-w-xl leading-relaxed">
          Tarjih grounds a question into logic, <strong className="text-text-primary font-semibold">proves</strong> it
          against reviewed evidence, <strong className="text-text-primary font-semibold">weighs</strong> conflicts,
          then <strong className="text-text-primary font-semibold">narrates</strong> the decided result — with
          reasons you can inspect.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Link href="/study">
            <Button size="lg" className="text-xs md:text-sm font-bold shadow-sm hover:shadow-md">
              Examine a question
            </Button>
          </Link>
          <a href="#how-it-works" className="text-sm font-semibold text-text-primary hover:text-brand-red transition-colors flex items-center gap-1.5">
            Inspect the methodology
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </a>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full border-2 border-brand-green flex flex-col items-center justify-center text-brand-green">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39 1.593 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <span className="text-[7px] font-extrabold uppercase tracking-wider">Authentic</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
            Every citation carries a real authenticity grade. Formalized clauses stay marked
            <strong className="text-text-primary"> unreviewed</strong> until a human checks them — nothing enters a
            live answer unvetted.
          </p>
        </div>
      </div>
    </section>
  );
}
