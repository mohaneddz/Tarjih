/**
 * Usul al-fiqh: the derivation rules themselves.
 *
 * These are the clauses that let the engine reach a ruling no text states
 * directly, and they are the most dangerous clauses in the KB — one careless
 * rule over-generalises across the entire corpus. Each carries the conditions
 * the usulis actually place on it.
 */

import type { KbEntry } from "../entry";

export const USUL: KbEntry[] = [
  {
    id: "usul:qiyas",
    /*
     * Qiyas: the ruling of an established case transfers to a new case that
     * shares its effective cause.
     *
     * Three guards, each doing real work:
     *
     * - `illah`, never `hikma`. The analogy runs on the manifest, constant
     *   attribute the ruling turns on, not on the ruling's underlying wisdom.
     *   Date wine and grape wine share intoxication; they do not share a
     *   measurable quantum of "preserving the intellect".
     * - `generalisable(Asl)` must be asserted. A ruling that was a concession
     *   to a particular person or occasion cannot found an analogy, and with
     *   no negation-as-failure this guard fails closed: silence forbids the
     *   analogy rather than permitting it.
     * - New must differ from Asl. Not written as a condition because the
     *   prover's variant loop check already handles it — deriving
     *   ruling(X, H) from ruling(X, H) is a variant of its own parent goal.
     *   That also rules out circular chains of analogy at any length.
     */
    clause:
      "ruling(New, H) :- illah(New, Illa), illah(Asl, Illa), generalisable(Asl), ruling(Asl, H).",
    evidence: {
      kind: "qiyas",
      reference: "Qiyas (analogical extension)",
      dalala: "zanni",
      notes:
        "Analogy yields a probable indication, not a certain one. A derivation " +
        "resting on this clause loses to one resting on an explicit text about " +
        "the same act.",
    },
  },

  {
    id: "usul:darura-lifts-prohibition",
    /*
     * al-darurat tubih al-mahzurat — necessity renders the forbidden
     * permissible. Grounded in Qur'an 2:173, not a free-standing principle.
     *
     * Three body goals, and the third is the one that keeps this rule honest.
     *
     * `excepted` and `necessity` between them say only that starvation *is* a
     * darura and that it *would* excuse this act — both timeless facts about
     * the law, true whether or not anyone is starving. On their own they fired
     * for every question about a forbidden food, so "is pork permitted?"
     * answered "permitted", which is the exact opposite of the ruling and the
     * single worst thing this engine could get wrong.
     *
     * `circumstance(Reason)` is the missing premise: it holds only when the
     * asker's own situation was stated in the question, and it is never
     * stored in the KB. The gap between real necessity and mere difficulty is
     * the entire substance of the rule, so the engine will not infer it — and
     * because the premise comes from the asker rather than a text, the proof
     * tree shows it as theirs.
     */
    clause:
      "ruling(Act, mubah) :- excepted(Act, Reason), necessity(Reason), circumstance(Reason).",
    evidence: {
      kind: "usul",
      reference: "al-darurat tubih al-mahzurat",
      dalala: "qati",
      notes:
        "The concession lasts only while the necessity lasts and reaches only " +
        "as far as it requires (al-darura tuqaddar bi-qadariha). The engine " +
        "models whether the concession applies, not how far it extends.",
    },
  },

  {
    id: "usul:mashaqqa-brings-facility",
    /*
     * al-mashaqqa tajlib al-taysir — hardship brings facility.
     *
     * The sibling of the darura rule above, and deliberately not merged with
     * it. Both take an `excepted` pairing and a matching `circumstance`, but
     * they gate on different things and license different things:
     *
     * - darura is a threat to one of the five essentials, and suspends a
     *   prohibition. Starvation makes carrion lawful.
     * - mashaqqa is difficulty beyond what an act ordinarily costs, and
     *   attaches a lighter alternative to an obligation. Travel does not make
     *   anything forbidden lawful; it shortens a prayer.
     *
     * Collapsing them into one rule keyed on "some hard situation" would let
     * ordinary inconvenience excuse the forbidden, which is the confusion the
     * usulis spend the most effort forestalling — hence the explicit
     * `ghayr_mutada` guard, since hardship the act inherently carries
     * (mu'tada, in the transliteration) is the reason for the obligation, not an excuse from it.
     */
    clause:
      "ruling(Act, mubah) :- excepted(Act, Situation), hardship(Situation, ghayr_mutada), circumstance(Situation).",
    evidence: {
      kind: "qaida",
      reference: "al-mashaqqa tajlib al-taysir",
      text: "Hardship brings facility.",
      textArabic: "المشقة تجلب التيسير",
      dalala: "zanni",
      notes:
        "Inductive from the concessions the texts grant — the shortened " +
        "prayer, the deferred fast, dry ablution — rather than a text in its " +
        "own right, so a derivation resting on it loses to one resting on a " +
        "verse that names the same concession directly.",
    },
  },
];
