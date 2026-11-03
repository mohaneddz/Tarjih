/**
 * The hand-authored core knowledge base.
 *
 * Deliberately small. Everything the formalisation pipeline generates is
 * weighed against these clauses, so they are worth more scrutiny per line
 * than anything else in the project.
 */

import type { KbEntry } from "../entry";
import { loadKbStrict } from "../entry";
import { CONDUCT } from "./conduct";
import { FAMILY } from "./family";
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
import { ZAKAT } from "./zakat";
import { ANIMALS } from "./animals";
import { CHARITY } from "./charity";
import { ETHICS } from "./ethics";
import { FASTING } from "./fasting";
import { MARRIAGE } from "./marriage";
import { PRAYER } from "./prayer";
import { TRADE } from "./trade";

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
  ...ZAKAT,
  ...RELATIONS,
  ...FAMILY,
  ...CONDUCT,
  ...PRAYER,
  ...FASTING,
  ...MARRIAGE,
  ...ETHICS,
  ...TRADE,
  ...ANIMALS,
  ...CHARITY,
];

/** Loads the core KB, throwing if it fails validation. */
export function loadCoreKb() {
  return loadKbStrict(CORE_ENTRIES);
}

export {
  ANIMALS,
  CHARITY,
  CONDUCT,
  ETHICS,
  FAMILY,
  FASTING,
  FOOD,
  HAJJ,
  INTOXICANTS,
  MARRIAGE,
  PRAYER,
  QAWAID,
  RELATIONS,
  SCRIPTURE,
  TAXONOMY,
  TRADE,
  TRANSACTIONS,
  USUL,
  WORSHIP,
  ZAKAT,
};
