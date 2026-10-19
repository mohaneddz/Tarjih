/**
 * Food beyond the four named in Qur'an 5:3: what the sea yields, the animals
 * the sunnah adds to the prohibition, and the blood the verses qualify.
 *
 * One constraint shapes every clause here. Sub-goals are not weighed — only
 * the ruling a query asks for is — so a class-level claim that a later text
 * overrides keeps firing for every rule that chains on the class. Calling a
 * dead fish `forbidden_food` and letting a hadith override the ruling on
 * eating it would still hand "eating beyond need is forbidden" and the
 * starvation exception to dead fish. So where a text qualifies another, the
 * competing claims meet at `ruling/2`, the one place the murajjihat look.
 *
 * This file is also where three parts of the weighing machinery get their
 * first real case:
 *
 * - restriction (muqayyad over mutlaq): "the blood" in 5:3 read in light of
 *   "flowing blood" in 6:145;
 * - an inadmissible report: the Hanafi report on floating fish is da'if and
 *   cannot carve anything out of a sound one;
 * - madhhab spreads that are not contradictions: the Maliki makruh on
 *   predators and the Hanafi makruh on horse meat, each one step from the
 *   majority.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const FOOD: KbEntry[] = [
  // -------------------------------------------------------------------------
  // The sea, and the locust
  // -------------------------------------------------------------------------
  {
    id: "abudawud:83:sea-carrion",
    /*
     * 5:3 forbids al-mayta with the definite article, which is general; this
     * report says the sea's dead are lawful. Not modelled as a contest with
     * 5:3 — see the file comment — so the reconciliation the jurists make
     * (the sea's dead are outside the prohibition) is made here, in the class
     * the clause keys on, and stated rather than computed.
     */
    clause: "ruling(consume(Food), mubah) :- instance(Food, sea_carrion).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 83, Jami' at-Tirmidhi 69, Qur'an 5:96",
      text: "Its water is pure and its dead are lawful.",
      textArabic: "هو الطهور ماؤه الحل ميتته",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      notes:
        "Asked about the sea, the Prophet answered with more than was asked. " +
        "Al-Tirmidhi reports al-Bukhari judging it sound. Qur'an 5:96 — " +
        "'lawful to you is the game of the sea and its food' — is read by Ibn " +
        "'Abbas as covering what the sea casts up dead.",
    },
  },
  {
    id: "tax:dead-fish",
    clause: "instance(dead_fish, sea_carrion).",
    evidence: { ...definitional, notes: "A fish that died in the water, not by being caught." },
  },
  {
    id: "tax:floating-dead-fish",
    clause: "instance(floating_dead_fish, sea_carrion).",
    evidence: { ...definitional, notes: "al-samak al-tafi: a fish that died of itself and floated up." },
  },
  {
    id: "abudawud:3815:floating-fish",
    /*
     * Included because it is weak, not despite it. The Hanafis forbid the
     * floating fish, and this is the report that carries their position into
     * the texts. A da'if report cannot qualify a sound one (`admissible` in
     * murajjih.ts), so the sound general permission above stands; the
     * position is still on record and visible, with its grade beside it.
     */
    clause: "ruling(consume(floating_dead_fish), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 3815",
      text:
        "What the sea casts up or the tide leaves, eat it; and what dies in it " +
        "and floats, do not eat it.",
      textArabic: "ما ألقى البحر أو جزر عنه فكلوه وما مات فيه وطفا فلا تأكلوه",
      grade: "daif",
      thubut: "zanni",
      dalala: "qati",
      scope: "khass",
      madhahib: ["hanafi"],
      notes:
        "Abu Dawud himself notes that the reliable narrators stop it at Jabir " +
        "rather than the Prophet, and that the Prophetic attribution is weak. " +
        "The Hanafis also rest the position on Companion reports from 'Ali " +
        "and Ibn 'Abbas, which are not formalised here.",
    },
  },
  {
    id: "bukhari:5495:locust",
    clause: "ruling(consume(locust), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5495, Sahih Muslim 1952, Sunan Ibn Majah 3314",
      text: "We went on seven campaigns with the Prophet, eating locusts.",
      textArabic: "غزونا مع النبي سبع غزوات أو ستا كنا نأكل معه الجراد",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Ibn Majah 3314 names the locust with the fish as the two dead things " +
        "made lawful; the Bukhari report is cited first because it is the " +
        "sounder chain. Locusts need no slaughter, which is why the question " +
        "of how they died does not arise.",
    },
  },

  // -------------------------------------------------------------------------
  // Blood: the unqualified verse and the qualified one
  // -------------------------------------------------------------------------
  {
    id: "quran:5-3:blood-unqualified",
    /*
     * "the blood", with no qualifier, read on its own — which reaches the
     * blood left in the flesh and veins after lawful slaughter. Recorded as a
     * reading of 5:3 rather than folded into the forbidden-food class, so
     * that the qualification below meets it at the ruling and can be seen
     * doing so.
     */
    clause: "ruling(consume(Blood), haram) :- instance(Blood, blood_of_any_kind).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:3",
      text: "Forbidden to you are carrion, blood, the flesh of swine …",
      textArabic: "حُرِّمَتْ عَلَيْكُمُ الْمَيْتَةُ وَالدَّمُ",
      thubut: "qati",
      dalala: "zanni",
      restriction: "mutlaq",
      notes:
        "Unrestricted (mutlaq) in this verse. Whether 'the blood' reaches " +
        "every blood is exactly the question, so the indication is marked " +
        "probable.",
    },
  },
  {
    id: "tax:residual-blood",
    clause: "instance(residual_blood, blood_of_any_kind).",
    evidence: {
      ...definitional,
      notes: "The blood that stays in the meat and veins after the animal is lawfully slaughtered.",
    },
  },
  {
    id: "quran:6-145:flowing-blood",
    clause: "ruling(consume(residual_blood), mubah).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 6:145",
      text:
        "Say: I do not find in what has been revealed to me anything forbidden " +
        "to one who eats it, unless it be carrion, or blood poured forth, or " +
        "the flesh of swine.",
      textArabic: "إِلَّا أَن يَكُونَ مَيْتَةً أَوْ دَمًا مَّسْفُوحًا أَوْ لَحْمَ خِنزِيرٍ",
      thubut: "qati",
      dalala: "zanni",
      restriction: "muqayyad",
      notes:
        "The standard case of reading the unrestricted text in light of the " +
        "restricted one (haml al-mutlaq 'ala al-muqayyad): same ruling, same " +
        "subject, so 'blood' in 5:3 is 'blood poured forth'. Al-Qurtubi " +
        "reports agreement that the blood remaining in the flesh is not " +
        "forbidden. Probable in indication because the permission is taken " +
        "from the qualifier's implication (mafhum al-sifa), which the " +
        "Hanafis do not argue from — though they reach the same ruling.",
    },
  },

  // -------------------------------------------------------------------------
  // Animals the sunnah adds
  // -------------------------------------------------------------------------
  {
    id: "muslim:1933:fanged-predators",
    clause: "ruling(consume(Animal), haram) :- instance_of(Animal, fanged_predator).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1933, Sahih al-Bukhari 5530",
      text: "Every predator with fangs — eating it is forbidden.",
      textArabic: "كل ذي ناب من السباع فأكله حرام",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      madhahib: ["hanafi", "shafii", "hanbali"],
      notes:
        "Deliberately not marked khass. It is a general rule over a class, and " +
        "marking it specific would let it tie the starvation exception on " +
        "specificity and then beat it on directness — telling a starving asker " +
        "that the necessity which lifts carrion does not lift a wolf.",
    },
  },
  {
    id: "maliki:fanged-predators-makruh",
    clause: "ruling(consume(Animal), makruh) :- instance_of(Animal, fanged_predator).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 6:145, as the Malikis read it",
      text: "Say: I do not find in what has been revealed to me anything forbidden to one who eats it, unless …",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["maliki"],
      notes:
        "The well-known Maliki position: the verse's list is exhaustive, so " +
        "the prohibition in the reports is read as strong dislike. haram " +
        "against makruh is one step, and both tell the asker not to eat it.",
    },
  },
  {
    id: "tax:predator-forbidden-animal",
    clause: "subclass(fanged_predator, forbidden_animal).",
    evidence: { ...definitional },
  },
  {
    id: "tax:lion",
    clause: "instance(lion, fanged_predator).",
    evidence: { ...definitional },
  },
  {
    id: "tax:wolf",
    clause: "instance(wolf, fanged_predator).",
    evidence: { ...definitional },
  },
  {
    id: "bukhari:4216:domestic-donkey",
    clause: "ruling(consume(domestic_donkey), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 4216, Sahih Muslim 1407",
      text:
        "The Messenger of Allah forbade, on the day of Khaybar, temporary " +
        "marriage and the eating of the flesh of domestic donkeys.",
      textArabic: "نهى عن متعة النساء يوم خيبر وعن أكل لحوم الحمر الإنسية",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "Domestic donkeys only; the wild ass is lawful game.",
    },
  },
  {
    id: "tax:donkey-forbidden-animal",
    clause: "instance(domestic_donkey, forbidden_animal).",
    evidence: { ...definitional },
  },
  {
    id: "quran:6-119:necessity-reaches-animals",
    /*
     * Without this, a starving asker would find carrion lawful and a wolf not:
     * the starvation exception in scripture.ts keys on the forbidden foods of
     * 5:3, and these animals are forbidden by other texts. 6:119 states the
     * exception for everything "He has detailed as forbidden to you".
     */
    clause: "excepted(consume(Animal), starvation) :- instance_of(Animal, forbidden_animal).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 6:119",
      text:
        "He has explained to you in detail what He has forbidden you, except " +
        "that to which you are compelled.",
      textArabic: "وَقَدْ فَصَّلَ لَكُم مَّا حَرَّمَ عَلَيْكُمْ إِلَّا مَا اضْطُرِرْتُمْ إِلَيْهِ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "bukhari:4219:horse-meat",
    clause: "ruling(consume(horse_meat), mubah).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 4219, Sahih Muslim 1941",
      text:
        "The Messenger of Allah forbade the flesh of donkeys on the day of " +
        "Khaybar, and permitted the flesh of horses.",
      textArabic: "نهى رسول الله يوم خيبر عن لحوم الحمر ورخص في الخيل",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      madhahib: ["shafii", "hanbali"],
      notes:
        "Abu Hanifa's two students, Abu Yusuf and Muhammad, held the same, " +
        "and later Hanafis largely followed them.",
    },
  },
  {
    id: "hanafi:horse-meat-makruh",
    clause: "ruling(consume(horse_meat), makruh).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 16:8, as Abu Hanifa read it",
      text: "And horses, mules and donkeys, for you to ride, and as adornment.",
      textArabic: "وَالْخَيْلَ وَالْبِغَالَ وَالْحَمِيرَ لِتَرْكَبُوهَا وَزِينَةً",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["hanafi", "maliki"],
      notes:
        "Abu Hanifa's position, and one reported from Malik: the verse names " +
        "riding and adornment as what horses are for, beside two animals that " +
        "are not eaten, and mentions no eating. The inference is from silence " +
        "in a list, so its indication is probable.",
    },
  },
];
