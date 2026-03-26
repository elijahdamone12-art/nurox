import type { QuestionDeck } from "@/types/game";

export const READING_CONTEXT_DECK: QuestionDeck = {
  id: "reading-context",
  title: "Reading Context Clues",
  description: "Short language arts questions focused on meaning and inference.",
  subject: "ELA",
  gradeBand: "Grades 5-8",
  questionCount: 3,
  label: "Comprehension",
  isActive: true,
  questions: [
    {
      id: "ela-1",
      prompt: "If a character is described as 'hesitant,' what are they most likely feeling?",
      options: [
        { id: "a", text: "Certain and confident" },
        { id: "b", text: "Unsure and cautious" },
        { id: "c", text: "Angry and loud" },
        { id: "d", text: "Excited and rushed" },
      ],
      correctOptionId: "b",
      explanation: "Hesitant usually means unsure or slow to act.",
    },
    {
      id: "ela-2",
      prompt: "Which sentence best shows the setting of a story?",
      options: [
        { id: "a", text: "Maya solved the puzzle quickly." },
        { id: "b", text: "The old lighthouse shook in the stormy night wind." },
        { id: "c", text: "Jordan promised to return." },
        { id: "d", text: "The puppy barked twice." },
      ],
      correctOptionId: "b",
      explanation: "Setting details describe where and when the story takes place.",
    },
    {
      id: "ela-3",
      prompt: "What does it mean to infer in reading?",
      options: [
        { id: "a", text: "To copy a sentence exactly" },
        { id: "b", text: "To sound out a word" },
        { id: "c", text: "To figure something out from clues" },
        { id: "d", text: "To list every detail in order" },
      ],
      correctOptionId: "c",
      explanation: "An inference is a smart guess based on evidence and context clues.",
    },
  ],
};
