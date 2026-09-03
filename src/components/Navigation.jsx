
import React from 'react';

export default function Navigation({
  currentQuestion,
  totalQuestions,
  onNext,
  onPrevious,
  onSubmit
}) {
  const isFirstQuestion = currentQuestion === 1;
  const isLastQuestion = currentQuestion === totalQuestions;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto w-full shadow-lg">
     
      {/* Previous Button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/50 flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Previous</span>
      </button>

      {/* Dynamic Question Progress Indicator */}
      <div className="text-center">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Progress</span>
        <span className="text-white font-bold text-sm">
          Question <span className="text-blue-400">{currentQuestion}</span> of {totalQuestions}
        </span>
      </div>

      {/* Action Buttons Group */}
      <div className="flex items-center gap-3">
        {/* Next Button */}
        <button
          type="button"
          onClick={onNext}
          disabled={isLastQuestion}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
        >
          <span>Next</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>

        {/* Submit Exam Button */}
        <button
          type="button"
          onClick={onSubmit}
          className="px-5 py-2.5 rounded-lg font-bold text-sm transition-all bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm border border-emerald-500/30 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span>Submit Exam</span>
        </button>
      </div>

    </div>
  );
}