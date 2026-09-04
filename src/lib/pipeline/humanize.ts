/**
 * Turns a proof node's formal goal into a sentence a reader can actually
 * interpret, without hiding the formal goal itself — see `ProofView.goal`,
 * which is kept alongside `goalHuman` precisely so the technical form stays
 * available (in the Evidence Inspector) for anyone who wants it.
 *
 * `instance(aunt_maternal, collateral_kin)` is exactly the right level of
 * precision for the engine and the wrong level for a reader deciding whether
 * to trust a ruling. This module is the translation step, built from the
 * same controlled vocabulary the engine already uses (`lexicon.ts` for
 * question-facing individuals and acts, `glosses.ts` for the KB's own
 * taxonomy/effect atoms) — it does not invent new labels, only renders known
 * ones as prose.
 */

import { findAct, findAtom } from "../kb/lexicon";
import { glossAtom } from "../kb/glosses";
import { HUKM_LABELS, isHukm } from "../kb/ontology";
import type { Literal, Term } from "../logic/types";

/** The short form of a lexicon label, before any parenthetical gloss — "maternal aunt (al-khala, ...)" -> "maternal aunt". */
function shortLabel(label: string): string {
  const idx = label.indexOf("(");
  return (idx === -1 ? label : label.slice(0, idx)).trim();
}

/** Humanizes one term: an atom, a compound act, or a literal value. */
export function humanizeTerm(term: Term): string {
  switch (term.kind) {
    case "var":
      return term.name;
    case "lit":
      return String(term.value);
    case "atom": {
      if (isHukm(term.name)) return HUKM_LABELS[term.name].en;
      const known = findAtom(term.name);
      return known ? shortLabel(known.label) : glossAtom(term.name);
    }
    case "struct": {
      const act = findAct(term.functor, term.args.length);
      const args = term.args.map(humanizeTerm).join(", ");
      if (!act) return `${glossAtom(term.functor)} of ${args}`;
      // "mistreating / disrespecting" + "maternal aunt" -> "mistreating maternal aunt"
      const gerund = act.label.split("/")[0].trim();
      return `${gerund} ${args}`;
    }
  }
}

type Template = (args: readonly Term[]) => string;

const h = humanizeTerm;

/**
 * One rendering template per predicate/arity. Deliberately explicit rather
 * than a generic "predicate(arg, arg)" fallback for every case — a fiqh
 * reader should never have to parse Horn-clause syntax to follow a proof.
 * Falls back to a readable-but-honest rendering (see `humanizeLiteral`) for
 * any predicate not listed here, which should only happen if the ontology
 * grows without this file being updated alongside it.
 */
const TEMPLATES: Record<string, Template> = {
  "ruling/2": ([a, b]) => `${cap(h(a))} is ${h(b)}`,
  "validity/2": ([a, b]) => `${cap(h(a))} is ${h(b)}`,
  "illah/2": ([a, b]) => `The effective cause of ${h(a)} is ${h(b)}`,
  "hikma/2": ([a, b]) => `The underlying wisdom of ${h(a)} is ${h(b)}`,
  "causes/2": ([a, b]) => `${cap(h(a))} causes ${h(b)}`,
  "prevents/2": ([a, b]) => `${cap(h(a))} prevents ${h(b)}`,
  "instance/2": ([a, b]) => `${cap(h(a))} is a ${h(b)}`,
  "instance_of/2": ([a, b]) => `${cap(h(a))} is a ${h(b)}`,
  "subclass/2": ([a, b]) => `Every ${h(a)} is a ${h(b)}`,
  "subclass_of/2": ([a, b]) => `Every ${h(a)} is ultimately a ${h(b)}`,
  "attribute/2": ([a, b]) => `${cap(h(a))} is ${h(b)}`,
  "kin/2": ([a, b]) => `${cap(h(a))} is a blood relative of ${h(b)}`,
  "mahram/2": ([a, b]) => `${cap(h(a))} is a mahram of ${h(b)}`,
  "ascendant/2": ([a, b]) => `${cap(h(a))} is an ascendant of ${h(b)}`,
  "obligation_toward/3": ([a, b, c]) => `${cap(h(a))} owes ${h(c)} to ${h(b)}`,
  "condition/2": ([a, b]) => `${cap(h(b))} must hold for ${h(a)} to be valid`,
  "impediment/2": ([a, b]) => `${cap(h(b))} blocks the ruling that would otherwise apply to ${h(a)}`,
  "necessity/1": ([a]) => `${cap(h(a))} constitutes a genuine necessity (darura)`,
  "hardship/2": ([a, b]) => `${cap(h(a))} involves ${h(b)} hardship`,
  "custom/2": ([a, b]) => `${cap(h(b))} is the settled custom of ${h(a)}`,
  "intention/3": ([a, b, c]) => `${cap(h(a))} performs ${h(b)} for the purpose of ${h(c)}`,
  "certain/1": ([a]) => `${cap(h(a))} is established with certainty`,
  // Phrased in the second person because this node is the asker's own claim,
  // not something a source asserts. See `kb/premises.ts`.
  "circumstance/1": ([a]) => `You stated that ${h(a)} applies to you`,
  "established/1": ([a]) => `${cap(h(a))} is settled by explicit text or consensus`,
  "generalisable/1": ([a]) => `${cap(h(a))} may serve as the basis for an analogy`,
  "excepted/2": ([a, b]) => `${cap(h(a))} is excepted, due to ${h(b)}`,
};

function cap(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/**
 * Renders a literal as a readable sentence. Unknown predicates fall back to
 * "predicate: arg, arg" — honest about not having a template rather than
 * guessing at English, and still far more readable than raw clause syntax.
 */
export function humanizeLiteral(literal: Literal): string {
  const key = `${literal.predicate}/${literal.args.length}`;
  const template = TEMPLATES[key];
  if (template) return template(literal.args);
  const args = literal.args.map(humanizeTerm).join(", ");
  return literal.args.length === 0 ? glossAtom(literal.predicate) : `${glossAtom(literal.predicate)}: ${args}`;
}
