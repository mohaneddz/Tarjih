/**
 * The hand-authored core knowledge base.
 *
 * Deliberately small. Everything the formalisation pipeline generates is
 * weighed against these clauses, so they are worth more scrutiny per line
 * than anything else in the project.
 */

import type { KbEntry } from "../entry";
import { loadKbStrict } from "../entry";
import { FOOD } from "./food";
import { HAJJ } from "./hajj";
import { INTOXICANTS } from "./intoxicants";
import { QAWAID } from "./qawaid";
import { RELATIONS } from "./relations";
import { SCRIPTURE } from "./scripture";
import { TAXONOMY } from "./taxonomy";
import { TRANSACTIONS } from "./transactions";
import { USUL } from "./usul";
import { WORSHIP } from "./worship";

export const CORE_ENTRIES: readonly KbEntry[] = [
  ...TAXONOMY,
  ...USUL,
  ...QAWAID,
  ...SCRIPTURE,
  ...FOOD,
  ...INTOXICANTS,
  ...TRANSACTIONS,
  ...WORSHIP,
  ...HAJJ,
  ...RELATIONS,
];

/** Loads the core KB, throwing if it fails validation. */
export function loadCoreKb() {
  return loadKbStrict(CORE_ENTRIES);
}

export { FOOD, HAJJ, INTOXICANTS, QAWAID, RELATIONS, SCRIPTURE, TAXONOMY, TRANSACTIONS, USUL, WORSHIP };
