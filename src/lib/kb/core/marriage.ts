/**
 * Marriage beyond kinship (family.ts covers who is mahram): marriage across
 * faiths, the limit of four, the waiting period, divorce, contraception, and
 * the care of children who are not one's own.
 *
 * Most prohibitions here have a second answer on the validity axis, and the
 * two are worth keeping apart. A marriage to a fifth wife is forbidden *and*
 * void; a divorce pronounced during menstruation is forbidden and yet, for
 * the four schools, still takes effect. Someone asking "can I" usually also
 * needs to know "and if I did, does it count".
 */

import type { KbEntry } from "../entry";

export const MARRIAGE: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Across faiths
  // -------------------------------------------------------------------------
  {
    id: "quran:5-5:women-of-the-book",
    clause: "ruling(marry(christian_or_jewish_woman), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:5",
      text:
        "And [lawful to you in marriage are] chaste women from among those who were given " +
        "the Scripture before you.",
      textArabic: "وَالْمُحْصَنَاتُ مِنَ الَّذِينَ أُوتُوا الْكِتَابَ مِن قَبْلِكُمْ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Permission for a Muslim man; agreed among the four schools. Several Companions, " +
        "'Umar among them, disliked it where it risked the children's upbringing, and some " +
        "schools record that dislike — the permission itself is not disputed.",
    },
  },
  {
    id: "quran:60-10:not-to-non-muslim-men",
    clause: "ruling(marry(non_muslim_man), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 60:10, Qur'an 2:221",
      text: "They are not lawful for them, nor are they lawful for them.",
      textArabic: "لَا هُنَّ حِلٌّ لَّهُمْ وَلَا هُمْ يَحِلُّونَ لَهُنَّ",
      thubut: "qati",
      dalala: "qati",
      notes: "A Muslim woman may not marry a non-Muslim man, of the Book or otherwise; agreed (ijma').",
    },
  },
  {
    id: "ijma:non-muslim-husband-void",
    clause: "validity(marry(non_muslim_man), batil).",
    evidence: {
      kind: "ijma",
      reference: "Consensus, on Qur'an 60:10",
      thubut: "qati",
      dalala: "qati",
      notes: "The contract has no effect; it does not become a marriage.",
    },
  },
  {
    id: "quran:2-221:not-polytheists",
    clause: "ruling(marry(polytheist_woman), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:221",
      text: "And do not marry polytheistic women until they believe.",
      textArabic: "وَلَا تَنكِحُوا الْمُشْرِكَاتِ حَتَّىٰ يُؤْمِنَّ",
      thubut: "qati",
      dalala: "qati",
      notes: "General in wording, but specified by 5:5, which excepts women of the Book.",
    },
  },
  {
    id: "ijma:polytheist-marriage-void",
    clause: "validity(marry(polytheist_woman), batil).",
    evidence: {
      kind: "ijma",
      reference: "Consensus, on Qur'an 2:221",
      thubut: "qati",
      dalala: "qati",
    },
  },

  // -------------------------------------------------------------------------
  // The limit of four, and the waiting period
  // -------------------------------------------------------------------------
  {
    id: "quran:4-3:no-fifth-wife",
    clause: "ruling(marry(fifth_wife), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:3; Jami` at-Tirmidhi 1128",
      text: "Then marry those that please you of women, two or three or four.",
      textArabic: "فَانكِحُوا مَا طَابَ لَكُم مِّنَ النِّسَاءِ مَثْنَىٰ وَثُلَاثَ وَرُبَاعَ",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "The verse names the number; that it is a ceiling rests on the Prophet telling " +
        "Ghaylan al-Thaqafi, who had ten wives on entering Islam, to keep four, and on " +
        "consensus.",
    },
  },
  {
    id: "ijma:fifth-wife-void",
    clause: "validity(marry(fifth_wife), batil).",
    evidence: {
      kind: "ijma",
      reference: "Consensus, on Qur'an 4:3",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "quran:2-235:not-during-iddah",
    clause: "ruling(marry(woman_in_iddah), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:235",
      text: "And do not resolve on the marriage contract until the prescribed term has run its course.",
      textArabic: "وَلَا تَعْزِمُوا عُقْدَةَ النِّكَاحِ حَتَّىٰ يَبْلُغَ الْكِتَابُ أَجَلَهُ",
      thubut: "qati",
      dalala: "qati",
      notes: "Her waiting period after divorce or widowhood. An indirect hint of proposal is allowed (the same verse).",
    },
  },
  {
    id: "ijma:iddah-marriage-void",
    clause: "validity(marry(woman_in_iddah), batil).",
    evidence: {
      kind: "ijma",
      reference: "Consensus, on Qur'an 2:235",
      thubut: "qati",
      dalala: "qati",
      notes: "The couple are separated; the schools differ on whether he may marry her once it ends.",
    },
  },

  // -------------------------------------------------------------------------
  // Divorce
  // -------------------------------------------------------------------------
  {
    id: "quran:2-229:divorce-permitted",
    clause: "ruling(divorce(wife), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:229",
      text: "Divorce is twice; then either keep her on reasonable terms or release her with kindness.",
      textArabic: "الطَّلَاقُ مَرَّتَانِ ۖ فَإِمْسَاكٌ بِمَعْرُوفٍ أَوْ تَسْرِيحٌ بِإِحْسَانٍ",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "abudawud:2178:most-hated-permitted-thing",
    /*
     * Kept although weak, because it is the report people quote, and because
     * the engine should show what a weak report can and cannot do: it is
     * weighed, it loses to the verse on certainty, and it survives as a
     * related opinion — the widely held dislike of divorce without need —
     * rather than as the ruling.
     */
    clause: "ruling(divorce(wife), makruh).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 2178",
      text: "The most hated of permitted things to Allah is divorce.",
      textArabic: "أَبْغَضُ الْحَلَالِ إِلَى اللَّهِ تَعَالَى الطَّلَاقُ",
      grade: "daif",
      thubut: "zanni",
      dalala: "zanni",
      notes:
        "Graded weak by many (Abu Hatim and others prefer it as mursal). The dislike of " +
        "divorce without a need is nonetheless widely held.",
    },
  },
  {
    id: "bukhari:5251:not-during-menstruation",
    clause: "ruling(divorce(wife_during_menstruation), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5251, Sahih Muslim 1471; Qur'an 65:1",
      text:
        "Ibn 'Umar divorced his wife while she was menstruating. 'Umar asked the Messenger " +
        "of Allah, who said: Tell him to take her back.",
      textArabic: "مُرْهُ فَلْيُرَاجِعْهَا",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Qur'an 65:1 — 'divorce them at the start of their waiting period' — is the text it " +
        "applies; a divorce in menstruation is the innovated divorce (talaq bid'i).",
    },
  },
  {
    id: "bukhari:5253:it-still-counts",
    clause: "validity(divorce(wife_during_menstruation), sahih).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5253",
      text: "Ibn 'Umar said: It was counted against me as one pronouncement of divorce.",
      textArabic: "حُسِبَتْ عَلَيَّ بِتَطْلِيقَةٍ",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["hanafi", "maliki", "shafii", "hanbali"],
      notes:
        "Forbidden and still effective: the order to 'take her back' presupposes a divorce " +
        "that happened. Ibn Taymiyya and Ibn Hazm held that it does not take effect.",
    },
  },

  // -------------------------------------------------------------------------
  // Contraception
  // -------------------------------------------------------------------------
  {
    id: "bukhari:5209:azl",
    clause: "ruling(use(contraception), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5209, Sahih Muslim 1440",
      text: "We used to practise withdrawal ('azl) while the Qur'an was being revealed.",
      textArabic: "كُنَّا نَعْزِلُ وَالْقُرْآنُ يَنْزِلُ",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "Jabir's report concerns withdrawal; the schools extend it to reversible contraception, " +
        "with the wife's consent. Permanent sterilisation without necessity is a separate, " +
        "forbidden matter.",
    },
  },

  // -------------------------------------------------------------------------
  // Orphans and adoption
  // -------------------------------------------------------------------------
  {
    id: "bukhari:5304:caring-for-an-orphan",
    clause: "ruling(care_for(orphan), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5304",
      text: "I and the one who looks after an orphan will be in Paradise like this — and he held two fingers together.",
      textArabic: "أَنَا وَكَافِلُ الْيَتِيمِ فِي الْجَنَّةِ هَكَذَا",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "quran:33-5:call-them-by-their-fathers",
    clause: "ruling(give_surname_to(adopted_child), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 33:5",
      text: "Call them by [the names of] their fathers; that is more just in the sight of Allah.",
      textArabic: "ادْعُوهُمْ لِآبَائِهِمْ هُوَ أَقْسَطُ عِندَ اللَّهِ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Raising and providing for a child is praised; what is forbidden is attributing the " +
        "child's lineage to oneself, which changes inheritance and who is mahram.",
    },
  },
];
