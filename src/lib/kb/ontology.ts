/**
 * The controlled predicate vocabulary the knowledge base is written in.
 *
 * Every clause — hand-authored or LLM-formalised — must use these predicates
 * with these arities. That constraint is what makes the KB composable: a rule
 * derived from a hadith in the 9th century and a maxim from a modern nawazil
 * ruling can chain together only if they talk about the world in the same
 * terms. It is also the main defence against the formalisation pipeline
 * inventing a plausible-looking predicate that nothing else can ever match.
 */

// ---------------------------------------------------------------------------
// Al-Ahkam al-Taklifiyya — the five defining rulings
// ---------------------------------------------------------------------------

export const AHKAM_TAKLIFIYYA = ["wajib", "mandub", "mubah", "makruh", "haram"] as const;
export type Hukm = (typeof AHKAM_TAKLIFIYYA)[number];

/** Where each ruling sits on the obligation-to-prohibition axis. */
const HUKM_POLARITY: Record<Hukm, number> = {
  wajib: 2, // required; omission is sinful
  mandub: 1, // encouraged; omission is not sinful
  mubah: 0, // legally neutral
  makruh: -1, // discouraged; commission is not sinful
  haram: -2, // forbidden; commission is sinful
};

export const HUKM_LABELS: Record<Hukm, { en: string; ar: string; gloss: string }> = {
  wajib: { en: "Obligatory", ar: "واجب", gloss: "Required; omitting it incurs sin." },
  mandub: { en: "Recommended", ar: "مندوب", gloss: "Encouraged and rewarded; omitting it does not incur sin." },
  mubah: { en: "Permitted", ar: "مباح", gloss: "Legally neutral; neither rewarded nor blamed." },
  makruh: { en: "Discouraged", ar: "مكروه", gloss: "Disliked; avoiding it is rewarded, doing it is not sinful." },
  haram: { en: "Forbidden", ar: "حرام", gloss: "Prohibited; committing it incurs sin." },
};

export function isHukm(value: string): value is Hukm {
  return (AHKAM_TAKLIFIYYA as readonly string[]).includes(value);
}

/**
 * How sharply two rulings for the same act conflict.
 *
 * The five ahkam are mutually exclusive, so any two distinct values are a
 * conflict — but they are not equally serious. `wajib` against `haram` is a
 * genuine contradiction that the tarjih layer must resolve before it can
 * answer at all. `mubah` against `makruh` is the ordinary spread of scholarly
 * opinion and can honestly be presented as a range. Flattening the two would
 * either manufacture false crises or bury real ones.
 */
export function conflictSeverity(a: Hukm, b: Hukm): number {
  return Math.abs(HUKM_POLARITY[a] - HUKM_POLARITY[b]);
}

/** True when the two rulings sit on opposite sides of permissibility. */
export function contradicts(a: Hukm, b: Hukm): boolean {
  return conflictSeverity(a, b) >= 3;
}

// ---------------------------------------------------------------------------
// Al-Ahkam al-Wad'iyya — declaratory rulings, mostly for transactions
// ---------------------------------------------------------------------------

export const VALIDITY_VALUES = ["sahih", "fasid", "batil"] as const;
export type Validity = (typeof VALIDITY_VALUES)[number];

export const VALIDITY_LABELS: Record<Validity, { en: string; ar: string; gloss: string }> = {
  sahih: { en: "Valid", ar: "صحيح", gloss: "Sound in both its essence and its attributes; legally effective." },
  fasid: { en: "Defective", ar: "فاسد", gloss: "Sound in essence but defective in an attribute; may be rectifiable." },
  batil: { en: "Void", ar: "باطل", gloss: "Defective in its essence; legally without effect." },
};

// ---------------------------------------------------------------------------
// Predicate registry
// ---------------------------------------------------------------------------

