import { NextRequest, NextResponse } from "next/server";

import { getLiveKb } from "@/lib/kb/live-kb";
import { MAX_QUESTION_LENGTH, rateLimit } from "@/lib/http/guard";
import { describeLlmFailure, GroqClient } from "@/lib/pipeline/llm";
import { resolveQuestion } from "@/lib/pipeline/resolve";
import { saveResolution } from "@/lib/resolutions";

interface ResolveRequestBody {
  question: string;
  madhhab?: string;
  strictness?: string;
  /** The goal the asker confirmed in the grounding preview; proved as-is when present. */
  goal?: string;
}

/**
 * The entire route is now: ground the question, prove, weigh, narrate. Every
 * substantive decision (which clauses fire, what the verdict is, why one
 * derivation beat another) is made by the deterministic engine in
 * `resolveQuestion` — this handler only translates HTTP in and out and
 * best-effort persists the result.
 */
export async function POST(req: NextRequest) {
  let body: ResolveRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be JSON." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question_required", message: "Question is required." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: "question_too_long", message: `Please keep the question under ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 }
    );
  }
  const confirmedGoal = typeof body.goal === "string" && body.goal.trim() ? body.goal.trim().slice(0, 1000) : undefined;

  const retryAfter = rateLimit(req);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: "rate_limited", message: `Too many questions in a short time. Please wait ${retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "api_key_missing", message: "The language model isn't configured on this server (GROQ_API_KEY is missing)." },
      { status: 503 }
    );
  }

  const liveKb = await getLiveKb();
  const result = await resolveQuestion({
    question,
    madhhab: body.madhhab,
    strictness: body.strictness,
    llm: new GroqClient(apiKey),
    kb: liveKb.loaded,
    confirmedGoal,
  });

  if (!result.ok) {
    switch (result.error.stage) {
      case "goal-grounding":
        return NextResponse.json(
          {
            error: "grounding_failed",
            message: result.error.error.message,
            detail: result.error.error,
          },
          { status: 422 }
        );
      case "no-derivation":
        return NextResponse.json(
          {
            error: "no_derivation",
            message:
              "The knowledge base has no rule covering this question yet. This is a real gap in the KB's " +
              "current coverage, not a failure to understand the question.",
            goal: result.error.goalText,
            stalled: result.error.stalled,
            whatIf: result.error.whatIf,
          },
          { status: 404 }
        );
      case "llm":
        console.warn("[Tarjih] resolve LLM call failed:", result.error.message);
        return NextResponse.json(
          { error: "llm_failed", kind: result.error.kind, message: describeLlmFailure(result.error.kind) },
          { status: result.error.kind === "rate_limit" ? 429 : 503 }
        );
    }
  }

  // Best-effort persistence: never fail the request over it. The Resolution
  // table depends on a migration (`prisma db push`) that may not have run in
  // every environment yet, and a cache write failing is not a reason to
  // discard an answer that has already been fully computed.
  try {
    await saveResolution(result.view);
  } catch (persistError) {
    console.warn("[Tarjih] could not persist resolution (continuing without caching):", persistError);
  }

  return NextResponse.json(result.view);
}
