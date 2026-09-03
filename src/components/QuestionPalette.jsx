
import React from 'react';

export default function QuestionPalette({
  totalQuestions,
  currentIndex,
  userAnswers,
  onSelectQuestion
}) {
  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Question Palette
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span className="text-slate-400">Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></span>
            <span className="text-slate-400">Unanswered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="text-slate-400">Current</span>
          </div>
        </div>
      </div>

      {/* Grid Palette */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5 max-h-44 overflow-y-auto pr-1">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const qNum = index + 1;
          const isCurrent = currentIndex === index;
          const isAnswered = Boolean(userAnswers[index]);

          let buttonStyle = 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500';

          if (isAnswered) {
            buttonStyle = 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-semibold';
          }

          if (isCurrent) {
            buttonStyle = 'bg-blue-600 border-blue-400 text-white font-bold ring-2 ring-blue-500/40';
          }

          return (
            <button
              key={qNum}
              type="button"
              onClick={() => onSelectQuestion(index)}
              className={`h-9 rounded-md text-xs sm:text-sm border flex items-center justify-center transition ${buttonStyle}`}
            >
              {qNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}