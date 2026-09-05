import React, { useState, useEffect } from 'react';

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

  // Normalize options list
  const rawOptions = currentQuestion.options || {};
  let optionEntries = [];
  if (Array.isArray(rawOptions)) {
    optionEntries = rawOptions.map((opt, idx) => [
      String.fromCharCode(97 + idx),
      typeof opt === 'object' ? opt.val || opt.text || '' : opt,
    ]);
  } else if (typeof rawOptions === 'object' && rawOptions !== null) {
    optionEntries = Object.entries(rawOptions).filter(([_, val]) => val && String(val).trim() !== '');
  }

  const handleSelectOption = (key) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  };

  // Submit Exam Logic
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
        options: q.options,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect,
        explanation: q.explanation || q.section || 'No detailed explanation provided for this question.',
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

    // Save to Exam History in LocalStorage
    const existingHistory = JSON.parse(localStorage.getItem('sbedtech_exam_history') || '[]');
    localStorage.setItem('sbedtech_exam_history', JSON.stringify([resultData, ...existingHistory]));

    setExamResult(resultData);
    setIsSubmitted(true);
  };

  // --- 1. RESULT SUMMARY SCREEN ---
  if (isSubmitted && !showReview) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in duration-200">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 text-3xl font-extrabold">
          {examResult.percentage}%
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Exam Completed!</h2>
        <p className="text-slate-500 text-sm mt-1">Here is a quick summary of your performance in <strong>{subject}</strong>.</p>

        <div className="grid grid-cols-3 gap-4 my-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Questions</p>
            <p className="text-lg font-bold text-slate-800">{examResult.total}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Correct</p>
            <p className="text-lg font-bold text-green-600">{examResult.score}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Missed</p>
            <p className="text-lg font-bold text-red-500">{examResult.total - examResult.score}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setShowReview(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition"
          >
            Check Missed Questions & Explanations
          </button>
          <button
            onClick={onEndExam}
            className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- 2. DETAILED REVIEW SCREEN (MISSED QUESTIONS) ---
  if (isSubmitted && showReview) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Exam Review & Explanations</h2>
            <p className="text-xs text-slate-500 mt-1">{subject} • {examResult.score} / {examResult.total} Correct</p>
          </div>
          <button
            onClick={onEndExam}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition"
          >
            Finish Review
          </button>
        </div>

        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {examResult.summary.map((item, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border ${
                item.isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question {index + 1}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    item.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.isCorrect ? 'Correct' : 'Missed'}
                </span>
              </div>

              <p className="text-slate-800 font-medium mb-3">{item.question}</p>

              <div className="text-xs space-y-1 text-slate-600 mb-3">
                <p>
                  <strong>Your Choice:</strong>{' '}
                  <span className={item.isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {item.userAnswer ? item.userAnswer.toUpperCase() : 'None (Skipped)'}
                  </span>
                </p>
                {!item.isCorrect && (
                  <p>
                    <strong>Correct Answer:</strong>{' '}
                    <span className="text-green-600 font-bold uppercase">{item.correctAnswer}</span>
                  </p>
                )}
              </div>

              {/* Explanation Block */}
              <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200 text-xs text-slate-700">
                <p className="font-semibold text-slate-900 mb-1">Explanation:</p>
                <p>{item.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 3. ACTIVE EXAM TAKING VIEW ---
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
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

      <div className="mb-6">
        <p className="text-lg font-medium text-slate-800 leading-relaxed">
          {currentQuestion.question}
        </p>
      </div>

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
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold uppercase mr-3 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {key}
              </span>
              <span className="text-base">{value}</span>
            </button>
          );
        })}
      </div>

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
            onClick={handleSubmitExam}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition shadow-md"
          >
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}