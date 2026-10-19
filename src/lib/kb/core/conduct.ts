/**
 * Conduct: speech, and what may be worn.
 *
 * Both are domains of general prohibitions with narrow textual exceptions,
 * and the exceptions are the reason to formalise them. "Backbiting is
 * forbidden" is something nobody needed an engine for; that it is permitted
 * to someone describing a wrong done to them, by a different verse, is the
 * part a reader can get wrong.
 *
 * Dress is the first domain where the ruling depends on who the asker is
 * rather than what they are going through. Sex is a fact about the asker, so
 * it arrives as a circumstance like any other: asked with nothing stated, the
 * engine says the ruling depends on it instead of assuming either.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const CONDUCT: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Backbiting
  // -------------------------------------------------------------------------
  {
    id: "quran:49-12:backbiting",
    clause: "ruling(speak(backbiting), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 49:12, Sahih Muslim 2589",
      text:
        "And do not backbite one another. Would one of you like to eat the " +
        "flesh of his dead brother? You would detest it.",
      textArabic: "وَلَا يَغْتَب بَّعْضُكُم بَعْضًا",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "Muslim 2589 defines it: mentioning your brother with what he would " +
        "dislike — and if it is untrue, it is slander rather than backbiting.",
    },
  },
  {
    id: "quran:4-148:complaint-of-wrong",
    clause: "ruling(speak(backbiting), mubah) :- circumstance(complaining_of_wrong).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:148",
      text: "Allah does not like the public mention of evil, except by one who has been wronged.",
      textArabic: "لَّا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ مِنَ الْقَوْلِ إِلَّا مَن ظُلِمَ",
      thubut: "qati",
      dalala: "zanni",
      scope: "khass",
      notes:
        "The first of the exceptions al-Nawawi lists in Riyad al-Salihin: the " +
        "wronged may describe the wrong to someone able to remedy it — a judge, " +
        "an authority. Probable in indication because the verse speaks of " +
        "'public mention of evil' and its reach to backbiting is a juristic " +
        "reading; it does not license telling everyone.",
    },
  },

  // -------------------------------------------------------------------------
  // Lying
  // -------------------------------------------------------------------------
  {
    id: "bukhari:6094:lying",
    clause: "ruling(speak(lie), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 6094, Sahih Muslim 2607",
      text:
        "Truthfulness leads to righteousness … and lying leads to wickedness, " +
        "and wickedness leads to the Fire.",
      textArabic: "إن الصدق يهدي إلى البر … وإن الكذب يهدي إلى الفجور",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
    },
  },
  {
    id: "muslim:2605:lying-to-reconcile",
    clause: "ruling(speak(lie), mubah) :- circumstance(reconciling_people).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 2605, Sahih al-Bukhari 2692",
      text: "He is not a liar who reconciles between people, saying good and conveying good.",
      textArabic: "ليس الكذاب الذي يصلح بين الناس فيقول خيرا وينمي خيرا",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      scope: "khass",
      notes:
        "Muslim's version adds the narrator's report of three permitted " +
        "cases: war, reconciling people, and what spouses say to each other. " +
        "Probable in indication because a group of scholars, al-Tabari among " +
        "them, read the license as covering only equivocation (tawriya) — " +
        "words true in one sense and heard in another — rather than outright " +
        "falsehood. Only reconciliation is formalised.",
    },
  },

  // -------------------------------------------------------------------------
  // Gold and silk
  // -------------------------------------------------------------------------
  {
    id: "tax:gold",
    clause: "instance(gold, gold_or_silk).",
    evidence: { ...definitional, notes: "Gold worn as jewellery or adornment, such as a ring." },
  },
  {
    id: "tax:silk",
    clause: "instance(silk, gold_or_silk).",
    evidence: { ...definitional, notes: "Garments of pure silk." },
  },
  {
    id: "tirmidhi:1720:forbidden-to-men",
    clause: "ruling(wear(Item), haram) :- instance(Item, gold_or_silk), circumstance(male).",
    evidence: {
      kind: "sunnah",
      reference: "Jami' at-Tirmidhi 1720, Sunan Abi Dawud 4057",
      text:
        "Wearing silk and gold has been forbidden to the males of my community " +
        "and permitted to its females.",
      textArabic: "حرم لباس الحرير والذهب على ذكور أمتي وأحل لإناثهم",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      notes:
        "Not marked khass, though it names men, because the exception below " +
        "has to qualify it: two specific texts tie on specificity, and the " +
        "contest would go to whichever happened to rank higher on directness.",
    },
  },
  {
    id: "tirmidhi:1720:permitted-to-women",
    clause: "ruling(wear(Item), mubah) :- instance(Item, gold_or_silk), circumstance(female).",
    evidence: {
      kind: "sunnah",
      reference: "Jami' at-Tirmidhi 1720, Sunan Abi Dawud 4057",
      text: "… and permitted to its females.",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
    },
  },
  {
    id: "bukhari:2919:silk-for-itching",
    clause: "ruling(wear(silk), mubah) :- circumstance(male), circumstance(skin_ailment).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2919, Sahih Muslim 2076",
      text:
        "The Prophet permitted 'Abd al-Rahman ibn 'Awf and al-Zubayr to wear " +
        "silk because of an itch they had.",
      textArabic: "رخص النبي لعبد الرحمن بن عوف والزبير في قميص من حرير من حكة كانت بهما",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Keyed on the situation directly rather than routed through the " +
        "hardship maxim, which in this KB never lifts a prohibition. The " +
        "jurists explain the case by a narrower principle: what is forbidden " +
        "as a means to something else is permitted for a need (ma hurrima " +
        "sadd li'l-dhari'a ubiha li'l-haja), and silk is forbidden for what it " +
        "leads to, not in itself. Malik is reported to have disallowed it " +
        "even so; the majority follow the report.",
    },
  },
];
