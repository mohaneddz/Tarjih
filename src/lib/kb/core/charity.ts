/**
 * Charity beyond zakat on wealth (zakat.ts): the end-of-Ramadan alms, and
 * voluntary giving.
 */

import type { KbEntry } from "../entry";

export const CHARITY: KbEntry[] = [
  {
    id: "bukhari:1503:zakat-al-fitr",
    clause: "ruling(pay(zakat_al_fitr), wajib).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1503, Sahih Muslim 984",
      text:
        "The Messenger of Allah made zakat al-fitr obligatory: a sa' of dates or a sa' of " +
        "barley, on every Muslim, slave and free, male and female, young and old.",
      textArabic: "فَرَضَ رَسُولُ اللَّهِ صلى الله عليه وسلم زَكَاةَ الْفِطْرِ صَاعًا مِنْ تَمْرٍ أَوْ صَاعًا مِنْ شَعِيرٍ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Paid by the head of the household for each dependant, before the Eid prayer. The " +
        "Hanafis call it wajib rather than fard, in their sense; all hold it binding.",
    },
  },
  {
    id: "quran:2-261:voluntary-charity",
    clause: "ruling(give(voluntary_charity), mandub).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:261",
      text:
        "The example of those who spend their wealth in the way of Allah is like a seed which " +
        "grows seven ears; in every ear a hundred grains.",
      textArabic: "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ",
      thubut: "qati",
      dalala: "zanni",
    },
  },
];
