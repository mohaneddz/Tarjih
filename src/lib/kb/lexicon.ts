/**
 * Human-readable labels for the atoms and acts the vertical-slice KB knows
 * about, and the grounding vocabulary the NL-to-goal stage is restricted to.
 *
 * This exists because the LLM parsing stage must not be free to invent terms.
 * If it writes `mistreat(camel_meat)`, the query silently finds no
 * derivation — which looks exactly like a genuine "the KB has no rule for
 * this" answer, but means something completely different ("the KB has never
 * heard of this term"). Those two cases must be told apart, and the only way
 * to do that is to check every atom the LLM used against a known list before
 * proving anything.
 *
 * Kept separate from `ontology.ts`: the ontology is the predicate schema
 * (fixed, load-bearing, rarely changes); this is per-entity vocabulary that
 * grows with the KB content and will eventually be generated from the loaded
 * KB's `instance`/`subclass` facts rather than hand-listed.
 */

export interface ActEntry {
  readonly functor: string;
  readonly arity: number;
  readonly label: string;
  readonly argumentHint: string;
}

export interface AtomEntry {
  readonly atom: string;
  readonly label: string;
  /** Alternate English spellings/phrasings a question might use. */
  readonly aliases?: readonly string[];
}

/**
 * A situation the asker can assert about themselves, as distinct from the act
 * they are asking about.
 *
 * These are the only atoms allowed inside `circumstance/1`, and they are
 * deliberately a separate list from `KNOWN_ATOMS`: a circumstance unlocks a
 * concession, so letting the grounding stage put an arbitrary atom there
 * would let a mis-parse hand out an exemption.
 */
export interface CircumstanceEntry {
  readonly atom: string;
  readonly label: string;
  /** How a question signals this circumstance, for the grounding prompt. */
  readonly cue: string;
  readonly aliases?: readonly string[];
}

export const KNOWN_ACTS: readonly ActEntry[] = [
  { functor: "mistreat", arity: 1, label: "mistreating / disrespecting", argumentHint: "a relative" },
  { functor: "consume", arity: 1, label: "eating or drinking", argumentHint: "a foodstuff or drink" },
  { functor: "sell", arity: 1, label: "selling / entering into", argumentHint: "a kind of sale contract" },
  { functor: "lend", arity: 1, label: "lending under", argumentHint: "a kind of loan" },
  { functor: "play", arity: 1, label: "taking part in", argumentHint: "a game of chance" },
  { functor: "shorten", arity: 1, label: "shortening", argumentHint: "an act of worship" },
  { functor: "omit", arity: 1, label: "omitting / not performing", argumentHint: "an obligation" },
  { functor: "perform", arity: 1, label: "performing", argumentHint: "an act of worship" },
  { functor: "maintain", arity: 1, label: "keeping ties with / staying in touch with", argumentHint: "a relative" },
  { functor: "document", arity: 1, label: "writing down / recording", argumentHint: "a debt or agreement" },
];

export const KNOWN_ATOMS: readonly AtomEntry[] = [
  { atom: "mother", label: "one's mother" },
  { atom: "father", label: "one's father" },
  { atom: "grandmother", label: "one's grandmother" },
  { atom: "son", label: "one's son" },
  { atom: "daughter", label: "one's daughter" },
  { atom: "brother", label: "one's brother" },
  { atom: "sister", label: "one's sister" },
  { atom: "aunt_maternal", label: "maternal aunt (al-khala, mother's sister)", aliases: ["maternal aunt", "khala"] },
  { atom: "aunt_paternal", label: "paternal aunt (al-amma, father's sister)", aliases: ["paternal aunt", "amma"] },
  { atom: "uncle_maternal", label: "maternal uncle (al-khal, mother's brother)", aliases: ["maternal uncle", "khal"] },
  { atom: "uncle_paternal", label: "paternal uncle (al-amm, father's brother)", aliases: ["paternal uncle", "amm"] },
  { atom: "carrion", label: "carrion (an animal dead otherwise than by lawful slaughter)", aliases: ["carcass", "dead animal meat"] },
  { atom: "swine", label: "swine / pork", aliases: ["pork", "pig meat"] },
  { atom: "blood", label: "blood" },

  // Intoxicants
  { atom: "khamr", label: "khamr (grape wine)", aliases: ["wine", "alcohol"] },
  { atom: "nabidh", label: "nabidh (fermented date or raisin infusion)", aliases: ["date wine"] },
  { atom: "beer", label: "beer" },
  { atom: "spirits", label: "spirits (distilled liquor)", aliases: ["liquor", "vodka", "whisky"] },
  { atom: "sip_of_khamr", label: "a sip of wine, below the intoxicating amount", aliases: ["a small amount of alcohol", "one drink"] },
  { atom: "narcotic", label: "a narcotic or recreational drug", aliases: ["drugs", "cannabis", "hashish", "cocaine"] },

  // Contracts and dealings
  { atom: "interest_loan", label: "a loan repaid with stipulated interest", aliases: ["interest", "usury", "a bank loan with interest"] },
  { atom: "unequal_gold_exchange", label: "exchanging gold for gold in unequal amounts", aliases: ["gold for gold", "currency exchange at unequal weight"] },
  { atom: "unborn_calf", label: "an animal not yet born, or not yet conceived", aliases: ["unborn animal", "an unborn calf", "next year's offspring"] },
  {
    atom: "fish_still_in_water",
    // Distinguished from salam by what is *unspecified*, not by the delay.
    // Both are sales of goods not yet in hand; only this one leaves the
    // quantity and the delivery unfixed, which is the whole difference.
    label: "an uncaught catch, with nothing fixed about how much will be caught or whether it will be",
    aliases: ["fish still in the sea", "whatever the net brings up", "the catch before it is caught"],
  },
  { atom: "maysir", label: "maysir (gambling)", aliases: ["gambling", "betting", "a wager", "the lottery"] },
  { atom: "spot_sale", label: "an ordinary sale, goods and price exchanged at once", aliases: ["a normal sale", "buying something outright"] },
  {
    atom: "salam_contract",
    label:
      "salam — paying in full now for goods whose quantity, quality and delivery date are all fixed at the time of contract",
    aliases: ["paying upfront for a fixed order", "advance purchase of a specified quantity"],
  },

  // Acts of worship
  { atom: "obligatory_prayer", label: "an obligatory prayer", aliases: ["salah", "the prayer", "prayers"] },
  { atom: "fasting", label: "fasting in Ramadan", aliases: ["the fast", "fasting", "Ramadan"] },
  { atom: "tayammum", label: "tayammum (dry ablution with clean earth)", aliases: ["dry ablution", "wiping with earth instead of washing"] },

  // Other
  { atom: "debt", label: "a debt owed for a fixed term", aliases: ["a loan between people", "money owed"] },
  { atom: "instalment_sale", label: "an instalment sale — a higher price for deferred payment, fixed at contract", aliases: ["buying in instalments", "paying monthly", "hire purchase"] },
];

