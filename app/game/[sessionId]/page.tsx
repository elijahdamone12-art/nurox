"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { LeaderboardPanel } from "@/components/game/LeaderboardPanel";
import { QuestionPanel } from "@/components/game/QuestionPanel";
import { SessionStatusCard } from "@/components/shared/SessionStatusCard";
import { TeacherAuthPanel } from "@/components/teacher/TeacherAuthPanel";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  finishOwnedGame,
  getSessionMetrics,
  isGamePhaseAnswerable,
  isSessionPlayable,
  isValidSessionId,
  lockOwnedRound,
  revealOwnedRound,
  showOwnedLeaderboard,
  startOwnedNextRound,
  submitOwnAnswer,
  subscribeToCurrentRound,
  subscribeToOwnRoundAnswer,
  subscribeToPlayers,
  subscribeToRoundAnswers,
  subscribeToSession,
  heartbeatOwnPresence,
  markOwnPlayerDisconnectedBestEffort,
} from "@/lib/sessions/service";
import { isTeacherUser } from "@/lib/firebase/client";
import type { AnswerSubmission, Round } from "@/types/game";
import type { Player, Session } from "@/types/session";

export default function GamePage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthUser();

  const sessionId = params.sessionId;
  const playerId = searchParams.get("playerId");
  const isTeacherView = !playerId;
  const teacherUser = isTeacherUser(user) ? user : null;

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [ownAnswer, setOwnAnswer] = useState<AnswerSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isTeacherActionLoading, setIsTeacherActionLoading] = useState<string | null>(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const autoLockAttemptedRoundIdRef = useRef<string | null>(null);

  const sessionIdIsValid = isValidSessionId(sessionId);

  useEffect(() => {
    if (!sessionIdIsValid) {
      setSession(null);
      setPlayers([]);
      return;
    }

    if (isTeacherView && isAuthLoading) {
      return;
    }

    if (isTeacherView && !teacherUser) {
      setSession(null);
      setPlayers([]);
      return;
    }

    const unsubscribeSession = subscribeToSession(
      sessionId,
      (nextSession) => setSession(nextSession),
      () => setError("We lost the live session connection."),
    );
    const unsubscribePlayers = subscribeToPlayers(
      sessionId,
      (nextPlayers) => setPlayers(nextPlayers),
      () => setError("We couldn't load the player roster."),
    );

    return () => {
      unsubscribeSession();
      unsubscribePlayers();
    };
  }, [isAuthLoading, isTeacherView, sessionId, sessionIdIsValid, teacherUser]);

  useEffect(() => {
    const unsubscribeRound = subscribeToCurrentRound(
      sessionId,
      session?.activeRoundId ?? null,
      (nextRound) => {
        setRound(nextRound);
      },
      () => setError("We couldn't load the active round."),
    );

    return () => {
      unsubscribeRound();
    };
  }, [session?.activeRoundId, sessionId]);

  useEffect(() => {
    if (isTeacherView) {
      const unsubscribeAnswers = subscribeToRoundAnswers(
        sessionId,
        session?.activeRoundId ?? null,
        (nextAnswers) => {
          setAnswers(nextAnswers);
        },
        () => setError("We couldn't load round answers."),
      );

      return () => {
        unsubscribeAnswers();
      };
    }

    const unsubscribeOwnAnswer = subscribeToOwnRoundAnswer(
      sessionId,
      session?.activeRoundId ?? null,
      playerId,
      (nextAnswer) => {
        setOwnAnswer(nextAnswer);
      },
      () => setError("We couldn't load your answer for this round."),
    );

    return () => {
      unsubscribeOwnAnswer();
    };
  }, [isTeacherView, playerId, session?.activeRoundId, sessionId]);

  useEffect(() => {
    if (!playerId || !sessionIdIsValid) {
      return;
    }

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
    setSelectedOptionId(null);
  }, [session?.activeRoundId]);

  useEffect(() => {
    if (!round?.roundEndsAt || session?.gamePhase !== "question") {
      return;
    }

    const interval = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [round?.roundEndsAt, session?.gamePhase]);

  useEffect(() => {
    if (!isTeacherView || !round || session?.gamePhase !== "question" || isTeacherActionLoading !== null) {
      return;
    }

    const endsAt = round.roundEndsAt?.toMillis();
    if (!endsAt || countdownNow < endsAt) {
      return;
    }

    if (autoLockAttemptedRoundIdRef.current === round.id) {
      return;
    }

    autoLockAttemptedRoundIdRef.current = round.id;
    runTeacherAction("lock");
  }, [countdownNow, isTeacherActionLoading, isTeacherView, round, session?.gamePhase]);

  useEffect(() => {
    if (!session || !playerId) {
      return;
    }

    if (session.status === "lobby" || session.status === "draft") {
      router.replace(`/lobby/${sessionId}?playerId=${playerId}`);
    }
  }, [playerId, router, session, sessionId]);

  const metrics = useMemo(() => getSessionMetrics(players), [players]);
  const currentPlayer = useMemo(
    () => (playerId ? players.find((player) => player.id === playerId) ?? null : null),
    [playerId, players],
  );
  const submittedAnswer = isTeacherView ? null : ownAnswer;
  const submittedCount = round?.submittedCount ?? answers.length;
  const correctCount = round?.correctCount ?? answers.filter((answer) => answer.isCorrect).length;
  const canAnswer =
    !!currentPlayer &&
    !!round &&
    !!session &&
    session.status === "live" &&
    isGamePhaseAnswerable(session.gamePhase) &&
    !submittedAnswer;
  const roundEndsAtMs = round?.roundEndsAt?.toMillis() ?? null;
  const secondsRemaining = roundEndsAtMs
    ? Math.max(0, Math.ceil((roundEndsAtMs - countdownNow) / 1000))
    : null;

  async function handleSubmitAnswer(optionId: string) {
    if (!playerId || !round || !canAnswer) {
      return;
    }

    setSelectedOptionId(optionId);
    setIsSubmittingAnswer(true);
    setError(null);

    try {
      await submitOwnAnswer(sessionId, playerId, optionId);
    } catch {
      setError("Unable to submit that answer. If you already answered, your response is locked.");
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  async function runTeacherAction(action: "start-round" | "lock" | "reveal" | "leaderboard" | "finish") {
    setIsTeacherActionLoading(action);
    setError(null);

    try {
      if (action === "start-round") {
        await startOwnedNextRound(sessionId);
      } else if (action === "lock") {
        await lockOwnedRound(sessionId);
      } else if (action === "reveal") {
        await revealOwnedRound(sessionId);
      } else if (action === "leaderboard") {
        await showOwnedLeaderboard(sessionId);
      } else {
        await finishOwnedGame(sessionId);
      }
    } catch {
      setError("The teacher control could not be completed right now.");
    } finally {
      setIsTeacherActionLoading(null);
    }
  }

  if (session === undefined) {
    if (isTeacherView && isAuthLoading) {
      return (
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/75 px-6 py-8 text-slate-300">
            Loading teacher authentication...
          </div>
        </main>
      );
    }

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/75 px-6 py-8 text-slate-300">
          Loading game session...
        </div>
      </main>
    );
  }

  if (isTeacherView && !teacherUser) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 text-slate-300">
            Teacher game controls require a signed-in teacher account.
          </div>
          <TeacherAuthPanel
            user={null}
            description="Sign in to access the live teacher game board for your sessions."
          />
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-950/75 p-10 text-center shadow-2xl shadow-cyan-950/20">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {sessionIdIsValid ? "Session not found" : "Invalid session link"}
          </h1>
          <p className="mt-4 text-slate-300">This game route cannot be opened.</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (!isSessionPlayable(session.status) && !(session.status === "ended" && session.gamePhase === "ended")) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-950/75 p-10 text-center shadow-2xl shadow-cyan-950/20">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Game access blocked</h1>
          <p className="mt-4 text-slate-300">
            This session is currently in <span className="font-medium text-cyan-200">{session.status}</span>.
          </p>
          <Link
            href={playerId ? `/lobby/${sessionId}?playerId=${playerId}` : `/teacher/session/${sessionId}`}
            className="mt-8 inline-flex rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
          >
            {playerId ? "Return to lobby" : "Back to teacher session"}
          </Link>
        </div>
      </main>
    );
  }

  if (playerId && !currentPlayer) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-950/75 p-10 text-center shadow-2xl shadow-cyan-950/20">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Player not found</h1>
          <p className="mt-4 text-slate-300">This browser is not part of the active session roster.</p>
          <Link
            href="/join"
            className="mt-8 inline-flex rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
          >
            Join again
          </Link>
        </div>
      </main>
    );
  }

  if (isTeacherView && teacherUser && session.teacherId !== teacherUser.uid) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
        <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-950/75 p-10 text-center shadow-2xl shadow-cyan-950/20">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Access denied</h1>
          <p className="mt-4 text-slate-300">This live game board belongs to another teacher account.</p>
          <Link
            href="/teacher"
            className="mt-8 inline-flex rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
          >
            Back to teacher entry
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              {isTeacherView ? "Teacher command center" : "Student gameplay"}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              {session.gamePhase === "lobby" && "Waiting to begin"}
              {session.gamePhase === "question" && "Answer the question"}
              {session.gamePhase === "locked" && "Answers locked"}
              {session.gamePhase === "reveal" && "Results revealed"}
              {session.gamePhase === "leaderboard" && "Leaderboard"}
              {session.gamePhase === "ended" && "Game complete"}
            </h1>
            <p className="mt-4 text-slate-300">
              {isTeacherView
                ? "Control the classroom round flow from here in real time."
                : "Answer once per round and watch the results come in live."}
            </p>
          </div>

          <SessionStatusCard session={session} metrics={metrics} />

          <QuestionPanel
            round={round}
            selectedOptionId={selectedOptionId}
            submittedAnswer={submittedAnswer}
            disabled={!canAnswer || isSubmittingAnswer}
            revealAnswers={session.gamePhase === "reveal" || session.gamePhase === "leaderboard" || session.gamePhase === "ended"}
            onSubmit={handleSubmitAnswer}
          />

          {isTeacherView && (session.gamePhase === "leaderboard" || session.gamePhase === "ended") ? (
            <LeaderboardPanel players={players} highlightPlayerId={playerId} />
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Round status</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {round ? `Round ${round.index + 1} of ${session.totalRounds}` : "No active round"}
                </h2>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">
                Code {session.code}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/90 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Submitted</p>
                <p className="mt-2 text-2xl font-semibold text-white">{submittedCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/90 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {session.gamePhase === "question" ? "Time left" : "Correct"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {session.gamePhase === "question"
                    ? `${secondsRemaining ?? 0}s`
                    : session.gamePhase === "reveal" || session.gamePhase === "leaderboard" || session.gamePhase === "ended"
                    ? correctCount
                    : "--"}
                </p>
              </div>
            </div>

            {!isTeacherView ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                {submittedAnswer
                  ? session.gamePhase === "reveal" || session.gamePhase === "leaderboard" || session.gamePhase === "ended"
                    ? submittedAnswer.isCorrect
                      ? `Correct. You earned ${submittedAnswer.pointsAwarded} points.`
                      : "Not quite. Check the reveal and explanation."
                    : "Your answer is locked in."
                  : session.gamePhase === "question"
                    ? "Choose one answer. You only get one submission per round."
                    : session.gamePhase === "locked"
                      ? "The round is locked. Wait for the reveal."
                      : "Watch for the next teacher action."}
              </div>
            ) : null}
          </div>

          {isTeacherView ? (
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Teacher controls</p>
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={() => runTeacherAction("start-round")}
                  disabled={
                    isTeacherActionLoading !== null ||
                    session.status !== "live" ||
                    !["lobby", "leaderboard"].includes(session.gamePhase)
                  }
                  className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTeacherActionLoading === "start-round" ? "Starting..." : "Start Next Round"}
                </button>
                <button
                  type="button"
                  onClick={() => runTeacherAction("lock")}
                  disabled={
                    isTeacherActionLoading !== null ||
                    session.status !== "live" ||
                    session.gamePhase !== "question"
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTeacherActionLoading === "lock" ? "Locking..." : "Lock Round"}
                </button>
                <button
                  type="button"
                  onClick={() => runTeacherAction("reveal")}
                  disabled={
                    isTeacherActionLoading !== null ||
                    session.status !== "live" ||
                    session.gamePhase !== "locked"
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTeacherActionLoading === "reveal" ? "Revealing..." : "Reveal Answer"}
                </button>
                <button
                  type="button"
                  onClick={() => runTeacherAction("leaderboard")}
                  disabled={
                    isTeacherActionLoading !== null ||
                    session.status !== "live" ||
                    session.gamePhase !== "reveal"
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTeacherActionLoading === "leaderboard" ? "Opening..." : "Show Leaderboard"}
                </button>
                <button
                  type="button"
                  onClick={() => runTeacherAction("finish")}
                  disabled={
                    isTeacherActionLoading !== null ||
                    session.status !== "live" ||
                    session.gamePhase === "question" ||
                    session.gamePhase === "locked"
                  }
                  className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTeacherActionLoading === "finish" ? "Finishing..." : "Finish Game"}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                {session.gamePhase === "lobby" && "Start the first round when the class is ready."}
                {session.gamePhase === "question" &&
                  `Students can answer now. ${secondsRemaining !== null ? `Auto-lock in ${secondsRemaining}s,` : "Timer active,"} or lock manually when you are ready.`}
                {session.gamePhase === "locked" && "Submissions are closed. Reveal the correct answer next."}
                {session.gamePhase === "reveal" && "Results are visible. Show the leaderboard or finish the game."}
                {session.gamePhase === "leaderboard" &&
                  (session.currentRoundIndex + 1 >= session.totalRounds
                    ? "You have reached the end of the deck. Finish the game or reset to lobby."
                    : "Move to the next round whenever you are ready.")}
                {session.gamePhase === "ended" && "The game loop is complete. Reset to lobby from the teacher session page to play again."}
              </div>
            </div>
          ) : null}

          {!isTeacherView ? (
            <LeaderboardPanel players={players} highlightPlayerId={playerId} />
          ) : null}
        </section>
      </div>
    </main>
  );
}
