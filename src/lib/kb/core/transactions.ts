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
    /*
     * Was recorded as consensus. It is not: the consensus is on the
     * prohibition and on the excess being returned. Whether the contract
     * itself is void or only defective is the standing disagreement between
     * the majority and the Hanafis, who are the ones that draw the
     * fasid/batil line at all.
     */
    clause: "validity(Deal, batil) :- causes(Deal, riba).",
    evidence: {
      kind: "usul",
      reference: "The majority on the effect of riba on a contract",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["maliki", "shafii", "hanbali"],
      notes:
        "The prohibition and its effect on the contract are separate claims. " +
        "That an interest-bearing loan is sinful is in the verse; that the " +
        "contract is void and conveys nothing is the majority's juristic " +
        "consequence, recorded as its own clause so it can be weighed and " +
        "disagreed with separately.",
    },
  },
  {
    id: "hanafi:riba-fasid",
    // Sales only. A loan with a stipulated excess is a different case for the
    // Hanafis — the condition falls away and the loan stands — and saying
    // fasid of it would put a position in their mouth they do not hold.
    clause: "validity(sell(Contract), fasid) :- causes(sell(Contract), riba).",
    evidence: {
      kind: "usul",
      reference: "The Hanafi classification of a ribawi contract",
      thubut: "qati",
      dalala: "zanni",
      madhahib: ["hanafi"],
      notes:
        "For the Hanafis riba in an exchange is a defect in an attribute of " +
        "the contract — the excess — not in its essence, so the sale is fasid: " +
        "it must be rescinded, and it conveys ownership once the goods are " +
        "taken into possession. fasid against batil is one step apart, so the " +
        "engine reports a spread rather than a contradiction, which is what " +
        "this disagreement is.",
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
    id: "muslim:1598:riba-borrower",
    /*
     * The same report names four parties, and the KB modelled only the one
     * taking the interest. The borrower who pays it (mu'kil) is named in the
     * report itself, so this is the text, not the maxim "what is forbidden to
     * take is forbidden to give" standing in for it.
     */
    clause: "ruling(borrow(Loan), haram) :- causes(lend(Loan), riba).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1598",
      text: "The Messenger of Allah cursed the one who consumes riba, the one who pays it …",
      textArabic: "لعن رسول الله آكل الربا وموكله",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Some contemporary bodies permit an interest-bearing loan under " +
        "genuine necessity through the darura rule; no `excepted` pairing " +
        "exists for it here, so the engine does not extend that concession.",
    },
  },
  {
    id: "muslim:1598:riba-scribe",
    clause: "ruling(document(Loan), haram) :- causes(lend(Loan), riba).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 1598",
      text: "… the one who records it and its two witnesses, and said: they are all alike.",
      textArabic: "وكاتبه وشاهديه وقال هم سواء",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Meets the debt-recording verse in relations.ts at the act and not at " +
        "the ruling: 2:282 is about `debt`, this about a riba loan, so writing " +
        "down a lawful debt stays recommended and writing down a ribawi one " +
        "is forbidden.",
    },
  },
  {
    id: "abudawud:3580:bribery",
    clause: "ruling(give(bribe), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 3580, Jami' at-Tirmidhi 1337",
      text: "The Messenger of Allah cursed the one who gives a bribe and the one who takes it.",
      textArabic: "لعن رسول الله الراشي والمرتشي",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      notes:
        "Many jurists allow paying to obtain a right that cannot be had " +
        "otherwise, placing the sin on the taker alone. That exception is " +
        "not formalised.",
    },
  },
  {
    id: "abudawud:3580:taking-bribe",
    clause: "ruling(take(bribe), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 3580, Jami' at-Tirmidhi 1337, Qur'an 2:188",
      text: "… and the one who takes it.",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
    },
  },
  {
    id: "bukhari:2177:riba-exchange",
    clause: "causes(sell(unequal_gold_exchange), riba).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2177, Sahih Muslim 1584",
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
    id: "quran:5-90:maysir",
    /*
     * The verse names gambling outright. Without this clause the only route
     * to its prohibition ran through gharar and Muslim 1513, whose indication
     * is probable — so the engine presented the ruling on gambling as weaker
     * than the ruling on wine, though both stand in the same sentence.
     */
    clause: "ruling(play(maysir), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 5:90",
      text:
        "O you who believe, intoxicants, gambling, idols and divining arrows are " +
        "but defilement from the work of Satan, so avoid it, that you may succeed.",
      textArabic: "إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ فَاجْتَنِبُوهُ",
      thubut: "qati",
      dalala: "qati",
      notes: "'rijs' and the command to avoid it carry the same certainty here as they do for khamr.",
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
