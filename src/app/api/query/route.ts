import { NextRequest, NextResponse } from "next/server";

import { getLiveKb } from "@/lib/kb/live-kb";
import { runConsoleQuery } from "@/lib/pipeline/console";

interface QueryRequestBody {
  query?: string;
  circumstances?: string[];
  maxSolutions?: number;
}

/**
 * Backs the Prolog console: proves a raw goal against the live KB (core plus
 * reviewed clauses). No LLM is involved, so this works without an API key.
 */
export async function POST(req: NextRequest) {
  let body: QueryRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: { kind: "parse", message: "Request body must be JSON." } }, { status: 400 });
  }

  const circumstances = Array.isArray(body.circumstances)
    ? body.circumstances.filter((c): c is string => typeof c === "string")
    : [];
  const liveKb = await getLiveKb();
  const result = runConsoleQuery(
    { query: typeof body.query === "string" ? body.query : "", circumstances, maxSolutions: body.maxSolutions },
    liveKb.loaded
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
