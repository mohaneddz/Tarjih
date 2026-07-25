import { NextRequest, NextResponse } from "next/server";

import { getLiveKb } from "@/lib/kb/live-kb";
import { GroqClient } from "@/lib/pipeline/llm";
import { resolveQuestion } from "@/lib/pipeline/resolve";
import { prisma } from "@/data/db";

interface ResolveRequestBody {
  question: string;
  madhhab?: string;
  strictness?: string;
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

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question_required", message: "Question is required." }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "api_key_missing",
        message: "GROQ_API_KEY is not configured in the backend environment. Please check your .env file.",
      },
      { status: 400 }
    );
  }

  const liveKb = await getLiveKb();
  const result = await resolveQuestion({
    question,
    madhhab: body.madhhab,
    strictness: body.strictness,
    llm: new GroqClient(apiKey),
    kb: liveKb.loaded,
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
          },
          { status: 404 }
        );
      case "llm":
        return NextResponse.json({ error: "llm_failed", message: result.error.message }, { status: 502 });
    }
  }

  // Best-effort persistence: never fail the request over it. The Resolution
  // table depends on a migration (`prisma db push`) that may not have run in
  // every environment yet, and a cache write failing is not a reason to
  // discard an answer that has already been fully computed.
  try {
    await prisma.resolution.create({
      data: {
        question: result.view.question,
        goal: result.view.goalText,
        madhhab: result.view.madhhab,
        strictness: result.view.strictness,
        verdict: result.view.verdict,
        confidence: result.view.confidence,
        contested: result.view.contested,
        truncated: result.view.truncated,
        result: JSON.stringify(result.view),
      },
    });
  } catch (persistError) {
    console.warn("[Tarjih] could not persist resolution (continuing without caching):", persistError);
  }

  return NextResponse.json(result.view);
}
