import { getDefaultDeck } from "@/lib/game/decks";

// Backwards-compatible shim for older imports while the deck registry becomes the source of truth.
export const LOCAL_QUESTION_DECK = getDefaultDeck()?.questions ?? [];
