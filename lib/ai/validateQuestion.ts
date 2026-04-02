import type { QuestionCard } from "@/types/game";
import { tryNormalizeStandardTag } from "@/lib/standards/normalizeTag";

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult =
  | { valid: true; card: QuestionCard }
  | { valid: false; errors: ValidationError[] };

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

export function validateQuestionCard(raw: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { valid: false, errors: [{ field: "root", message: "Must be a plain object." }] };
  }

  const obj = raw as Record<string, unknown>;

  // id
  if (typeof obj.id !== "string" || obj.id.trim() === "") {
    errors.push({ field: "id", message: "Must be a non-empty string." });
  }

  // prompt
  if (typeof obj.prompt !== "string" || obj.prompt.trim() === "") {
    errors.push({ field: "prompt", message: "Must be a non-empty string." });
  } else if (obj.prompt.length > 500) {
    errors.push({ field: "prompt", message: "Must be 500 characters or fewer." });
  }

  // options
  if (!Array.isArray(obj.options)) {
    errors.push({ field: "options", message: "Must be an array." });
  } else if (obj.options.length < 2 || obj.options.length > 6) {
    errors.push({ field: "options", message: "Must have 2–6 options." });
  } else {
    const optionIds = new Set<string>();
    obj.options.forEach((opt, i) => {
      if (typeof opt !== "object" || opt === null) {
        errors.push({ field: `options[${i}]`, message: "Must be an object." });
        return;
      }
      const o = opt as Record<string, unknown>;
      if (typeof o.id !== "string" || o.id.trim() === "") {
        errors.push({ field: `options[${i}].id`, message: "Must be a non-empty string." });
      } else if (optionIds.has(o.id)) {
        errors.push({ field: `options[${i}].id`, message: `Duplicate option id "${o.id}".` });
      } else {
        optionIds.add(o.id);
      }
      if (typeof o.text !== "string" || o.text.trim() === "") {
        errors.push({ field: `options[${i}].text`, message: "Must be a non-empty string." });
      }
    });

    // correctOptionId must reference a valid option id
    if (typeof obj.correctOptionId !== "string" || obj.correctOptionId.trim() === "") {
      errors.push({ field: "correctOptionId", message: "Must be a non-empty string." });
    } else if (!optionIds.has(obj.correctOptionId)) {
      errors.push({
        field: "correctOptionId",
        message: `"${obj.correctOptionId}" does not match any option id.`,
      });
    }
  }

  // explanation (optional)
  if (obj.explanation !== undefined) {
    if (typeof obj.explanation !== "string") {
      errors.push({ field: "explanation", message: "Must be a string if provided." });
    } else if (obj.explanation.length > 1000) {
      errors.push({ field: "explanation", message: "Must be 1000 characters or fewer." });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build the validated card — normalize standardsTags, strip invalid ones silently
  const rawTags = Array.isArray(obj.standardsTags) ? (obj.standardsTags as unknown[]) : [];
  const standardsTags = rawTags
    .filter((t): t is string => typeof t === "string")
    .map((t) => tryNormalizeStandardTag(t))
    .filter((t): t is string => t !== null);

  const difficulty =
    typeof obj.difficulty === "string" && VALID_DIFFICULTIES.has(obj.difficulty)
      ? (obj.difficulty as QuestionCard["difficulty"])
      : undefined;

  const card: QuestionCard = {
    id: (obj.id as string).trim(),
    prompt: (obj.prompt as string).trim(),
    options: (obj.options as Array<{ id: string; text: string }>).map((o) => ({
      id: o.id.trim(),
      text: o.text.trim(),
    })),
    correctOptionId: (obj.correctOptionId as string).trim(),
    ...(typeof obj.explanation === "string" && obj.explanation.trim()
      ? { explanation: obj.explanation.trim() }
      : {}),
    ...(standardsTags.length > 0 ? { standardsTags } : {}),
    ...(difficulty ? { difficulty } : {}),
  };

  return { valid: true, card };
}

export function validateQuestionCards(rawArray: unknown[]): {
  valid: QuestionCard[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
} {
  const valid: QuestionCard[] = [];
  const invalid: Array<{ index: number; errors: ValidationError[] }> = [];

  for (let i = 0; i < rawArray.length; i++) {
    const result = validateQuestionCard(rawArray[i]);
    if (result.valid) {
      valid.push(result.card);
    } else {
      invalid.push({ index: i, errors: result.errors });
    }
  }

  return { valid, invalid };
}
