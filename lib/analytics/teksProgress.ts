import { getStudentProgress, getProgressForStudents } from "@/lib/grading/weakTags";
import type { StudentProgress } from "@/lib/grading/weakTags";
import { lookupStandard } from "@/lib/standards";
import type { TeksStandard } from "@/lib/standards";

export type MasteryLevel = "not_started" | "emerging" | "developing" | "proficient" | "mastered";

export type StudentTeksView = {
  studentId: string;
  tag: string;
  standard?: TeksStandard;
  attempts: number;
  correct: number;
  masteryPct: number;
  masteryLevel: MasteryLevel;
};

export type ClassTeksView = {
  tag: string;
  standard?: TeksStandard;
  averageMasteryPct: number;
  studentCount: number;
  proficientCount: number;
};

export function getMasteryLevel(masteryPct: number, attempts: number): MasteryLevel {
  if (attempts === 0) return "not_started";
  if (masteryPct < 40) return "emerging";
  if (masteryPct < 60) return "developing";
  if (masteryPct < 80) return "proficient";
  return "mastered";
}

export function getStudentTeksViews(progress: StudentProgress): StudentTeksView[] {
  return Object.values(progress.standards).map((s) => ({
    studentId: progress.studentId,
    tag: s.tag,
    standard: lookupStandard(s.tag),
    attempts: s.attempts,
    correct: s.correct,
    masteryPct: s.masteryPct,
    masteryLevel: getMasteryLevel(s.masteryPct, s.attempts),
  }));
}

export function getClassTeksViews(progressList: StudentProgress[]): ClassTeksView[] {
  const tagMap = new Map<string, { total: number; count: number; proficientCount: number }>();

  for (const progress of progressList) {
    for (const s of Object.values(progress.standards)) {
      const existing = tagMap.get(s.tag) ?? { total: 0, count: 0, proficientCount: 0 };
      const level = getMasteryLevel(s.masteryPct, s.attempts);
      tagMap.set(s.tag, {
        total: existing.total + s.masteryPct,
        count: existing.count + 1,
        proficientCount:
          existing.proficientCount + (level === "proficient" || level === "mastered" ? 1 : 0),
      });
    }
  }

  return Array.from(tagMap.entries()).map(([tag, stats]) => ({
    tag,
    standard: lookupStandard(tag),
    averageMasteryPct: Math.round(stats.total / stats.count),
    studentCount: stats.count,
    proficientCount: stats.proficientCount,
  }));
}

export async function fetchStudentTeksProgress(studentId: string): Promise<StudentTeksView[]> {
  const progress = await getStudentProgress(studentId);
  if (!progress) return [];
  return getStudentTeksViews(progress);
}

export async function fetchClassTeksProgress(studentIds: string[]): Promise<ClassTeksView[]> {
  const progressList = await getProgressForStudents(studentIds);
  return getClassTeksViews(progressList);
}
