/**
 * Prompt construction for the two LLM calls in the pipeline.
 *
 * Kept as pure string-building functions, deliberately separate from the
 * fetch call itself, so the prompts can be inspected and tested without a
 * network dependency.
 *
 * The two calls have sharply different jobs and sharply different amounts of
 * trust: the goal-parsing call only picks *which* known terms the question
 * refers to (its output is independently validated against the lexicon
 * afterwards — see `goal.ts`); the narration call explains a verdict that has
 * already been computed and is explicitly told it cannot change it.
 */

import { lexiconPromptBlock } from "../kb/lexicon";
import { AHKAM_TAKLIFIYYA, HUKM_LABELS } from "../kb/ontology";
import type { OutcomeGroupView, TarjihStepView } from "./present";

export interface LlmMessages {
  readonly system: string;
  readonly user: string;
}

// ---------------------------------------------------------------------------
// Stage 1: natural language -> goal literal
// ---------------------------------------------------------------------------

export function buildGoalPrompt(question: string): LlmMessages {
  const system = `You are the question-grounding stage of Tarjih, a symbolic Islamic legal reasoning engine.

Your ONLY job is to translate the user's question into a single goal literal for
a backward-chaining prover, using EXACTLY the vocabulary below. You do not answer
the question, and you do not reason about fiqh — a separate deterministic engine
does that. If you use a term that is not listed, the engine will correctly report
that it doesn't know that term, so do not guess or substitute a similar-sounding
term.

${lexiconPromptBlock()}

Ruling values (for reference only — you do not choose one): ${AHKAM_TAKLIFIYYA.join(", ")}.

Output format: respond with EXACTLY ONE LINE, no explanation, no markdown, no
code fences, matching this pattern precisely:

  ruling(<act>(<entity>), H)

For example, for "Is mistreating my mother wrong?" you would output exactly:

  ruling(mistreat(mother), H)

If — and only if — the question states that the asker is in one of the known
circumstances above, append it to the same line, comma-separated:

  ruling(consume(carrion), H), circumstance(starvation)

This is the most consequential judgement you make. A circumstance unlocks a
legal concession, so adding one the asker did not claim converts a prohibition
into a permission for someone who was never entitled to it. "Can I eat carrion
if I am starving?" states the circumstance. "Is eating carrion permitted?",
"What is the ruling on carrion?", and "Is carrion halal in Islam?" do NOT —
they ask the general rule, and the general rule is what they must get. When in
doubt, leave the circumstance off: omitting one gives the asker the ordinary
ruling, which is the safe direction to be wrong in.

Some entities in the list are deliberately close to each other and differ on
one detail that changes the ruling — two sales of goods not yet in hand, say,
where one fixes the quantity and delivery and the other does not. Read the
whole label, not the first few words, and pick on the detail rather than on
the general resemblance. If the question does not settle which of two near
neighbours it means, answer NONE: a confident answer to the wrong one of a
pair is worse than no answer, because nothing downstream can detect it.

The question must genuinely be ABOUT the act and entity you choose — not merely
built from words that happen to appear in the lists above. "Is it halal to fight
back against an attacker?" is NOT a question about food, even though the only
acts you know are mistreat/1 and consume/1; forcing it into
"ruling(consume(swine), H)" would make the engine confidently answer a
completely different question and mislead whoever asked it. That is far worse
than admitting the knowledge base doesn't cover this yet.

If the question is not genuinely about mistreating a known relative or
consuming a known foodstuff, respond with EXACTLY the single word:

  NONE

Do not guess a structurally-valid-but-unrelated goal just to produce output.
NONE is a correct, expected, and safe answer for any question outside the
lists above — the engine will report that plainly rather than treat it as a
failure.`;

  const user = `Question: ${question}`;
  return { system, user };
}

// ---------------------------------------------------------------------------
// Stage 2: computed verdict -> narration
// ---------------------------------------------------------------------------

