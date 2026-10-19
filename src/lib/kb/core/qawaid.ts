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
      reference: "la darar wa la dirar — Sunan Ibn Majah 2341, al-Muwatta 36:31",
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

  // -------------------------------------------------------------------------
  // al-umur bi-maqasidiha — matters are judged by their aims
  //
  // The maxim's best-settled consequence: an act of worship without the
  // intention to perform it is not that act of worship. Going without food
  // all day is not a fast unless it was meant as one. The intention itself is
  // a fact about the asker, so it arrives as a circumstance; the KB says only
  // which acts require it.
  // -------------------------------------------------------------------------
  {
    id: "bukhari:1:intention-condition",
    clause: "condition(Act, intention) :- instance(Act, ibada).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1, Sahih Muslim 1907",
      text: "Actions are only by intentions, and every person shall have only what he intended.",
      textArabic: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "Probable in indication, because the report needs a word supplied — " +
        "actions are *valid* by intentions, or *rewarded* by them. The " +
        "majority supply validity. The Hanafis supply reward for acts that are " +
        "only means, which is why wudu is not in the class below: for them it " +
        "is sound without intention. For the acts that are listed, every " +
        "school requires it.",
    },
  },
  {
    id: "qaida:no-intention-voids-worship",
    clause: "validity(perform(Act), batil) :- condition(Act, intention), circumstance(no_intention).",
    evidence: {
      kind: "ijma",
      reference: "al-umur bi-maqasidiha",
      text: "Matters are judged by their aims.",
      textArabic: "الأمور بمقاصدها",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The same shape as the purity rule in worship.ts: a condition, the " +
        "asker's statement that it was unmet, and the act void in its essence.",
    },
  },
  {
    id: "tax:prayer-is-ibada",
    clause: "instance(obligatory_prayer, ibada).",
    evidence: { kind: "ontology", reference: "Definitional" },
  },
  {
    id: "tax:fasting-is-ibada",
    clause: "instance(fasting, ibada).",
    evidence: { kind: "ontology", reference: "Definitional" },
  },

  // -------------------------------------------------------------------------
  // al-darura tuqaddar bi-qadariha — necessity is measured by its extent
  // -------------------------------------------------------------------------
  {
    id: "quran:2-173:no-more-than-need",
    /*
     * The first piece of the concession's *extent* the engine can state. The
     * darura rule in usul.ts makes eating carrion lawful to the starving; it
     * says nothing about how much. This clause reaches what lies past the
     * need, and because no `excepted` pairing covers it, nothing lifts it —
     * the starving asker who asks about eating their fill is told it is
     * forbidden, by the same verse that granted the concession.
     */
    clause: "ruling(consume_beyond_need(Food), haram) :- instance_of(Food, forbidden_food).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:173",
      text:
        "But whoever is compelled by necessity, neither craving it nor " +
        "exceeding the limit, there is no sin upon him.",
      textArabic: "فَمَنِ اضْطُرَّ غَيْرَ بَاغٍ وَلَا عَادٍ فَلَا إِثْمَ عَلَيْهِ",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["hanafi", "shafii", "hanbali"],
      notes:
        "Probable in indication: 'neither craving nor exceeding' is read by the " +
        "majority as a limit on quantity — what keeps one alive, sadd al-ramaq " +
        "— while the Shafi'is also read 'ghayra baghin' as excluding a journey " +
        "undertaken in sin. Malik permitted eating to satiety and carrying " +
        "provision where the necessity is expected to last, which this clause " +
        "does not model.",
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
