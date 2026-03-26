"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TeacherAuthPanel } from "@/components/teacher/TeacherAuthPanel";
import { isTeacherUser } from "@/lib/firebase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  createTeacherSession,
  getAvailableDecks,
  subscribeToRecentOwnedSessions,
} from "@/lib/sessions/service";
import type { Session } from "@/types/session";

export default function TeacherEntryPage() {
  const { user, isLoading } = useAuthUser();
  const teacherUser = isTeacherUser(user) ? user : null;
  const router = useRouter();
  const decks = useMemo(() => getAvailableDecks(), []);
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id ?? "");
  const [roundDurationSec, setRoundDurationSec] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!teacherUser) {
      setRecentSessions([]);
      return;
    }

    const unsubscribe = subscribeToRecentOwnedSessions(
      (sessions) => setRecentSessions(sessions),
      () => setError("We couldn't load your recent sessions."),
    );

    return () => {
      unsubscribe();
    };
  }, [teacherUser]);

  async function handleCreateSession() {
    if (!selectedDeckId) {
      setError("Choose a deck before creating a session.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const session = await createTeacherSession({
        deckId: selectedDeckId,
        defaultRoundDurationSec: roundDurationSec,
      });
      if (!session) {
        throw new Error("Session creation failed.");
      }

      router.push(`/teacher/session/${session.id}`);
    } catch {
      setError("Unable to create a new classroom session right now.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Teacher access</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Protected teacher tools</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Teacher session management now requires a real Firebase email/password account.
            Students continue using anonymous auth automatically.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
            Choose a deck, create a draft session, review the setup, then open the lobby when class is ready.
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 text-slate-300">
            Loading teacher auth...
          </section>
        ) : !teacherUser ? (
          <TeacherAuthPanel user={null} />
        ) : (
          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Create session</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Pick a classroom deck</h2>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">
                {teacherUser.email ?? "Teacher"}
              </span>
            </div>

            {decks.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-slate-300">
                No active decks are available yet.
              </div>
            ) : (
              <div className="mt-8 grid gap-4">
                {decks.map((deck) => {
                  const selected = deck.id === selectedDeckId;

                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setSelectedDeckId(deck.id)}
                      className={`rounded-[1.5rem] border p-5 text-left ${
                        selected
                          ? "border-cyan-400/60 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{deck.title}</h3>
                          <p className="mt-2 text-sm text-slate-300">{deck.description}</p>
                        </div>
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
                          {deck.label}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded-full bg-slate-950 px-3 py-1">{deck.subject}</span>
                        <span className="rounded-full bg-slate-950 px-3 py-1">{deck.gradeBand}</span>
                        <span className="rounded-full bg-slate-950 px-3 py-1">
                          {deck.questionCount} questions
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-slate-100">Round timer</p>
              <div className="mt-3 flex gap-2">
                {[15, 30, 45, 60].map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setRoundDurationSec(seconds)}
                    className={`rounded-full px-3 py-2 text-sm font-medium ${
                      roundDurationSec === seconds
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-slate-950 text-slate-200"
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={isCreating || !selectedDeckId}
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating session..." : "Create new session"}
              </button>
              <Link
                href="/teacher/session/local-test"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
              >
                Local test session
              </Link>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Recent sessions</p>
                <span className="text-sm text-slate-400">{recentSessions.length}</span>
              </div>

              {recentSessions.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-300">
                  No sessions yet. Create your first class session above.
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/teacher/session/${session.id}`}
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{session.deckTitle}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Code {session.code} / {session.status} / {session.deckQuestionCount} questions
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {session.createdAt
                              ? session.createdAt.toDate().toLocaleString()
                              : "Created just now"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            session.status === "ended"
                              ? "bg-slate-800 text-slate-300"
                              : session.status === "live" || session.status === "starting"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-cyan-500/15 text-cyan-300"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
