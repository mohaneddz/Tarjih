/**
 * Trade beyond riba and gharar (transactions.ts): what may not be sold at
 * all, selling what one does not have, and conduct in the market — hoarding,
 * concealing defects, cutting in on another's sale.
 *
 * Selling what one does not have sits next to salam, which is exactly that
 * and is permitted. The difference is the whole content of the ruling: salam
 * fixes a described quantity, quality and date and pays in full now;
 * selling a specific thing one does not yet own promises what one may not be
 * able to deliver. The two are separate entities in the lexicon for that
 * reason, and the grounding stage is told not to guess between near
 * neighbours.
 */

import type { KbEntry } from "../entry";

const SALE_OF_FORBIDDEN_THINGS = {
  kind: "sunnah",
  reference: "Sahih al-Bukhari 2236, Sahih Muslim 1581",
  text: "Allah and His Messenger have forbidden the sale of wine, carrion, swine and idols.",
  textArabic: "إِنَّ اللَّهَ وَرَسُولَهُ حَرَّمَ بَيْعَ الْخَمْرِ وَالْمَيْتَةِ وَالْخِنْزِيرِ وَالْأَصْنَامِ",
  grade: "sahih",
  thubut: "qati",
  dalala: "qati",
  scope: "khass",
} as const;

export const TRADE: KbEntry[] = [
  // -------------------------------------------------------------------------
  // What may not be sold
  // -------------------------------------------------------------------------
  {
    id: "bukhari:2236:no-sale-of-wine",
    clause: "ruling(sell(khamr), haram).",
    evidence: {
      ...SALE_OF_FORBIDDEN_THINGS,
      notes: "Narrated by Jabir in Makka in the year of the conquest. Whatever may not be consumed may not be traded.",
    },
  },
  {
    id: "bukhari:2236:no-sale-of-swine",
    clause: "ruling(sell(swine), haram).",
    evidence: SALE_OF_FORBIDDEN_THINGS,
  },
  {
    id: "bukhari:2236:no-sale-of-carrion",
    clause: "ruling(sell(carrion), haram).",
    evidence: {
      ...SALE_OF_FORBIDDEN_THINGS,
      notes:
        "In the same report the Companions asked about using carrion fat to caulk ships and " +
        "light lamps; the answer kept the sale forbidden.",
    },
  },
  {
    id: "ijma:sale-of-forbidden-things-void",
    clause: "validity(sell(khamr), batil).",
    evidence: {
      kind: "ijma",
      reference: "Consensus, on Sahih al-Bukhari 2236",
      thubut: "qati",
      dalala: "qati",
      notes: "Wine has no lawful value for a Muslim, so a sale of it transfers nothing and the price is not owed.",
    },
  },

  // -------------------------------------------------------------------------
  // Selling what one does not have
  // -------------------------------------------------------------------------
  {
    id: "tirmidhi:1232:what-you-do-not-have",
    clause: "ruling(sell(goods_not_owned), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Jami` at-Tirmidhi 1232, Sunan Abi Dawud 3503",
      text: "Do not sell what you do not have.",
      textArabic: "لَا تَبِعْ مَا لَيْسَ عِنْدَكَ",
      grade: "hasan",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      notes:
        "Said to Hakim ibn Hizam, who sold goods to customers and then went to buy them in " +
        "the market. Salam — a described quantity, paid now, for a fixed date — is the " +
        "recognised exception and is not this.",
    },
  },

  // -------------------------------------------------------------------------
  // Conduct in the market
  // -------------------------------------------------------------------------
  {
    id: "muslim:1605:hoarding",
    clause: "ruling(hoard(staple_food), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1605",
      text: "No one hoards except a sinner.",
      textArabic: "لَا يَحْتَكِرُ إِلَّا خَاطِئٌ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Buying up what people need and holding it back to raise its price. The schools differ " +
        "on whether it extends beyond foodstuffs.",
    },
  },
  {
    id: "muslim:102:concealing-defects",
    clause: "ruling(sell(goods_with_concealed_defect), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 102",
      text:
        "The Prophet passed a heap of grain, put his hand into it and found it damp beneath. " +
        "He said: Why did you not put it on top so that people could see it? Whoever cheats is not of me.",
      textArabic: "مَنْ غَشَّ فَلَيْسَ مِنِّي",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The sale itself stands, but the buyer may return the goods on discovering the defect " +
        "(khiyar al-'ayb).",
    },
  },
  {
    id: "bukhari:2139:selling-over-a-sale",
    clause: "ruling(sell(offer_undercutting_a_sale), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2139, Sahih Muslim 1412",
      text: "None of you should sell over the sale of his brother.",
      textArabic: "لَا يَبِيعُ بَعْضُكُمْ عَلَى بَيْعِ أَخِيهِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Offering a buyer a better deal to make them abandon a sale already agreed with someone " +
        "else. Bidding in an open auction, before any sale is agreed, is not this.",
    },
  },
];
