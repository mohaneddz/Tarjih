import { NextResponse } from "next/server";

import { prisma } from "@/data/db";
import { getLiveKb } from "@/lib/kb/live-kb";

export interface ReviewQueueItem {
  readonly id: string;
  readonly source: string;
  readonly head: string;
  readonly kind: string;
  readonly reference: string;
  readonly grade: string | null;
  readonly scope: string | null;
  readonly dalala: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly sourceText: { readonly textEn: string; readonly textAr: string | null } | null;
}

export interface ExcludedLiveEntry {
  readonly clauseId: string;
  readonly reasons: readonly string[];
}

/**
 * Lists clauses awaiting human review, plus a transparency panel: any
 * *already-approved* clause the live KB had to exclude anyway (a later
 * combination of approvals can surface a conflict that did not exist at the
 * moment each one was individually approved — see `wouldValidate`'s own
 * caveat about this being rare but possible).
 */
export async function GET() {
  try {
    const [pending, live] = await Promise.all([
      prisma.clause.findMany({
        where: { unreviewed: true },
        orderBy: { createdAt: "asc" },
        include: { sourceText: { select: { textEn: true, textAr: true } } },
      }),
      getLiveKb(),
    ]);

    const items: ReviewQueueItem[] = pending.map((c) => ({
      id: c.id,
      source: c.source,
      head: c.head,
      kind: c.kind,
      reference: c.reference,
      grade: c.grade,
      scope: c.scope,
      dalala: c.dalala,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      sourceText: c.sourceText,
    }));

    const excluded: ExcludedLiveEntry[] = live.excluded.map((e) => ({
      clauseId: e.entry.id,
      reasons: e.report.errors.map((err) => err.message),
    }));

    return NextResponse.json({ items, excluded });
  } catch (error) {
    console.warn("[Tarjih] could not load review queue:", error);
    return NextResponse.json({ items: [], excluded: [] });
  }
}
