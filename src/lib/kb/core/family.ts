/**
 * Marriage: who may and may not be married.
 *
 * relations.ts already derived mahram standing from the class hierarchy and
 * nothing consumed it. This is the ruling that standing exists for. It also
 * fills in the three relationships the hierarchy had no room for:
 *
 * - cousins, who are womb-relatives and are *not* mahram — the case the
 *   collateral-kin mahram clause was written to keep out;
 * - milk kinship, which makes a person mahram without making them kin at
 *   all: no inheritance, no duty of silat al-rahim;
 * - the women unlawful only in combination — a wife's sister or aunt — who
 *   are neither mahram nor freely marriageable.
 *
 * No general "everyone else is lawful" clause. Qur'an 4:24 does say "lawful
 * to you is what is beyond these", but the engine has no negation as failure
 * (see qawaid.ts), so the permission can only be given to classes the KB
 * positively names.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const FAMILY: KbEntry[] = [
  // -------------------------------------------------------------------------
  // The relationships the hierarchy lacked
  // -------------------------------------------------------------------------
  {
    id: "tax:cousin-is-collateral",
    /*
     * A subclass, not direct `instance(_, collateral_kin)` facts, and the
     * difference is load-bearing: the 4:23 mahram clause keys on direct
     * membership precisely so that cousins inherit rahim standing without
     * inheriting the marriage prohibition.
     */
    clause: "subclass(cousin_kin, collateral_kin).",
    evidence: { ...definitional, notes: "Children of aunts and uncles: womb-relatives, one step further out." },
  },
  {
    id: "tax:cousin-paternal",
    clause: "instance(cousin_paternal, cousin_kin).",
    evidence: { ...definitional, notes: "A child of the father's brother or sister." },
  },
  {
    id: "tax:cousin-maternal",
    clause: "instance(cousin_maternal, cousin_kin).",
    evidence: { ...definitional, notes: "A child of the mother's brother or sister." },
  },
  {
    id: "tax:niece",
    clause: "instance(niece, collateral_kin).",
    evidence: {
      ...definitional,
      notes: "A brother's or sister's daughter — named in 4:23, so a direct member and mahram.",
    },
  },
  {
    id: "tax:mother-in-law",
    clause: "instance(mother_in_law, affinal_kin).",
    evidence: { ...definitional },
  },
  {
    id: "tax:wifes-sister",
    clause: "instance(wifes_sister, affinal_kin).",
    evidence: { ...definitional },
  },
  {
    id: "tax:milk-mother",
    clause: "instance(milk_mother, milk_kin).",
    evidence: { ...definitional, notes: "A woman who nursed one in infancy." },
  },
  {
    id: "tax:milk-sibling",
    clause: "instance(milk_sibling, milk_kin).",
    evidence: { ...definitional, notes: "Someone nursed by the same woman." },
  },

  // -------------------------------------------------------------------------
  // Mahram standing beyond blood
  // -------------------------------------------------------------------------
  {
    id: "quran:4-23:mahram-mother-in-law",
    clause: "mahram(mother_in_law, ego).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:23",
      text: "Forbidden to you are … the mothers of your wives …",
      textArabic: "وَأُمَّهَاتُ نِسَائِكُمْ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "By the marriage contract alone, on the majority reading, whether or " +
        "not the marriage to her daughter was consummated.",
    },
  },
  {
    id: "bukhari:2645:milk-kin-mahram",
    /*
     * Milk kin are deliberately not placed under `kin` or `rahim`. They share
     * the marriage prohibition and nothing else — they do not inherit, and
     * the severing-kinship texts do not reach them — and a subclass link
     * would have handed them all of it.
     */
    clause: "mahram(Relative, ego) :- instance(Relative, milk_kin).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 2645, Sahih Muslim 1447, Qur'an 4:23",
      text: "What is forbidden by lineage is forbidden by nursing.",
      textArabic: "يحرم من الرضاع ما يحرم من النسب",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "4:23 names the milk mother and milk sister; the report extends the " +
        "list to every relation lineage forbids. How much nursing establishes " +
        "it — five sucklings for the Shafi'is and Hanbalis, any amount for " +
        "the Hanafis and Malikis — is not modelled.",
    },
  },

  // -------------------------------------------------------------------------
  // The rulings
  // -------------------------------------------------------------------------
  {
    id: "quran:4-23:no-marrying-mahram",
    clause: "ruling(marry(Relative), haram) :- mahram(Relative, ego).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:23",
      text:
        "Forbidden to you are your mothers, your daughters, your sisters, your " +
        "paternal aunts, your maternal aunts, your brothers' daughters, your " +
        "sisters' daughters, your mothers who nursed you, your sisters through " +
        "nursing, the mothers of your wives …",
      textArabic: "حُرِّمَتْ عَلَيْكُمْ أُمَّهَاتُكُمْ وَبَنَاتُكُمْ وَأَخَوَاتُكُمْ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Stated over `mahram/2` rather than per relative, so the prohibition " +
        "follows the standing wherever relations.ts or this file derives it. " +
        "Written from the man's side, as the verse is; the relation runs the " +
        "other way unchanged.",
    },
  },
  {
    id: "quran:33-50:cousins-lawful",
    clause: "ruling(marry(Relative), mubah) :- instance(Relative, cousin_kin).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 33:50, Qur'an 4:24",
      text:
        "O Prophet, We have made lawful to you … the daughters of your paternal " +
        "uncle, the daughters of your paternal aunts, the daughters of your " +
        "maternal uncle and the daughters of your maternal aunts.",
      textArabic: "وَبَنَاتِ عَمِّكَ وَبَنَاتِ عَمَّاتِكَ وَبَنَاتِ خَالِكَ وَبَنَاتِ خَالَاتِكَ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Addressed to the Prophet, but cousins are not among the things " +
        "particular to him, and 4:24's 'lawful to you is what is beyond " +
        "these' reaches the whole community — cousins being absent from the " +
        "list just before it.",
    },
  },
  {
    id: "quran:4-23:not-two-sisters",
    clause: "ruling(marry(wifes_sister), haram).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:23",
      text: "… and that you take two sisters together, except what has already passed.",
      textArabic: "وَأَن تَجْمَعُوا بَيْنَ الْأُخْتَيْنِ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "Forbidden in combination, not permanently: while the marriage to her " +
        "sister stands, including, for most schools, her waiting period after " +
        "a revocable divorce. Hence not `mahram` — she must still observe hijab " +
        "before him.",
    },
  },
  {
    id: "bukhari:5109:not-wife-and-her-aunt",
    clause: "ruling(marry(wifes_aunt), haram).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5109, Sahih Muslim 1408",
      text: "A woman may not be combined in marriage with her paternal aunt, nor with her maternal aunt.",
      textArabic: "لا يجمع بين المرأة وعمتها ولا بين المرأة وخالتها",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "The standard example of the sunnah specifying the Qur'an: 4:24's " +
        "permission of 'what is beyond these' would otherwise reach her, since " +
        "4:23 names only two sisters. Accepted by all four schools.",
    },
  },
];
