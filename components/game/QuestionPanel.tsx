"use client";

import type { AnswerSubmission, Round } from "@/types/game";

type QuestionPanelProps = {
  round: Round | null;
  selectedOptionId?: string | null;
  submittedAnswer?: AnswerSubmission | null;
  disabled?: boolean;
  revealAnswers?: boolean;
  onSubmit?: (optionId: string) => void;
};

export function QuestionPanel({
  round,
  selectedOptionId,
  submittedAnswer,
  disabled,
  revealAnswers,
  onSubmit,
}: QuestionPanelProps) {
  if (!round) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 text-slate-300">
        No question is active yet.
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/75 p-8 shadow-2xl shadow-cyan-950/20">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Round {round.index + 1}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{round.question.prompt}</h2>

      <div className="mt-6 grid gap-3">
        {round.question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isSubmitted = submittedAnswer?.answerOptionId === option.id;
          const isCorrect = revealAnswers && round.question.correctOptionId === option.id;
          const isIncorrectSubmitted =
            revealAnswers && isSubmitted && round.question.correctOptionId !== option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSubmit?.(option.id)}
              className={`rounded-2xl border px-4 py-4 text-left disabled:cursor-not-allowed disabled:opacity-70 ${
                isCorrect
                  ? "border-emerald-400/60 bg-emerald-500/10"
                  : isIncorrectSubmitted
                    ? "border-rose-400/40 bg-rose-500/10"
                    : isSelected || isSubmitted
                      ? "border-cyan-400/60 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{option.id}</p>
                  <p className="mt-2 text-lg font-medium text-slate-100">{option.text}</p>
                </div>
                {isCorrect ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Correct
                  </span>
                ) : null}
                {isIncorrectSubmitted ? (
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-300">
                    Your answer
                  </span>
                ) : null}
                {!revealAnswers && isSubmitted ? (
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300">
                    Submitted
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {revealAnswers && round.question.explanation ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          {round.question.explanation}
        </div>
      ) : null}
    </div>
  );
}
