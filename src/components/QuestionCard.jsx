import React, { useState } from 'react';

export default function QuestionCard({
  subject = '',
  mode = 'practice',
  questions = [],
  timeLeft = 0,
  initialTimeInSeconds = 5400, // Dynamic fallback if custom duration is set
  onEndExam,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // Tracks { 0: 'a', 1: 'c' }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // Tracks { 0: true }
  const [showPalette, setShowPalette] = useState(false); // Default hidden on mobile for better space

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || {};

  // Answer Selection
  const handleSelectOption = (optionKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));
  };

  // Flag Toggle
  const toggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // Calculate score and submit payload
  const handleSubmitExam = () => {
    let score = 0;
    const itemizedResults = [];

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const correct = (q.answer || '').toLowerCase().trim();
      const isCorrect = selected && selected.toLowerCase() === correct;
      if (isCorrect) score += 1;

      itemizedResults.push({
        questionId: q.id || idx,
        question: q.question,
        selectedOption: selected || null,
        correctOption: q.answer,
        isCorrect: !!isCorrect,
        explanation: q.explanation || '',
        topic: q.topic || 'General',
      });
    });

    const timeSpentSeconds = Math.max(0, initialTimeInSeconds - timeLeft);

    onEndExam({
      subject,
      mode,
      score,
      totalQuestions,
      userAnswers,
      timeSpentSeconds,
      itemizedResults,
      completedAt: new Date().toISOString(),
    });
  };

  if (totalQuestions === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl text-center shadow-sm max-w-md mx-auto border border-slate-200">
        <p className="text-slate-600 font-bold mb-4">No questions available for this practice session.</p>
        <button
          onClick={() => onEndExam(null)}
          className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
            {mode} Mode
          </span>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
            {subject?.toUpperCase() || 'CBT EXAM'}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Flag Button */}
          <button
            onClick={toggleFlag}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
              flaggedQuestions[currentIndex]
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {flaggedQuestions[currentIndex] ? '🚩 Flagged' : '🏳️ Flag Question'}
          </button>

          {/* Toggle Mobile Palette */}
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="md:hidden px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl"
          >
            Matrix ({Object.keys(userAnswers).length}/{totalQuestions})
          </button>

          {/* Quit Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to quit this exam session?')) {
                onEndExam(null);
              }
            }}
            className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
          >
            Quit Exam
          </button>
        </div>
      </div>

      {/* Main Grid: Left Area (Question Display) & Right Area (1 to N Palette Matrix) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* LEFT AREA: Question Text & Options (3 Columns) */}
        <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              {currentQuestion.topic && (
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                  🎯 {currentQuestion.topic}
                </span>
              )}
            </div>

            {/* Comprehension Passage / Context */}
            {currentQuestion.passage && (
              <div className="mb-4 p-4 bg-slate-50 border-l-4 border-blue-600 text-sm text-slate-700 rounded-r-xl max-h-48 overflow-y-auto">
                <p className="font-bold text-slate-900 mb-1">Passage / Reading Text:</p>
                <p className="leading-relaxed">{currentQuestion.passage}</p>
              </div>
            )}

            {/* Question Body */}
            <h3 className="text-slate-800 text-base sm:text-lg font-bold mb-6 leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options &&
                Object.entries(currentQuestion.options).map(([key, value]) => {
                  if (!value) return null;
                  const isSelected = userAnswers[currentIndex] === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black uppercase shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {key}
                      </span>
                      <span className="text-sm pt-0.5 leading-snug">{value}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <button
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* RIGHT AREA: Dynamic Question Palette Matrix (1 Column) */}
        <div
          className={`${
            showPalette ? 'block' : 'hidden md:block'
          } md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between`}
        >
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-100">
              Question Matrix ({Object.keys(userAnswers).length}/{totalQuestions})
            </h4>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500 mb-4">
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

            {/* 1 to N Grid Buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = userAnswers[idx] !== undefined;
                const isFlagged = !!flaggedQuestions[idx];

                let buttonStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
                if (isCurrent) {
                  buttonStyle = 'bg-blue-600 text-white ring-2 ring-blue-400 font-extrabold border-blue-600';
                } else if (isAnswered) {
                  buttonStyle = 'bg-emerald-600 text-white font-extrabold border-emerald-600';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-9 text-xs rounded-xl font-bold transition-all border flex items-center justify-center ${buttonStyle} ${
                      isFlagged ? 'ring-2 ring-amber-500 border-amber-500' : ''
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 text-[9px]">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Final Submit Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to submit your test now?')) {
                handleSubmitExam();
              }
            }}
            className="w-full mt-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-md transition-colors"
          >
            Submit Test Now
          </button>
        </div>

      </div>
    </div>
  );
}