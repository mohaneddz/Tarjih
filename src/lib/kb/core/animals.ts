/**
 * Which animals may be eaten, beyond the four named in 5:3 and the cases in
 * food.ts: livestock and fowl, game, birds of prey, more predators, the
 * meat of the People of the Book, and shellfish.
 *
 * Built on classes where a text speaks of a class — "grazing livestock",
 * "every bird with talons" — so that adding an animal is adding one fact, and
 * so that the necessity exception for forbidden animals (food.ts) reaches a
 * new forbidden animal without being restated. Where a text speaks of one
 * animal — the rabbit, the dabb — the clause is about that animal alone.
 *
 * Lawful animals are lawful when lawfully slaughtered; slaughter itself is
 * not modelled, so "may I eat camel" answers whether camel is lawful meat,
 * not whether a given piece of it was slaughtered properly.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const ANIMALS: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Grazing livestock
  // -------------------------------------------------------------------------
  {
    id: "quran:5-1:livestock-lawful",
    clause: "ruling(consume(Animal), mubah) :- instance(Animal, livestock).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:1",
      text: "Lawful for you are the grazing livestock, except what is recited to you.",
      textArabic: "أُحِلَّتْ لَكُم بَهِيمَةُ الْأَنْعَامِ إِلَّا مَا يُتْلَىٰ عَلَيْكُمْ",
      thubut: "qati",
      dalala: "qati",
      notes: "Bahimat al-an'am: camels, cattle, sheep and goats (6:143-144 names the pairs).",
    },
  },
  { id: "tax:camel", clause: "instance(camel, livestock).", evidence: definitional },
  { id: "tax:cow", clause: "instance(cow, livestock).", evidence: definitional },
  { id: "tax:sheep", clause: "instance(sheep, livestock).", evidence: definitional },
  { id: "tax:goat", clause: "instance(goat, livestock).", evidence: definitional },

  // -------------------------------------------------------------------------
  // Fowl and small game
  // -------------------------------------------------------------------------
  {
    id: "bukhari:5517:chicken",
    clause: "ruling(consume(chicken), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5517",
      text: "Zahdam said: I saw the Prophet eating chicken.",
      textArabic: "رَأَيْتُ النَّبِيَّ صلى الله عليه وسلم يَأْكُلُ دَجَاجًا",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
    },
  },
  {
    id: "bukhari:2572:rabbit",
    clause: "ruling(consume(rabbit), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2572, Sahih Muslim 1953",
      text:
        "Anas said: We startled a rabbit and caught it; Abu Talha slaughtered it and sent its " +
        "haunch to the Messenger of Allah, who accepted it.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "Agreed among the four schools.",
    },
  },
  {
    id: "bukhari:5536:dabb",
    clause: "ruling(consume(dabb_lizard), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5536, Sahih Muslim 1943",
      text: "The Prophet was asked about the dabb and said: I neither eat it nor forbid it.",
      textArabic: "لَسْتُ بِآكِلِهِ وَلَا مُحَرِّمِهِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      madhahib: ["maliki", "shafii", "hanbali"],
      notes:
        "Khalid ibn al-Walid ate it at the Prophet's table. The Hanafis hold it disliked, on " +
        "other reports; that position is not modelled here.",
    },
  },

  // -------------------------------------------------------------------------
  // Birds of prey and more predators
  // -------------------------------------------------------------------------
  {
    id: "muslim:1934:taloned-birds",
    clause: "ruling(consume(Bird), haram) :- instance_of(Bird, taloned_bird).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1934",
      text:
        "The Messenger of Allah forbade every predator with fangs and every bird with talons.",
      textArabic: "نَهَى رَسُولُ اللَّهِ صلى الله عليه وسلم عَنْ كُلِّ ذِي نَابٍ مِنَ السِّبَاعِ وَعَنْ كُلِّ ذِي مِخْلَبٍ مِنَ الطَّيْرِ",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      madhahib: ["hanafi", "shafii", "hanbali"],
      notes:
        "Narrated by Ibn 'Abbas. The well-known Maliki position permits birds of prey; it is " +
        "not modelled here.",
    },
  },
  { id: "tax:taloned-bird-forbidden", clause: "subclass(taloned_bird, forbidden_animal).", evidence: definitional },
  { id: "tax:eagle", clause: "instance(eagle, taloned_bird).", evidence: definitional },
  { id: "tax:hawk", clause: "instance(hawk, taloned_bird).", evidence: definitional },
  { id: "tax:falcon", clause: "instance(falcon, taloned_bird).", evidence: definitional },
  { id: "tax:vulture", clause: "instance(vulture, taloned_bird).", evidence: definitional },
  { id: "tax:tiger", clause: "instance(tiger, fanged_predator).", evidence: definitional },
  { id: "tax:leopard", clause: "instance(leopard, fanged_predator).", evidence: definitional },

  // -------------------------------------------------------------------------
  // The People of the Book
  // -------------------------------------------------------------------------
  {
    id: "quran:5-5:food-of-the-book",
    clause: "ruling(consume(ahl_al_kitab_meat), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:5",
      text: "The food of those who were given the Scripture is lawful for you.",
      textArabic: "وَطَعَامُ الَّذِينَ أُوتُوا الْكِتَابَ حِلٌّ لَّكُمْ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Ibn 'Abbas: 'their food' means what they slaughter. The meat of animals they may eat " +
        "and that they slaughter; pork stays forbidden whoever prepares it. Whether their " +
        "modern industrial slaughter meets the condition is a contemporary dispute this " +
        "clause does not settle.",
    },
  },

  // -------------------------------------------------------------------------
  // Shellfish: a spread between the schools
  // -------------------------------------------------------------------------
  {
    id: "quran:5-96:sea-food-lawful",
    clause: "ruling(consume(shrimp), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:96",
      text: "Lawful to you is the game of the sea and its food.",
      textArabic: "أُحِلَّ لَكُمْ صَيْدُ الْبَحْرِ وَطَعَامُهُ",
      thubut: "qati",
      dalala: "qati",
      madhahib: ["maliki", "shafii", "hanbali"],
      notes: "The majority: everything that lives only in the sea is lawful.",
    },
  },
  {
    id: "hanafi:shrimp-makruh",
    clause: "ruling(consume(shrimp), makruh).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 7:157, as the Hanafis read it",
      text: "And he forbids them impure things (al-khaba'ith).",
      textArabic: "وَيُحَرِّمُ عَلَيْهِمُ الْخَبَائِثَ",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["hanafi"],
      notes:
        "The Hanafis permit only fish from the sea. Many later Hanafis count shrimp as a fish " +
        "and permit it, so the school is not uniform on this.",
    },
  },

  // -------------------------------------------------------------------------
  // Fowl and fish
  // -------------------------------------------------------------------------
  {
    id: "quran:5-4:good-things-fowl",
    clause: "ruling(consume(Bird), mubah) :- instance(Bird, fowl).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:4; Qur'an 2:57",
      text: "They ask you what has been made lawful for them. Say: lawful for you are the good things.",
      textArabic: "يَسْأَلُونَكَ مَاذَا أُحِلَّ لَهُمْ ۖ قُلْ أُحِلَّ لَكُمُ الطَّيِّبَاتُ",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "Birds without talons that people eat are among 'the good things'; quail (salwa) is " +
        "named as a provision in 2:57. Agreed among the four schools.",
    },
  },
  { id: "tax:duck", clause: "instance(duck, fowl).", evidence: definitional },
  { id: "tax:turkey", clause: "instance(turkey, fowl).", evidence: definitional },
  { id: "tax:pigeon", clause: "instance(pigeon, fowl).", evidence: definitional },
  { id: "tax:quail", clause: "instance(quail, fowl).", evidence: definitional },
  {
    id: "quran:5-96:fish",
    clause: "ruling(consume(fish), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:96",
      text: "Lawful to you is the game of the sea and its food.",
      textArabic: "أُحِلَّ لَكُمْ صَيْدُ الْبَحْرِ وَطَعَامُهُ",
      thubut: "qati",
      dalala: "qati",
      notes: "Fish needs no slaughter (Ibn Majah 3314: 'two dead things are lawful to us: fish and locusts').",
    },
  },
];
