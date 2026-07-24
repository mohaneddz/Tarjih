/**
 * Definitional scaffolding: class hierarchy and kinship.
 *
 * All of it is `ontology` evidence, which scores zero. These clauses let real
 * evidence connect to a question; they must never make a conclusion look
 * better supported than its actual scriptural basis.
 */

import type { KbEntry } from "../entry";

const scaffold = { kind: "ontology", reference: "Definitional" } as const;

export const TAXONOMY: KbEntry[] = [
  // --- Transitive closure over the class hierarchy ---
  {
    id: "tax:subclass-base",
    clause: "subclass_of(A, B) :- subclass(A, B).",
    evidence: { ...scaffold, notes: "Direct subclass link." },
  },
  {
    id: "tax:subclass-transitive",
    clause: "subclass_of(A, C) :- subclass(A, B), subclass_of(B, C).",
    evidence: {
      ...scaffold,
      notes:
        "Right-recursive on purpose. Written the other way round — " +
        "subclass_of(A,C) :- subclass_of(A,B), subclass(B,C) — the first body " +
        "goal is a variant of its own parent and the prover's loop check cuts " +
        "it, leaving only direct links.",
    },
  },
  {
    id: "tax:instance-direct",
    clause: "instance_of(E, C) :- instance(E, C).",
    evidence: { ...scaffold, notes: "Directly asserted membership." },
  },
  {
    id: "tax:instance-inherited",
    clause: "instance_of(E, C) :- instance(E, D), subclass_of(D, C).",
    evidence: { ...scaffold, notes: "Membership inherited through the hierarchy." },
  },

  // --- Kinship classes ---
  //
  // `rahim` is the womb-relationship the texts on severing kinship address.
  // It is narrower than `kin`: kinship by marriage carries duties but is not
  // rahim, and the severing-kinship texts do not reach it.
  {
    id: "tax:ascendant-is-rahim",
    clause: "subclass(ascendant_kin, rahim).",
    evidence: { ...scaffold, notes: "Parents and grandparents are womb-relatives." },
  },
  {
    id: "tax:descendant-is-rahim",
    clause: "subclass(descendant_kin, rahim).",
    evidence: { ...scaffold, notes: "Children and grandchildren are womb-relatives." },
  },
  {
    id: "tax:collateral-is-rahim",
    clause: "subclass(collateral_kin, rahim).",
    evidence: {
      ...scaffold,
      notes:
        "Siblings, aunts, uncles and their children are womb-relatives. This " +
        "link is what brings aunts within reach of the severing-kinship texts.",
    },
  },
  {
    id: "tax:rahim-is-kin",
    clause: "subclass(rahim, kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:affinal-is-kin",
    clause: "subclass(affinal_kin, kin).",
    evidence: {
      ...scaffold,
      notes: "Relatives by marriage are kin but deliberately not rahim.",
    },
  },

  // --- Individual relatives ---
  {
    id: "tax:mother",
    clause: "instance(mother, ascendant_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:father",
    clause: "instance(father, ascendant_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:grandmother",
    clause: "instance(grandmother, ascendant_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:son",
    clause: "instance(son, descendant_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:daughter",
    clause: "instance(daughter, descendant_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:brother",
    clause: "instance(brother, collateral_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:sister",
    clause: "instance(sister, collateral_kin).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:aunt-maternal",
    clause: "instance(aunt_maternal, collateral_kin).",
    evidence: { ...scaffold, notes: "al-khala — the mother's sister." },
  },
  {
    id: "tax:aunt-paternal",
    clause: "instance(aunt_paternal, collateral_kin).",
    evidence: { ...scaffold, notes: "al-amma — the father's sister." },
  },
  {
    id: "tax:uncle-maternal",
    clause: "instance(uncle_maternal, collateral_kin).",
    evidence: { ...scaffold, notes: "al-khal — the mother's brother." },
  },
  {
    id: "tax:uncle-paternal",
    clause: "instance(uncle_paternal, collateral_kin).",
    evidence: { ...scaffold, notes: "al-amm — the father's brother." },
  },

  // --- Ascendancy, for rules that turn on it specifically ---
  {
    id: "tax:ascendant-mother",
    clause: "ascendant(mother, ego).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:ascendant-father",
    clause: "ascendant(father, ego).",
    evidence: { ...scaffold },
  },

  // --- Substances, for the necessity case ---
  {
    id: "tax:carrion",
    clause: "instance(carrion, forbidden_food).",
    evidence: { ...scaffold, notes: "al-mayta — an animal dead otherwise than by lawful slaughter." },
  },
  {
    id: "tax:swine",
    clause: "instance(swine, forbidden_food).",
    evidence: { ...scaffold },
  },
  {
    id: "tax:blood",
    clause: "instance(blood, forbidden_food).",
    evidence: { ...scaffold },
  },
];
