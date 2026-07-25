import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/data/db";
import { clauseRowToEntry } from "@/lib/kb/reviewed";
import { invalidateLiveKb, wouldValidate } from "@/lib/kb/live-kb";

interface ActionBody {
  readonly action: "approve" | "reject" | "revoke";
  readonly reason?: string;
}

/**
 * Approves, rejects, or revokes a formalized clause.
 *
 * Approval is checked *before* it is written: the candidate is merged
 * against every other currently-approved clause and validated as a whole,
 * and refused with a specific reason if that combination doesn't hold up.
 * The alternative — flip the flag, let `getLiveKb()` silently exclude it
 * later — would leave a scholar believing they approved something that
 * quietly never took effect.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: ActionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be JSON." }, { status: 400 });
  }

  const clause = await prisma.clause.findUnique({ where: { id } });
  if (!clause) {
    return NextResponse.json({ error: "not_found", message: "No clause with that id." }, { status: 404 });
  }

  switch (body.action) {
    case "approve": {
      const otherApproved = await prisma.clause.findMany({ where: { unreviewed: false, id: { not: id } } });
      const candidate = clauseRowToEntry({ ...clause, unreviewed: false });
      const report = wouldValidate(otherApproved.map(clauseRowToEntry), candidate);

      if (!report.ok) {
        return NextResponse.json(
          {
            error: "validation_failed",
            message: "Approving this clause would make the knowledge base invalid.",
            issues: report.errors,
          },
          { status: 422 }
        );
      }

      await prisma.clause.update({ where: { id }, data: { unreviewed: false } });
      invalidateLiveKb();
      return NextResponse.json({ ok: true, status: "approved" });
    }

    case "revoke": {
      await prisma.clause.update({ where: { id }, data: { unreviewed: true } });
      invalidateLiveKb();
      return NextResponse.json({ ok: true, status: "unreviewed" });
    }

    case "reject": {
      const reasonNote = body.reason?.trim()
        ? `human-rejected: ${body.reason.trim()}`
        : "human-rejected (no reason given)";
      await prisma.$transaction([
        prisma.clause.delete({ where: { id } }),
        ...(clause.sourceTextId
          ? [
              prisma.sourceText.update({
                where: { id: clause.sourceTextId },
                data: { formalisationStatus: "skipped", formalisationError: reasonNote },
              }),
            ]
          : []),
      ]);
      invalidateLiveKb();
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    default:
      return NextResponse.json(
        { error: "invalid_action", message: "action must be approve, reject, or revoke." },
        { status: 400 }
      );
  }
}
