import { NextRequest, NextResponse } from "next/server";
import { dbNodes, dbEdges } from "@/data/knowledge-base";
import { prisma } from "@/data/db";
import { searchHadiths } from "@/data/hadiths";

// Define the shape of the incoming request body
interface ResolveRequestBody {
  question: string;
  madhhab: string;
  sourceSet: string;
  strictness: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ResolveRequestBody = await req.json();
    const { question, madhhab, sourceSet, strictness } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
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

    // --- STAGE 1: QUERY PLANNING AND KEYWORD GENERATION ---
    const plannerSystemPrompt = `You are the Search & Fiqh Query Planner for Tarjih, an Islamic Jurisprudence Reasoning Engine.
Your task is to analyze the user's inquiry and formulate the target legal relation/concept to investigate, along with a list of key search terms to search in an authoritative Hadith database.

The user is asking: "${question}"
Under juristic parameters:
- Madhhab: ${madhhab} (apply the legal reasoning and principles of this school)
- Strictness Filter: ${strictness}

You MUST respond with a single, valid JSON object matching the following TypeScript schema:
{
  "targetRelation": "Description of the legal relation or concept we want to find (e.g. 'relationship between maternal aunts and mothers regarding respect and care')",
  "keywords": ["array", "of", "2-4", "lowercase", "keywords", "in", "english", "relevant", "for", "searching", "hadiths", "e.g.", "aunt", "mother", "kinship"],
  "reasoningGoal": "Brief summary of what we need to extract to resolve the question"
}

Do not include any markup, markdown wrapper, or explanation outside the JSON object. Output ONLY the JSON block.`;

