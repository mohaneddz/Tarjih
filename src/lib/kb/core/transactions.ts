/**
 * Mu'amalat — commercial dealings.
 *
 * The first domain where the two ruling axes come apart, and the reason the
 * ontology carries both. A defective sale asks two different questions with
 * two different answers: *may I do this* (al-hukm al-taklifi — sinful or not)
 * and *did anything happen* (al-hukm al-wad'i — did ownership transfer). A
 * contract can be forbidden to enter and still transfer title; another can be
 * entered in good faith and be void. Collapsing them would leave the parties
 * without the answer they actually need.
 *
 * The prohibitions here are stated narrowly. Riba and gharar have enormous
 * modern literature attached, almost none of it agreed, so what is formalised
 * is the part the texts settle: the named contracts and the two defects the
 * verses and reports name outright.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const TRANSACTIONS: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Riba
  // -------------------------------------------------------------------------
  {
    id: "quran:2-275:riba",
    clause: "ruling(Deal, haram) :- causes(Deal, riba).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:275",
      text: "Allah has permitted trade and forbidden usury.",
      textArabic: "وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "The clearest possible pairing: the same verse permits the general " +
        "category and forbids the specific defect, which is why the defect and " +
        "not the transaction is what the rule keys on.",
    },
  },
  {
    id: "quran:2-275:validity",
    clause: "validity(Deal, batil) :- causes(Deal, riba).",
    evidence: {
      kind: "ijma",
      reference: "Consensus on the effect of riba on a contract",
      thubut: "qati",
      dalala: "zanni",
      notes:
        "The prohibition and its effect on the contract are separate claims. " +
        "That an interest-bearing loan is sinful is in the verse; that the " +
        "excess is legally without effect and must be returned is the agreed " +
        "juristic consequence, recorded as its own clause so it can be " +
        "weighed and disagreed with separately.",
    },
  },
  {
    id: "muslim:1598:riba-loan",
    clause: "causes(lend(interest_loan), riba).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1598",
      text:
        "The Messenger of Allah cursed the one who consumes riba, the one who " +
        "pays it, the one who records it and its two witnesses, and said: they " +
        "are all alike.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes: "A loan repaid with a stipulated excess is the paradigm case.",
    },
  },
  {
    id: "bukhari:2178:riba-exchange",
    clause: "causes(sell(unequal_gold_exchange), riba).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2178, Sahih Muslim 1584",
      text:
        "Do not sell gold for gold except like for like, and do not give one " +
        "more than the other; and do not sell silver for silver except like for " +
        "like, and do not give one more than the other.",
      textArabic: "لا تبيعوا الذهب بالذهب إلا مثلا بمثل",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "riba al-fadl: excess in a hand-to-hand exchange of the same genus. " +
        "Distinct from the riba of a deferred loan, and named separately " +
        "because the two rest on different reports.",
    },
  },

  // -------------------------------------------------------------------------
  // Gharar
  // -------------------------------------------------------------------------
  {
    id: "muslim:1513:gharar",
    clause: "ruling(Deal, haram) :- causes(Deal, gharar).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1513",
      text:
        "The Messenger of Allah forbade the sale of the pebble and the sale " +
        "involving uncertainty.",
      textArabic: "نهى رسول الله عن بيع الحصاة وعن بيع الغرر",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "Certainly transmitted; probable in what it indicates, because the " +
        "report does not say how much uncertainty is fatal. Every sale carries " +
        "some. The jurists confine it to gharar that is excessive and that " +
        "concerns the substance of the contract, which is a judgement the " +
        "engine does not make for you — it fires only where the KB has " +
        "asserted the defect.",
    },
  },
  {
    id: "gharar:validity",
    clause: "validity(Deal, batil) :- causes(Deal, gharar).",
    evidence: {
      kind: "ijma",
      reference: "Consensus on the effect of excessive gharar",
      thubut: "qati",
      dalala: "zanni",
      notes: "Excessive uncertainty about the object voids the contract in its essence.",
    },
  },
  {
    id: "gharar:unborn-calf",
    clause: "causes(sell(unborn_calf), gharar).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2143, Sahih Muslim 1514",
      text: "The Prophet forbade the sale of the offspring of the offspring of a she-camel.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "habal al-habala: a named instance rather than an inference, so the " +
        "engine is not being asked to judge how much uncertainty is too much.",
    },
  },
  {
    id: "gharar:undelivered-catch",
    clause: "causes(sell(fish_still_in_water), gharar).",
    evidence: {
      kind: "usul",
      reference: "Classical instance of excessive gharar",
      dalala: "zanni",
      notes:
        "Neither existence nor deliverability is established at contract time. " +
        "Recorded as a juristic identification, not a text.",
    },
  },
  {
    id: "gharar:maysir",
    clause: "causes(play(maysir), gharar).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:90",
      text:
        "O you who believe, intoxicants, gambling, idols and divining arrows are " +
        "but defilement from the work of Satan, so avoid it.",
      textArabic: "إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Gambling is named in the same verse as khamr. The link to gharar is " +
        "recorded because the exchange is entirely contingent on an unknown " +
        "outcome — the defect in its purest form.",
    },
  },

  // -------------------------------------------------------------------------
  // The permitted default, and what it is not
  // -------------------------------------------------------------------------
  {
    id: "quran:2-275:trade-permitted",
    /*
     * Scoped to sales the KB has positively marked sound, never stated as a
     * blanket "sales are permitted".
     *
     * The verse does say trade at large is lawful, but the engine has no
     * negation-as-failure, so a general clause here would be indistinguishable
     * from "every sale this KB has not yet learned to object to is fine" — the
     * corpus's own gaps rendered as permissions. See the closing note in
     * qawaid.ts on why that trade is never worth making.
     */
    clause: "ruling(sell(Contract), mubah) :- attribute(Contract, sound_sale).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:275",
      text: "Allah has permitted trade and forbidden usury.",
      thubut: "qati",
      dalala: "qati",
      scope: "amm",
      notes:
        "Applied only to contracts explicitly marked sound. The permission in " +
        "the verse is real, but the engine cannot tell 'no defect exists' from " +
        "'no defect has been formalised yet', so it will not infer soundness.",
    },
  },
  {
    id: "sound:spot-sale",
    clause: "attribute(spot_sale, sound_sale).",
    evidence: {
      ...definitional,
      notes: "Price and goods both known and exchanged at once: no gharar, no excess.",
    },
  },
  {
    id: "sound:salam",
    clause: "attribute(salam_contract, sound_sale).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2240, Sahih Muslim 1604",
      text:
        "Whoever pays in advance for something, let him pay for a known volume " +
        "and a known weight, for a known term.",
      textArabic: "من أسلف في شيء ففي كيل معلوم ووزن معلوم إلى أجل معلوم",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Worth its place because it is the exception that shows the rule is " +
        "about uncertainty and not about time: paying now for goods delivered " +
        "later would look like gharar, and is permitted precisely because the " +
        "quantity, quality and term are all fixed at contract.",
    },
  },

  // -------------------------------------------------------------------------
  // Contract validity as a matter of conditions being met
  // -------------------------------------------------------------------------
  {
    id: "condition:sale-ownership",
    clause: "condition(sell(Contract), ownership) :- attribute(Contract, sound_sale).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 3503, Jami' at-Tirmidhi 1232",
      text: "Do not sell what you do not have.",
      textArabic: "لا تبع ما ليس عندك",
      grade: "hasan",
      thubut: "zanni",
      dalala: "zanni",
      notes:
        "Recorded as a condition rather than a prohibition: what the report " +
        "settles is what a valid sale requires, and salam is the standing proof " +
        "that it is not a flat ban on selling what is not yet in hand.",
    },
  },
];
