/**
 * Process-wide KB instance.
 *
 * Parsing and validating the core KB is cheap at this size, but re-running
 * `loadCoreKb` (and its lint pass) on every request is still pointless work,
 * and Next.js dev-mode hot reload can otherwise end up doing it per request.
 * `globalThis` is the standard workaround for that in this framework.
 */

import { loadCoreKb } from "./core";
import type { LoadedKb } from "./entry";

const globalForKb = globalThis as unknown as { tarjihKb?: LoadedKb };

export function getKb(): LoadedKb {
  if (!globalForKb.tarjihKb) {
    globalForKb.tarjihKb = loadCoreKb();
  }
  return globalForKb.tarjihKb;
}
