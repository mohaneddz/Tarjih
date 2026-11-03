/**
 * Fasting beyond the Ramadan obligation and its travel and illness
 * concessions (those live in worship.ts): what does and does not break a
 * fast, who else may leave it, and the days on which fasting is recommended,
 * disliked or forbidden.
 *
 * Two questions here have answers on both axes. "I ate by mistake while
 * fasting" is not asking whether eating is permitted — it is asking whether
 * the fast still counts, which is a validity question; and fasting on the day
 * of Eid is both forbidden to undertake and of no effect if undertaken.
 */

import type { KbEntry } from "../entry";

export const FASTING: KbEntry[] = [
  // -------------------------------------------------------------------------
  // What does not break a fast
  // -------------------------------------------------------------------------
  {
    id: "bukhari:1933:eating-forgetfully",
    clause: "validity(perform(fasting), sahih) :- circumstance(ate_forgetfully).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1933, Sahih Muslim 1155",
      text:
        "Whoever forgets while fasting and eats or drinks, let him complete his fast, for it " +
        "is Allah who fed him and gave him drink.",
      textArabic: "مَنْ نَسِيَ وَهُوَ صَائِمٌ فَأَكَلَ أَوْ شَرِبَ فَلْيُتِمَّ صَوْمَهُ فَإِنَّمَا أَطْعَمَهُ اللَّهُ وَسَقَاهُ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      madhahib: ["hanafi", "shafii", "hanbali"],
      notes:
        "The fast stands and nothing is owed. Malik held that an obligatory fast broken this " +
        "way is made up, reading the report as about voluntary fasting.",
    },
  },
  {
    id: "bukhari:1927:kissing-while-fasting",
    clause: "ruling(kiss(spouse), mubah) :- circumstance(currently_fasting).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1927, Sahih Muslim 1106",
      text:
        "The Prophet would kiss and embrace while fasting, and he was the most in control of " +
        "his desire among you.",
      textArabic: "كَانَ النَّبِيُّ صلى الله عليه وسلم يُقَبِّلُ وَيُبَاشِرُ وَهُوَ صَائِمٌ وَكَانَ أَمْلَكَكُمْ لِإِرْبِهِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Narrated by 'A'isha. Her closing words are why the schools dislike it for someone " +
        "who cannot trust himself not to go further; for one who can, it does not affect the fast.",
    },
  },

  // -------------------------------------------------------------------------
  // Who else may leave the fast
  // -------------------------------------------------------------------------
  {
    id: "tirmidhi:715:pregnancy-excuses-fast",
    clause: "ruling(omit(fasting), mubah) :- circumstance(pregnant).",
    evidence: {
      kind: "sunnah",
      reference: "Jami` at-Tirmidhi 715, Sunan Abi Dawud 2408",
      text:
        "Allah has relieved the traveller of fasting and half the prayer, and the pregnant " +
        "and the nursing woman of fasting.",
      textArabic: "إِنَّ اللَّهَ وَضَعَ عَنِ الْمُسَافِرِ الصَّوْمَ وَشَطْرَ الصَّلَاةِ وَعَنِ الْحَامِلِ أَوِ الْمُرْضِعِ الصَّوْمَ",
      grade: "hasan",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      notes:
        "Where she fears for herself or the child. The days are made up later; whether a " +
        "ransom is also owed differs between the schools.",
    },
  },
  {
    id: "tirmidhi:715:nursing-excuses-fast",
    clause: "ruling(omit(fasting), mubah) :- circumstance(nursing).",
    evidence: {
      kind: "sunnah",
      reference: "Jami` at-Tirmidhi 715, Sunan Abi Dawud 2408",
      text: "Allah has relieved ... the pregnant and the nursing woman of fasting.",
      grade: "hasan",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
    },
  },

  // -------------------------------------------------------------------------
  // Days of fasting
  // -------------------------------------------------------------------------
  {
    id: "bukhari:1991:no-fasting-on-eid",
    clause: "ruling(perform(eid_fast), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1991, Sahih Muslim 827",
      text: "The Prophet forbade fasting on the day of Fitr and the day of Sacrifice.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "ijma:eid-fast-void",
    clause: "validity(perform(eid_fast), batil).",
    evidence: {
      kind: "ijma",
      reference: "Consensus, on Sahih al-Bukhari 1991",
      thubut: "qati",
      dalala: "qati",
      notes:
        "A fast on either Eid is not merely sinful but does not count: it cannot discharge a " +
        "vow, a make-up day or an expiation.",
    },
  },
  {
    id: "muslim:1162:arafah-fast",
    clause: "ruling(perform(arafah_fast), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1162",
      text: "Fasting the day of 'Arafa — I hope from Allah that it expiates the year before it and the year after it.",
      textArabic: "صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "For those not on hajj; the pilgrim at 'Arafa is not to fast it.",
    },
  },
  {
    id: "muslim:1162:ashura-fast",
    clause: "ruling(perform(ashura_fast), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1162",
      text: "Fasting the day of 'Ashura — I hope from Allah that it expiates the year before it.",
      textArabic: "وَصِيَامُ يَوْمِ عَاشُورَاءَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "Recommended with a day before it (Muslim 1134: 'I will fast the ninth').",
    },
  },
  {
    id: "bukhari:1985:friday-alone",
    clause: "ruling(perform(friday_only_fast), makruh).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1985, Sahih Muslim 1144",
      text: "None of you should fast on Friday unless he fasts a day before it or a day after it.",
      textArabic: "لَا يَصُومَنَّ أَحَدُكُمْ يَوْمَ الْجُمُعَةِ إِلَّا يَوْمًا قَبْلَهُ أَوْ بَعْدَهُ",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "The majority read the prohibition as one of dislike, not of sin; it does not apply " +
        "when Friday falls on a day one fasts anyway, such as 'Arafa.",
    },
  },

  {
    id: "muslim:1164:six-of-shawwal",
    clause: "ruling(perform(shawwal_fast), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1164",
      text: "Whoever fasts Ramadan and follows it with six days of Shawwal, it is as if he fasted for a lifetime.",
      textArabic: "مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      madhahib: ["hanafi", "shafii", "hanbali"],
      notes: "Malik disliked making them a fixed practice, lest they be taken as part of Ramadan.",
    },
  },
  {
    id: "tirmidhi:747:monday-and-thursday",
    clause: "ruling(perform(monday_thursday_fast), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Jami` at-Tirmidhi 747",
      text: "Deeds are presented on Monday and Thursday, and I love that my deeds be presented while I am fasting.",
      grade: "hasan",
      thubut: "zanni",
      dalala: "qati",
    },
  },
];
