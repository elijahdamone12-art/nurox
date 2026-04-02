import type { Timestamp } from "firebase/firestore";
import type { QuestionCard } from "@/types/game";

export type AssignmentQuestionSource = "deck" | "custom" | "ai";

export type AssignmentQuestion = {
  id: string;
  questionCard: QuestionCard;
  sourceType: AssignmentQuestionSource;
  sourceDeckId?: string;
  order: number;
};

export type Assignment = {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  subject: string;
  gradeBand: string;
  questions: AssignmentQuestion[];
  questionCount: number;
  standardsTags: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type AssignmentAnswer = {
  assignmentQuestionId: string;
  chosenOptionId: string;
  isCorrect: boolean;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  sessionId?: string;
  studentId: string;
  answers: AssignmentAnswer[];
  score: number;
  maxScore: number;
  submittedAt: Timestamp | null;
};

export type CreateAssignmentInput = {
  title: string;
  description?: string;
  subject: string;
  gradeBand: string;
  questions: Omit<AssignmentQuestion, "id">[];
};

export type UpdateAssignmentInput = Partial<
  Pick<Assignment, "title" | "description" | "questions" | "subject" | "gradeBand">
>;
