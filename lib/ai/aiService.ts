import Anthropic from "@anthropic-ai/sdk";
import type { QuestionCard } from "@/types/game";
import { normalizeStandardTag } from "@/lib/standards/normalizeTag";
import { lookupStandard } from "@/lib/standards/teksRegistry";
import { validateQuestionCards } from "./validateQuestion";

export type GenerateQuestionsInput = {
  subject: string;
  grade: number;
  standardsTag: string;
  count: number;
};

export type GenerateQuestionsResult =
  | { success: true; questions: QuestionCard[] }
  | { success: false; error: string; partialQuestions?: QuestionCard[] };

function buildPrompt(input: GenerateQuestionsInput, normalizedTag: string): string {
  const standard = lookupStandard(normalizedTag);
  const standardDescription = standard
    ? `"${standard.description}"`
    : "(standard description unavailable)";

  return `Generate ${input.count} multiple-choice quiz questions for grade ${input.grade} ${input.subject} students.

These questions must be aligned to TEKS standard ${normalizedTag}: ${standardDescription}.

Return ONLY a valid JSON array. Each element must be an object with exactly these fields:
{
  "id": "<unique string, e.g. 'q1', 'q2'>",
  "prompt": "<clear question text, max 500 characters>",
  "options": [
    { "id": "a", "text": "<option text>" },
    { "id": "b", "text": "<option text>" },
    { "id": "c", "text": "<option text>" },
    { "id": "d", "text": "<option text>" }
  ],
  "correctOptionId": "<must exactly match one of the option ids above>",
  "explanation": "<brief explanation of the correct answer, max 200 characters>",
  "standardsTags": ["${normalizedTag}"],
  "difficulty": "<one of: easy, medium, hard>"
}

Requirements:
- Each question must have exactly 4 options (ids: a, b, c, d)
- correctOptionId must exactly equal one of the option ids
- Options must be plausible and distinct — avoid obviously wrong distractors
- Questions must be age-appropriate for grade ${input.grade}
- standardsTags must include "${normalizedTag}"
- Return ONLY the JSON array, no markdown, no explanation, no other text`;
}

export async function generateQuestionsForStandard(
  input: GenerateQuestionsInput,
): Promise<GenerateQuestionsResult> {
  try {
    const normalizedTag = normalizeStandardTag(input.standardsTag);

    if (input.count < 1 || input.count > 10) {
      return { success: false, error: "count must be between 1 and 10." };
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const model = process.env.AI_MODEL ?? "claude-sonnet-4-6";

    const message = await client.messages.create({
      model,
      max_tokens: Math.max(1024, input.count * 400),
      system: "You are an educational quiz question generator for K-12 classrooms. You always return valid JSON arrays only, with no additional text.",
      messages: [
        {
          role: "user",
          content: buildPrompt(input, normalizedTag),
        },
      ],
    });

    // Extract text from response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { success: false, error: "AI returned no text content." };
    }

    const rawText = textBlock.text.trim();

    // Parse JSON — handle cases where model wraps in markdown code blocks
    let parsed: unknown;
    try {
      const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(jsonText);
    } catch {
      return {
        success: false,
        error: `AI response was not valid JSON. Raw preview: ${rawText.slice(0, 200)}`,
      };
    }

    if (!Array.isArray(parsed)) {
      return { success: false, error: "AI response was not a JSON array." };
    }

    const { valid, invalid } = validateQuestionCards(parsed);

    if (valid.length === 0) {
      const errorSummary = invalid
        .slice(0, 3)
        .map((e) => `[${e.index}]: ${e.errors.map((err) => err.message).join(", ")}`)
        .join("; ");
      return {
        success: false,
        error: `All ${parsed.length} generated questions failed validation. Errors: ${errorSummary}`,
        partialQuestions: [],
      };
    }

    if (invalid.length > 0) {
      // Partial success — return valid ones, log invalid count
      console.warn(
        `[aiService] ${invalid.length}/${parsed.length} questions failed validation and were discarded.`,
      );
    }

    return { success: true, questions: valid };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `AI generation failed: ${message}` };
  }
}
