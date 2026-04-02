import type { QuestionCard } from "@/types/game";

export type GradedAnswer = {
  questionId: string;
  chosenOptionId: string;
  isCorrect: boolean;
  standardsTags: string[];
  difficulty?: "easy" | "medium" | "hard";
};

export type GradingResult = {
  gradedAnswers: GradedAnswer[];
  score: number;
  maxScore: number;
  scorePct: number;
  weakTags: string[];
  strongTags: string[];
};

export type AnswerInput = {
  questionCard: QuestionCard;
  chosenOptionId: string;
};

const POINTS_PER_CORRECT = 100;

export function gradeAnswers(answers: AnswerInput[]): GradingResult {
  const weakTagSet = new Set<string>();
  const strongTagSet = new Set<string>();

  const gradedAnswers: GradedAnswer[] = answers.map(({ questionCard, chosenOptionId }) => {
    const isCorrect = questionCard.correctOptionId === chosenOptionId;
    const tags = questionCard.standardsTags ?? [];

    if (isCorrect) {
      for (const tag of tags) strongTagSet.add(tag);
    } else {
      for (const tag of tags) weakTagSet.add(tag);
    }

    return {
      questionId: questionCard.id,
      chosenOptionId,
      isCorrect,
      standardsTags: tags,
      difficulty: questionCard.difficulty,
    };
  });

  const score = gradedAnswers.filter((a) => a.isCorrect).length * POINTS_PER_CORRECT;
  const maxScore = answers.length * POINTS_PER_CORRECT;
  const scorePct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    gradedAnswers,
    score,
    maxScore,
    scorePct,
    weakTags: Array.from(weakTagSet).sort(),
    strongTags: Array.from(strongTagSet).sort(),
  };
}
