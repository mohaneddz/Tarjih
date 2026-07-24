/**
 * The hand-authored core knowledge base.
 *
 * Deliberately small. Everything the formalisation pipeline generates is
 * weighed against these clauses, so they are worth more scrutiny per line
 * than anything else in the project.
 */

import type { KbEntry } from "../entry";
import { loadKbStrict } from "../entry";
import { QAWAID } from "./qawaid";
import { SCRIPTURE } from "./scripture";
import { TAXONOMY } from "./taxonomy";
import { USUL } from "./usul";

export const CORE_ENTRIES: readonly KbEntry[] = [...TAXONOMY, ...USUL, ...QAWAID, ...SCRIPTURE];

/** Loads the core KB, throwing if it fails validation. */
export function loadCoreKb() {
  return loadKbStrict(CORE_ENTRIES);
}

export { QAWAID, SCRIPTURE, TAXONOMY, USUL };
