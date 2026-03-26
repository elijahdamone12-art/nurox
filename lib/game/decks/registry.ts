import { MATH_FLUENCY_DECK } from "@/lib/game/decks/math-fluency";
import { READING_CONTEXT_DECK } from "@/lib/game/decks/reading-context";
import { SCIENCE_FOUNDATIONS_DECK } from "@/lib/game/decks/science-foundations";
import type { DeckMetadata, QuestionDeck } from "@/types/game";

const DECKS: QuestionDeck[] = [
  SCIENCE_FOUNDATIONS_DECK,
  MATH_FLUENCY_DECK,
  READING_CONTEXT_DECK,
];

export function getActiveDecks(): DeckMetadata[] {
  return DECKS.filter((deck) => deck.isActive).map((deck) => ({
    id: deck.id,
    title: deck.title,
    description: deck.description,
    subject: deck.subject,
    gradeBand: deck.gradeBand,
    questionCount: deck.questionCount,
    label: deck.label,
    isActive: deck.isActive,
  }));
}

export function getDeckById(deckId: string) {
  return DECKS.find((deck) => deck.id === deckId) ?? null;
}

export function getDefaultDeck() {
  return DECKS[0] ?? null;
}
