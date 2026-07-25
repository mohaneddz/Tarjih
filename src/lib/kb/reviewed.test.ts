import { describe, expect, it } from "vitest";

import { clauseRowToEntry, clauseRowsToEntries } from "./reviewed";
import type { ClauseRow } from "./reviewed";

const baseRow: ClauseRow = {
  id: "sunnah:tirmidhi:1",
  source: "condition(prayer, purity).",
  kind: "sunnah",
  reference: "Jami` at-Tirmidhi 1",
  grade: "sahih",
  thubut: "qati",
  dalala: null,
  scope: null,
  restriction: null,
  abrogation: null,
  abrogates: null,
  madhahib: null,
  unreviewed: false,
  notes: "States purification is a precondition for valid prayer.",
};

describe("clauseRowToEntry", () => {
  it("maps id and clause source through unchanged", () => {
    const entry = clauseRowToEntry(baseRow);
    expect(entry.id).toBe("sunnah:tirmidhi:1");
    expect(entry.clause).toBe("condition(prayer, purity).");
  });

  it("maps evidence fields, converting null to undefined", () => {
    const entry = clauseRowToEntry(baseRow);
    expect(entry.evidence.kind).toBe("sunnah");
    expect(entry.evidence.grade).toBe("sahih");
    expect(entry.evidence.thubut).toBe("qati");
    expect(entry.evidence.dalala).toBeUndefined();
    expect(entry.evidence.scope).toBeUndefined();
  });

  it("carries the review flag and notes through", () => {
    const entry = clauseRowToEntry(baseRow);
    expect(entry.evidence.unreviewed).toBe(false);
    expect(entry.evidence.notes).toContain("precondition for valid prayer");
  });

  it("parses a valid madhahib JSON array", () => {
    const row: ClauseRow = { ...baseRow, madhahib: JSON.stringify(["hanafi", "shafii"]) };
    const entry = clauseRowToEntry(row);
    expect(entry.evidence.madhahib).toEqual(["hanafi", "shafii"]);
  });

  it("drops unrecognised entries out of a madhahib array rather than failing the whole row", () => {
    const row: ClauseRow = { ...baseRow, madhahib: JSON.stringify(["hanafi", "not-a-real-madhhab"]) };
    const entry = clauseRowToEntry(row);
    expect(entry.evidence.madhahib).toEqual(["hanafi"]);
  });

  it("treats malformed madhahib JSON as absent rather than throwing", () => {
    const row: ClauseRow = { ...baseRow, madhahib: "{not valid json" };
    expect(() => clauseRowToEntry(row)).not.toThrow();
    expect(clauseRowToEntry(row).evidence.madhahib).toBeUndefined();
  });

  it("treats an empty madhahib array as absent", () => {
    const row: ClauseRow = { ...baseRow, madhahib: JSON.stringify([]) };
    expect(clauseRowToEntry(row).evidence.madhahib).toBeUndefined();
  });

  it("maps abrogation fields when present", () => {
    const row: ClauseRow = { ...baseRow, abrogation: "mansukh", abrogates: "sunnah:tirmidhi:5" };
    const entry = clauseRowToEntry(row);
    expect(entry.evidence.abrogation).toBe("mansukh");
    expect(entry.evidence.abrogates).toBe("sunnah:tirmidhi:5");
  });
});

describe("clauseRowsToEntries", () => {
  it("maps a list preserving order", () => {
    const rows: ClauseRow[] = [baseRow, { ...baseRow, id: "sunnah:tirmidhi:2" }];
    const entries = clauseRowsToEntries(rows);
    expect(entries.map((e) => e.id)).toEqual(["sunnah:tirmidhi:1", "sunnah:tirmidhi:2"]);
  });

  it("returns an empty array for no rows", () => {
    expect(clauseRowsToEntries([])).toEqual([]);
  });
});
