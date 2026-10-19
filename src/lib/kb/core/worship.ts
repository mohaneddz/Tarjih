/**
 * 'Ibadat — the concessions attached to prayer, fasting and purification.
 *
 * The domain that most needs `circumstance/1`, and the clearest illustration
 * of why it exists. Almost nothing here is a ruling about an act in the
 * abstract: shortening the prayer is licensed for a traveller and not for
 * anyone else, breaking the fast is permitted to the ill and obligatory for
 * the menstruating, dry ablution substitutes for water only when there is no
 * water. A KB that stated these as flat facts about the acts would tell every
 * asker they may skip the fast.
 *
 * Two distinct concession mechanisms, kept apart because the fiqh keeps them
 * apart and they license different things:
 *
 * - darura (see usul.ts) — a threat to one of the five essentials, which
 *   suspends a prohibition outright.
 * - mashaqqa ghayr mu'tada — hardship beyond what an act ordinarily costs,
 *   which does not suspend a prohibition but attaches a lighter alternative
 *   to an obligation.
 *
 * Collapsing them would let ordinary difficulty excuse the forbidden, which
 * is the failure mode the jurists spend the most ink guarding against.
 */

import type { KbEntry } from "../entry";

export const WORSHIP: KbEntry[] = [
  // -------------------------------------------------------------------------
  // The obligations the concessions below relax
  //
  // Without these the concessions had nothing to be concessions *from*. "May
  // I skip the fast while travelling?" came back "permitted" with no record
  // that skipping it is otherwise forbidden, so the answer read as the
  // ruling on the act rather than as a rukhsa — and the engine could not
  // answer "must I pray?" at all.
  // -------------------------------------------------------------------------
  {
    id: "quran:4-103:prayer-obligatory",
    clause: "ruling(perform(obligatory_prayer), wajib).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:103, Qur'an 2:43",
      text: "Indeed, prayer has been decreed upon the believers a decree of specified times.",
      textArabic: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "Known of the religion by necessity (ma'lum min al-din bi'l-darura). " +
        "General in its subject: it addresses the believers at large, which is " +
        "what lets a text about a particular situation qualify it.",
    },
  },
  {
    id: "quran:2-183:fasting-obligatory",
    clause: "ruling(perform(fasting), wajib).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:183",
      text: "O you who have believed, decreed upon you is fasting as it was decreed upon those before you.",
      textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "The very next verse (2:184) carves out the ill and the traveller, which " +
        "is why the two are recorded as general and specific respectively.",
    },
  },
  {
    id: "usul:omitting-wajib-is-haram",
    /*
     * The opposite of an obligation is forbidden: leaving what is wajib is
     * sinful, which is what makes it wajib rather than mandub (see the gloss
     * on `wajib` in ontology.ts). Stated as a rule rather than as a fact per
     * obligation so that every obligation the KB learns gets its omission
     * covered, and so that a concession or impediment on the omission meets
     * this general prohibition head-on — where the murajjihat, not clause
     * order, decide between them.
     */
    clause: "ruling(omit(Act), haram) :- ruling(perform(Act), wajib).",
    evidence: {
      kind: "usul",
      reference: "al-amr bi'l-shay' nahy 'an diddih",
      dalala: "qati",
      notes:
        "A command to do something entails forbidding its omission. Certain in " +
        "indication because it follows from what wajib means.",
    },
  },

  // -------------------------------------------------------------------------
  // Travel: the shortened prayer
  // -------------------------------------------------------------------------
  {
    id: "quran:4-101:shorten-prayer",
    clause: "excepted(shorten(obligatory_prayer), travel).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:101",
      text:
        "And when you travel throughout the land, there is no blame upon you " +
        "for shortening the prayer.",
      textArabic: "وَإِذَا ضَرَبْتُمْ فِي الْأَرْضِ فَلَيْسَ عَلَيْكُمْ جُنَاحٌ أَن تَقْصُرُوا مِنَ الصَّلَاةِ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Addressed to the traveller in particular. Recorded as an exception " +
        "attached to a situation rather than as a ruling on the act, because " +
        "the act is only licensed for someone actually in that situation.",
    },
  },
  {
    id: "fact:travel-is-hardship",
    clause: "hardship(travel, ghayr_mutada).",
    evidence: {
      kind: "usul",
      reference: "Travel as mashaqqa beyond the ordinary",
      dalala: "zanni",
      notes:
        "The concession is tied to the journey, not to whether a particular " +
        "traveller finds it difficult — the jurists fix it to the situation " +
        "precisely so it does not turn on an unmeasurable personal claim. " +
        "That the classical thresholds of distance and duration are not " +
        "modelled here is a real gap.",
    },
  },

  // -------------------------------------------------------------------------
  // Illness and travel: the fast
  // -------------------------------------------------------------------------
  {
    id: "quran:2-184:break-fast-travel",
    clause: "excepted(omit(fasting), travel).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:184",
      text:
        "So whoever among you is ill or on a journey, then an equal number of " +
        "other days.",
      textArabic: "فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ عَلَىٰ سَفَرٍ فَعِدَّةٌ مِّنْ أَيَّامٍ أُخَرَ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "The concession is a deferral, not a cancellation: the days are made " +
        "up. The engine models whether the concession applies, not what it " +
        "leaves owed, which is a limitation worth stating rather than hiding.",
    },
  },
  {
    id: "quran:2-184:break-fast-illness",
    clause: "excepted(omit(fasting), illness).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:184",
      text: "So whoever among you is ill or on a journey, then an equal number of other days.",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "quran:2-184:travel-excuses-fast",
    /*
     * The verse names the traveller itself, so the concession is keyed on it
     * directly — the same reasoning as tayammum below: the jurists cite the
     * verse for it, not the maxim. The maxim route stays as corroboration,
     * and now holds on its own too: it once carried the maxim's probable
     * indication into a contest with 2:183 on dalala before specificity was
     * consulted, until reconciliation (jam') was ordered ahead of certainty
     * in murajjih.ts.
     */
    clause: "ruling(omit(fasting), mubah) :- circumstance(travel).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:184",
      text: "So whoever among you is ill or on a journey, then an equal number of other days.",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "quran:2-184:illness-excuses-fast",
    clause: "ruling(omit(fasting), mubah) :- circumstance(illness).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:184",
      text: "So whoever among you is ill or on a journey, then an equal number of other days.",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "fact:illness-is-hardship",
    clause: "hardship(illness, ghayr_mutada).",
    evidence: {
      kind: "usul",
      reference: "Illness as mashaqqa beyond the ordinary",
      dalala: "zanni",
    },
  },

  // -------------------------------------------------------------------------
  // Purification
  // -------------------------------------------------------------------------
  {
    id: "muslim:224:purity-condition",
    clause: "condition(obligatory_prayer, purity).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 224",
      text: "No prayer is accepted without purification, nor charity from misappropriated wealth.",
      textArabic: "لا تقبل صلاة بغير طهور",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "A shart, not a ruling: it says what the prayer requires to be valid, " +
        "which is a declaratory statement and belongs on the validity axis.",
    },
  },
  {
    id: "muslim:224:impurity-voids",
    clause: "validity(perform(obligatory_prayer), batil) :- condition(obligatory_prayer, purity), circumstance(ritual_impurity).",
    evidence: {
      kind: "ijma",
      reference: "Consensus on the effect of an unmet shart",
      thubut: "qati",
      dalala: "qati",
      notes:
        "An act whose condition is absent is void in its essence, not merely " +
        "defective. Stated as a rule over `condition/2` rather than as a bare " +
        "fact about prayer so that the reasoning — this is a condition, the " +
        "condition is unmet, therefore void — is visible in the proof.",
    },
  },
  {
    id: "quran:4-43:tayammum-no-water",
    clause: "ruling(perform(tayammum), mubah) :- circumstance(water_unavailable).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:43, Qur'an 5:6",
      text:
        "And if you are ill or on a journey, or one of you comes from relieving " +
        "himself, or you have contacted women and find no water, then seek clean " +
        "earth and wipe your faces and your hands with it.",
      textArabic: "فَلَمْ تَجِدُوا مَاءً فَتَيَمَّمُوا صَعِيدًا طَيِّبًا",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Keyed directly on the situation rather than routed through the " +
        "hardship rule: the verse names the absence of water itself as the " +
        "trigger, so nothing is gained by inferring it from a general maxim, " +
        "and something is lost — the derivation would present as weaker than " +
        "the plain text it actually rests on.",
    },
  },
  {
    id: "quran:5-6:tayammum-illness",
    clause: "ruling(perform(tayammum), mubah) :- circumstance(illness).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:6",
      text: "And if you are ill or on a journey … and find no water, then seek clean earth.",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },

  // -------------------------------------------------------------------------
  // An impediment, which does more than excuse
  // -------------------------------------------------------------------------
  {
    id: "bukhari:304:menstruation-impediment",
    clause: "impediment(fasting, menstruation).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 304, Sahih Muslim 79",
      text:
        "Is it not the case that when a woman menstruates she neither prays " +
        "nor fasts?",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      /*
       * Specific to the menstruating woman. Marked so because it has to
       * qualify the general obligation in 2:183: unmarked, the specificity
       * rule tied and directness handed the question to the verse, telling
       * a menstruating woman she must fast.
       */
      scope: "khass",
      notes:
        "A mani', not a rukhsa. The distinction is the point of modelling it " +
        "separately: a concession permits the lighter option, an impediment " +
        "removes the heavier one altogether, so the ruling is not that she may " +
        "omit the fast but that she must.",
    },
  },
  {
    id: "bukhari:304:prayer-impediment",
    clause: "impediment(obligatory_prayer, menstruation).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 304, Sahih Muslim 79",
      text:
        "Is it not the case that when a woman menstruates she neither prays " +
        "nor fasts?",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "The same report names the prayer alongside the fast. Unlike the fast, " +
        "the missed prayers are not made up (Sahih Muslim 335).",
    },
  },
  {
    id: "usul:impediment-forbids-performance",
    clause: "ruling(perform(Obligation), haram) :- impediment(Obligation, Mani), circumstance(Mani).",
    evidence: {
      kind: "usul",
      reference: "An impediment makes the blocked act unlawful to perform",
      dalala: "qati",
      notes:
        "The other half of what a mani' does. Omitting is required, so " +
        "performing is forbidden — and it meets the general obligation as a " +
        "specific text qualifying it, not as a contradiction left open.",
    },
  },
  {
    id: "usul:impediment-obliges-omission",
    clause: "ruling(omit(Obligation), wajib) :- impediment(Obligation, Mani), circumstance(Mani).",
    evidence: {
      kind: "usul",
      reference: "An impediment removes the obligation it blocks",
      dalala: "qati",
      notes:
        "Where a rukhsa would yield mubah — you may take the lighter option — " +
        "a mani' yields wajib: the act is not merely excused but no longer " +
        "lawfully performable, so omitting it is what is required.",
    },
  },
];
