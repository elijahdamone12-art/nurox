"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { PlayerList } from "@/components/lobby/PlayerList";
import { SessionStatusCard } from "@/components/shared/SessionStatusCard";
import {
  getCharacterById,
  getSessionMetrics,
  heartbeatOwnPresence,
  isSessionPlayable,
  isValidSessionId,
  markOwnPlayerDisconnectedBestEffort,
  setOwnReadyState,
  subscribeToPlayers,
  subscribeToSession,
} from "@/lib/sessions/service";
import type { Player, Session } from "@/types/session";

export default function LobbyPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = params.sessionId;
  const playerId = searchParams.get("playerId") ?? "";

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingReady, setIsUpdatingReady] = useState(false);

  const sessionIdIsValid = isValidSessionId(sessionId);

  useEffect(() => {
    if (!sessionIdIsValid) {
      setSession(null);
      setPlayers([]);
      return;
    }

    const unsubscribeSession = subscribeToSession(
      sessionId,
      (nextSession) => {
        setSession(nextSession);
      },
      () => setError("We lost the live session connection."),
    );

    const unsubscribePlayers = subscribeToPlayers(
      sessionId,
      (nextPlayers) => {
        setPlayers(nextPlayers);
      },
      () => setError("We couldn't load the players in this lobby."),
    );

    return () => {
      unsubscribeSession();
      unsubscribePlayers();
    };
  }, [sessionId, sessionIdIsValid]);

  useEffect(() => {
    if (!sessionIdIsValid || !playerId) return;

    heartbeatOwnPresence(sessionId, playerId, { isConnected: true }).catch(() => undefined);

    const heartbeat = window.setInterval(() => {
      heartbeatOwnPresence(sessionId, playerId, { isConnected: true }).catch(() => undefined);
    }, 15_000);

    return () => {
      window.clearInterval(heartbeat);
      markOwnPlayerDisconnectedBestEffort(sessionId, playerId).catch(() => undefined);
    };
  }, [playerId, sessionId, sessionIdIsValid]);

  useEffect(() => {
    if (session && isSessionPlayable(session.status) && playerId) {
      const query = playerId ? `?playerId=${playerId}` : "";
      router.replace(`/game/${sessionId}${query}`);
    }
  }, [playerId, router, session?.status, sessionId]);

  const currentPlayer = useMemo(
    () => players.find((player) => player.id === playerId) ?? null,
    [playerId, players],
  );
  const selectedCharacter = currentPlayer ? getCharacterById(currentPlayer.characterId) : null;
  const metrics = useMemo(() => getSessionMetrics(players), [players]);

  async function handleReadyToggle() {
    if (!currentPlayer || !session || session.status !== "lobby") {
      return;
    }

    setIsUpdatingReady(true);
    setError(null);

    try {
      await setOwnReadyState(session.id, currentPlayer.id, !currentPlayer.isReady);
    } catch {
      setError("Unable to update your ready state right now.");
    } finally {
      setIsUpdatingReady(false);
    }
  }

  if (!playerId) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-950/75 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Lobby access blocked</h1>
          <p className="mt-3 text-slate-400">This lobby link is missing player details.</p>
          <Link
            href="/join"
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            Back to join
          </Link>
        </div>
      </main>
    );
  }

  if (session === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/75 px-6 py-8 text-slate-300">
          Loading lobby...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-950/75 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">
            {sessionIdIsValid ? "Session not found" : "Invalid session link"}
          </h1>
          <p className="mt-3 text-slate-400">
            {sessionIdIsValid
              ? "This lobby no longer exists or the link is invalid."
              : "This session URL is malformed and cannot be opened."}
          </p>
          <Link
            href="/join"
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            Back to join
          </Link>
        </div>
      </main>
    );
  }

  if (!currentPlayer) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-950/75 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">You&apos;re not in this session</h1>
          <p className="mt-3 text-slate-400">
            Your player entry is missing, removed, or belongs to a different browser.
          </p>
          <Link
            href="/join"
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            Rejoin session
          </Link>
        </div>
      </main>
    );
  }

  if (session.status === "ended") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-950/75 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Session ended</h1>
          <p className="mt-3 text-slate-400">This classroom session has ended.</p>
          <Link
            href="/join"
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            Join another session
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Student lobby</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Waiting for teacher to start
            </h1>
            <p className="mt-4 text-slate-300">
              {session.status === "lobby"
                ? "Stay here while everyone joins. You&apos;ll move into the game automatically."
                : "The teacher is moving the class into the game now."}
            </p>
          </div>

          <SessionStatusCard session={session} metrics={metrics} />

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
            <p className="text-sm font-semibold text-slate-100">Your selection</p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{
                  backgroundColor: selectedCharacter ? `${selectedCharacter.color}22` : "#0f172a",
                  color: selectedCharacter?.color ?? "#67e8f9",
                }}
              >
                {selectedCharacter?.emoji ?? ":)"}
              </div>
              <div>
                <p className="text-lg font-medium text-white">
                  {currentPlayer.name}
                </p>
                <p className="text-slate-400">{selectedCharacter?.name ?? "Character pending"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReadyToggle}
              disabled={isUpdatingReady || session.status !== "lobby"}
              className={`mt-5 w-full rounded-2xl px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                currentPlayer.isReady
                  ? "border border-slate-700 bg-slate-900 text-slate-100"
                  : "bg-cyan-400 text-slate-950"
              }`}
            >
              {isUpdatingReady
                ? "Updating..."
                : currentPlayer.isReady
                  ? "Mark Not Ready"
                  : "Mark Ready"}
            </button>
            <p className="mt-3 text-sm text-slate-400">
              Ready players: {metrics.readyPlayers} of {metrics.totalPlayers}
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">Joined players</p>
              <p className="text-sm text-slate-400">
                {metrics.connectedPlayers} connected, {metrics.readyPlayers} ready
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-cyan-300">
              Mode: {session.mode}
            </span>
          </div>

          <div className="mt-6">
            <PlayerList players={players} highlightPlayerId={playerId} />
          </div>
        </section>
      </div>
    </main>
  );
}
