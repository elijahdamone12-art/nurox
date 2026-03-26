"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CharacterPicker } from "@/components/join/CharacterPicker";
import {
  CHARACTER_OPTIONS,
  joinSessionByCode,
  normalizeJoinCode,
} from "@/lib/sessions/service";

export default function JoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTER_OPTIONS[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedJoinCode = useMemo(() => normalizeJoinCode(joinCode), [joinCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const code = normalizeJoinCode(joinCode);

    if (!trimmedName || !code || !selectedCharacterId) {
      setError("Enter your name, a valid code, and choose a character.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await joinSessionByCode({
        code,
        name: trimmedName,
        characterId: selectedCharacterId,
      });

      router.push(`/lobby/${result.session.id}?playerId=${result.playerId}`);
    } catch {
      setError("Something went wrong while joining. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Student join</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Enter the lobby</h1>
          <p className="mt-4 max-w-md text-slate-300">
            Join your classroom session with a short code and character pick.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Normalized code</p>
              <p className="mt-2 font-mono text-2xl text-cyan-200">
                {normalizedJoinCode || "______"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
              Anonymous auth is used automatically for student devices.
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-200">
                Student name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your display name"
                maxLength={24}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="joinCode" className="text-sm font-medium text-slate-200">
                Join code
              </label>
              <input
                id="joinCode"
                value={joinCode}
                onChange={(event) => setJoinCode(normalizeJoinCode(event.target.value))}
                placeholder="ABC123"
                maxLength={8}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono uppercase text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <CharacterPicker
              characters={CHARACTER_OPTIONS}
              selectedCharacterId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
            />

            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Joining..." : "Join session"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
