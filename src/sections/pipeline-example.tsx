import React from "react";
import { WeighingScale, VerdictBadge, RulingRosette } from "@/components/ui/asset-badge";

/**
 * The 5-step "how it works" illustration from design/home.png (Question ->
 * Formal Goal -> Proof Tree -> Weighing -> Verdict), walked through with one
 * real worked example rather than invented placeholder content.
 *
 * Every fact below — the grounded goal, the clause references, the
 * weighing rule and its explanation, the verdict and evidence strengths — is
 * copied from an actual run of the engine against the question "Can I eat
 * carrion if I'm starving?", verified live during this session. It is
 * static (this page does not call the LLM on every visit — that would be
 * slow and pointless for an illustration), but nothing in it is made up.
 */
export function PipelineExample() {
  const steps = [
    { n: 1, label: "Question" },
    { n: 2, label: "Formal Goal" },
    { n: 3, label: "Proof Tree" },
    { n: 4, label: "Weighing" },
    { n: 5, label: "Verdict" },
  ];

  return (
    <section id="how-it-works" className="py-4">
      <div className="mx-auto max-w-[92rem] px-6">
        {/* Step markers */}
        <div className="hidden md:flex items-center mb-6">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <span className="h-8 w-8 rounded-full bg-brand-red text-white text-sm font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <span className="text-sm font-bold text-text-primary whitespace-nowrap">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-brand-red/30 mx-2 mb-6" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* 1. Question */}
          <div className="bg-card-warm border border-border-warm rounded-2xl p-4 flex flex-col gap-2">
            <span className="h-7 w-7 rounded bg-brand-red text-white font-serif font-bold text-sm flex items-center justify-center">Q</span>
            <p className="font-serif font-semibold text-sm text-text-primary leading-snug">
              Can I eat carrion if I&rsquo;m starving?
            </p>
          </div>

          {/* 2. Formal Goal */}
          <div className="bg-card-warm border border-border-warm rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Grounded as</span>
            <code className="font-mono text-sm text-text-primary bg-background rounded-lg px-2 py-2 leading-relaxed break-words">
              ruling(consume(carrion), H), circumstance(starvation)
            </code>
            <span className="text-[12px] text-text-secondary leading-snug">
              &ldquo;I&rsquo;m starving&rdquo; becomes a stated premise, shown back to the asker.
            </span>
          </div>

          {/* 3. Proof Tree (simplified) */}
          <div className="bg-card-warm border border-border-warm rounded-2xl p-4 flex flex-col gap-1.5 text-[13px]">
            <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-1">2 conflicting derivations</span>
            <span className="text-[12px] font-bold text-text-primary">Forbidden</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-green shrink-0" />
              <span className="text-text-secondary truncate">Qur&apos;an 5:3 — forbidden foods</span>
            </div>
            <span className="text-[12px] font-bold text-text-primary mt-1">Permitted</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-green shrink-0" />
              <span className="text-text-secondary truncate">Qur&apos;an 2:173 — necessity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
              <span className="text-text-secondary truncate">al-darurat tubih al-mahzurat</span>
            </div>
          </div>

          {/* 4. Weighing */}
          <div className="bg-card-warm border border-border-warm rounded-2xl p-4 flex flex-col gap-2 text-[13px] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">Specific over general</span>
              <WeighingScale size="sm" className="opacity-80 scale-75 -mr-2 -mt-1" />
            </div>
            <p className="text-text-secondary leading-relaxed">
              2:173 is specific (khass) to the compelled person, so it qualifies the general prohibition in 5:3 instead
              of competing with it.
            </p>
            <p className="text-text-secondary/80 leading-relaxed text-[12px]">
              Both texts are certain (evidence strength 100 each), so strength can&rsquo;t decide — the weighing rule
              does.
            </p>
          </div>

          {/* 5. Verdict */}
          <div className="border-2 border-brand-red rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-card-warm/40 relative">
            <div className="flex items-center gap-1.5">
              <RulingRosette size="sm" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-text-secondary">Verdict</span>
            </div>
            <VerdictBadge verdict="permissible" size="md" showLabel={false} />
            <span className="font-serif text-lg font-bold text-brand-red">Permitted</span>
            <span className="text-[12px] text-text-secondary leading-snug">
              a concession for the starving; without that premise the ruling is Forbidden
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-text-secondary">
          <span>[1] Qur&apos;an 5:3</span>
          <span>[2] Qur&apos;an 2:173</span>
          <span>[3] al-darurat tubih al-mahzurat (usul al-fiqh)</span>
        </div>
      </div>
    </section>
  );
}
