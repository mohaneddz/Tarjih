import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/data/db";
import type { ResolutionView } from "@/lib/pipeline/resolve";

/** Returns the full computed view for a past resolution, as originally persisted. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await prisma.resolution.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "not_found", message: "No resolution with that id." }, { status: 404 });
    }
    const view: ResolutionView = JSON.parse(row.result);
    return NextResponse.json(view);
  } catch (error) {
    console.warn("[Tarjih] could not load resolution:", error);
    return NextResponse.json({ error: "unavailable", message: "History is not available right now." }, { status: 503 });
  }
}
