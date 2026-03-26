import type { QuestionDeck } from "@/types/game";

export const SCIENCE_FOUNDATIONS_DECK: QuestionDeck = {
  id: "science-foundations",
  title: "Science Foundations",
  description: "Quick warm-up science questions for a mixed middle-school classroom.",
  subject: "Science",
  gradeBand: "Grades 5-8",
  questionCount: 3,
  label: "Warm-up",
  isActive: true,
  questions: [
    {
      id: "science-1",
      prompt: "Which planet is known as the Red Planet?",
      options: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Mars" },
        { id: "c", text: "Venus" },
        { id: "d", text: "Jupiter" },
      ],
      correctOptionId: "b",
      explanation: "Mars looks red because iron oxide covers much of its surface.",
    },
    {
      id: "science-2",
      prompt: "Which state of matter has a definite volume but no fixed shape?",
      options: [
        { id: "a", text: "Solid" },
        { id: "b", text: "Gas" },
        { id: "c", text: "Liquid" },
        { id: "d", text: "Plasma" },
      ],
      correctOptionId: "c",
      explanation: "Liquids keep their volume while taking the shape of their container.",
    },
    {
      id: "science-3",
      prompt: "What force pulls objects toward Earth?",
      options: [
        { id: "a", text: "Magnetism" },
        { id: "b", text: "Friction" },
        { id: "c", text: "Gravity" },
        { id: "d", text: "Electricity" },
      ],
      correctOptionId: "c",
      explanation: "Gravity is the force that attracts objects toward Earth.",
    },
  ],
};