export interface PredicateSpec {
  readonly name: string;
  readonly arity: number;
  /** What a true instance of this predicate asserts. */
  readonly meaning: string;
  readonly args: readonly string[];
  readonly group: PredicateGroup;
  /** Written by hand or emitted by the formalisation pipeline. */
  readonly example: string;
}

export type PredicateGroup =
  | "deontic"
  | "causal"
  | "taxonomy"
  | "relational"
  | "circumstantial"
  | "derivational";

function spec(
  name: string,
  args: string[],
  group: PredicateGroup,
  meaning: string,
  example: string
): PredicateSpec {
  return { name, arity: args.length, args, group, meaning, example };
}

/**
 * Acts are ordinary compound terms — `mistreat(aunt)`, `consume(alcohol)`,
 * `sell(gharar_contract)` — rather than a fixed `act(Verb, Object)` wrapper.
 * This keeps clauses readable and still allows fully general rules, since a
 * bare variable in the act position ranges over every act.
 */
export const PREDICATES: readonly PredicateSpec[] = [
  // --- Deontic: the goal predicates a query resolves to ---
  spec(
    "ruling",
    ["Act", "Hukm"],
    "deontic",
    "Act carries the defining ruling Hukm, one of the five ahkam taklifiyya.",
    "ruling(mistreat(aunt), haram)"
  ),
  spec(
    "validity",
    ["Transaction", "Validity"],
    "deontic",
    "Transaction is sahih, fasid, or batil. Used for contracts and acts of worship.",
    "validity(sale(gharar), batil)"
  ),

  // --- Causal: the machinery of qiyas and the maxims ---
  spec(
    "illah",
    ["Case", "Cause"],
    "causal",
    "Cause is the effective cause ('illa) of the ruling on Case: the manifest, " +
      "constant attribute the ruling actually turns on. This is the pivot of qiyas — " +
      "a ruling transfers between cases only through a shared 'illa.",
    "illah(consume(wine), intoxication)"
  ),
  spec(
    "hikma",
    ["Case", "Wisdom"],
    "causal",
    "Wisdom is the underlying benefit or harm the ruling on Case aims at. " +
      "Deliberately kept distinct from illah: hikma is often hidden or immeasurable, " +
      "and the majority of usulis hold that qiyas may not be built on it. Rules that " +
      "reason from hikma must say so, so the tarjih layer can weight them lower.",
    "hikma(prohibit(wine), preservation_of_intellect)"
  ),
  spec(
    "causes",
    ["Act", "Effect"],
    "causal",
    "Act brings about Effect, e.g. darar (harm), maslaha (benefit), fitna (discord).",
    "causes(mistreat(kin), darar)"
  ),
  spec(
    "prevents",
    ["Act", "Effect"],
    "causal",
    "Act blocks Effect from arising. Underpins sadd al-dhara'i.",
    "prevents(safeguard(contract), gharar)"
  ),

  // --- Taxonomy: lets one rule cover a whole class ---
  spec(
    "instance",
    ["Entity", "Class"],
    "taxonomy",
    "Entity is a member of Class.",
    "instance(aunt, kin)"
  ),
  spec(
    "subclass",
    ["Sub", "Super"],
    "taxonomy",
    "Every member of Sub is a member of Super. Transitive; closure is derived.",
    "subclass(maternal_kin, kin)"
  ),
  spec(
    "attribute",
    ["Entity", "Attribute"],
    "taxonomy",
    "Entity bears Attribute.",
    "attribute(khamr, intoxicating)"
  ),

  // --- Relational: kinship and standing ---
  spec("kin", ["A", "B"], "relational", "A is a blood relative of B.", "kin(aunt, ego)"),
  spec(
    "mahram",
    ["A", "B"],
    "relational",
    "A is permanently unmarriageable to B, with the attendant rights and duties.",
    "mahram(aunt, ego)"
  ),
  spec(
    "ascendant",
    ["A", "B"],
    "relational",
    "A is a direct ancestor of B.",
    "ascendant(mother, ego)"
  ),
  spec(
    "obligation_toward",
    ["Agent", "Party", "Duty"],
    "relational",
    "Agent owes Duty to Party.",
    "obligation_toward(ego, mother, birr)"
  ),

  // --- Circumstantial: what changes a ruling in a given situation ---
  spec(
    "condition",
    ["Act", "Condition"],
    "circumstantial",
    "Condition (shart) must hold for Act to be valid or obligatory.",
    "condition(prayer, purity)"
  ),
  spec(
    "impediment",
    ["Act", "Impediment"],
    "circumstantial",
    "Impediment (mani') blocks a ruling that would otherwise apply.",
    "impediment(fasting, menstruation)"
  ),
  spec(
    "necessity",
    ["Situation"],
    "circumstantial",
    "Situation constitutes darura: a threat to one of the five essentials.",
    "necessity(starvation)"
  ),
  spec(
    "hardship",
    ["Situation", "Degree"],
    "circumstantial",
    "Situation involves mashaqqa of the given Degree (mu'tada or ghayr_mu'tada). " +
      "Only extraordinary hardship triggers a concession.",
    "hardship(travel, ghayr_mu'tada)"
  ),
  spec(
    "custom",
    ["Community", "Practice"],
    "circumstantial",
    "Practice is the settled custom ('urf) of Community. Arbitrates where texts are silent.",
    "custom(traders, delayed_delivery)"
  ),
  spec(
    "intention",
    ["Agent", "Act", "Purpose"],
    "circumstantial",
    "Agent performs Act for Purpose. Drives 'actions are by intentions'.",
    "intention(buyer, purchase(shares), long_term_holding)"
  ),
  spec(
    "certain",
    ["Proposition"],
    "circumstantial",
    "Proposition is established with certainty (yaqin) rather than mere doubt (shakk).",
    "certain(state(purity))"
  ),

  // --- Derivational: bookkeeping the reasoning rules need ---
  spec(
    "established",
    ["Proposition"],
    "derivational",
    "Proposition is settled by an explicit text or by ijma', and so may serve as " +
      "the source case (asl) of an analogy.",
    "established(ruling(consume(wine), haram))"
  ),
  spec(
    "text_specific",
    ["Case"],
    "derivational",
    "The ruling on Case is a concession peculiar to it and may not be generalised " +
      "by qiyas. Blocks analogy from rulings that are explicitly exceptional.",
    "text_specific(testimony(khuzayma))"
  ),
  spec(
    "excepted",
    ["Act", "Reason"],
    "derivational",
    "Act is exempted from the ruling that would otherwise cover it, for Reason.",
    "excepted(consume(carrion), necessity)"
  ),
];

