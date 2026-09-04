/**
 * Human-readable glosses for the class/relation/effect atoms that appear as
 * predicate arguments throughout the KB — as distinct from `lexicon.ts`,
 * which covers the individuals and acts a *question* can name (mother,
 * carrion, mistreat/1). This file covers the vocabulary the KB's own rules
 * are built from: taxonomy classes (rahim, collateral_kin), effects (darar),
 * and other atoms that show up as arguments to predicates like `subclass`,
 * `causes`, `illah`.
 *
 * Exists because a proof node's goal — `instance(aunt_maternal,
 * collateral_kin)` — is exactly the right level of precision for the engine
 * and exactly the wrong level for a reader deciding whether to trust the
 * ruling. See `humanize.ts`, which uses this to build a readable sentence.
 */

export const ATOM_GLOSSES: Record<string, string> = {
  // Kinship classes
  kin: "relative",
  rahim: "womb-relative",
  ascendant_kin: "ascendant (parent or grandparent)",
  descendant_kin: "descendant (child or grandchild)",
  collateral_kin: "collateral relative (sibling, aunt, uncle, or their children)",
  affinal_kin: "relative by marriage",
  forbidden_food: "forbidden food",

  // Substances and their attributes
  muskir: "intoxicating",
  khamr: "khamr (wine)",
  small_measure_of_muskir: "small quantity of an intoxicant",

  // Transactions
  sound_sale: "a sale free of the named defects",
  ownership: "owning what is sold",
  maysir: "gambling",

  // Effective causes ('ilal) and effects
  qata_rahim: "severance of the womb-tie",
  iskar: "intoxication",
  darar: "harm",
  maslaha: "benefit",
  fitna: "discord",
  gharar: "excessive uncertainty",
  riba: "usury",
  zulm: "injustice",

  // Worship
  purity: "ritual purity",
  obligatory_prayer: "an obligatory prayer",
  fasting: "fasting",
  tayammum: "tayammum (dry ablution)",

  // Circumstances
  starvation: "starvation",
  travel: "being on a journey",
  illness: "illness",
  water_unavailable: "the absence of water",
  menstruation: "menstruation",
  ritual_impurity: "ritual impurity",
  mutada: "hardship an act ordinarily carries",
  ghayr_mutada: "hardship beyond what the act ordinarily carries",
  ego: "oneself",

  // The five maqasid
  preservation_of_religion: "the preservation of religion",
  preservation_of_life: "the preservation of life",
  preservation_of_intellect: "the preservation of intellect",
  preservation_of_lineage: "the preservation of lineage",
  preservation_of_property: "the preservation of property",
};

/** Turns an unglossed snake_case atom into readable words as a last resort, e.g. "camel_meat" -> "camel meat". */
export function prettifyAtomName(name: string): string {
  return name.replace(/_/g, " ").replace(/'/g, "'");
}

export function glossAtom(name: string): string {
  return ATOM_GLOSSES[name] ?? prettifyAtomName(name);
}