    const plannerResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: plannerSystemPrompt },
            { role: "user", content: `Plan search for: ${question}` },
          ],
          temperature: 0.1,
        }),
      }
    );

    if (!plannerResponse.ok) {
      const errorData = await plannerResponse.json();
      console.error("[Groq Planner API Error]", errorData);
      return NextResponse.json(
        {
          error: "planner_failed",
          message: errorData.error?.message || "Failed to communicate with Groq Query Planner.",
        },
        { status: 502 }
      );
    }

    const plannerRawResult = await plannerResponse.json();
    const plannerContent = plannerRawResult.choices?.[0]?.message?.content;
    if (!plannerContent) {
      throw new Error("Empty response from Groq planner model.");
    }

    const plannerResult = JSON.parse(plannerContent);
    const keywords: string[] = plannerResult.keywords || [];
    const targetRelation: string = plannerResult.targetRelation || "";
    const reasoningGoal: string = plannerResult.reasoningGoal || "";

    // --- STAGE 2: HADITH SEARCH / SCRAPING ---
    const matchedHadiths = await searchHadiths(keywords);
    const hadithsTextContext = matchedHadiths
      .map(
        (h, index) =>
          `[Hadith #${index + 1}]
Source: ${h.source}
Text: ${h.text}
Tags: ${h.tags.join(", ")}`
      )
      .join("\n\n");

    // Prepare a compact list of known concepts, rules, and relations to send to the LLM for reference
    const knowledgeBaseContext = dbNodes.map((node) => ({
      id: node.id,
      type: node.type,
      title: node.title,
      subtitle: node.subtitle,
      description: node.description,
      details: node.details,
      source: node.source,
      cluster: node.cluster,
    }));

    // --- STAGE 3: SCHOLARLY JURISTIC EXTRACTION ---
    const extractionSystemPrompt = `You are Tarjih, an advanced Islamic Jurisprudence Reasoning and Analytical Weighting Engine.
You synthesize classical Usul al-Fiqh principles with modern Nawazil (contemporary issues) and provide structured logical derivations.

The user is asking a question in natural language: "${question}"
Under the following juristic parameters:
- Madhhab: ${madhhab} (apply the legal reasoning and principles of this school)
- Source Set: ${sourceSet}
- Strictness Filter: ${strictness}

Your search workflow has successfully retrieved the following matching authoritative Hadith text(s) for extraction:
${hadithsTextContext}

Target Relation: ${targetRelation}
Reasoning Goal: ${reasoningGoal}

Your task is to:
1. Formulate a final juristic resolution based on these texts.
2. Select or create exactly 5 nodes to build a Reasoning Tree (DAG) representing the logical path of the derivation, explicitly extracting them from the matched Hadiths:
   - Node 1: Concept (Subject 1 / Fact 1 of the query. Reuse or define a concept ID, title, description).
   - Node 2: Concept (Subject 2 / Fact 2 of the query, e.g. the legal context or comparable entity. Reuse or define).
   - Node 3: Rule (The scriptural rule or text governing the derivation. MUST be extracted from the Matched Hadiths).
   - Node 4: Relation (The legal connective, e.g. Qiyas (Analogy), Rukhshah (Concession), Sadd al-Dhara'i (Blocking the Means), or Maslahah (Public Welfare). Reuse or define).
   - Node 5: Conclusion (The final ruling. Reuse or define).
3. Connect these nodes with exactly 4 edges:
   - Edge 1: Concept 1 -> Relation (type: "Analogical" or "Direct")
   - Edge 2: Concept 2 -> Relation (type: "Analogical" or "Direct")
   - Edge 3: Relation -> Conclusion (type: "Derivation")
   - Edge 4: Rule -> Conclusion (type: "Derivation")
4. Provide detailed inspector data for each node, ensuring that for the Rule node, the 'source' attribute matches the Matched Hadith source and the 'whyFired' details how it applies to the question.

Predefined Database Nodes for context:
${JSON.stringify(knowledgeBaseContext, null, 2)}

You MUST respond with a single, valid JSON object matching the following TypeScript interface schema:
interface AnswerData {
  id: string; // Unique string, e.g., "query-12345" or "halal-lab-meat"
  question: string; // The user's input question
  category: string; // e.g., "General (Ethics)", "Worship (Ibadah)", "Transactions (Muamalat)", "Financials (Zakat)"
  summary: string; // A 1-2 sentence juristic summary of the conclusion
  analysis: string; // Detailed scholarly explanation (2-3 paragraphs) detailing the derivation and school variations (Tarjih), explaining how the concepts were extracted from the matched Hadith text
  references: string[]; // 2-4 primary references, including the matched Hadith sources
  notes: string; // Important juristic caveats, purification actions, or limitations
  confidence: "High" | "Medium" | "Low";
  disclaimer: "This response is generated by Tarjih for study and research purposes, and should not be considered an official fatwa.";
  reasoningTree: {
    statusBadge: string; // e.g., "Likely Forbidden", "Permissible Concession", "Highly Disputed", "Recommended"
    confidenceVal: number; // integer 0-100
    nodes: [
      { id: string; type: "Concept"; title: string; subtitle?: string; description?: string; icon: "user"; badge: "Concept" },
      { id: string; type: "Concept"; title: string; subtitle?: string; description?: string; icon: "user"; badge: "Concept" },
      { id: string; type: "Relation"; title: string; subtitle?: string; description?: string; icon: "scale"; badge: "Relation" },
      { id: string; type: "Rule"; title: string; subtitle?: string; description?: string; icon: "book"; badge: "Rule" },
      { id: string; type: "Conclusion"; title: string; subtitle?: string; description?: string; icon: "scale"; badge: "Conclusion" }
    ];
    edges: [
      { from: string; to: string; type: "Direct" | "Analogical" | "Derivation" },
      { from: string; to: string; type: "Direct" | "Analogical" | "Derivation" },
      { from: string; to: string; type: "Direct" | "Analogical" | "Derivation" },
      { from: string; to: string; type: "Direct" | "Analogical" | "Derivation" }
    ];
    inspectorData: Record<string, {
      type: string; // e.g., "Concept", "Rule", "Relation", "Conclusion"
      source: string; // e.g., "Quranic Text", "Juristic Analogy", "Usul al-Fiqh", or the exact Matched Hadith source
      sourceInfo?: string; // Text snippet or quote from the matched Hadith
      strength: number; // integer 1-5
      confidence: number; // integer 0-100
      whyFired: string; // explanation of why this node is active in the reasoning path
      exceptions: string; // exception conditions or conflicts
      relatedConflicts: string; // description of disputed views or conflicting arguments
    }>;
  };
}

Do not include any markup, markdown wrapper, or explanation outside the JSON object. Output ONLY the JSON block. Ensure the JSON is perfectly valid and matches this structure exactly.`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: extractionSystemPrompt },
            { role: "user", content: `Please resolve this inquiry based on the searched Hadiths: ${question}` },
          ],
          temperature: 0.2,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error("[Groq Extraction API Error]", errorData);
      return NextResponse.json(
        {
          error: "groq_failed",
          message: errorData.error?.message || "Failed to communicate with Groq Extraction Engine.",
        },
        { status: 502 }
      );
    }

    const rawResult = await groqResponse.json();
    const messageContent = rawResult.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Empty response from Groq model.");
    }

    const responseJSON = JSON.parse(messageContent);

    // Save the resolved answer to SQLite database
    const dbAnswer = await prisma.answer.create({
      data: {
        id: responseJSON.id || `query-${Date.now()}`,
        question: responseJSON.question || question,
        category: responseJSON.category || "General",
        summary: responseJSON.summary || "",
        analysis: responseJSON.analysis || "",
        references: JSON.stringify(responseJSON.references || []),
        notes: responseJSON.notes || "",
        confidence: responseJSON.confidence || "Medium",
        disclaimer: responseJSON.disclaimer || "This response is generated by Tarjih for study and research purposes, and should not be considered an official fatwa.",
        reasoningTree: JSON.stringify(responseJSON.reasoningTree),
      },
    });

    // Parse the newly created database object back to type AnswerData
    const savedAnswer = {
      id: dbAnswer.id,
      question: dbAnswer.question,
      category: dbAnswer.category,
      summary: dbAnswer.summary,
      analysis: dbAnswer.analysis,
      references: JSON.parse(dbAnswer.references),
      notes: dbAnswer.notes,
      confidence: dbAnswer.confidence as any,
      disclaimer: dbAnswer.disclaimer as any,
      reasoningTree: JSON.parse(dbAnswer.reasoningTree),
    };

    return NextResponse.json(savedAnswer);
  } catch (error: any) {
    console.error("[Resolve API Error]", error);
    return NextResponse.json(
      {
        error: "internal_error",
        message: error.message || "An unexpected error occurred during resolution.",
      },
      { status: 500 }
    );
  }
}
