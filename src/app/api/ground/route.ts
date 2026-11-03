import { NextRequest, NextResponse } from "next/server";

import { MAX_QUESTION_LENGTH, rateLimit } from "@/lib/http/guard";
import { describeLlmFailure, GroqClient } from "@/lib/pipeline/llm";
import { groundQuestion } from "@/lib/pipeline/resolve";

/**
 * Stage 1 only: translate a question into its goal literal, without proving
 * or narrating anything. Backs the Study page's "grounding preview" — real
 * transparency into what the question will actually be evaluated as, not a
 * separate guess from a different code path (see `groundQuestion`).
 */
/**
 * Model calls can wait out a rate limit (see GroqClient), so give the
 * function room rather than letting the platform cut a question off at its
 * default limit.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { question?: string };
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

  const result = await groundQuestion(question, new GroqClient(apiKey));
  if (!result.ok) {
    if (result.error.stage === "goal-grounding") {
      return NextResponse.json(
        { error: "grounding_failed", message: result.error.error.message, detail: result.error.error },
        { status: 422 }
      );
    }
    console.warn("[Tarjih] grounding LLM call failed:", result.error.message);
    return NextResponse.json(
      { error: "llm_failed", kind: result.error.kind, message: describeLlmFailure(result.error.kind) },
      { status: result.error.kind === "rate_limit" ? 429 : 503 }
    );
  }

  return NextResponse.json({ goalText: result.goalText });
}
