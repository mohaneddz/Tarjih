/**
 * Hajj, and the state of ihram.
 *
 * Two things here that the rest of the KB has no case of. An obligation
 * conditioned on the asker's *capacity* (istita'a): hajj is not owed by
 * everyone and then excused for some, it is owed only by those able, so the
 * capacity is a premise of the obligation itself rather than an exception to
 * it. And a circumstance that turns a permission into a prohibition: hunting
 * is lawful, and forbidden in ihram — the reverse of every concession
 * elsewhere, which turn a prohibition or obligation into a permission.
 */

import type { KbEntry } from "../entry";

export const HAJJ: KbEntry[] = [
  // -------------------------------------------------------------------------
  // The obligation, once, on the able
  // -------------------------------------------------------------------------
  {
    id: "quran:3-97:hajj-on-the-able",
    clause: "ruling(perform(hajj), wajib) :- circumstance(able_to_perform_hajj).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 3:97",
      text:
        "And pilgrimage to the House is a duty owed to Allah by people — whoever " +
        "is able to find a way to it.",
      textArabic: "وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Capacity is part of what the verse obliges, so it is a body goal of " +
        "the obligation rather than an excuse attached to it: asked with " +
        "nothing stated, the engine derives no obligation and says what it " +
        "was waiting on. What capacity consists of — provision, transport, a " +
        "safe road, and for a woman, on most schools, a mahram — is not " +
        "modelled; the asker's own judgement of it is taken as given.",
    },
  },
  {
    id: "abudawud:1721:once-in-a-lifetime",
    clause: "ruling(perform(additional_hajj), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 1721, Sahih Muslim 1337",
      text: "Hajj is once; whoever does more, it is voluntary.",
      textArabic: "الحج مرة فمن زاد فهو تطوع",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      notes:
        "Muslim 1337 records the occasion: asked whether hajj was owed every " +
        "year, the Prophet said that had he said yes, it would have become " +
        "obligatory.",
    },
  },
  {
    id: "tax:hajj-is-ibada",
    clause: "instance(hajj, ibada).",
    evidence: { kind: "ontology", reference: "Definitional" },
  },

  // -------------------------------------------------------------------------
  // Tawaf and menstruation
  // -------------------------------------------------------------------------
  {
    id: "bukhari:305:tawaf-until-pure",
    /*
     * Not routed through `impediment/2`. The impediment rules in worship.ts
     * conclude that omitting the blocked act is wajib, which is right for a
     * day's fast and wrong here: the tawaf of hajj is a pillar, and it is
     * delayed until she is pure, not dropped. The report says exactly that,
     * so the clause says exactly that and no more.
     */
    clause: "ruling(perform(tawaf), haram) :- circumstance(menstruation).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 305, Sahih Muslim 1211",
      text:
        "Do everything the pilgrim does, except that you do not circle the " +
        "House until you are pure.",
      textArabic: "فافعلي ما يفعل الحاج غير أن لا تطوفي بالبيت حتى تطهري",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Said to 'A'isha when her period came during hajj. That the tawaf is " +
        "forbidden to her is agreed; the Hanafis hold one performed anyway " +
        "still counts, with an expiation, which is a question on the validity " +
        "axis this KB does not answer.",
    },
  },

  // -------------------------------------------------------------------------
  // Hunting: lawful, forbidden in ihram, except at sea
  // -------------------------------------------------------------------------
  {
    id: "quran:5-2:hunting-lawful",
    clause: "ruling(hunt(land_game), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:2, Qur'an 5:4",
      text: "And when you have come out of ihram, then hunt.",
      textArabic: "وَإِذَا حَلَلْتُمْ فَاصْطَادُوا",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "An imperative, but one that follows a prohibition, and the majority " +
        "read a command after a prohibition as restoring what was permitted " +
        "before (al-amr ba'd al-hazr li'l-ibaha) — not as making hunting " +
        "obligatory. That reading is a principle of usul, not something the " +
        "verse states, so the indication is marked probable.",
    },
  },
  {
    id: "quran:5-95:no-hunting-in-ihram",
    clause: "ruling(hunt(land_game), haram) :- circumstance(ihram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:95, Qur'an 5:96",
      text: "O you who believe, do not kill game while you are in ihram.",
      textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَقْتُلُوا الصَّيْدَ وَأَنتُمْ حُرُمٌ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Specific to the person in ihram, so it qualifies the general " +
        "permission rather than contradicting it. The verse goes on to set " +
        "the expiation, which is not modelled.",
    },
  },
  {
    id: "quran:5-96:sea-game",
    clause: "ruling(hunt(sea_game), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:96",
      text:
        "Lawful to you is the game of the sea and its food, as provision for " +
        "you and for travellers; and forbidden to you is the game of the land " +
        "so long as you are in ihram.",
      textArabic: "أُحِلَّ لَكُمْ صَيْدُ الْبَحْرِ وَطَعَامُهُ مَتَاعًا لَّكُمْ وَلِلسَّيَّارَةِ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The same verse draws the line: the prohibition in ihram is of land " +
        "game only, so this permission holds whatever the asker's state.",
    },
  },
];
