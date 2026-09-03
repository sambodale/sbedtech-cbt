
import React from 'react';

export default function QuestionCard({
  questionData,
  questionNumber,
  selectedOption,
  onSelectOption
}) {
  if (!questionData) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 bg-slate-900 rounded-xl border border-slate-800 text-center text-slate-400">
        No question data available.
      </div>
    );
  }

  const options = [
    { label: 'A', text: questionData.optionA },
    { label: 'B', text: questionData.optionB },
    { label: 'C', text: questionData.optionC },
    { label: 'D', text: questionData.optionD }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-left">
      {/* Question Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800 px-3 py-1 rounded-full">
          Question {questionNumber}
        </span>
        {questionData.category && (
          <span className="text-xs text-slate-400 font-medium">
            {questionData.category}
          </span>
        )}
      </div>

      {/* Optional Passage */}
      {questionData.passage && (
        <div className="mb-6 p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed max-h-48 overflow-y-auto">
          <p className="font-semibold text-slate-400 mb-2">Read the passage carefully:</p>
          {questionData.passage}
        </div>
      )}

      {/* Question Text */}
      <h3 className="text-base md:text-lg font-medium text-slate-100 mb-6 leading-relaxed">
        {questionData.question}
      </h3>

      {/* Options List */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onSelectOption(opt.label)}
              className={`w-full flex items-center p-4 rounded-lg border text-left transition-all duration-150 ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm mr-4 shrink-0 transition ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {opt.label}
              </span>

              <span className="text-sm md:text-base font-normal flex-1">
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}