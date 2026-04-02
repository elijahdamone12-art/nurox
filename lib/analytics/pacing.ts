import type { StudentTeksView, MasteryLevel } from "./teksProgress";
import { getMasteryLevel } from "./teksProgress";
import { getStudentTeksViews, fetchStudentTeksProgress } from "./teksProgress";
import { getStudentProgress } from "@/lib/grading/weakTags";
import { getStandardsBySubjectAndGrade } from "@/lib/standards";
import type { TeksStandard } from "@/lib/standards";

export type PacingReason = "weak" | "not_started" | "reinforcement";

export type PacingSuggestion = {
  tag: string;
  standard?: TeksStandard;
  reason: PacingReason;
  priority: number;
};

const LEVEL_PRIORITY: Record<MasteryLevel, number> = {
  emerging: 1,
  developing: 2,
  not_started: 3,
  reinforcement: 4,
  proficient: 5,
  mastered: 6,
} as unknown as Record<MasteryLevel, number>;

export function suggestNextStandards(
  views: StudentTeksView[],
  allStandardsForContext: TeksStandard[],
  maxSuggestions = 5,
): PacingSuggestion[] {
  const seenTags = new Set(views.map((v) => v.tag));
  const suggestions: PacingSuggestion[] = [];

  // Weak / in-progress standards (not yet proficient)
  for (const view of views) {
    if (view.masteryLevel === "proficient" || view.masteryLevel === "mastered") continue;
    const reason: PacingReason =
      view.masteryLevel === "not_started"
        ? "not_started"
        : view.masteryLevel === "developing"
        ? "reinforcement"
        : "weak";
    suggestions.push({
      tag: view.tag,
      standard: view.standard,
      reason,
      priority: LEVEL_PRIORITY[view.masteryLevel] ?? 3,
    });
  }

  // Standards from context that the student has never seen
  for (const standard of allStandardsForContext) {
    if (!seenTags.has(standard.tag)) {
      suggestions.push({
        tag: standard.tag,
        standard,
        reason: "not_started",
        priority: LEVEL_PRIORITY["not_started"],
      });
    }
  }

  return suggestions
    .sort((a, b) => a.priority - b.priority || a.tag.localeCompare(b.tag))
    .slice(0, maxSuggestions);
}

export async function getPacingSuggestionsForStudent(
  studentId: string,
  subject: string,
  grade: number,
  maxSuggestions = 5,
): Promise<PacingSuggestion[]> {
  const progress = await getStudentProgress(studentId);
  const views = progress ? getStudentTeksViews(progress) : [];
  const allStandardsForContext = getStandardsBySubjectAndGrade(subject, grade);
  return suggestNextStandards(views, allStandardsForContext, maxSuggestions);
}
