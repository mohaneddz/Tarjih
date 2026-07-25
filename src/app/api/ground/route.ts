import { NextRequest, NextResponse } from "next/server";

import { GroqClient } from "@/lib/pipeline/llm";
import { groundQuestion } from "@/lib/pipeline/resolve";

/**
 * Stage 1 only: translate a question into its goal literal, without proving
 * or narrating anything. Backs the Study page's "grounding preview" — real
 * transparency into what the question will actually be evaluated as, not a
 * separate guess from a different code path (see `groundQuestion`).
 */
export async function POST(req: NextRequest) {
  let body: { question?: string };
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
    return NextResponse.json({ error: "api_key_missing", message: "GROQ_API_KEY is not configured." }, { status: 400 });
  }

  const result = await groundQuestion(question, new GroqClient(apiKey));
  if (!result.ok) {
    if (result.error.stage === "goal-grounding") {
      return NextResponse.json(
        { error: "grounding_failed", message: result.error.error.message, detail: result.error.error },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "llm_failed", message: result.error.message }, { status: 502 });
  }

  return NextResponse.json({ goalText: result.goalText });
}