const BY_KEY = new Map<string, PredicateSpec>(PREDICATES.map((p) => [`${p.name}/${p.arity}`, p]));

export function lookupPredicate(name: string, arity: number): PredicateSpec | undefined {
  return BY_KEY.get(`${name}/${arity}`);
}

export function predicateKeys(): string[] {
  return [...BY_KEY.keys()].sort();
}

export function predicatesByGroup(group: PredicateGroup): PredicateSpec[] {
  return PREDICATES.filter((p) => p.group === group);
}

// ---------------------------------------------------------------------------
// Vocabulary values
// ---------------------------------------------------------------------------

/** The five universal aims of the law, used to rank competing maslaha claims. */
export const MAQASID = [
  "preservation_of_religion",
  "preservation_of_life",
  "preservation_of_intellect",
  "preservation_of_lineage",
  "preservation_of_property",
] as const;
export type Maqsid = (typeof MAQASID)[number];

/** Effects an act may produce, as used in the `causes` and `prevents` predicates. */
export const EFFECTS = ["darar", "maslaha", "fitna", "gharar", "riba", "zulm"] as const;

/** Degrees of hardship. Only `ghayr_mu'tada` warrants a concession. */
export const HARDSHIP_DEGREES = ["mu'tada", "ghayr_mu'tada"] as const;
