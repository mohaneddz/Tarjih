"use client";

/**
 * There is no auth in this app, so "saved cases" is a per-browser bookmark
 * list kept in localStorage rather than anything server-backed. The full
 * resolution summary is snapshotted at save time (not just the id) so the
 * saved page can render without a round trip, and stays correct even if the
 * underlying resolution is later pruned from the server's history.
 */

export interface SavedCase {
  readonly id: string;
  readonly question: string;
  readonly verdict: string | null;
  readonly confidence: number | null;
  readonly contested: boolean;
  readonly savedAt: string;
}

const STORAGE_KEY = "tarjih:savedCases";

function read(): SavedCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(cases: readonly SavedCase[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    // Same-tab listeners (React state) don't see the native "storage" event,
    // which only fires in other tabs — dispatch a matching custom event so a
    // page that renders the list can stay in sync with a toggle fired
    // elsewhere on the same page.
    window.dispatchEvent(new CustomEvent("tarjih:saved-cases-changed"));
  } catch {
    // Storage can throw (quota, private mode); saving is a convenience, not
    // something worth surfacing an error for.
  }
}

export function getSavedCases(): SavedCase[] {
  return read().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function isCaseSaved(id: string): boolean {
  return read().some((c) => c.id === id);
}

export function saveCase(entry: Omit<SavedCase, "savedAt">): void {
  const existing = read().filter((c) => c.id !== entry.id);
  write([...existing, { ...entry, savedAt: new Date().toISOString() }]);
}

export function unsaveCase(id: string): void {
  write(read().filter((c) => c.id !== id));
}

export function toggleSavedCase(entry: Omit<SavedCase, "savedAt">): boolean {
  if (isCaseSaved(entry.id)) {
    unsaveCase(entry.id);
    return false;
  }
  saveCase(entry);
  return true;
}
