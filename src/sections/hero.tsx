import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthenticStamp, WeighingScale } from "@/components/ui/asset-badge";

/**
 * Hero section matching design/home.png: a plain white background, a large
 * serif headline with the key claim picked out in red, and a direct
 * statement of the mechanism rather than vague "AI-powered" marketing copy.
 */
export function Hero() {
  return (
    <section className="relative py-20 md:py-28 select-none overflow-hidden">
      <div className="mx-auto max-w-[92rem] px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
        <div className="flex-1 flex flex-col">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-brand-red/30 bg-brand-red-light px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-red">
              Proof of concept — an Expert System paired with a modern LLM
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight max-w-2xl leading-[1.1] text-text-primary">
            A ruling should be <span className="text-brand-red">proven,</span> not predicted.
          </h1>

          <p className="mt-6 text-sm md:text-base text-text-secondary max-w-xl leading-relaxed">
            An LLM turns your question into a formal goal; a symbolic expert system
            <strong className="text-text-primary font-semibold"> proves</strong> it against reviewed evidence and
            <strong className="text-text-primary font-semibold"> weighs</strong> conflicts by explicit rule, not
            probability — then the LLM <strong className="text-text-primary font-semibold">narrates</strong> the
            decided result, with reasons you can inspect.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Link href="/study">
              <Button size="lg" className="text-sm md:text-sm font-bold shadow-sm hover:shadow-md">
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
            <AuthenticStamp size="md" showLabel={false} />
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              Every citation carries a real authenticity grade. Formalized clauses stay marked
              <strong className="text-text-primary"> unreviewed</strong> until a human checks them — nothing enters a
              live answer unvetted.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center p-6 bg-card-warm/50 border border-border-warm/60 rounded-3xl backdrop-blur-xs shadow-sm shrink-0">
          <WeighingScale size="lg" className="opacity-90" />
        </div>
      </div>
    </section>
  );
}
