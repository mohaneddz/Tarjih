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
      reference: "Sahih al-Bukhari 304, Sahih Muslim 335",
      text:
        "Is it not the case that when a woman menstruates she neither prays " +
        "nor fasts?",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "A mani', not a rukhsa. The distinction is the point of modelling it " +
        "separately: a concession permits the lighter option, an impediment " +
        "removes the heavier one altogether, so the ruling is not that she may " +
        "omit the fast but that she must.",
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
