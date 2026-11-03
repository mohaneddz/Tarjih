/**
 * Prayer beyond the five daily obligations: Friday, the forms a prayer may
 * take for someone who cannot manage its ordinary form, the voluntary prayers,
 * and what purity the mushaf requires.
 *
 * The pattern from worship.ts repeats: a general obligation or prohibition
 * stated in the Qur'an, and a narrower text that lifts it for a person in a
 * stated situation. Friday prayer is where it reaches a question of who the
 * asker is — obligatory on men, not on women — so, as with gold and silk, the
 * engine asks rather than assumes.
 */

import type { KbEntry } from "../entry";

export const PRAYER: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Friday prayer
  // -------------------------------------------------------------------------
  {
    id: "quran:62-9:friday-prayer",
    /*
     * Keyed on the asker being a man: the verse addresses believers
     * generally, but the obligation's reach is set by Abu Dawud 1067 below,
     * which names women among those it does not bind. Unconditioned, it would
     * tell a woman that missing Friday prayer is a sin.
     */
    clause: "ruling(perform(friday_prayer), wajib) :- circumstance(male).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 62:9",
      text:
        "O you who believe, when the call is made for prayer on Friday, hasten to the " +
        "remembrance of Allah and leave trade.",
      textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes: "Its obligation on adult, resident men is agreed (ijma').",
    },
  },
  {
    id: "abudawud:1067:friday-not-on-women",
    clause: "ruling(perform(friday_prayer), mubah) :- circumstance(female).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 1067",
      text:
        "Friday prayer is a duty binding on every Muslim in congregation, except four: a " +
        "slave, a woman, a child, or a sick person.",
      textArabic: "الْجُمُعَةُ حَقٌّ وَاجِبٌ عَلَى كُلِّ مُسْلِمٍ فِي جَمَاعَةٍ إِلَّا أَرْبَعَةً عَبْدٌ مَمْلُوكٌ أَوِ امْرَأَةٌ أَوْ صَبِيٌّ أَوْ مَرِيضٌ",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      notes:
        "Not binding on her; if she attends, it is valid and replaces the noon prayer. " +
        "Hence mubah for her rather than a ruling either way on attending.",
    },
  },
  {
    id: "abudawud:1067:friday-not-on-the-sick",
    clause: "ruling(perform(friday_prayer), mubah) :- circumstance(illness).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 1067",
      text: "Friday prayer is a duty binding on every Muslim in congregation, except four: ... or a sick person.",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "abudawud:1067:sick-may-miss-friday",
    /*
     * The omission needs its own clause. "Omitting what is wajib is haram"
     * fires from the men's obligation as a sub-goal, and sub-goals are not
     * weighed — without this, a sick man asking whether he may miss Friday
     * prayer would meet only the prohibition.
     */
    clause: "ruling(omit(friday_prayer), mubah) :- circumstance(illness).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 1067",
      text: "Friday prayer is a duty binding on every Muslim in congregation, except four: ... or a sick person.",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      notes: "He prays the noon prayer (dhuhr) in its place.",
    },
  },

  // -------------------------------------------------------------------------
  // Praying seated
  // -------------------------------------------------------------------------
  {
    id: "quran:2-238:standing-in-prayer",
    clause: "ruling(perform(sitting_prayer), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:238",
      text: "Guard strictly the prayers, and the middle prayer, and stand before Allah in devotion.",
      textArabic: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "Standing is a pillar of an obligatory prayer for whoever can stand; praying it " +
        "seated while able leaves the pillar out. Voluntary prayers may be prayed seated.",
    },
  },
  {
    id: "bukhari:1117:pray-as-you-are-able",
    clause: "ruling(perform(sitting_prayer), mubah) :- circumstance(illness).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1117",
      text: "Pray standing; if you cannot, then sitting; and if you cannot, then on your side.",
      textArabic: "صَلِّ قَائِمًا فَإِنْ لَمْ تَسْتَطِعْ فَقَاعِدًا فَإِنْ لَمْ تَسْتَطِعْ فَعَلَى جَنْبٍ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes: "Said to 'Imran ibn Husayn, who had piles. The concession reaches as far as the inability does.",
    },
  },
  {
    id: "bukhari:1117:seated-prayer-valid",
    clause: "validity(perform(sitting_prayer), sahih) :- circumstance(illness).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1117",
      text: "Pray standing; if you cannot, then sitting; and if you cannot, then on your side.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes: "The prayer counts in full; nothing is owed afterwards.",
    },
  },

  // -------------------------------------------------------------------------
  // Combining prayers on a journey
  // -------------------------------------------------------------------------
  {
    id: "bukhari:1106:combining-on-a-journey",
    clause: "ruling(perform(combined_prayers), mubah) :- circumstance(travel).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 1106, Sahih Muslim 703",
      text: "The Prophet would combine the sunset and night prayers when he was pressed on a journey.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      madhahib: ["maliki", "shafii", "hanbali"],
    },
  },
  {
    id: "hanafi:no-combining-on-a-journey",
    clause: "ruling(perform(combined_prayers), haram) :- circumstance(travel).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:103, as the Hanafis read it",
      text: "Indeed, prayer has been decreed upon the believers at fixed times.",
      textArabic: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      madhahib: ["hanafi"],
      notes:
        "The Hanafis allow combining only at 'Arafa and Muzdalifa during hajj, and read the " +
        "reports of combining on journeys as praying one prayer at the end of its time and " +
        "the next at the start of its own.",
    },
  },

  // -------------------------------------------------------------------------
  // Voluntary prayers
  // -------------------------------------------------------------------------
  {
    id: "tirmidhi:453:witr-sunnah",
    clause: "ruling(perform(witr), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Jami` at-Tirmidhi 453",
      text:
        "The witr is not compulsory like your prescribed prayer, but the Messenger of Allah " +
        "established it as a sunnah.",
      textArabic: "الْوِتْرُ لَيْسَ بِحَتْمٍ كَصَلَاتِكُمُ الْمَكْتُوبَةِ وَلَكِنْ سَنَّ رَسُولُ اللَّهِ",
      grade: "hasan",
      thubut: "zanni",
      dalala: "qati",
      madhahib: ["maliki", "shafii", "hanbali"],
      notes:
        "The words of 'Ali. Abu Hanifa held witr wajib — a category between fard and sunnah " +
        "in his school — on the report 'Witr is a duty' (Abu Dawud 1422); that position is " +
        "not modelled here.",
    },
  },
  {
    id: "quran:17-79:night-prayer",
    clause: "ruling(perform(night_prayer), mandub).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 17:79",
      text: "And during part of the night, pray with it as an additional prayer for you.",
      textArabic: "وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "Addressed to the Prophet; for the community it is among the most emphasised " +
        "voluntary prayers (Muslim 1163: 'the best prayer after the obligatory is prayer at night').",
    },
  },

  // -------------------------------------------------------------------------
  // Purity
  // -------------------------------------------------------------------------
  {
    id: "muslim:274:wiping-over-khuffs",
    clause: "ruling(perform(wiping_over_khuffs), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 274",
      text:
        "Al-Mughira ibn Shu'ba poured water for the Prophet as he made wudu, and he wiped " +
        "over his leather socks.",
      grade: "mutawatir",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Reported by some seventy Companions, so treated as mass-transmitted. Agreed among " +
        "the four schools for a resident (a day and a night) and a traveller (three days), " +
        "provided the socks were put on in a state of wudu.",
    },
  },
  {
    id: "muwatta:amr-ibn-hazm:only-the-pure-touch-the-quran",
    clause: "ruling(touch(mushaf), haram) :- circumstance(ritual_impurity).",
    evidence: {
      kind: "sunnah",
      reference: "Muwatta Malik, Book of the Qur'an (the letter to 'Amr ibn Hazm); cf. Qur'an 56:79",
      text: "None should touch the Qur'an except one who is pure.",
      textArabic: "أَنْ لَا يَمَسَّ الْقُرْآنَ إِلَّا طَاهِرٌ",
      grade: "hasan",
      thubut: "zanni",
      dalala: "zanni",
      madhahib: ["hanafi", "maliki", "shafii", "hanbali"],
      notes:
        "The four schools; the Zahiris dissented. 56:79 ('none touch it except the purified') " +
        "is read by many as about the angels and the preserved tablet, so the ruling rests on " +
        "the letter. Reciting from memory without wudu is permitted.",
    },
  },

  // -------------------------------------------------------------------------
  // Whether a prayer counts, and making one up
  // -------------------------------------------------------------------------
  {
    id: "muslim:224:no-prayer-without-purity",
    clause: "validity(perform(obligatory_prayer), batil) :- circumstance(ritual_impurity).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 224; Jami` at-Tirmidhi 1",
      text: "No prayer is accepted without purification.",
      textArabic: "لَا تُقْبَلُ صَلَاةٌ بِغَيْرِ طُهُورٍ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Agreed: a prayer prayed knowingly without wudu (or ghusl, where due) does not count " +
        "and must be repeated. The obligation to pray is untouched — purify, then pray.",
    },
  },
  {
    id: "muslim:684:making-up-a-missed-prayer",
    clause: "ruling(make_up(obligatory_prayer), wajib) :- circumstance(missed_prayer).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 684",
      text:
        "Whoever forgets a prayer or sleeps through it, its expiation is to pray it when he " +
        "remembers it.",
      textArabic: "مَنْ نَسِيَ صَلَاةً أَوْ نَامَ عَنْهَا فَكَفَّارَتُهَا أَنْ يُصَلِّيَهَا إِذَا ذَكَرَهَا",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "The four schools extend it to a prayer missed deliberately, which is owed all the " +
        "more. A prayer missed during menstruation is not made up (see worship.ts).",
    },
  },
  {
    id: "bukhari:645:congregation",
    clause: "ruling(perform(congregational_prayer), mandub).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 645, Sahih Muslim 650",
      text: "Prayer in congregation is twenty-seven degrees better than prayer alone.",
      textArabic: "صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["hanafi", "maliki", "shafii"],
      notes:
        "For men, a strongly emphasised sunnah for the majority. The Hanbalis hold it " +
        "obligatory (on the blind man told to come, Muslim 653); that position is not " +
        "modelled here.",
    },
  },
];
