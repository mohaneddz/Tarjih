import { NextResponse } from "next/server";
import { getAnswers } from "@/data/db";

export async function GET() {
  try {
    const answers = await getAnswers();
    return NextResponse.json(answers);
  } catch (error: any) {
    console.error("[Answers API Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch answers", details: error.message },
      { status: 500 }
    );
  }
}
