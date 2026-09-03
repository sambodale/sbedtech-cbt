import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import QuestionCard from './components/QuestionCard';
import QuestionPalette from './components/QuestionPalette';
import Navigation from './components/Navigation';

import { questions } from './data/questions';

export default function App() {
  const [mode, setMode] = useState('exam'); // 'exam' or 'practice'
  
  // Single selection for Practice Mode
  const [practiceSubject, setPracticeSubject] = useState('English Language');
  
  // Multi selection for Exam Mode (English included by default)
  const [selectedSubjects, setSelectedSubjects] = useState(['English Language']);
  
  // Year Filter (2005 - 2026)
  const [selectedYear, setSelectedYear] = useState('All');

  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});

  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Full subject list including Sciences, Arts, Humanities, & Management
  const allSubjects = [
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Literature in English',
    'Christian Religious Studies (CRS)',
    'Islamic Religious Studies (IRS)',
    'Yoruba',
    'Government',
    'Economics',
    'Geography',
    'Financial Accounting',
    'Commerce'
  ];

  // Generated exam years from 2005 to 2026
  const availableYears = ['All', ...Array.from({ length: 22 }, (_, i) => String(2026 - i))];

  // Toggle subject for Exam Mode (Max 4, English mandatory)
  const handleSubjectToggle = (subject) => {
    if (subject === 'English Language') return; // Cannot uncheck English
    
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      if (selectedSubjects.length >= 4) {
        alert('You can select a maximum of 4 subjects for Exam Mode.');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Filter questions based on active mode, subjects, and selected year
  const activeSubjects = mode === 'exam' ? selectedSubjects : [practiceSubject];

  const filteredQuestions = questions.filter((q) => {
    const matchesSubject = activeSubjects.includes(q.category);
    const matchesYear = selectedYear === 'All' || String(q.year) === String(selectedYear);
    return matchesSubject && matchesYear;
  });

  const handleSelectOption = (optionKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionKey,
    }));
  };

  const handleStart = (e) => {
    e.preventDefault();
    
    if (mode === 'exam' && selectedSubjects.length < 4) {
      alert('Please select exactly 4 subjects (including English Language) for Exam Mode.');
      return;
    }

    if (filteredQuestions.length === 0) {
      alert('No questions found for the selected subject(s) and year.');
      return;
    }

    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);

    if (mode === 'exam') {
      const totalSecs = (Number(hours) * 60 + Number(minutes)) * 60;
      setSecondsLeft(totalSecs);
    }

    setIsExamStarted(true);
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = filteredQuestions.length;

    if (window.confirm(`You answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`)) {
      setIsSubmitted(true);
      setIsExamStarted(false);
    }
  };

  useEffect(() => {
    if (!isExamStarted || isSubmitted || mode !== 'exam' || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(true);
          setIsExamStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, isSubmitted, mode, secondsLeft]);

  // Setup Screen
  if (!isExamStarted && !isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">
          <h1 className="text-2xl font-bold text-center text-white">CBT Setup & Mode Selection</h1>

          <form onSubmit={handleStart} className="space-y-5">
            {/* Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Select Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('exam')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition ${
                    mode === 'exam'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Exam Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode('practice')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition ${
                    mode === 'practice'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Practice Mode
                </button>
              </div>
            </div>

            {/* Practice Mode: Single Subject Dropdown */}
            {mode === 'practice' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Select Subject
                </label>
                <select
                  value={practiceSubject}
                  onChange={(e) => setPracticeSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {allSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Exam Mode: Select 4 Subjects (English required) */
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Select 4 Subjects (English mandatory)
                </label>
                <div className="space-y-2 bg-slate-950 border border-slate-800 p-3 rounded-xl max-h-56 overflow-y-auto">
                  {allSubjects.map((sub) => {
                    const isChecked = selectedSubjects.includes(sub);
                    const isMandatory = sub === 'English Language';

                    return (
                      <label
                        key={sub}
                        className={`flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer select-none transition ${
                          isChecked ? 'bg-blue-950/60 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isMandatory}
                            onChange={() => handleSubjectToggle(sub)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                          />
                          {sub}
                        </span>
                        {isMandatory && (
                          <span className="text-[10px] bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded font-bold uppercase">
                            Required
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selected: {selectedSubjects.length} / 4 subjects
                </p>
              </div>
            )}

            {/* Past UTME Year Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Select Exam Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr === 'All' ? 'All Years (2005 - 2026)' : `UTME ${yr}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Timer Selection (Exam Mode Only) */}
            {mode === 'exam' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Exam Duration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Hours"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Minutes"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-950/50"
            >
              Start {mode === 'exam' ? 'Exam' : 'Practice'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Results Screen
  if (isSubmitted) {
    const totalAnswered = Object.keys(userAnswers).length;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <h1 className="text-3xl font-bold text-emerald-400">Session Completed!</h1>
          <p className="text-slate-400 text-sm">
            Subjects: <strong className="text-white">{activeSubjects.join(', ')}</strong>
          </p>
          <p className="text-slate-400 text-sm">
            Year: <strong className="text-white">{selectedYear}</strong>
          </p>
          <p className="text-slate-400 text-sm">
            You answered {totalAnswered} out of {filteredQuestions.length} questions.
          </p>
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  // Active Session Screen
  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        examType={`${mode.toUpperCase()} MODE - ${activeSubjects.join(', ')} (${selectedYear})`}
        studentName="Candidate"
        totalSeconds={mode === 'exam' ? secondsLeft : null}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <QuestionCard
            questionData={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            selectedOption={userAnswers[currentQuestionIndex]}
            onSelectOption={handleSelectOption}
            showFeedback={mode === 'practice'}
          />

          <Navigation
            currentIndex={currentQuestionIndex}
            totalQuestions={filteredQuestions.length}
            onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentQuestionIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="lg:col-span-1">
          <QuestionPalette
            totalQuestions={filteredQuestions.length}
            currentIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            onSelectQuestion={(index) => setCurrentQuestionIndex(index)}
          />
        </div>
      </main>
    </div>
  );
}