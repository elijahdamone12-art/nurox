"use client";

import type { CharacterOption } from "@/types/session";

type CharacterPickerProps = {
  characters: CharacterOption[];
  selectedCharacterId: string;
  onSelect: (characterId: string) => void;
};

export function CharacterPicker({
  characters,
  selectedCharacterId,
  onSelect,
}: CharacterPickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-100">Choose a character</p>
        <p className="text-sm text-slate-400">Pick a simple avatar for the waiting room.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {characters.map((character) => {
          const selected = character.id === selectedCharacterId;

          return (
            <button
              key={character.id}
              type="button"
              onClick={() => onSelect(character.id)}
              className={`rounded-2xl border px-3 py-4 text-left transition ${
                selected
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                  : "border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner"
                style={{ backgroundColor: `${character.color}22`, color: character.color }}
              >
                {character.emoji}
              </div>
              <p className="font-medium text-slate-100">{character.name}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{character.id}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
