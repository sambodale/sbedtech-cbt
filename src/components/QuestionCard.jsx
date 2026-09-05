// src/components/QuestionCard.jsx

import React, { useState } from 'react';

export default function QuestionCard({ subject, mode, questions, onEndExam }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 font-medium">No question data available.</p>
        <button
          onClick={onEndExam}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Extract and normalize option entries into [[key, value], ...]
  const rawOptions = currentQuestion.options || {};
  let optionEntries = [];

  if (Array.isArray(rawOptions)) {
    optionEntries = rawOptions.map((opt, idx) => [
      String.fromCharCode(97 + idx), // 'a', 'b', 'c', 'd'
      typeof opt === 'object' ? opt.val || opt.text || '' : opt
    ]);
  } else if (typeof rawOptions === 'object' && rawOptions !== null) {
    optionEntries = Object.entries(rawOptions).filter(([_, val]) => val && String(val).trim() !== '');
  }

  const handleSelectOption = (key) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key
    }));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
      {/* Header Info */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {subject} ({mode})
          </span>
          <h2 className="text-sm font-semibold text-slate-500 mt-2">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>
        <button
          onClick={onEndExam}
          className="text-xs text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
        >
          Quit Exam
        </button>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-lg font-medium text-slate-800 leading-relaxed">
          {currentQuestion.question}
        </p>
      </div>

      {/* Render Options */}
      <div className="space-y-3 mb-8">
        {optionEntries.length > 0 ? (
          optionEntries.map(([key, value]) => {
            const isSelected = selectedAnswers[currentIndex] === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectOption(key)}
                className={`w-full flex items-center p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 text-blue-900 font-medium'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold uppercase mr-3 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {key}
                </span>
                <span className="text-base">{value}</span>
              </button>
            );
          })
        ) : (
          <p className="text-slate-400 text-sm italic">No options provided for this question.</p>
        )}
      </div>

      {/* Footer Navigation Controls */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onEndExam}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition"
          >
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}