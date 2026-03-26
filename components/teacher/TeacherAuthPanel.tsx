"use client";

import { FormEvent, useState } from "react";
import type { User } from "firebase/auth";

import {
  registerTeacherWithEmail,
  signInTeacherWithEmail,
  signOutCurrentUser,
} from "@/lib/firebase/client";

type TeacherAuthPanelProps = {
  user: User | null;
  title?: string;
  description?: string;
};

export function TeacherAuthPanel({
  user,
  title = "Teacher sign in",
  description = "Sign in with your teacher account to manage sessions.",
}: TeacherAuthPanelProps) {
  const [mode, setMode] = useState<"sign-in" | "register">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "sign-in") {
        await signInTeacherWithEmail(email.trim(), password);
      } else {
        await registerTeacherWithEmail(email.trim(), password);
      }

      setPassword("");
    } catch {
      setError(
        mode === "sign-in"
          ? "Unable to sign in with that teacher account."
          : "Unable to create the teacher account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Teacher account</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">{user.email ?? "Signed in"}</h1>
        <p className="mt-4 text-slate-300">You are authenticated as a teacher account.</p>
        <button
          type="button"
          onClick={() => signOutCurrentUser().catch(() => undefined)}
          className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{title}</p>
      <p className="mt-4 text-slate-300">{description}</p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded-2xl px-4 py-2 text-sm font-medium ${
            mode === "sign-in" ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-200"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-2xl px-4 py-2 text-sm font-medium ${
            mode === "register" ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-200"
          }`}
        >
          Create account
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="teacher@nurox.dev"
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500"
        />

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || password.length < 6}
          className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? mode === "sign-in"
              ? "Signing in..."
              : "Creating account..."
            : mode === "sign-in"
              ? "Sign in as teacher"
              : "Create teacher account"}
        </button>
      </form>
    </div>
  );
}
