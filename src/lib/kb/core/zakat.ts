/**
 * Zakat: who owes it, and to whom it can be given.
 *
 * Both halves turn on facts the KB cannot know. Whether the asker owes zakat
 * depends on what they hold and for how long, so the obligation is keyed on
 * a circumstance, as hajj is on capacity. Whether a payment discharges it
 * depends on who received it, which is a validity question: zakat given to
 * one's own parent is not forbidden so much as ineffective — it was never
 * zakat, and is still owed.
 *
 * The nisab thresholds and rates are not modelled. The numeric builtins could
 * compare them, but grounding does not extract amounts, and a threshold the
 * asker cannot reach from a question is worse than none.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const ZAKAT: KbEntry[] = [
  {
    id: "quran:2-43:zakat-owed",
    clause: "ruling(perform(zakat), wajib) :- circumstance(nisab_held_for_year).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:43, Sunan Abi Dawud 1573",
      text: "And establish prayer and give zakat.",
      textArabic: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The verse obliges zakat; the conditions on whom it falls — wealth at " +
        "or above the nisab, held a full lunar year — come from the sunnah " +
        "(Abu Dawud 1573: 'no zakat is due on wealth until a year has passed " +
        "over it') and are agreed for money and trade goods. Crops are due at " +
        "harvest with no year, which this clause does not cover.",
    },
  },
  {
    id: "tax:zakat-is-ibada",
    clause: "instance(zakat, ibada).",
    evidence: { ...definitional },
  },

  // -------------------------------------------------------------------------
  // To whom it may be given
  // -------------------------------------------------------------------------
  {
    id: "quran:9-60:recipients",
    clause: "validity(give_zakat_to(Recipient), sahih) :- instance(Recipient, zakat_recipient).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 9:60",
      text:
        "Zakat is only for the poor and the needy, those who collect it, those " +
        "whose hearts are to be reconciled, the freeing of captives, debtors, " +
        "the cause of Allah, and the wayfarer.",
      textArabic: "إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "'Only' (innama) confines it to the eight, which is why the permission " +
        "is given to named classes rather than inferred for anyone the KB " +
        "does not object to.",
    },
  },
  {
    id: "tax:recipient-poor",
    clause: "instance(the_poor, zakat_recipient).",
    evidence: { ...definitional },
  },
  {
    id: "tax:recipient-needy",
    clause: "instance(the_needy, zakat_recipient).",
    evidence: { ...definitional },
  },
  {
    id: "tax:recipient-debtor",
    clause: "instance(debtor, zakat_recipient).",
    evidence: { ...definitional, notes: "Someone unable to pay a debt taken on for a lawful need." },
  },
  {
    id: "tax:recipient-wayfarer",
    clause: "instance(wayfarer, zakat_recipient).",
    evidence: { ...definitional, notes: "A traveller cut off from their means, whatever they own at home." },
  },
  {
    id: "ijma:not-to-ascendants",
    clause: "validity(give_zakat_to(Relative), batil) :- instance_of(Relative, ascendant_kin).",
    evidence: {
      kind: "ijma",
      reference: "Consensus reported by Ibn al-Mundhir, al-Ijma'",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Parents and grandparents are owed maintenance by the giver already, " +
        "so zakat paid to them returns to the giver's own benefit. Keyed on " +
        "the ascendant class so it reaches grandparents, as the consensus does.",
    },
  },
  {
    id: "ijma:not-to-descendants",
    clause: "validity(give_zakat_to(Relative), batil) :- instance_of(Relative, descendant_kin).",
    evidence: {
      kind: "ijma",
      reference: "Consensus reported by Ibn al-Mundhir, al-Ijma'",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The same reasoning for children and grandchildren. Siblings and other " +
        "relatives are not covered: most schools allow zakat to a poor sibling, " +
        "and that permission is not formalised.",
    },
  },
  {
    id: "abudawud:1634:not-to-the-wealthy",
    clause: "validity(give_zakat_to(wealthy_person), batil).",
    evidence: {
      kind: "sunnah",
      reference: "Sunan Abi Dawud 1634, Jami' at-Tirmidhi 652",
      text: "Charity is not lawful for the wealthy, nor for one strong and able-bodied.",
      textArabic: "لا تحل الصدقة لغني ولا لذي مرة سوي",
      grade: "sahih",
      thubut: "zanni",
      dalala: "qati",
      notes:
        "Where the giver made reasonable inquiry and was mistaken, the Hanafis " +
        "and a view among the others count the payment; the clause covers the " +
        "case where the recipient's wealth is known.",
    },
  },
];
