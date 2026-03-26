import { getCharacterById, withDerivedPresence } from "@/lib/sessions/service";
import type { Player } from "@/types/session";

type PlayerListProps = {
  players: Player[];
  highlightPlayerId?: string;
  onRemovePlayer?: (playerId: string) => void;
  isRemovingPlayerId?: string | null;
};

const PRESENCE_STYLES = {
  connected: "bg-emerald-500/15 text-emerald-300",
  stale: "bg-amber-500/15 text-amber-300",
  offline: "bg-slate-800 text-slate-400",
};

const PRESENCE_LABELS = {
  connected: "Connected",
  stale: "Stale",
  offline: "Offline",
};

export function PlayerList({
  players,
  highlightPlayerId,
  onRemovePlayer,
  isRemovingPlayerId,
}: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
        No players have joined yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {withDerivedPresence(players).map((player) => {
        const character = getCharacterById(player.characterId);
        const isCurrentPlayer = player.id === highlightPlayerId;

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
              isCurrentPlayer
                ? "border-cyan-400/60 bg-cyan-500/10"
                : "border-slate-800 bg-slate-900/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{
                  backgroundColor: character ? `${character.color}22` : "#0f172a",
                  color: character?.color ?? "#67e8f9",
                }}
              >
                {character?.emoji ?? ":)"}
              </div>
              <div>
                <p className="font-medium text-slate-100">{player.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                  <span>{character?.name ?? "Unknown character"}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      player.isReady ? "bg-cyan-500/15 text-cyan-300" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {player.isReady ? "Ready" : "Not ready"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${PRESENCE_STYLES[player.presence]}`}
              >
                {PRESENCE_LABELS[player.presence]}
              </span>
              {onRemovePlayer ? (
                <button
                  type="button"
                  onClick={() => onRemovePlayer(player.id)}
                  disabled={isRemovingPlayerId === player.id}
                  className="rounded-full border border-rose-500/30 px-3 py-1 text-xs font-medium text-rose-200 disabled:opacity-50"
                >
                  {isRemovingPlayerId === player.id ? "Removing..." : "Remove"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
