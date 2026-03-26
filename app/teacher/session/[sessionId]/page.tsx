"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PlayerList } from "@/components/lobby/PlayerList";
import { SessionStatusCard } from "@/components/shared/SessionStatusCard";
import { TeacherAuthPanel } from "@/components/teacher/TeacherAuthPanel";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  createLocalTestSession,
  endOwnedSession,
  getSessionMetrics,
  isValidSessionId,
  openOwnedSessionLobby,
  removePlayerFromOwnedSession,
  resetOwnedSessionToLobby,
  startOwnedSession,
  subscribeToPlayers,
  subscribeToSession,
} from "@/lib/sessions/service";
import { isTeacherUser } from "@/lib/firebase/client";
import type { Player, Session } from "@/types/session";

export default function TeacherSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const teacherUser = isTeacherUser(user) ? user : null;

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isOpeningLobby, setIsOpeningLobby] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const sessionIdIsValid = isValidSessionId(sessionId);

  useEffect(() => {
    if (!sessionIdIsValid || !teacherUser) {
      setSession(null);
      setPlayers([]);
      return;
    }

    const unsubscribeSession = subscribeToSession(
      sessionId,
      (nextSession) => setSession(nextSession),
      () => setError("We lost the live connection to this session."),
    );

    return () => {
      unsubscribeSession();
    };
  }, [sessionId, sessionIdIsValid, teacherUser]);

  useEffect(() => {
    if (!teacherUser || !session || session.teacherId !== teacherUser.uid) {
      setPlayers([]);
      return;
    }

    const unsubscribePlayers = subscribeToPlayers(
      sessionId,
      (nextPlayers) => setPlayers(nextPlayers),
      () => setError("We couldn't load the players for this session."),
    );

    return () => {
      unsubscribePlayers();
    };
  }, [session, sessionId, teacherUser]);

  const metrics = useMemo(() => getSessionMetrics(players), [players]);
  const hasUnreadyPlayers = metrics.totalPlayers > metrics.readyPlayers;

  async function handleStartGame() {
    if (!session) {
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      await startOwnedSession(session.id);
    } catch {
      setError("Unable to start the game right now. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSeedLocalSession() {
    setIsSeeding(true);
    setError(null);

    try {
      await createLocalTestSession(sessionId);
    } catch {
      setError("Unable to create the local test session.");
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleEndSession() {
    if (!session) {
      return;
    }

    setIsEnding(true);
    setError(null);

    try {
      await endOwnedSession(session.id);
    } catch {
      setError("Unable to end the session right now.");
    } finally {
      setIsEnding(false);
    }
  }

  async function handleResetToLobby() {
    if (!session) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      await resetOwnedSessionToLobby(session.id);
    } catch {
      setError("Unable to reset the session back to the lobby.");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleRemovePlayer(playerId: string) {
    setRemovingPlayerId(playerId);
    setError(null);

    try {
      await removePlayerFromOwnedSession(sessionId, playerId);
    } catch {
      setError("Unable to remove that player right now.");
    } finally {
      setRemovingPlayerId(null);
    }
  }

  async function handleOpenLobby() {
    if (!session) {
      return;
    }

    setIsOpeningLobby(true);
    setError(null);

    try {
      await openOwnedSessionLobby(session.id);
    } catch {
      setError("Unable to open the session lobby right now.");
    } finally {
      setIsOpeningLobby(false);
    }
  }

  async function handleCopyJoinCode() {
    if (!session) {
      return;
    }

    try {
      await navigator.clipboard.writeText(session.code);
    } catch {
      setError("Unable to copy the join code on this device.");
    }
  }

  if (isAuthLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/75 px-6 py-8 text-slate-300">
          Loading teacher authentication...
        </div>
      </main>
    );
  }

  if (!teacherUser) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 text-slate-300">
            Teacher routes require a signed-in teacher account.
          </div>
          <TeacherAuthPanel
            user={null}
            description="Sign in to access teacher-owned sessions and classroom controls."
          />
        </div>
      </main>
    );
  }

  if (session === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/75 px-6 py-8 text-slate-300">
          Loading teacher session...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Teacher session</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            {sessionIdIsValid ? "Session not found" : "Invalid session link"}
          </h1>
          <p className="mt-4 text-slate-400">
            {sessionIdIsValid
              ? "For local testing, you can create this session directly from here."
              : "This URL is malformed. Use a simple session id like local-test."}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
            Suggested test URL: <span className="font-mono text-cyan-200">{sessionId}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSeedLocalSession}
              disabled={isSeeding || !sessionIdIsValid}
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSeeding ? "Creating..." : "Create local test session"}
            </button>
            <Link
              href="/teacher"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
            >
              Back to teacher setup
            </Link>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  if (session.teacherId !== teacherUser.uid) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Access denied</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">This session belongs to another teacher</h1>
          <p className="mt-4 text-slate-400">
            You are signed in as {teacherUser.email ?? teacherUser.uid}, but this session is owned by a different teacher account.
          </p>
          <Link
            href="/teacher"
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Back to teacher entry
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
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Teacher console</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Classroom launch</h1>
            <p className="mt-4 text-slate-300">
              Review setup, open the lobby, then launch the class into gameplay when everyone is ready.
            </p>
          </div>

          <SessionStatusCard session={session} metrics={metrics} />

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Session setup</p>
                <p className="mt-2 text-sm text-slate-400">
                  Deck: {session.deckTitle} / {session.deckSubject} / {session.deckQuestionCount} questions
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyJoinCode}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100"
              >
                Copy join code
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/90 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Join code</p>
                <p className="mt-2 font-mono text-2xl text-cyan-200">{session.code}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/90 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Setup state</p>
                <p className="mt-2 text-lg font-medium text-slate-100">
                  {session.status === "draft"
                    ? "Draft setup ready"
                    : session.status === "lobby"
                      ? "Lobby open"
                      : session.status === "ended"
                        ? "Session ended"
                        : "Session running"}
                </p>
              </div>
            </div>

            {session.status === "draft" ? (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                This session is configured and ready. Open the lobby to let students join with the code above.
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
            <p className="text-sm font-semibold text-slate-100">Teacher actions</p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={handleOpenLobby}
                disabled={isOpeningLobby || session.status !== "draft"}
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOpeningLobby ? "Opening..." : "Open Lobby"}
              </button>
              <button
                type="button"
                onClick={handleStartGame}
                disabled={isStarting || session.status !== "lobby" || metrics.connectedPlayers < 1}
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStarting ? "Starting..." : session.status === "lobby" ? "Start Game" : "Start Unavailable"}
              </button>
              <button
                type="button"
                onClick={handleResetToLobby}
                disabled={isResetting || !["starting", "live", "ended"].includes(session.status)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting ? "Resetting..." : "Reset to Lobby"}
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                disabled={isEnding || session.status === "ended"}
                className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEnding ? "Ending..." : "End Session"}
              </button>
              <Link
                href={`/game/${session.id}`}
                className={`inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100 ${
                  session.status === "live" || session.status === "starting"
                    ? ""
                    : "pointer-events-none opacity-60"
                }`}
              >
                Open Live Game Board
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Students can only join once the session is in lobby. They automatically transition
              to the game screen when the session moves through starting into live.
            </p>
            {session.status === "draft" ? (
              <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                Open the lobby first. Starting gameplay stays disabled until students can join.
              </div>
            ) : null}
            {metrics.connectedPlayers < 1 ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                At least one connected player is required before starting.
              </div>
            ) : null}
            {hasUnreadyPlayers && session.status === "lobby" ? (
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                Some players are not ready yet. You can still start once someone is connected.
              </div>
            ) : null}
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
                {metrics.connectedPlayers} connected, {metrics.readyPlayers} ready, {metrics.totalPlayers} total
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-cyan-300">
              {session.deckTitle}
            </span>
          </div>

          <div className="mt-6">
            <PlayerList
              players={players}
              onRemovePlayer={handleRemovePlayer}
              isRemovingPlayerId={removingPlayerId}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
