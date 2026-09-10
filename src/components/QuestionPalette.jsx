import React from 'react';

export default function QuestionPalette({
  totalQuestions = 0,
  currentIndex = 0,
  userAnswers = {},
  flaggedQuestions = {},
  onSelectQuestion,
  className = '',
}) {
  return (
    <div className={`w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm font-sans ${className}`}>
      {/* Header & Status Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          Question Matrix ({Object.keys(userAnswers).length}/{totalQuestions})
        </h4>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block"></span>
            <span>Unanswered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span>Flagged</span>
          </div>
        </div>
      </div>

      {/* Grid Matrix Buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto pr-1">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const qNum = index + 1;
          const isCurrent = currentIndex === index;
          const isAnswered = userAnswers[index] !== undefined;
          const isFlagged = Boolean(flaggedQuestions[index]);

          let buttonStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'; // Unanswered

          if (isAnswered) {
            buttonStyle = 'bg-emerald-600 text-white font-extrabold border-emerald-600';
          }

          if (isCurrent) {
            buttonStyle = 'bg-blue-600 text-white font-extrabold ring-2 ring-blue-400 border-blue-600';
          }

          return (
            <button
              key={qNum}
              type="button"
              onClick={() => onSelectQuestion && onSelectQuestion(index)}
              className={`relative h-9 text-xs rounded-xl font-bold transition-all border flex items-center justify-center ${buttonStyle} ${
                isFlagged ? 'ring-2 ring-amber-500 border-amber-500' : ''
              }`}
            >
              {qNum}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 text-[9px]">🚩</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}