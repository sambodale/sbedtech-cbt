import React, { useState } from 'react';
import QuestionPalette from './QuestionPalette'; // Import your palette component

export default function QuestionCard({ subject, mode, questions, onEndExam }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [examResult, setExamResult] = useState(null);

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 font-medium">No question data available.</p>
        <button
          onClick={onEndExam}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const optionsObj = currentQuestion.options || {};
  const optionEntries = Object.entries(optionsObj).filter(([_, val]) => val && String(val).trim() !== '');

  const handleSelectOption = (key) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  };

  const handleSubmitExam = () => {
    let score = 0;
    const detailedSummary = questions.map((q, idx) => {
      const userAns = (selectedAnswers[idx] || '').toLowerCase().trim();
      const correctAns = (q.answer || '').toLowerCase().trim();
      const isCorrect = userAns !== '' && userAns === correctAns;

      if (isCorrect) score += 1;

      return {
        questionId: q.id || idx,
        question: q.question,
        imageUrl: q.imageUrl,
        options: q.options,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect,
        explanation: q.explanation || 'No detailed explanation provided.',
      };
    });

    const percentage = Math.round((score / questions.length) * 100);
    const resultData = {
      id: Date.now(),
      subject,
      mode,
      score,
      total: questions.length,
      percentage,
      date: new Date().toLocaleString(),
      summary: detailedSummary,
    };

    const existingHistory = JSON.parse(localStorage.getItem('sbedtech_exam_history') || '[]');
    localStorage.setItem('sbedtech_exam_history', JSON.stringify([resultData, ...existingHistory]));

    setExamResult(resultData);
    setIsSubmitted(true);
  };

  // If submitted, show result or review screen (keep your existing handlers)...
  if (isSubmitted && !showReview) {
    // ... result summary code ...
  }

  if (isSubmitted && showReview) {
    // ... review code ...
  }

  // --- ACTIVE SIDE-BY-SIDE EXAM VIEW ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 Columns: Active Question Card Workspace */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
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
              type="button"
              onClick={onEndExam}
              className="text-xs text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              Quit Exam
            </button>
          </div>

          {/* QUESTION TEXT */}
          <div
            className="question-text text-lg font-medium text-slate-800 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
          />

          {/* IMAGE / DIAGRAM */}
          {currentQuestion.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={currentQuestion.imageUrl}
                alt="Question Diagram"
                className="max-h-64 object-contain rounded-lg border border-slate-200 p-2 bg-white shadow-sm"
              />
            </div>
          )}

          {/* OPTIONS LIST */}
          <div className="space-y-3 mb-8">
            {optionEntries.map(([key, value]) => {
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
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold uppercase mr-3 flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {key}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: value }} className="text-base" />
                </button>
              );
            })}
          </div>

          {/* FOOTER NAVIGATION */}
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
                onClick={() => {
                  if (window.confirm('Are you sure you want to submit your exam?')) {
                    handleSubmitExam();
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition shadow-md"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Column: Your QuestionPalette Component as a Sidebar */}
        <div className="lg:col-span-1 sticky top-6">
          <QuestionPalette
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            userAnswers={selectedAnswers}
            onSelectQuestion={(index) => setCurrentIndex(index)}
          />

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to submit your exam?')) {
                handleSubmitExam();
              }
            }}
            className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
          >
            Submit Exam
          </button>
        </div>

      </div>
    </div>
  );
}