export interface NarrationInput {
  readonly question: string;
  readonly goalText: string;
  readonly madhhabRequested?: string;
  readonly contested: boolean;
  readonly unresolved: boolean;
  readonly verdict?: string;
  readonly groups: readonly OutcomeGroupView[];
  readonly resolution: readonly TarjihStepView[];
  readonly truncated: boolean;
  /** Declaratory status of the transaction, when there is one. */
  readonly declaratory?: { readonly status: string; readonly label: string; readonly gloss: string };
}

function renderGroups(groups: readonly OutcomeGroupView[]): string {
  return groups
    .map((g) => {
      const label = HUKM_LABELS[g.outcome as keyof typeof HUKM_LABELS]?.en ?? g.outcome;
      return `- ${g.outcome} (${label}): ${g.confidence}% confidence, ${g.derivationCount} independent derivation(s).\n${indent(proofSummary(g))}`;
    })
    .join("\n");
}

function proofSummary(group: OutcomeGroupView): string {
  const lines: string[] = [];
  const walk = (node: OutcomeGroupView["proof"], depth: number) => {
    const cite = node.evidence.reference !== "(no evidence record)" ? ` [${node.evidence.reference}]` : "";
    lines.push(`${"  ".repeat(depth)}${node.goal}${cite}`);
    for (const c of node.children) walk(c, depth + 1);
  };
  walk(group.proof, 0);
  return lines.join("\n");
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
}

export function buildNarrationPrompt(input: NarrationInput): LlmMessages {
  const madhhabCaveat = input.madhhabRequested
    ? `\nNote: the user asked for the ${input.madhhabRequested} school specifically. The knowledge base used here is currently madhhab-neutral and does not yet model inter-school variation — say so plainly rather than implying school-specific analysis was performed.`
    : "";

  const truncationCaveat = input.truncated
    ? "\nNote: the search hit a resource budget and may not have found every derivation. Mention this as a limitation."
    : "";

  const declaratoryLine = input.declaratory
    ? `\nThe engine also determined the transaction's declaratory status (al-hukm al-wad'i): ${input.declaratory.status} — ${input.declaratory.label}. ${input.declaratory.gloss} This answers a different question from the ruling above: whether the act is permitted is one thing, whether the contract legally takes effect is another, and the two can diverge. Report both, and do not merge them into a single verdict.`
    : "";

  const verdictLine = input.unresolved
    ? "The engine found genuinely conflicting rulings that its weighing rules could not separate. Do NOT pick a side yourself — present both positions as an open, unresolved tension."
    : `The engine has already determined the verdict: ${input.verdict}. This is FINAL. Do not propose a different verdict, hedge it away, or suggest the engine might be wrong about which ruling applies — your job is only to explain, in accessible language, why the evidence below leads here.`;

  const system = `You are the narration stage of Tarjih, a symbolic Islamic legal reasoning engine.

A deterministic prover has already found every applicable derivation and a
weighing algorithm has already resolved any conflict between them using the
classical murajjihat (rules for preferring between conflicting evidences).
${verdictLine}${declaratoryLine}

Write for an educated layperson, not a scholar audience. Reference the actual
citations given below rather than generic phrases like "textual evidence
suggests". Where the reasoning used qiyas (analogy) or a legal maxim rather
than a direct text, say so plainly rather than implying certainty it doesn't
have.${madhhabCaveat}${truncationCaveat}

Respond with a single JSON object, no markdown fences, matching:
{
  "summary": "one or two sentence plain-language answer",
  "analysis": "two to three paragraphs walking through the derivation(s) and, if contested, the tarjih reasoning",
  "notes": "caveats, limitations, or exceptions worth flagging; empty string if none"
}`;

  const user = `Question: ${input.question}
Formal goal: ${input.goalText}
Contested: ${input.contested}

Derivations found:
${renderGroups(input.groups)}
${
  input.resolution.length > 0
    ? `\nTarjih reasoning applied:\n${input.resolution.map((s) => `- [${s.rule}] ${s.winner} preferred over ${s.loser}: ${s.explanation}`).join("\n")}`
    : ""
}`;

  return { system, user };
}
