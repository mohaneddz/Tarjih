import React from "react";

export interface ReasoningStatsProps {
  readonly coreClauseCount: number;
  readonly reviewedClauseCount: number;
}

const STEPS = [
  {
    label: "Ground",
    description: "Clarify the question and define the goal.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    label: "Prove",
    description: "Build a transparent proof from sources.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m11.142 0L21.75 12l-4.179-2.25M2.25 12l9.75 5.25 9.75-5.25M2.25 12l9.75-5.25 9.75 5.25M9.75 17.25V21.75M14.25 17.25V21.75" />
      </svg>
    ),
  },
  {
    label: "Weigh",
    description: "Resolve conflicts using established principles.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0-17.25a3.75 3.75 0 110 7.5m0-7.5a3.75 3.75 0 100 7.5m0-7.5v7.5m-6.75 3h13.5m-13.5 0a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25m-13.5 0v3a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-3" />
      </svg>
    ),
  },
  {
    label: "Narrate",
    description: "Deliver a verdict with reasons and citations.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

/**
 * "How Tarjih reasons" plus the honest stats band from design/home.png.
 *
 * The mockup's stats tiles read "3.2k Sources reviewed" / "1.1k Legal
 * positions" — placeholder numbers implying a corpus this project doesn't
 * have yet. These are computed from the real knowledge base instead: the
 * hand-authored core (loadCoreKb(), always available) and however many
 * formalized clauses have actually been reviewed and approved so far. Small
 * true numbers, not large invented ones — matching the section's own
 * headline, which the mockup already states honestly.
 */
export function ReasoningSteps({ coreClauseCount, reviewedClauseCount }: ReasoningStatsProps) {
  return (
    <section className="py-16 border-t border-border-warm/60">
      <div className="mx-auto max-w-[92rem] px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* How Tarjih reasons */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-1">How Tarjih reasons</h2>
          <div className="w-10 h-0.5 bg-brand-red mb-8" />
          <div className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-4">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex items-start gap-3 max-w-[180px]">
                  <span className="h-10 w-10 shrink-0 rounded-full border border-border-warm text-text-secondary flex items-center justify-center">
                    {step.icon}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-text-primary">{step.label}</p>
                    <p className="text-xs text-text-secondary leading-snug mt-0.5">{step.description}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <svg className="hidden sm:block h-4 w-4 text-text-secondary/40 self-center shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stats + editor's note */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-text-primary leading-snug">
              Small reviewed knowledge base — gaps are reported, <span className="text-brand-red">never guessed.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-card-warm border border-border-warm rounded-xl p-4">
              <svg className="h-6 w-6 text-brand-red shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <div>
                <p className="font-serif font-bold text-xl text-text-primary">{coreClauseCount}</p>
                <p className="text-xs text-text-secondary">Core clauses</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card-warm border border-border-warm rounded-xl p-4">
              <svg className="h-6 w-6 text-brand-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39 1.593 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <div>
                <p className="font-serif font-bold text-xl text-text-primary">{reviewedClauseCount}</p>
                <p className="text-xs text-text-secondary">Formalized clauses reviewed</p>
              </div>
            </div>
          </div>
          <div className="border border-dashed border-brand-red/40 rounded-xl p-4 bg-brand-red-light/30">
            <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mb-1">Editor&rsquo;s note</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              If evidence is missing or the knowledge base has no rule covering a question, Tarjih reports the gap
              instead of guessing an answer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
