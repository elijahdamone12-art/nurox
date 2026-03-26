import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Nurox internal milestone</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Session join flow for live classroom lobbies.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Students can join with a short code, appear in a live waiting room, and move into
            the game together when the teacher starts the session.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/join"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Join as student
            </Link>
            <Link
              href="/teacher"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Teacher sign in
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-950/65 p-8">
          <p className="text-sm font-semibold text-slate-100">Quick test path</p>
          <ol className="mt-4 space-y-4 text-sm text-slate-300">
            <li>1. Sign in as a teacher and create a session from the teacher setup page.</li>
            <li>2. Open the lobby and copy the displayed join code into the student join page.</li>
            <li>3. Join from one or more tabs and watch the teacher lobby update live.</li>
            <li>4. Start the session and run the classroom rounds from the live game board.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
