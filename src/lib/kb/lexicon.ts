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
  { functor: "consume_beyond_need", arity: 1, label: "eating or drinking more than is needed to survive", argumentHint: "a foodstuff or drink" },
  { functor: "sell", arity: 1, label: "selling / entering into", argumentHint: "a kind of sale contract" },
  { functor: "lend", arity: 1, label: "lending under", argumentHint: "a kind of loan" },
  { functor: "play", arity: 1, label: "taking part in", argumentHint: "a game of chance" },
  { functor: "shorten", arity: 1, label: "shortening", argumentHint: "an act of worship" },
  { functor: "omit", arity: 1, label: "omitting / not performing", argumentHint: "an obligation" },
  { functor: "perform", arity: 1, label: "performing", argumentHint: "an act of worship" },
  { functor: "maintain", arity: 1, label: "keeping ties with / staying in touch with", argumentHint: "a relative" },
  { functor: "document", arity: 1, label: "writing down / recording", argumentHint: "a debt or agreement" },
  { functor: "make_up", arity: 1, label: "making up (performing later, in place of what was missed)", argumentHint: "an act of worship" },
  { functor: "pay", arity: 1, label: "paying / giving", argumentHint: "a due such as a ransom" },
  { functor: "hunt", arity: 1, label: "hunting", argumentHint: "game" },
  { functor: "marry", arity: 1, label: "marrying", argumentHint: "a relative or in-law" },
  { functor: "give_zakat_to", arity: 1, label: "giving one's zakat to", argumentHint: "a recipient or relative" },
  { functor: "speak", arity: 1, label: "saying / engaging in", argumentHint: "a kind of speech" },
  { functor: "wear", arity: 1, label: "wearing", argumentHint: "a material or adornment" },
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
  { atom: "cousin_paternal", label: "a paternal cousin (child of the father's brother or sister)", aliases: ["cousin on my father's side", "father's brother's daughter"] },
  { atom: "cousin_maternal", label: "a maternal cousin (child of the mother's brother or sister)", aliases: ["cousin on my mother's side", "mother's sister's daughter"] },
  { atom: "niece", label: "a niece (brother's or sister's daughter)", aliases: ["my brother's daughter", "my sister's daughter"] },
  { atom: "mother_in_law", label: "one's wife's mother", aliases: ["mother-in-law", "wife's mother"] },
  { atom: "wifes_sister", label: "one's wife's sister, while married to her", aliases: ["sister-in-law", "wife's sister"] },
  { atom: "wifes_aunt", label: "one's wife's paternal or maternal aunt, while married to her", aliases: ["wife's aunt"] },
  { atom: "milk_mother", label: "a woman who nursed one as an infant", aliases: ["wet nurse", "foster mother by nursing"] },
  { atom: "milk_sibling", label: "someone nursed by the same woman", aliases: ["milk brother", "milk sister", "foster sibling by nursing"] },
  { atom: "carrion", label: "carrion (an animal dead otherwise than by lawful slaughter)", aliases: ["carcass", "dead animal meat"] },
  { atom: "swine", label: "swine / pork", aliases: ["pork", "pig meat"] },
  { atom: "blood", label: "blood" },

  // Food beyond the four named in Qur'an 5:3
  { atom: "dead_fish", label: "a fish that died in the water rather than being caught", aliases: ["dead fish", "fish found dead", "seafood that died on its own"] },
  { atom: "floating_dead_fish", label: "a fish that died of itself and floated to the surface", aliases: ["floating fish", "fish floating dead"] },
  { atom: "locust", label: "locusts", aliases: ["grasshoppers", "locust"] },
  { atom: "residual_blood", label: "the blood left in meat after lawful slaughter", aliases: ["blood in the meat", "blood left in the veins", "pink juice in steak"] },
  { atom: "lion", label: "a lion" },
  { atom: "wolf", label: "a wolf" },
  { atom: "domestic_donkey", label: "the meat of a domestic donkey", aliases: ["donkey meat"] },
  { atom: "horse_meat", label: "horse meat", aliases: ["horse"] },

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
  { atom: "fidya", label: "fidya — the ransom of feeding a poor person for each fast missed", aliases: ["ransom for missed fasts", "feeding a poor person instead of fasting"] },
  { atom: "hajj", label: "hajj, the pilgrimage to Mecca", aliases: ["pilgrimage", "the hajj"] },
  { atom: "zakat", label: "zakat, the obligatory alms", aliases: ["zakah", "alms", "obligatory charity"] },
  { atom: "the_poor", label: "the poor", aliases: ["a poor person", "someone in poverty"] },
  { atom: "the_needy", label: "the needy (al-masakin)", aliases: ["a needy person"] },
  { atom: "debtor", label: "a debtor unable to repay", aliases: ["someone in debt"] },
  { atom: "wayfarer", label: "a stranded traveller", aliases: ["ibn al-sabil", "a traveller cut off from their money"] },
  { atom: "wealthy_person", label: "someone already wealthy", aliases: ["a rich person"] },

  // Speech and dress
  { atom: "backbiting", label: "backbiting — mentioning someone absent with what they would dislike", aliases: ["gossip", "ghiba", "talking behind someone's back"] },
  { atom: "lie", label: "a lie", aliases: ["lying", "telling a lie", "saying something untrue"] },
  { atom: "gold", label: "gold jewellery or adornment", aliases: ["a gold ring", "gold chain"] },
  { atom: "silk", label: "pure silk clothing", aliases: ["silk", "a silk shirt"] },
  { atom: "additional_hajj", label: "a further hajj after the first", aliases: ["a second hajj", "hajj again", "another hajj"] },
  { atom: "tawaf", label: "tawaf — circling the Ka'ba", aliases: ["circumambulation", "circling the Kaaba"] },
  { atom: "land_game", label: "land game — wild animals hunted on land", aliases: ["deer", "game birds", "hunting animals"] },
  { atom: "sea_game", label: "sea game — fish and other creatures of the sea", aliases: ["fishing", "fish"] },

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
    atom: "too_old_to_fast",
    label: "too old to fast, with no prospect of being able to",
    cue: "the asker says they are elderly and cannot fast, or asks about an elderly person who cannot",
    aliases: ["too old to fast", "elderly and unable to fast"],
  },
  {
    atom: "no_intention",
    label: "did the act without intending it as that act of worship",
    cue: "the asker says they did it without intending it, e.g. went without food all day without meaning to fast",
    aliases: ["without intention", "didn't intend to fast", "no niyya"],
  },
  {
    atom: "able_to_perform_hajj",
    label: "able to perform hajj — with the health, means and safe passage for it",
    cue: "the asker says they can afford hajj and are able to make the journey",
    aliases: ["can afford hajj", "able to go on pilgrimage"],
  },
  {
    atom: "nisab_held_for_year",
    label: "holding wealth at or above the nisab for a full lunar year",
    cue: "the asker says their savings or trade goods have reached the nisab and been held a year",
    aliases: ["my savings are above nisab", "I have had this money a year"],
  },
  {
    atom: "male",
    label: "male",
    cue: "the asker says they are a man or boy, or asks what is permitted to men",
    aliases: ["a man", "for men", "I'm a guy"],
  },
  {
    atom: "female",
    label: "female",
    cue: "the asker says they are a woman or girl, or asks what is permitted to women",
    aliases: ["a woman", "for women", "I'm a girl"],
  },
  {
    atom: "skin_ailment",
    label: "suffering a skin condition such as itching that the material relieves",
    cue: "the asker says they have an itch, rash or skin condition that other fabrics aggravate",
    aliases: ["itchy skin", "eczema", "a rash"],
  },
  {
    atom: "complaining_of_wrong",
    label: "describing a wrong done to them, to someone able to remedy it",
    cue: "the asker says they were wronged and want to tell a judge, authority or someone who can help",
    aliases: ["reporting someone who wronged me", "complaining to a judge"],
  },
  {
    atom: "reconciling_people",
    label: "trying to reconcile two people who have fallen out",
    cue: "the asker says they are trying to make peace between people",
    aliases: ["making peace between friends", "reconciling a quarrel"],
  },
  {
    atom: "ihram",
    label: "in ihram, the consecrated state of hajj or 'umra",
    cue: "the asker says they are in ihram, or on hajj or 'umra having entered ihram",
    aliases: ["in ihram", "on pilgrimage in ihram"],
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
