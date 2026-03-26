import type { Session, SessionMetrics } from "@/types/session";

const STATUS_COPY: Record<Session["status"], string> = {
  draft: "Session is being prepared",
  lobby: "Waiting room open",
  starting: "Launching game now",
  live: "Game in progress",
  ended: "Session ended",
};

type SessionStatusCardProps = {
  session: Session;
  metrics: SessionMetrics;
};

export function SessionStatusCard({ session, metrics }: SessionStatusCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Session</p>
          <h2 className="text-2xl font-semibold text-white">{session.code}</h2>
          <p className="text-sm text-slate-400">{STATUS_COPY[session.status]}</p>
          <p className="text-sm text-slate-500">
            {session.deckTitle} · {session.deckQuestionCount} questions
          </p>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
          {session.mode}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-slate-900/90 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-lg font-medium capitalize text-slate-100">{session.status}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/90 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Game Phase</p>
          <p className="mt-2 text-lg font-medium capitalize text-slate-100">{session.gamePhase}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/90 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Connected</p>
          <p className="mt-2 text-lg font-medium text-slate-100">{metrics.connectedPlayers}</p>
        </div>
        <div className="rounded-2xl bg-slate-900/90 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ready</p>
          <p className="mt-2 text-lg font-medium text-slate-100">{metrics.readyPlayers}</p>
        </div>
      </div>

      {metrics.stalePlayers > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {metrics.stalePlayers} {metrics.stalePlayers === 1 ? "player looks" : "players look"} stale and may
          have closed or refreshed their tab.
        </div>
      ) : null}
    </div>
  );
}
