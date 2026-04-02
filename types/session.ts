import type { Timestamp } from "firebase/firestore";
import type { GamePhase } from "@/types/game";

export type SessionStatus = "draft" | "lobby" | "starting" | "live" | "ended";

export type Session = {
  id: string;
  code: string;
  teacherId: string;
  mode: string;
  deckId: string;
  deckTitle: string;
  deckSubject: string;
  deckQuestionCount: number;
  defaultRoundDurationSec: number;
  status: SessionStatus;
  gamePhase: GamePhase;
  currentRoundIndex: number;
  activeRoundId: string | null;
  totalRounds: number;
  assignmentId?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
};

export type Player = {
  id: string;
  playerId: string;
  sessionId: string;
  role: "student";
  name: string;
  characterId: string;
  joinedAt: Timestamp | null;
  isConnected: boolean;
  isReady: boolean;
  score: number;
  lastSeenAt: Timestamp | null;
  removedAt: Timestamp | null;
};

export type CharacterOption = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

export type PlayerPresenceState = "connected" | "stale" | "offline";

export type PlayerWithPresence = Player & {
  presence: PlayerPresenceState;
};

export type SessionMetrics = {
  totalPlayers: number;
  connectedPlayers: number;
  readyPlayers: number;
  stalePlayers: number;
};
