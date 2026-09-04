import React from "react";

interface Row {
  readonly label: string;
  readonly chatbot: string;
  readonly tarjih: string;
}

const ROWS: readonly Row[] = [
  { label: "How a ruling is reached", chatbot: "Predicted from training data", tarjih: "Derived by explicit rule against a cited knowledge base" },
  { label: "Citations", chatbot: "Can be invented, wrong, or unverifiable", tarjih: "Every clause traces to a real, graded source" },
  { label: "Missing coverage", chatbot: "Guesses an answer anyway", tarjih: "Reports the gap instead of guessing" },
  { label: "Conflicting opinions", chatbot: "Picks one, usually without saying why", tarjih: "Shows both paths and the rule that weighed them" },
  { label: "Can you check its work?", chatbot: "Only by asking it to explain itself", tarjih: "Yes — an inspectable reasoning tree, every time" },
];

/**
 * Contrasts the engine against a plain LLM chatbot, making concrete why the
 * hybrid architecture (see Architecture section) exists rather than just
 * asking a model directly.
 */
export function Comparison() {
  return (
    <section className="py-16 border-t border-border-warm/60">
      <div className="mx-auto max-w-[92rem] px-6">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-1">Not another chatbot</h2>
        <div className="w-10 h-0.5 bg-brand-red mb-8" />

        <div className="overflow-x-auto rounded-2xl border border-border-warm">
          <table className="w-full border-collapse text-sm min-w-[640px]">
            <thead>
              <tr className="bg-card-warm">
                <th className="text-left font-bold text-text-secondary uppercase tracking-widest text-[11px] px-5 py-4 w-1/3">
                </th>
                <th className="text-left font-bold text-text-secondary uppercase tracking-widest text-[11px] px-5 py-4">
                  A generic LLM chatbot
                </th>
                <th className="text-left font-bold text-brand-red uppercase tracking-widest text-[11px] px-5 py-4">
                  Tarjih
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-card-warm/40"}>
                  <td className="px-5 py-4 font-semibold text-text-primary align-top">{row.label}</td>
                  <td className="px-5 py-4 text-text-secondary align-top">{row.chatbot}</td>
                  <td className="px-5 py-4 text-text-primary align-top font-medium">{row.tarjih}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
