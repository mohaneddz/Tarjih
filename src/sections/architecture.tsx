import React from "react";

/**
 * Explains the hybrid architecture the hero's "proof of concept" badge
 * refers to: an LLM handles natural language in and out, while a symbolic
 * expert system (a hand-authored Prolog-style knowledge base, see
 * src/lib/kb) does the actual reasoning. Neither half alone would do —
 * an LLM alone hallucinates citations, an expert system alone can't parse
 * a freeform question — which is the point being made here.
 */
export function Architecture() {
  return (
    <section className="py-16 border-t border-border-warm/60">
      <div className="mx-auto max-w-[92rem] px-6">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-1">Two systems, one answer</h2>
        <div className="w-10 h-0.5 bg-brand-red mb-3" />
        <p className="text-sm text-text-secondary max-w-2xl leading-relaxed mb-10">
          Neither half of this works alone. An LLM by itself will happily invent a citation; a symbolic reasoner by
          itself can&rsquo;t parse a freeform question. Tarjih splits the job between them on purpose.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="bg-card-warm border border-border-warm rounded-2xl p-6 flex flex-col gap-3">
            <span className="w-fit text-[11px] font-bold uppercase tracking-widest text-brand-red bg-brand-red-light rounded-full px-3 py-1">
              Modern LLM
            </span>
            <h3 className="font-serif text-lg font-bold text-text-primary">Language in, language out</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Reads your freeform question and grounds it into a formal goal the reasoner can act on, then turns the
              engine&rsquo;s verdict back into a readable explanation. It never decides the ruling itself.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center text-text-secondary/50 shrink-0">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>

          <div className="bg-card-warm border border-border-warm rounded-2xl p-6 flex flex-col gap-3">
            <span className="w-fit text-[11px] font-bold uppercase tracking-widest text-brand-green bg-brand-green-light rounded-full px-3 py-1">
              Expert System
            </span>
            <h3 className="font-serif text-lg font-bold text-text-primary">A hand-authored knowledge base</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              A Prolog-style engine derives the ruling by explicit rule against a knowledge base of citable facts —
              deterministic and inspectable, so every step of the proof tree traces back to a real source.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
