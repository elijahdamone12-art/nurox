import type { Timestamp } from "firebase/firestore";

export type GamePhase = "lobby" | "question" | "locked" | "reveal" | "leaderboard" | "ended";

export type QuestionOption = {
  id: string;
  text: string;
};

export type QuestionCard = {
  id: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
  standardsTags?: string[];
  difficulty?: "easy" | "medium" | "hard";
};

export type DeckMetadata = {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeBand: string;
  questionCount: number;
  label: string;
  isActive: boolean;
};

export type QuestionDeck = DeckMetadata & {
  questions: QuestionCard[];
};

export type Round = {
  id: string;
  index: number;
  questionId: string;
  question: QuestionCard;
  submittedCount: number;
  correctCount: number;
  durationSec: number;
  roundEndsAt: Timestamp | null;
  pointsAwarded: boolean;
  createdAt: Timestamp | null;
  lockedAt: Timestamp | null;
  revealedAt: Timestamp | null;
};

export type AnswerSubmission = {
  id: string;
  playerId: string;
  roundId: string;
  roundIndex: number;
  answerOptionId: string;
  submittedAt: Timestamp | null;
  isCorrect: boolean | null;
  pointsAwarded: number;
};
