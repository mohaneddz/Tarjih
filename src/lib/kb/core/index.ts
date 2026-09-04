/**
 * The hand-authored core knowledge base.
 *
 * Deliberately small. Everything the formalisation pipeline generates is
 * weighed against these clauses, so they are worth more scrutiny per line
 * than anything else in the project.
 */

import type { KbEntry } from "../entry";
import { loadKbStrict } from "../entry";
import { INTOXICANTS } from "./intoxicants";
import { QAWAID } from "./qawaid";
import { SCRIPTURE } from "./scripture";
import { TAXONOMY } from "./taxonomy";
import { TRANSACTIONS } from "./transactions";
import { USUL } from "./usul";

export const CORE_ENTRIES: readonly KbEntry[] = [
  ...TAXONOMY,
  ...USUL,
  ...QAWAID,
  ...SCRIPTURE,
  ...INTOXICANTS,
  ...TRANSACTIONS,
];

/** Loads the core KB, throwing if it fails validation. */
export function loadCoreKb() {
  return loadKbStrict(CORE_ENTRIES);
}

export { INTOXICANTS, QAWAID, SCRIPTURE, TAXONOMY, TRANSACTIONS, USUL };