export const KNOWN_CIRCUMSTANCES: readonly CircumstanceEntry[] = [
  {
    atom: "starvation",
    label: "facing starvation — a genuine threat to life from lack of food",
    cue: "the asker says they are starving, have no other food, or would die without eating this",
    aliases: ["starving", "famine", "no other food"],
  },
  {
    atom: "travel",
    label: "on a journey",
    cue: "the asker says they are travelling, on a journey, or away from home",
    aliases: ["travelling", "on a trip", "away from home"],
  },
  {
    atom: "illness",
    label: "ill",
    cue: "the asker says they are ill, sick, or unwell",
    aliases: ["sick", "unwell", "not well"],
  },
  {
    atom: "water_unavailable",
    label: "with no water available for ablution",
    cue: "the asker says there is no water, or none they can reach or use",
    aliases: ["no water", "cannot find water"],
  },
  {
    atom: "menstruation",
    label: "menstruating",
    cue: "the asker says they are on their period or menstruating",
    aliases: ["on my period", "menstruating"],
  },
  {
    atom: "certain_prior_purity",
    label: "certain of having been in a state of purity beforehand",
    cue: "the asker says they know they had wudu, and are now unsure whether they broke it",
    aliases: ["I had wudu", "I know I was pure"],
  },
  {
    atom: "doubt_about_breaking_purity",
    label: "unsure whether that purity was broken",
    cue: "the asker says they are not sure whether they broke wudu",
    aliases: ["not sure if I broke wudu", "I might have broken it"],
  },
  {
    atom: "ritual_impurity",
    label: "in a state of ritual impurity (without wudu or ghusl)",
    cue: "the asker says they have not performed wudu or ghusl, or are in a state of janaba",
    aliases: ["without wudu", "not in a state of purity", "junub"],
  },
];

const ACT_INDEX = new Map<string, ActEntry>(KNOWN_ACTS.map((a) => [`${a.functor}/${a.arity}`, a]));
const ATOM_INDEX = new Map<string, AtomEntry>(KNOWN_ATOMS.map((a) => [a.atom, a]));
const CIRCUMSTANCE_INDEX = new Map<string, CircumstanceEntry>(
  KNOWN_CIRCUMSTANCES.map((c) => [c.atom, c])
);

export function findAct(functor: string, arity: number): ActEntry | undefined {
  return ACT_INDEX.get(`${functor}/${arity}`);
}

export function findAtom(name: string): AtomEntry | undefined {
  return ATOM_INDEX.get(name);
}

export function isKnownAtom(name: string): boolean {
  return ATOM_INDEX.has(name);
}

export function findCircumstance(name: string): CircumstanceEntry | undefined {
  return CIRCUMSTANCE_INDEX.get(name);
}

/**
 * Renders the vocabulary as a block for an LLM prompt.
 *
 * `includeCircumstances` is off for the formalisation stage. A hadith
 * establishes what the law is, never that the person reading it is starving,
 * so offering that vocabulary there can only invite a clause that asserts a
 * situation on everyone's behalf. `validateClause` refuses such a clause
 * outright; not advertising the predicate keeps the model from spending
 * attempts on one.
 */
export function lexiconPromptBlock(includeCircumstances = true): string {
  const acts = KNOWN_ACTS.map((a) => `  - ${a.functor}(X) — ${a.label}; X must be ${a.argumentHint} from the list below`).join(
    "\n"
  );
  const atoms = KNOWN_ATOMS.map((a) => {
    const aliasText = a.aliases?.length ? ` (aka: ${a.aliases.join(", ")})` : "";
    return `  - ${a.atom} — ${a.label}${aliasText}`;
  }).join("\n");
  const base =
    `Known acts:\n${acts}\n\n` +
    `Known entities (use exactly these atom names, lowercase with underscores):\n${atoms}`;
  if (!includeCircumstances) return base;

  const circumstances = KNOWN_CIRCUMSTANCES.map(
    (c) => `  - circumstance(${c.atom}) — ${c.label}. Add this only when ${c.cue}.`
  ).join("\n");
  return `${base}\n\nKnown circumstances (about the ASKER's own situation, not the act):\n${circumstances}`;
}
