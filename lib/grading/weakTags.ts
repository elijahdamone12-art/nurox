import {
  doc,
  type DocumentData,
  type DocumentSnapshot,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { collection, query, where } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { GradingResult } from "./testGrading";

export type StudentStandardProgress = {
  tag: string;
  attempts: number;
  correct: number;
  incorrect: number;
  masteryPct: number;
  lastSeenAt: ReturnType<typeof serverTimestamp> | null;
};

export type StudentProgress = {
  studentId: string;
  standards: Record<string, StudentStandardProgress>;
  updatedAt: ReturnType<typeof serverTimestamp> | null;
};

const STUDENT_PROGRESS_COLLECTION = "studentProgress";

function progressDoc(studentId: string) {
  return doc(getClientDb(), STUDENT_PROGRESS_COLLECTION, studentId);
}

function mapProgress(
  snapshot: DocumentSnapshot<DocumentData>,
): StudentProgress | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    studentId: snapshot.id,
    standards: (data.standards as Record<string, StudentStandardProgress>) ?? {},
    updatedAt: data.updatedAt ?? null,
  };
}

export async function persistWeakTags(
  studentId: string,
  gradingResult: GradingResult,
): Promise<void> {
  if (gradingResult.gradedAnswers.length === 0) return;

  const tagsInvolved = new Set<string>();
  for (const answer of gradingResult.gradedAnswers) {
    for (const tag of answer.standardsTags) {
      tagsInvolved.add(tag);
    }
  }

  if (tagsInvolved.size === 0) return;

  const existing = await getStudentProgress(studentId);
  const standards: Record<string, StudentStandardProgress> = existing?.standards ?? {};

  for (const tag of tagsInvolved) {
    const current = standards[tag] ?? {
      tag,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      masteryPct: 0,
      lastSeenAt: null,
    };

    const correctForTag = gradingResult.gradedAnswers.filter(
      (a) => a.isCorrect && a.standardsTags.includes(tag),
    ).length;
    const incorrectForTag = gradingResult.gradedAnswers.filter(
      (a) => !a.isCorrect && a.standardsTags.includes(tag),
    ).length;
    const attemptsForTag = correctForTag + incorrectForTag;

    const newAttempts = current.attempts + attemptsForTag;
    const newCorrect = current.correct + correctForTag;
    const newIncorrect = current.incorrect + incorrectForTag;
    const newMasteryPct = newAttempts > 0 ? Math.round((newCorrect / newAttempts) * 100) : 0;

    standards[tag] = {
      tag,
      attempts: newAttempts,
      correct: newCorrect,
      incorrect: newIncorrect,
      masteryPct: newMasteryPct,
      lastSeenAt: serverTimestamp() as unknown as ReturnType<typeof serverTimestamp>,
    };
  }

  await setDoc(
    progressDoc(studentId),
    {
      studentId,
      standards,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getStudentProgress(studentId: string): Promise<StudentProgress | null> {
  return mapProgress(await getDoc(progressDoc(studentId)));
}

export async function getProgressForStudents(studentIds: string[]): Promise<StudentProgress[]> {
  if (studentIds.length === 0) return [];

  // Firestore 'in' queries allow max 30 items; batch if needed.
  const BATCH_SIZE = 30;
  const results: StudentProgress[] = [];

  for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
    const batch = studentIds.slice(i, i + BATCH_SIZE);
    const snapshot = await getDocs(
      query(
        collection(getClientDb(), STUDENT_PROGRESS_COLLECTION),
        where("studentId", "in", batch),
      ),
    );
    for (const d of snapshot.docs) {
      const p = mapProgress(d);
      if (p) results.push(p);
    }
  }

  return results;
}
