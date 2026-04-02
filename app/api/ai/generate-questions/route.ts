import { type NextRequest, NextResponse } from "next/server";
import { generateQuestionsForStandard } from "@/lib/ai/aiService";
import { tryNormalizeStandardTag } from "@/lib/standards/normalizeTag";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const { subject, grade, standardsTag, count } = body as Record<string, unknown>;

  if (typeof subject !== "string" || subject.trim() === "") {
    return NextResponse.json({ error: "subject must be a non-empty string." }, { status: 400 });
  }

  const gradeNum = Number(grade);
  if (!Number.isInteger(gradeNum) || gradeNum < 1 || gradeNum > 12) {
    return NextResponse.json({ error: "grade must be an integer between 1 and 12." }, { status: 400 });
  }

  if (typeof standardsTag !== "string") {
    return NextResponse.json({ error: "standardsTag must be a string." }, { status: 400 });
  }
  const normalizedTag = tryNormalizeStandardTag(standardsTag);
  if (!normalizedTag) {
    return NextResponse.json(
      { error: `Invalid TEKS tag format: "${standardsTag}". Expected format: grade.standardLetter (e.g. "5.3A").` },
      { status: 400 },
    );
  }

  const countNum = Number(count);
  if (!Number.isInteger(countNum) || countNum < 1 || countNum > 10) {
    return NextResponse.json({ error: "count must be an integer between 1 and 10." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI generation is not configured." }, { status: 503 });
  }

  const result = await generateQuestionsForStandard({
    subject: subject.trim(),
    grade: gradeNum,
    standardsTag: normalizedTag,
    count: countNum,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        ...(result.partialQuestions ? { partialQuestions: result.partialQuestions } : {}),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ questions: result.questions });
}
