import React, { useState, useEffect } from 'react';

export default function QuestionCard({
  subject = 'Use of English',
  mode = 'practice',
  questions = [],
  initialTimeInSeconds = 5400, // 90 minutes default
  onEndExam,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex] || {};

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format Timer as HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Option Handler
  const handleSelectOption = (optionKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));
  };

  // Flag Handler
  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // Calculate Results & Submit
  const handleSubmit = () => {
    let score = 0;
    const itemizedResults = questions.map((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.answer;
      if (isCorrect) score++;

      return {
        questionId: q.id || idx + 1,
        question: q.question,
        selectedOption: selected || null,
        correctOption: q.answer,
        isCorrect,
        topic: q.topic || 'General',
        explanation: q.explanation || '',
      };
    });

    const elapsedSeconds = initialTimeInSeconds - timeLeft;

    if (onEndExam) {
      onEndExam({
        subject,
        mode,
        score,
        totalQuestions,
        timeSpentSeconds: elapsedSeconds,
        userAnswers,
        itemizedResults,
      });
    }
  };

  if (totalQuestions === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-800">No Questions Available</h3>
        <p className="text-xs text-slate-500 mt-2 font-medium">
          Unable to load questions for {subject}. Please return to the dashboard and try again.
        </p>
        <button
          onClick={() => onEndExam && onEndExam(null)}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
      
      {/* LEFT & CENTER COLUMN: QUESTION DISPLAY & CONTROLS */}
      <div className="md:col-span-2 space-y-4">
        
        {/* HEADER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              {subject} • {mode} Mode
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 mt-1">
              Question {currentIndex + 1} of {totalQuestions}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Badge */}
            <div className="px-3 py-1.5 bg-slate-900 text-amber-400 font-black text-xs rounded-xl shadow-inner flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Mobile Matrix Toggle */}
            <button
              onClick={() => setShowPaletteMobile(!showPaletteMobile)}
              className="md:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              {showPaletteMobile ? 'Hide Matrix ✕' : 'Question Matrix 🔲'}
            </button>
          </div>
        </div>

        {/* MAIN QUESTION CARD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Question Text */}
          <div className="space-y-2">
            {currentQ.topic && (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Topic: {currentQ.topic}
              </span>
            )}
            <p className="text-sm sm:text-base font-extrabold text-slate-800 leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {currentQ.options &&
              Object.entries(currentQ.options).map(([key, value]) => {
                const isSelected = userAnswers[currentIndex] === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-500'
                        }`}
                      >
                        {key}
                      </span>
                      <span>{value}</span>
                    </div>

                    {isSelected && (
                      <span className="text-blue-600 font-bold text-xs">✓ Selected</span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleToggleFlag}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition border flex items-center gap-1.5 ${
                flaggedQuestions[currentIndex]
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>🚩</span>
              <span>{flaggedQuestions[currentIndex] ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-xl transition"
              >
                ← Previous
              </button>

              <button
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-xl transition"
              >
                Next →
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: 1-TO-N QUESTION MATRIX PALETTE */}
      <div
        className={`${
          showPaletteMobile ? 'block' : 'hidden'
        } md:block md:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4`}
      >
        <div className="space-y-4">
          
          {/* Matrix Header & Progress */}
          <div className="pb-3 border-b border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Question Matrix ({Object.keys(userAnswers).length}/{totalQuestions})
            </h4>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${(Object.keys(userAnswers).length / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pb-2">
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

          {/* 1-to-N Question Grid Matrix */}
          <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
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
                  onClick={() => {
                    setCurrentIndex(index);
                    setShowPaletteMobile(false);
                  }}
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

        {/* SUBMIT EXAM BUTTON */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition"
          >
            Submit Exam Session
          </button>
        </div>

      </div>

    </div>
  );
}