import React, { useState, useEffect } from 'react';

export default function QuestionCard({
  subject = 'ECONOMICS',
  mode = 'PRACTICE',
  questions = [],
  initialTimeInSeconds = 5400,
  onEndExam,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);

  const totalQuestions = questions.length > 0 ? questions.length : 40;
  const currentQ = questions[currentIndex] || {};

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectOption = (key) => {
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: key }));
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleSubmit = () => {
    if (onEndExam) {
      onEndExam({
        subject,
        mode,
        score: 0,
        totalQuestions,
        userAnswers,
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* MAIN QUESTION DISPLAY (3 COLUMNS ON DESKTOP) */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  {subject} ({mode})
                </span>
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Question {currentIndex + 1} of {totalQuestions}
                </p>
              </div>

              <button
                onClick={handleSubmit}
                className="text-xs font-extrabold text-red-600 hover:text-red-700 transition"
              >
                Quit Exam
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 mb-6 leading-relaxed">
              {currentQ.question || "Price elasticity of demand is expressed as"}
            </h3>

            {/* OPTIONS LIST */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((key) => {
                const defaultOptions = {
                  A: '% change in quantity demanded / % change in price',
                  B: '% change in quantity demanded / % change in income',
                  C: '% change in income / % change in quantity demanded',
                  D: 'none of the above',
                };
                const optionText = currentQ.options ? currentQ.options[key] : defaultOptions[key];
                const isSelected = userAnswers[currentIndex] === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center gap-4 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {key}
                    </span>
                    <span className="leading-snug">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 mt-8">
            <button
              type="button"
              onClick={handleToggleFlag}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition border flex items-center gap-2 ${
                flaggedQuestions[currentIndex]
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🚩 {flaggedQuestions[currentIndex] ? 'Flagged' : 'Flag Question'}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
              >
                ← Previous
              </button>

              <button
                type="button"
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* 1-TO-N QUESTION MATRIX SIDEBAR (1 COLUMN ON DESKTOP) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Question Matrix
            </h4>
            <span className="text-[11px] font-bold text-emerald-600">
              {Object.keys(userAnswers).length}/{totalQuestions}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
            {Array.from({ length: totalQuestions }, (_, idx) => {
              const qNum = idx + 1;
              const isCurrent = currentIndex === idx;
              const isAnswered = userAnswers[idx] !== undefined;
              const isFlagged = Boolean(flaggedQuestions[idx]);

              let btnStyle = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
              if (isAnswered) btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-extrabold';
              if (isCurrent) btnStyle = 'bg-blue-600 text-white border-blue-600 font-extrabold ring-2 ring-blue-300';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-9 text-xs rounded-xl transition border flex items-center justify-center ${btnStyle} ${
                    isFlagged ? 'ring-2 ring-amber-500 border-amber-500' : ''
                  }`}
                >
                  {qNum}
                  {isFlagged && <span className="absolute -top-1 -right-1 text-[8px]">🚩</span>}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition mt-4 cursor-pointer"
          >
            Submit Exam Session
          </button>
        </div>

      </div>
    </div>
  );
}