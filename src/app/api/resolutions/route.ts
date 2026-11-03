import { NextResponse } from "next/server";

import { prisma } from "@/data/db";

export interface ResolutionSummary {
  readonly id: string;
  readonly question: string;
  readonly goal: string;
  readonly madhhab: string | null;
  readonly verdict: string | null;
  readonly confidence: number | null;
  readonly contested: boolean;
  readonly truncated: boolean;
  readonly createdAt: string;
  /**
   * The declaratory answer ("Void", "Valid") when the case has one. Carried
   * so a case the KB answers only on that axis — zakat paid to a parent —
   * doesn't list as having no answer at all.
   */
  readonly validity: string | null;
}

/** Reads just the declaratory label out of a stored result; never throws. */
function validityOf(result: string): string | null {
  try {
    const label = JSON.parse(result)?.declaratory?.label;
    return typeof label === "string" ? label : null;
  } catch {
    return null;
  }
}

/**
 * Lists previously computed resolutions, most recent first.
 *
 * Best-effort: returns an empty list rather than an error if the table isn't
 * there yet (the schema migration is a separate, deliberate step — see
 * `prisma/schema.prisma`). A missing history is a much smaller problem for
 * the user than a broken page.
 */
export async function GET() {
  try {
    const rows = await prisma.resolution.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        question: true,
        goal: true,
        madhhab: true,
        verdict: true,
        confidence: true,
        contested: true,
        truncated: true,
        createdAt: true,
        result: true,
      },
    });
    const summaries: ResolutionSummary[] = rows.map(({ result, ...r }) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      validity: validityOf(result),
    }));
    return NextResponse.json(summaries);
  } catch (error) {
    console.warn("[Tarjih] could not list resolutions (returning empty history):", error);
    return NextResponse.json([]);
  }
}
