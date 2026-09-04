/**
 * The relational and derivational machinery: kinship standing, blocking the
 * means, custom, and presumption of continuity.
 *
 * Where the domain files each answer a family of questions, this one mostly
 * connects them. `kin/2` and `mahram/2` stop being asserted lists and become
 * consequences of the class hierarchy; a contract form settled by trade custom
 * reaches the permission in Qur'an 2:275 through the same clause an ordinary
 * spot sale does; an act that averts a recognised harm picks up a ruling
 * without any text naming that act at all.
 *
 * Those links are the point. A knowledge base of isolated facts can only
 * answer questions someone anticipated; the derivations worth having are the
 * ones nobody wrote down, and they only exist where the predicates actually
 * meet.
 */

import type { KbEntry } from "../entry";

const definitional = { kind: "ontology", reference: "Definitional" } as const;

export const RELATIONS: KbEntry[] = [
  // -------------------------------------------------------------------------
  // Kinship standing, derived rather than listed
  // -------------------------------------------------------------------------
  {
    id: "rel:kin-from-rahim",
    clause: "kin(Relative, ego) :- instance_of(Relative, rahim).",
    evidence: {
      ...definitional,
      notes:
        "Blood relation follows from womb-relation through the hierarchy, so " +
        "adding one relative to the taxonomy gives them kin standing without a " +
        "second assertion that could drift out of step with the first.",
    },
  },
  {
    id: "quran:4-23:mahram-ascendant",
    clause: "mahram(Relative, ego) :- instance_of(Relative, ascendant_kin).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:23",
      text:
        "Forbidden to you are your mothers, your daughters, your sisters, your " +
        "paternal aunts, your maternal aunts, brothers' daughters, sisters' " +
        "daughters …",
      textArabic: "حُرِّمَتْ عَلَيْكُمْ أُمَّهَاتُكُمْ وَبَنَاتُكُمْ وَأَخَوَاتُكُمْ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "The verse lists the permanently unmarriageable relatives by name. " +
        "Split across three clauses by class rather than written as one, " +
        "because the verse's list is not simply 'every womb-relative' — " +
        "cousins are rahim and are not mahram.",
    },
  },
  {
    id: "quran:4-23:mahram-descendant",
    clause: "mahram(Relative, ego) :- instance_of(Relative, descendant_kin).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:23",
      text: "Forbidden to you are … your daughters …",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
    },
  },
  {
    id: "quran:4-23:mahram-sibling",
    clause: "mahram(Relative, ego) :- instance(Relative, collateral_kin).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 4:23",
      text: "Forbidden to you are … your sisters, your paternal aunts, your maternal aunts …",
      thubut: "qati",
      dalala: "zanni",
      scope: "khass",
      notes:
        "Keyed on `instance`, not `instance_of`, and that is the whole care in " +
        "this clause. The verse names siblings, aunts and uncles individually; " +
        "it does not name their children, who are collateral relatives too and " +
        "are famously *not* mahram. Following the inherited membership " +
        "predicate here would have quietly extended the marriage prohibition " +
        "to cousins.",
    },
  },

  // -------------------------------------------------------------------------
  // The positive kinship duty
  // -------------------------------------------------------------------------
  {
    id: "bukhari:5987:silat-al-rahim",
    clause: "ruling(maintain(Relative), wajib) :- instance_of(Relative, rahim).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih al-Bukhari 5987, Sahih Muslim 2554",
      text:
        "Allah said: I am the Most Merciful. I have created the womb-tie and " +
        "derived its name from My name. Whoever keeps it, I keep ties with him, " +
        "and whoever severs it, I sever ties with him.",
      textArabic: "من وصلها وصلته ومن قطعها قطعته",
      grade: "sahih",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "The obverse of the severing-kinship text already in the KB, and the " +
        "reason both are worth holding: one forbids mistreatment, this one " +
        "obliges active upkeep, and a duty to refrain is not a duty to act.",
    },
  },
  {
    id: "bukhari:5971:mother-obligation-derived",
    clause: "obligation_toward(ego, Relative, birr) :- instance_of(Relative, ascendant_kin).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 17:23, Qur'an 31:14",
      text: "And We have enjoined upon man care for his parents.",
      textArabic: "وَوَصَّيْنَا الْإِنسَانَ بِوَالِدَيْهِ",
      thubut: "qati",
      dalala: "qati",
      scope: "khass",
      notes:
        "Extended to grandparents along with parents, which is the majority " +
        "reading of walidayn in the duty of birr, and is why this is keyed on " +
        "the ascendant class rather than on the two named individuals.",
    },
  },

  // -------------------------------------------------------------------------
  // Blocking the means, and its positive counterpart
  // -------------------------------------------------------------------------
  {
    id: "tax:mafsada-darar",
    clause: "instance(darar, mafsada).",
    evidence: { ...definitional, notes: "Harm is a recognised corruption to be averted." },
  },
  {
    id: "tax:mafsada-gharar",
    clause: "instance(gharar, mafsada).",
    evidence: { ...definitional },
  },
  {
    id: "tax:mafsada-fitna",
    clause: "instance(fitna, mafsada).",
    evidence: { ...definitional },
  },
  {
    id: "qaida:darul-mafasid",
    /*
     * dar' al-mafasid muqaddam 'ala jalb al-masalih — averting harms takes
     * precedence over securing benefits.
     *
     * Stated here in its weaker, safer direction only: an act that averts a
     * recognised corruption is at least recommended. The maxim's stronger use
     * — that averting a harm outweighs a competing benefit — is a comparison
     * between two derivations, which is the tarjih layer's job and not
     * something a Horn clause can express.
     */
    clause: "ruling(Act, mandub) :- prevents(Act, Harm), instance_of(Harm, mafsada).",
    evidence: {
      kind: "qaida",
      reference: "dar' al-mafasid muqaddam 'ala jalb al-masalih",
      text: "Averting corruptions takes precedence over securing benefits.",
      textArabic: "درء المفاسد مقدم على جلب المصالح",
      dalala: "zanni",
      notes:
        "An inductive maxim, not a text, so anything resting on it loses to a " +
        "verse or report addressing the same act directly.",
    },
  },
  {
    id: "quran:2-282:document-debt",
    clause: "prevents(document(debt), gharar).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:282",
      text:
        "O you who believe, when you contract a debt for a specified term, write " +
        "it down … and let a scribe write it between you in justice.",
      textArabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰ أَجَلٍ مُّسَمًّى فَاكْتُبُوهُ",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The longest verse in the Qur'an, and entirely about removing " +
        "uncertainty from a debt before it can become a dispute. Recorded as " +
        "prevention rather than as a ruling so the ruling has to be derived, " +
        "and can be argued with.",
    },
  },
  {
    id: "quran:2-282:writing-obligatory",
    /*
     * The minority reading, included on purpose.
     *
     * The verse's imperative is unqualified, and the Zahiris take it at face
     * value: writing the debt down is obligatory. The majority read the verse
     * that immediately follows as showing the command is guidance.
     *
     * Both are in the KB because this is what an honest disagreement looks
     * like: wajib against mandub is one step apart, so the engine reports a
     * spread of opinion rather than a crisis. A KB carrying only majority
     * positions would never produce that, and would present settled and
     * contested questions identically.
     */
    clause: "ruling(document(debt), wajib).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:282",
      text: "When you contract a debt for a specified term, write it down.",
      thubut: "qati",
      dalala: "zanni",
      scope: "amm",
      notes:
        "The Zahiri reading, holding the imperative to its apparent sense. " +
        "The indication is marked probable because that is precisely what is " +
        "in dispute — not whether the verse is authentic, but what it requires.",
    },
  },
  {
    id: "quran:2-283:writing-recommended",
    /*
     * The majority reading, and it has to rest on the verse that actually
     * carries the argument.
     *
     * Modelling it through the harm-aversion maxim instead would have been a
     * quiet misrepresentation: the majority do not hold this because writing
     * debts down is generally prudent, they hold it because 2:283 addresses
     * the very case 2:282 commands and does not require a record. Sourcing it
     * to a maxim also made it lose — an inductive summary scores below a
     * direct verse — so the engine reported the Zahiri position as the
     * verdict. With both readings resting on verses, the specificity rule
     * decides it on the ground the jurists actually argue from.
     */
    clause: "ruling(document(debt), mandub).",
    evidence: {
      kind: "quran",
      reference: "Qur'an 2:283",
      text:
        "And if one of you entrusts another, then let him who is entrusted " +
        "discharge his trust, and let him fear Allah his Lord.",
      textArabic: "فَإِنْ أَمِنَ بَعْضُكُم بَعْضًا فَلْيُؤَدِّ الَّذِي اؤْتُمِنَ أَمَانَتَهُ",
      thubut: "qati",
      dalala: "zanni",
      scope: "khass",
      notes:
        "The majority position. The verse addresses the specific case of " +
        "parties who trust one another and contemplates the debt standing " +
        "without a record at all, which the majority read as showing the " +
        "command in 2:282 to be guidance rather than binding.",
    },
  },

  // -------------------------------------------------------------------------
  // Custom
  // -------------------------------------------------------------------------
  {
    id: "qaida:al-ada-muhakkama",
    clause: "attribute(Contract, sound_sale) :- custom(traders, Contract).",
    evidence: {
      kind: "qaida",
      reference: "al-'ada muhakkama",
      text: "Custom is arbitral.",
      textArabic: "العادة محكمة",
      dalala: "zanni",
      notes:
        "Confined to contract forms, and only where the texts name no defect. " +
        "Custom settles what the parties are taken to have agreed; it does not " +
        "override a prohibition, which is why this concludes soundness — " +
        "feeding the permission in 2:275 — rather than concluding a ruling of " +
        "its own. A customary contract that causes riba is still forbidden, " +
        "because that rule keys on the defect and fires regardless.",
    },
  },
  {
    id: "urf:instalment-sale",
    clause: "custom(traders, instalment_sale).",
    evidence: {
      kind: "urf",
      reference: "Settled commercial practice",
      dalala: "zanni",
      notes:
        "Sale at a higher price for deferred payment, the price fixed at " +
        "contract. Long-settled among traders and distinguished from riba by " +
        "the price being fixed once rather than growing with time.",
    },
  },

  // -------------------------------------------------------------------------
  // Presumption of continuity
  // -------------------------------------------------------------------------
  {
    id: "istishab:certain-purity",
    clause: "certain(state(purity)) :- circumstance(certain_prior_purity).",
    evidence: {
      kind: "usul",
      reference: "Istishab: the presumption that an established state continues",
      dalala: "zanni",
      notes:
        "Only the asker can say whether they were certain, so this is keyed on " +
        "a premise they supply rather than on anything the KB could know.",
    },
  },
  {
    id: "muslim:362:doubt-does-not-void",
    /*
     * al-yaqin la yazul bi'l-shakk, in the only form this engine can state
     * honestly.
     *
     * qawaid.ts explains why the maxim is not in the KB as a general
     * principle: "nothing here contradicts it" needs negation-as-failure, and
     * an engine with that would convert its own gaps into permissions. This
     * clause avoids the trap by requiring the asker to positively assert both
     * halves — that the earlier state was certain, and that what displaces it
     * is only doubt. Silence produces nothing, which is the correct answer.
     */
    clause:
      "validity(perform(obligatory_prayer), sahih) :- condition(obligatory_prayer, purity), certain(state(purity)), circumstance(doubt_about_breaking_purity).",
    evidence: {
      kind: "sunnah",
      reference: "Sahih Muslim 362, Sahih al-Bukhari 137",
      text:
        "If one of you finds a disturbance in his abdomen and is unsure whether " +
        "anything has issued from him, let him not leave the mosque unless he " +
        "hears a sound or finds a smell.",
      grade: "sahih",
      thubut: "qati",
      dalala: "qati",
      notes:
        "The report the maxim is drawn from, and it is decided exactly this " +
        "way: an established certainty is not displaced by a doubt, only by " +
        "another certainty.",
    },
  },
];
