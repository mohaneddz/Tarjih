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
 * would let a mis-parse hand out an exemption. The `whenAbsent` text is what
 * the UI shows to explain what the ruling would have been without it.
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
  { functor: "consume", arity: 1, label: "eating or drinking", argumentHint: "a foodstuff" },
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
];

export const KNOWN_CIRCUMSTANCES: readonly CircumstanceEntry[] = [
  {
    atom: "starvation",
    label: "facing starvation — a genuine threat to life from lack of food",
    cue: "the asker says they are starving, have no other food, or would die without eating this",
    aliases: ["starving", "famine", "no other food"],
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

/** Renders the vocabulary as a block for the NL-parsing prompt. */
export function lexiconPromptBlock(): string {
  const acts = KNOWN_ACTS.map((a) => `  - ${a.functor}(X) — ${a.label}; X must be ${a.argumentHint} from the list below`).join(
    "\n"
  );
  const atoms = KNOWN_ATOMS.map((a) => {
    const aliasText = a.aliases?.length ? ` (aka: ${a.aliases.join(", ")})` : "";
    return `  - ${a.atom} — ${a.label}${aliasText}`;
  }).join("\n");
  const circumstances = KNOWN_CIRCUMSTANCES.map(
    (c) => `  - circumstance(${c.atom}) — ${c.label}. Add this only when ${c.cue}.`
  ).join("\n");
  return (
    `Known acts:\n${acts}\n\n` +
    `Known entities (use exactly these atom names, lowercase with underscores):\n${atoms}\n\n` +
    `Known circumstances (about the ASKER's own situation, not the act):\n${circumstances}`
  );
}
