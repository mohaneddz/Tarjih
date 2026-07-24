/**
 * Qawa'id fiqhiyya — the legal maxims.
 *
 * Maxims are inductive summaries of many particular rulings, not texts in
 * their own right, so they rank below an explicit text on the same question.
 * They earn their place by reaching questions no text addresses directly.
 */

import type { KbEntry } from "../entry";

export const QAWAID: KbEntry[] = [
  {
    id: "qaida:la-darar",
    /*
     * la darar wa la dirar — no harm may be inflicted or reciprocated.
     *
     * The broadest maxim in the KB and the one most likely to fire wrongly.
     * It is stated flatly here (harm implies prohibition) which is stronger
     * than the fiqh actually is: real application weighs the harm against
     * countervailing benefit and against greater harms. The tarjih layer does
     * that weighing, so this clause deliberately produces a *defeasible*
     * derivation rather than trying to encode the balancing itself.
     */
    clause: "ruling(Act, haram) :- causes(Act, darar).",
    evidence: {
      kind: "qaida",
      reference: "la darar wa la dirar — Sunan Ibn Majah 2341, al-Muwatta 31:31",
      text: "There shall be no harm inflicted, nor harm reciprocated.",
      textArabic: "لا ضرر ولا ضرار",
      grade: "hasan",
      thubut: "zanni",
      dalala: "zanni",
      notes:
        "Transmitted through several chains, each with some weakness, but " +
        "strengthened to hasan by their number. Universally received in " +
        "practice as a foundational maxim.",
    },
  },

];

/*
 * Deliberately not yet included: al-yaqin la yazul bi'l-shakk (certainty is
 * not removed by doubt) and its corollary al-asl fi'l-ashya' al-ibaha (the
 * default in things is permissibility).
 *
 * Both are presumptive principles: they say what holds *in the absence of*
 * evidence to the contrary. Expressing that needs negation-as-failure, which
 * this engine does not have — and adding it would be the wrong fix. Under
 * negation-as-failure, "nothing in the KB forbids this" silently becomes
 * "this is permitted", so the engine's answer would depend on the corpus
 * being complete. It is not complete and never will be, and a tool that
 * quietly converts its own gaps into permissions is dangerous in a way that
 * returning no answer is not.
 *
 * The right implementation is an explicit exhaustiveness check at the query
 * layer — establish that the relevant sources were searched, then apply the
 * presumption as a visible step the user can see and disagree with. That
 * belongs with the tarjih layer, not here.
 */
