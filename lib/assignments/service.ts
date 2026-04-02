import {
  collection,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { getClientDb, requireTeacherUser } from "@/lib/firebase/client";
import type {
  Assignment,
  AssignmentAnswer,
  AssignmentQuestion,
  AssignmentSubmission,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "@/types/assignment";
import type { QuestionCard } from "@/types/game";

const ASSIGNMENTS_COLLECTION = "assignments";
const SUBMISSIONS_SUBCOLLECTION = "submissions";
const MAX_INLINE_QUESTIONS = 50;

function assignmentsCollection() {
  return collection(getClientDb(), ASSIGNMENTS_COLLECTION);
}

function assignmentDoc(assignmentId: string) {
  return doc(getClientDb(), ASSIGNMENTS_COLLECTION, assignmentId);
}

function submissionsCollection(assignmentId: string) {
  return collection(getClientDb(), ASSIGNMENTS_COLLECTION, assignmentId, SUBMISSIONS_SUBCOLLECTION);
}

function submissionDoc(assignmentId: string, studentId: string) {
  return doc(getClientDb(), ASSIGNMENTS_COLLECTION, assignmentId, SUBMISSIONS_SUBCOLLECTION, studentId);
}

function buildAssignmentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `asn-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `asn-${Math.random().toString(36).slice(2, 10)}`;
}

function buildQuestionId(index: number): string {
  return `aq-${index + 1}`;
}

function extractStandardsTags(questions: AssignmentQuestion[]): string[] {
  const tagSet = new Set<string>();
  for (const q of questions) {
    for (const tag of q.questionCard.standardsTags ?? []) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

function mapAssignment(
  snapshot: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): Assignment | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    teacherId: String(data.teacherId ?? ""),
    title: String(data.title ?? ""),
    description: typeof data.description === "string" ? data.description : undefined,
    subject: String(data.subject ?? ""),
    gradeBand: String(data.gradeBand ?? ""),
    questions: Array.isArray(data.questions) ? (data.questions as AssignmentQuestion[]) : [],
    questionCount: Number(data.questionCount ?? 0),
    standardsTags: Array.isArray(data.standardsTags) ? (data.standardsTags as string[]) : [],
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function mapSubmission(
  snapshot: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): AssignmentSubmission | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    assignmentId: String(data.assignmentId ?? ""),
    sessionId: typeof data.sessionId === "string" ? data.sessionId : undefined,
    studentId: String(data.studentId ?? snapshot.id),
    answers: Array.isArray(data.answers) ? (data.answers as AssignmentAnswer[]) : [],
    score: Number(data.score ?? 0),
    maxScore: Number(data.maxScore ?? 0),
    submittedAt: data.submittedAt ?? null,
  };
}

export async function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
  const teacher = requireTeacherUser();
  const assignmentId = buildAssignmentId();

  const questions: AssignmentQuestion[] = input.questions.map((q, i) => ({
    ...q,
    id: buildQuestionId(i),
    order: i,
  }));

  if (questions.length > MAX_INLINE_QUESTIONS) {
    throw new Error(`Assignments cannot exceed ${MAX_INLINE_QUESTIONS} questions.`);
  }

  const standardsTags = extractStandardsTags(questions);

  await setDoc(assignmentDoc(assignmentId), {
    teacherId: teacher.uid,
    title: input.title.trim(),
    ...(input.description ? { description: input.description.trim() } : {}),
    subject: input.subject,
    gradeBand: input.gradeBand,
    questions,
    questionCount: questions.length,
    standardsTags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const assignment = await getAssignment(assignmentId);
  if (!assignment) throw new Error("Failed to create assignment.");
  return assignment;
}

export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  return mapAssignment(await getDoc(assignmentDoc(assignmentId)));
}

export async function updateAssignment(
  assignmentId: string,
  input: UpdateAssignmentInput,
): Promise<void> {
  const teacher = requireTeacherUser();
  const existing = await getAssignment(assignmentId);

  if (!existing) throw new Error("Assignment not found.");
  if (existing.teacherId !== teacher.uid) throw new Error("You do not own this assignment.");

  const questions = input.questions ?? existing.questions;

  if (questions.length > MAX_INLINE_QUESTIONS) {
    throw new Error(`Assignments cannot exceed ${MAX_INLINE_QUESTIONS} questions.`);
  }

  const standardsTags = extractStandardsTags(questions);

  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    standardsTags,
    questionCount: questions.length,
  };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.gradeBand !== undefined) patch.gradeBand = input.gradeBand;
  if (input.questions !== undefined) patch.questions = input.questions;

  await updateDoc(assignmentDoc(assignmentId), patch);
}

export async function getTeacherAssignments(limitCount = 20): Promise<Assignment[]> {
  const teacher = requireTeacherUser();
  const snapshot = await getDocs(
    query(
      assignmentsCollection(),
      where("teacherId", "==", teacher.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ),
  );
  return snapshot.docs.map((d) => mapAssignment(d)).filter(Boolean) as Assignment[];
}

export function subscribeToTeacherAssignments(
  callback: (assignments: Assignment[]) => void,
  onError?: (error: Error) => void,
  limitCount = 20,
): () => void {
  const teacher = requireTeacherUser();
  return onSnapshot(
    query(
      assignmentsCollection(),
      where("teacherId", "==", teacher.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ),
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapAssignment(d)).filter(Boolean) as Assignment[]);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function addAiQuestionsToAssignment(
  assignmentId: string,
  questions: QuestionCard[],
): Promise<void> {
  const existing = await getAssignment(assignmentId);
  if (!existing) throw new Error("Assignment not found.");

  const startIndex = existing.questions.length;
  if (startIndex + questions.length > MAX_INLINE_QUESTIONS) {
    throw new Error(`Adding these questions would exceed the ${MAX_INLINE_QUESTIONS} question limit.`);
  }

  const newQuestions: AssignmentQuestion[] = questions.map((card, i) => ({
    id: buildQuestionId(startIndex + i),
    questionCard: card,
    sourceType: "ai",
    order: startIndex + i,
  }));

  await updateAssignment(assignmentId, {
    questions: [...existing.questions, ...newQuestions],
  });
}

export async function submitAssignmentAnswers(
  assignmentId: string,
  studentId: string,
  answers: { assignmentQuestionId: string; chosenOptionId: string }[],
  sessionId?: string,
): Promise<AssignmentSubmission> {
  const assignment = await getAssignment(assignmentId);
  if (!assignment) throw new Error("Assignment not found.");

  const questionMap = new Map(assignment.questions.map((q) => [q.id, q]));

  const gradedAnswers: AssignmentAnswer[] = answers.map((a) => {
    const question = questionMap.get(a.assignmentQuestionId);
    const isCorrect = question
      ? question.questionCard.correctOptionId === a.chosenOptionId
      : false;
    return {
      assignmentQuestionId: a.assignmentQuestionId,
      chosenOptionId: a.chosenOptionId,
      isCorrect,
    };
  });

  const score = gradedAnswers.filter((a) => a.isCorrect).length * 100;
  const maxScore = assignment.questionCount * 100;

  const submissionData = {
    assignmentId,
    studentId,
    ...(sessionId ? { sessionId } : {}),
    answers: gradedAnswers,
    score,
    maxScore,
    submittedAt: serverTimestamp(),
  };

  await setDoc(submissionDoc(assignmentId, studentId), submissionData);

  const submission = await getAssignmentSubmission(assignmentId, studentId);
  if (!submission) throw new Error("Failed to save submission.");
  return submission;
}

export async function getAssignmentSubmission(
  assignmentId: string,
  studentId: string,
): Promise<AssignmentSubmission | null> {
  return mapSubmission(await getDoc(submissionDoc(assignmentId, studentId)));
}

export async function getAssignmentSubmissions(
  assignmentId: string,
): Promise<AssignmentSubmission[]> {
  const snapshot = await getDocs(submissionsCollection(assignmentId));
  return snapshot.docs.map((d) => mapSubmission(d)).filter(Boolean) as AssignmentSubmission[];
}
