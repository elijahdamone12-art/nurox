import { getCharacterById } from "@/lib/sessions/service";
import type { Player } from "@/types/session";

type LeaderboardPanelProps = {
  players: Player[];
  highlightPlayerId?: string | null;
};

export function LeaderboardPanel({ players, highlightPlayerId }: LeaderboardPanelProps) {
  const sortedPlayers = [...players].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.name.localeCompare(right.name);
  });

  if (sortedPlayers.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 text-slate-300">
        No players on the leaderboard yet.
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Leaderboard</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Current standings</h3>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">
          {sortedPlayers.length} players
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        {sortedPlayers.map((player, index) => {
          const character = getCharacterById(player.characterId);
          const isCurrent = player.id === highlightPlayerId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                isCurrent
                  ? "border-cyan-400/60 bg-cyan-500/10"
                  : "border-slate-800 bg-slate-900/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-cyan-200">
                  #{index + 1}
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                  style={{
                    backgroundColor: character ? `${character.color}22` : "#0f172a",
                    color: character?.color ?? "#67e8f9",
                  }}
                >
                  {character?.emoji ?? ":)"}
                </div>
                <div>
                  <p className="font-medium text-slate-100">{player.name}</p>
                  <p className="text-sm text-slate-400">{character?.name ?? "Unknown character"}</p>
                </div>
              </div>
              <p className="text-xl font-semibold text-white">{player.score}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
