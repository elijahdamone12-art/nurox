import type { QuestionDeck } from "@/types/game";

export const MATH_FLUENCY_DECK: QuestionDeck = {
  id: "math-fluency",
  title: "Math Fluency Sprint",
  description: "Fast multiple-choice arithmetic and number sense practice.",
  subject: "Math",
  gradeBand: "Grades 4-7",
  questionCount: 3,
  label: "Fluency",
  isActive: true,
  questions: [
    {
      id: "math-1",
      prompt: "What is 9 x 6?",
      options: [
        { id: "a", text: "42" },
        { id: "b", text: "54" },
        { id: "c", text: "63" },
        { id: "d", text: "49" },
      ],
      correctOptionId: "b",
      explanation: "Nine groups of six equals fifty-four.",
    },
    {
      id: "math-2",
      prompt: "Which fraction is equal to one-half?",
      options: [
        { id: "a", text: "2/3" },
        { id: "b", text: "3/4" },
        { id: "c", text: "4/8" },
        { id: "d", text: "5/8" },
      ],
      correctOptionId: "c",
      explanation: "Four out of eight simplifies to one-half.",
    },
    {
      id: "math-3",
      prompt: "What is 120 divided by 10?",
      options: [
        { id: "a", text: "12" },
        { id: "b", text: "10" },
        { id: "c", text: "14" },
        { id: "d", text: "20" },
      ],
      correctOptionId: "a",
      explanation: "Dividing by ten moves the decimal one place left.",
    },
  ],
};
