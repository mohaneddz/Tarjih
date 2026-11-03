import { NextResponse } from "next/server";

import { prisma } from "@/data/db";

export const dynamic = "force-dynamic";

/**
 * A one-glance check before a demo: is the database there, how much demo
 * content does it hold, and is the language model configured. Reports the
 * presence of the key, never the key.
 */
export async function GET() {
  const llmConfigured = Boolean(process.env.GROQ_API_KEY);
  try {
    const [resolutions, pendingReview, approved] = await Promise.all([
      prisma.resolution.count(),
      prisma.clause.count({ where: { unreviewed: true } }),
      prisma.clause.count({ where: { unreviewed: false } }),
    ]);
    return NextResponse.json({ ok: llmConfigured, database: "ok", resolutions, pendingReview, approved, llmConfigured });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable",
        detail: error instanceof Error ? error.message : String(error),
        llmConfigured,
      },
      { status: 503 }
    );
  }
}
