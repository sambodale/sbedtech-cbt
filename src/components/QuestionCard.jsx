import React, { useState, useEffect } from 'react';
import QuestionPalette from './QuestionPalette';
import CalculatorModal from './CalculatorModal';

export default function QuestionCard({ subject, mode, questions, onEndExam, onSubmitRef }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [examResult, setExamResult] = useState(null);
  
  // Calculator Modal state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Tab-switching and security integrity state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const MAX_ALLOWED_VIOLATIONS = 1; // 1 warning before automatic submission

  // Load and manage bookmarks for this specific subject/session
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`sbedtech_bookmarks_${subject}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // --- SECURE MONITORING: DESKTOP (FULLSCREEN + VISIBILITY) vs MOBILE (VISIBILITY ONLY) ---
  useEffect(() => {
    if (isSubmitted || mode === 'practice') return; // Bypass security checks if in practice mode

    const isDesktop = window.innerWidth >= 1024; // Identify desktop viewports

    const enterFullscreen = async () => {
      if (isDesktop) {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.log('Fullscreen request skipped or restricted by browser settings.');
        }
      }
    };
    enterFullscreen();

    const handleSecurityViolation = () => {
      if (isSubmitted || mode === 'practice') return;

      const isHidden = document.hidden;
      const isExitedFullscreen = isDesktop && !document.fullscreenElement;

      if (isHidden || isExitedFullscreen) {
        triggerViolationProtocol(
          isHidden 
            ? '⚠️ You switched tabs or minimized the browser.' 
            : '⚠️ You exited fullscreen mode.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleSecurityViolation);
    if (isDesktop) {
      document.addEventListener('fullscreenchange', handleSecurityViolation);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleSecurityViolation);
      if (isDesktop) {
        document.removeEventListener('fullscreenchange', handleSecurityViolation);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
  }, [isSubmitted, mode, tabSwitchCount]);

  const triggerViolationProtocol = (reason) => {
    if (isSubmitted) return;
    const newCount = tabSwitchCount + 1;
    setTabSwitchCount(newCount);

    if (newCount >= MAX_ALLOWED_VIOLATIONS) {
      alert(`${reason} Security limit reached. Your exam is now being submitted automatically.`);
      handleSubmitExam();
    } else {
      alert(`${reason} Warning ${newCount}/${MAX_ALLOWED_VIOLATIONS}: Please remain on the exam tab. Further violations will result in automatic submission!`);
      try {
        if (window.innerWidth >= 1024 && !document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        }
      } catch (e) {}
    }
  };

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion && !isSubmitted) {
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

  const optionsObj = currentQuestion?.options || {};
  const optionEntries = Object.entries(optionsObj).filter(([_, val]) => val && String(val).trim() !== '');

  const handleSelectOption = (key) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  };

  const handleToggleBookmark = (questionId) => {
    setBookmarkedIds((prev) => {
      let updated;
      if (prev.includes(questionId)) {
        updated = prev.filter((id) => id !== questionId);
      } else {
        updated = [...prev, questionId];
      }
      localStorage.setItem(`sbedtech_bookmarks_${subject}`, JSON.stringify(updated));
      return updated;
    });
  };

  // --- PDF EXPORT FOR BOOKMARKED QUESTIONS ---
  const handleDownloadBookmarksPdf = () => {
    const bookmarkedQuestionsList = questions.filter((q, idx) => {
      const qId = q.id || idx;
      return bookmarkedIds.includes(qId);
    });

    if (bookmarkedQuestionsList.length === 0) {
      alert('No bookmarked questions found to export for this subject.');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Study Notes: Bookmarked ${subject} Questions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #1e293b; line-height: 1.5; }
            h1 { text-align: center; color: #047857; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 25px; }
            .question-box { margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; page-break-inside: avoid; }
            .q-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
            .options { margin-left: 20px; margin-bottom: 10px; }
            .options div { margin-bottom: 4px; }
            .answer-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; color: #166534; font-size: 14px; }
            .explanation { margin-top: 6px; font-style: italic; color: #334155; }
          </style>
        </head>
        <body>
          <h1>SbedTech CBT Study Guide</h1>
          <div class="subtitle">Bookmarked Questions for: ${subject}</div>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-bottom: 20px;" />
          
          ${bookmarkedQuestionsList.map((q, index) => `
            <div class="question-box">
              <div class="q-title">Q${index + 1}: ${q.question}</div>
              <div class="options">
                <div><strong>A)</strong> ${q.options?.a || q.options?.A || ''}</div>
                <div><strong>B)</strong> ${q.options?.b || q.options?.B || ''}</div>
                <div><strong>C)</strong> ${q.options?.c || q.options?.C || ''}</div>
                <div><strong>D)</strong> ${q.options?.d || q.options?.D || ''}</div>
              </div>
              <div class="answer-box">
                <strong>Correct Answer:</strong> ${(q.answer || '').toUpperCase()}
                ${q.explanation ? `<div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSubmitExam = () => {
    if (isSubmitted) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    let score = 0;
    const detailedSummary = questions.map((q, idx) => {
      const userAns = (selectedAnswers[idx] || '').toLowerCase().trim();
      const correctAns = (q.answer || '').toLowerCase().trim();
      const isCorrect = userAns !== '' && userAns === correctAns;

      if (isCorrect) score += 1;

      return {
        questionId: q.id || idx,
        question: q.question || q.questionText || '',
        imageUrl: q.imageUrl,
        options: q.options,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect,
        explanation: q.explanation || 'No detailed explanation provided.',
      };
    });

    const currentTime = Date.now();
    const formattedDate = new Date().toISOString();
    const percentage = Math.round((score / questions.length) * 100);

    const resultData = {
      id: currentTime,
      timestamp: currentTime,
      date: formattedDate,
      subject,
      mode,
      score,
      total: questions.length,
      totalQuestions: questions.length,
      percentage,
      userAnswers: selectedAnswers,
      summary: detailedSummary,
    };

    const existingHistory = JSON.parse(localStorage.getItem('sbedtech_history') || '[]');
    localStorage.setItem('sbedtech_history', JSON.stringify([resultData, ...existingHistory]));

    setExamResult(resultData);
    setIsSubmitted(true);

    if (onEndExam) {
      onEndExam(resultData);
    }
  };

  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = handleSubmitExam;
    }
  }, [selectedAnswers, isSubmitted, questions]);

  // --- 1. RESULT SUMMARY SCREEN ---
  if (isSubmitted && !showReview) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in duration-200">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 text-3xl font-extrabold">
          {examResult?.percentage}%
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Exam Completed!</h2>
        <p className="text-slate-500 text-sm mt-1">
          Here is a quick summary of your performance in <strong>{subject}</strong>.
        </p>

        <div className="grid grid-cols-3 gap-4 my-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Questions</p>
            <p className="text-lg font-bold text-slate-800">{examResult?.total}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Correct</p>
            <p className="text-lg font-bold text-green-600">{examResult?.score}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Missed</p>
            <p className="text-lg font-bold text-red-500">{examResult ? examResult.total - examResult.score : 0}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <button
            onClick={() => setShowReview(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition"
          >
            Check Missed Questions & Explanations
          </button>
          
          {bookmarkedIds.length > 0 && (
            <button
              onClick={handleDownloadBookmarksPdf}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>📥 Download Bookmarks (PDF)</span>
            </button>
          )}
        </div>

        <div>
          <button
            onClick={onEndExam}
            className="text-sm text-slate-500 hover:text-slate-800 font-semibold underline transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- 2. DETAILED REVIEW SCREEN ---
  if (isSubmitted && showReview) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Exam Review & Explanations</h2>
            <p className="text-xs text-slate-500 mt-1">{subject} • {examResult?.score} / {examResult?.total} Correct</p>
          </div>
          <div className="flex items-center gap-2">
            {bookmarkedIds.length > 0 && (
              <button
                onClick={handleDownloadBookmarksPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                📥 Download Bookmarks PDF
              </button>
            )}
            <button
              onClick={onEndExam}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition"
            >
              Finish Review
            </button>
          </div>
        </div>

        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {examResult?.summary?.map((item, index) => (
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

              <div
                className="text-slate-800 font-medium mb-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.question }}
              />

              {item.imageUrl && (
                <div className="my-3 flex justify-center">
                  <img
                    src={item.imageUrl}
                    alt="Diagram"
                    className="max-h-56 object-contain rounded border bg-white p-2"
                  />
                </div>
              )}

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

              <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200 text-xs text-slate-700">
                <p className="font-semibold text-slate-900 mb-1">Explanation:</p>
                <div dangerouslySetInnerHTML={{ __html: item.explanation }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 3. ACTIVE SIDE-BY-SIDE EXAM VIEW ---
  const currentQuestionId = currentQuestion?.id || currentIndex;
  const isBookmarked = bookmarkedIds.includes(currentQuestionId);

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

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Built-in Calculator Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition flex items-center gap-1 shadow-xs"
              >
                <span>🧮 Calculator</span>
              </button>

              {/* Bookmark Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggleBookmark(currentQuestionId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isBookmarked
                    ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span>{isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}</span>
              </button>

              {bookmarkedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadBookmarksPdf}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition flex items-center gap-1"
                  title="Download all bookmarked questions as PDF"
                >
                  <span>📥 PDF ({bookmarkedIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEndExam}
                className="text-xs text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
              >
                Quit
              </button>
            </div>
          </div>

          {/* QUESTION TEXT */}
          <div
            className="question-text text-lg font-medium text-slate-800 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: currentQuestion?.question }}
          />

          {/* IMAGE / DIAGRAM */}
          {currentQuestion?.imageUrl && (
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

        {/* Right 1 Column: Upgraded Grouped QuestionPalette Component & Submit Button */}
        <div className="lg:col-span-1 sticky top-6 space-y-3">
          <QuestionPalette
            questions={questions}
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
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
          >
            Submit Exam
          </button>
        </div>

      </div>

      {/* Calculator Modal Integration */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
}