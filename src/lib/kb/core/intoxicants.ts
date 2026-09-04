/**
 * Intoxicants — the domain the machinery of qiyas was built for.
 *
 * Worth reading as a worked example of the discipline the rest of the KB is
 * written under, because it contains all three ways a ruling can arrive:
 *
 * - Qur'an 5:90 names khamr and forbids it. A clause states exactly that.
 * - Muslim 2003 generalises by definition — "every intoxicant is khamr" — so
 *   the rule keyed on the `muskir` attribute is still an explicit text, not an
 *   analogy, and is graded as one.
 * - A substance the texts never mention reaches the same ruling only through
 *   `usul:qiyas`, on an 'illa this file has to assert as a separate,
 *   separately-weighed juristic judgement. That derivation is visibly weaker
 *   in the proof, which is the correct outcome and the reason the two are not
 *   collapsed into one convenient rule.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const INTOXICANTS: KbEntry[] = [
  // -------------------------------------------------------------------------
  // The naming text
  // -------------------------------------------------------------------------
  {
    id: "quran:5-90:khamr",
    clause: "ruling(consume(khamr), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:90",
      text:
        "O you who believe, intoxicants, gambling, idols and divining arrows are " +
        "but defilement from the work of Satan, so avoid it, that you may succeed.",
      textArabic:
        "يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ فَاجْتَنِبُوهُ",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "The prohibition of khamr is one of the few rulings agreed to be " +
        "certain in both transmission and indication: 'rijs' plus the " +
        "imperative to avoid leaves no room for reading it as mere dislike.",
    },
  },
  {
    id: "quran:5-90:illah",
    clause: "illah(consume(khamr), iskar).",
    evidence: {
      kind: "usul",
      reference: "Identification of the 'illa in Qur'an 5:90",
      dalala: "zanni",
      notes:
        "The effective cause is intoxication, not the substance. Recorded as " +
        "its own clause because identifying an 'illa is a juristic judgement " +
        "rather than something the verse states, and every analogy built on it " +
        "should inherit that uncertainty rather than the verse's certainty.",
    },
  },
  {
    id: "quran:5-90:hikma",
    clause: "hikma(prohibit(khamr), preservation_of_intellect).",
    evidence: {
      kind: "usul",
      reference: "The maqsid served by the prohibition of khamr",
      dalala: "zanni",
      notes:
        "Recorded separately from the 'illa and deliberately not usable by " +
        "qiyas. The wisdom is the protection of the intellect, which is not " +
        "measurable in a given case — one glass may impair nobody — whereas " +
        "intoxication is manifest and constant. Reasoning from the wisdom " +
        "instead would extend the prohibition to anything arguably dulling.",
    },
  },
  {
    id: "quran:5-90:generalisable",
    clause: "generalisable(consume(khamr)).",
    evidence: {
      kind: "usul",
      reference: "The prohibition of khamr is not a personal concession",
      notes:
        "Addressed to the believers at large and tied to no occasion, so it " +
        "may serve as the source case of an analogy.",
    },
  },

  // -------------------------------------------------------------------------
  // The generalising text
  // -------------------------------------------------------------------------
  {
    id: "muslim:2003:every-intoxicant",
    /*
     * This is a definition, not an analogy. The hadith does not say "treat
     * other intoxicants like khamr"; it says they *are* khamr, which brings
     * them under 5:90 directly. Modelling it as qiyas would understate the
     * ruling on every intoxicant named by no verse.
     */
    clause: "ruling(consume(Substance), haram) :- attribute(Substance, muskir).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 2003, Sunan Abi Dawud 3679",
      text: "Every intoxicant is khamr, and every khamr is forbidden.",
      textArabic: "كل مسكر خمر وكل خمر حرام",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "Definitional in force: it settles what counts as khamr rather than " +
        "extending a ruling to something outside it. Its indication is certain " +
        "because 'every' admits no exception.",
    },
  },
  {
    id: "abudawud:3681:small-amount",
    clause: "ruling(consume(Portion), haram) :- instance_of(Portion, small_measure_of_muskir).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 3681, Jami' at-Tirmidhi 1865",
      text: "Whatever intoxicates in a large amount, a small amount of it is forbidden.",
      textArabic: "ما أسكر كثيره فقليله حرام",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      notes:
        "Specific (khass) against the general rule: it addresses quantity in " +
        "particular, closing the reading that only the intoxicating dose is " +
        "forbidden. An ahad report, so its transmission is probable even though " +
        "what it indicates is not.",
    },
  },

  // -------------------------------------------------------------------------
  // Substances
  // -------------------------------------------------------------------------
  {
    id: "tax:khamr-muskir",
    clause: "attribute(khamr, muskir).",
    evidence: { ...definitional, notes: "Grape wine, the substance the verse names." },
  },
  {
    id: "tax:nabidh-muskir",
    clause: "attribute(nabidh, muskir).",
    evidence: {
      ...definitional,
      notes:
        "Date or raisin infusion, once it has fermented to the point of " +
        "intoxicating. Brought under the prohibition by Muslim 2003 directly " +
        "rather than by analogy.",
    },
  },
  {
    id: "tax:beer-muskir",
    clause: "attribute(beer, muskir).",
    evidence: { ...definitional },
  },
  {
    id: "tax:spirits-muskir",
    clause: "attribute(spirits, muskir).",
    evidence: { ...definitional, notes: "Distilled liquor." },
  },
  {
    id: "tax:sip-of-khamr",
    clause: "instance(sip_of_khamr, small_measure_of_muskir).",
    evidence: {
      ...definitional,
      notes: "A quantity below the intoxicating dose — the case Abu Dawud 3681 addresses.",
    },
  },

  // -------------------------------------------------------------------------
  // A case no text names: reached only by analogy, and weighed as such
  // -------------------------------------------------------------------------
  {
    id: "illah:narcotic",
    /*
     * Deliberately asserted as a shared 'illa rather than as
     * `attribute(narcotic, muskir)`.
     *
     * The difference is the whole point. Calling it muskir would route it
     * through Muslim 2003 and hand it the certainty of an explicit text.
     * Asserting the 'illa instead routes it through `usul:qiyas`, so the proof
     * shows an analogy, the chain inherits that clause's zanni indication, and
     * the ruling presents as what it is: the majority position, derived, and
     * weaker in kind than the ruling on wine.
     */
    clause: "illah(consume(narcotic), iskar).",
    evidence: {
      kind: "usul",
      reference: "Shared 'illa: intoxication",
      dalala: "zanni",
      notes:
        "No text names these substances. The majority hold that they share " +
        "khamr's effective cause — the covering of the intellect — and take " +
        "its ruling by analogy. Recorded as an identification, not a fact.",
    },
  },
];
