import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClauseRow } from "./reviewed";

const findMany = vi.fn<() => Promise<ClauseRow[]>>();

vi.mock("../../data/db", () => ({
  prisma: { clause: { findMany } },
}));

// Imported after the mock so live-kb.ts picks up the mocked prisma.
const { getLiveKb, invalidateLiveKb, wouldValidate } = await import("./live-kb");
const { clauseRowToEntry } = await import("./reviewed");

function row(overrides: Partial<ClauseRow>): ClauseRow {
  return {
    id: "sunnah:test:1",
    source: "condition(prayer, purity).",
    kind: "sunnah",
    reference: "Test 1",
    grade: "sahih",
    thubut: null,
    dalala: null,
    scope: null,
    restriction: null,
    abrogation: null,
    abrogates: null,
    madhahib: null,
    unreviewed: false,
    notes: null,
    ...overrides,
  };
}

beforeEach(() => {
  findMany.mockReset();
  invalidateLiveKb();
});

describe("getLiveKb", () => {
  it("includes the core KB even with no reviewed clauses", async () => {
    findMany.mockResolvedValue([]);
    const { loaded } = await getLiveKb();
    expect(loaded.kb.size).toBeGreaterThan(0);
    expect(loaded.report.ok).toBe(true);
  });

  it("merges in a valid reviewed clause", async () => {
    findMany.mockResolvedValue([row({ id: "sunnah:test:1", source: "instance(camel, kin)." })]);
    const { loaded, excluded } = await getLiveKb();
    expect(excluded).toEqual([]);
    expect(loaded.kb.byClauseId("sunnah:test:1")).toBeDefined();
  });

  it("excludes a reviewed clause that references an unknown predicate, without dropping the rest", async () => {
    findMany.mockResolvedValue([
      row({ id: "sunnah:test:bad", source: "frobnicate(camel, kin)." }),
      row({ id: "sunnah:test:good", source: "instance(camel, kin)." }),
    ]);
    const { loaded, excluded } = await getLiveKb();
    expect(excluded).toHaveLength(1);
    expect(excluded[0].entry.id).toBe("sunnah:test:bad");
    expect(loaded.kb.byClauseId("sunnah:test:good")).toBeDefined();
    expect(loaded.kb.byClauseId("sunnah:test:bad")).toBeUndefined();
  });

  it("excludes a reviewed clause with an invalid ruling value", async () => {
    findMany.mockResolvedValue([row({ id: "sunnah:test:bad", source: "ruling(consume(x), forbidden)." })]);
    const { excluded } = await getLiveKb();
    expect(excluded).toHaveLength(1);
    expect(excluded[0].report.errors[0].code).toBe("invalid-hukm");
  });

  it("caches the result across calls without hitting the database again", async () => {
    findMany.mockResolvedValue([]);
    await getLiveKb();
    await getLiveKb();
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("recomputes after invalidateLiveKb", async () => {
    findMany.mockResolvedValue([]);
    await getLiveKb();
    invalidateLiveKb();
    await getLiveKb();
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("retries after a failed build instead of caching the failure", async () => {
    /*
     * Caching the promise is what makes concurrent requests share one database
     * read, but caching a *rejected* one made a single transient database
     * hiccup permanent: every later query failed on the stored rejection, with
     * no retry and no way back short of restarting the process.
     */
    findMany.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(getLiveKb()).rejects.toThrow("database unavailable");

    findMany.mockResolvedValue([]);
    const { loaded } = await getLiveKb();
    expect(loaded.kb.size).toBeGreaterThan(0);
  });

  it("wouldValidate approves a well-formed candidate without touching the database", async () => {
    const candidate = clauseRowToEntry(row({ id: "sunnah:test:1", source: "instance(camel, kin)." }));
    const report = wouldValidate([], candidate);
    expect(report.ok).toBe(true);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("wouldValidate rejects a candidate with an unknown predicate, scoped to just that candidate", async () => {
    const candidate = clauseRowToEntry(row({ id: "sunnah:test:bad", source: "frobnicate(camel, kin)." }));
    const report = wouldValidate([], candidate);
    expect(report.ok).toBe(false);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].clauseId).toBe("sunnah:test:bad");
  });

  it("wouldValidate does not blame a new candidate for another entry's pre-existing error", async () => {
    // An already-reviewed entry can carry its own error (this should not
    // happen in practice, since it would have been refused at its own
    // approval time, but the scoping must hold regardless) without that
    // error showing up as a reason to refuse a new, unrelated, well-formed
    // candidate.
    const existing = clauseRowToEntry(row({ id: "sunnah:test:existing", source: "frobnicate(camel, kin)." }));
    const candidate = clauseRowToEntry(row({ id: "sunnah:test:new", source: "instance(camel, kin)." }));
    const report = wouldValidate([existing], candidate);
    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it("reflects a clause that was rejected and removed between calls", async () => {
    findMany.mockResolvedValue([row({ id: "sunnah:test:1", source: "instance(camel, kin)." })]);
    const first = await getLiveKb();
    expect(first.loaded.kb.byClauseId("sunnah:test:1")).toBeDefined();

    invalidateLiveKb();
    findMany.mockResolvedValue([]);
    const second = await getLiveKb();
    expect(second.loaded.kb.byClauseId("sunnah:test:1")).toBeUndefined();
  });
});
