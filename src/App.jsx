import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import Header from './components/Header';
import QuestionCard from './components/QuestionCard';
import QuestionPalette from './components/QuestionPalette';
import Navigation from './components/Navigation';

import { questions as importedQuestions } from './data/questions';

export default function App() {
  const [sessionConfig, setSessionConfig] = useState(null);

  // Initialize user profile from local storage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sbedtech_cbt_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isActivated, setIsActivated] = useState(() => {
    return localStorage.getItem('sbedtech_cbt_activated') === 'true';
  });

  const [activeSubjectTab, setActiveSubjectTab] = useState('');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const handleSignUp = (userData) => {
    setUser(userData);
    localStorage.setItem('sbedtech_cbt_user', JSON.stringify(userData));
  };

  const handlePaystackPayment = (userData) => {
    const activeUser = userData || user;

    if (!activeUser || !activeUser.email) {
      alert('Email address is required to process activation. Please sign up first.');
      return;
    }

    if (!window.PaystackPop) {
      alert('Paystack payment gateway failed to load. Please check your internet connection.');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      email: activeUser.email,
      amount: 250000,
      currency: 'NGN',
      ref: 'SBED_' + Math.floor(Math.random() * 1000000000 + 1),
      metadata: {
        custom_fields: [
          {
            display_name: 'Username',
            variable_name: 'username',
            value: activeUser.username,
          },
          {
            display_name: 'Phone Number',
            variable_name: 'phone_number',
            value: activeUser.phone,
          },
        ],
      },
      callback: function (response) {
        setIsActivated(true);
        localStorage.setItem('sbedtech_cbt_activated', 'true');
        setShowActivationModal(false);
        alert(`Payment successful! Reference: ${response.reference}. App activated for 1 year.`);
      },
      onClose: function () {
        alert('Payment process cancelled.');
      },
    });

    handler.openIframe();
  };

  const getQuestionSubject = (q) => {
    const val = q.category || q.subject || q.subjectId || '';
    return val.toString().trim().toLowerCase();
  };

  const handleStartSession = (config) => {
    const { mode, subjects } = config;

    const allQuestions = Array.isArray(importedQuestions) ? importedQuestions : [];
    const normalizedSelectedSubjects = subjects.map((s) => s.toString().trim().toLowerCase());

    let filtered = allQuestions.filter((q) => {
      const qSub = getQuestionSubject(q);
      return normalizedSelectedSubjects.some(
        (selected) => selected === qSub || qSub.includes(selected) || selected.includes(qSub)
      );
    });

    // Fallback if no subject match found
    if (filtered.length === 0) {
      filtered = allQuestions;
    }

    const sessionQuestions = isActivated ? filtered : filtered.slice(0, 20);

    setSessionConfig({ mode, subjects, questions: sessionQuestions });
    setActiveSubjectTab(subjects[0] || '');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);

    if (mode === 'exam') setSecondsLeft(7200);
    setIsExamStarted(true);
  };

  const currentSubjectQuestions = sessionConfig?.questions
    ? sessionConfig.questions.filter((q) => {
        const qSub = getQuestionSubject(q);
        const targetSub = activeSubjectTab.toString().trim().toLowerCase();
        return qSub === targetSub || qSub.includes(targetSub) || targetSub.includes(qSub);
      })
    : [];

  const activeDisplayQuestions =
    currentSubjectQuestions.length > 0
      ? currentSubjectQuestions
      : sessionConfig?.questions || [];

  const currentQuestion = activeDisplayQuestions[currentQuestionIndex];

  const handleSelectOption = (optionKey) => {
    if (!currentQuestion) return;

    const totalAnswered = Object.keys(userAnswers).length;

    if (!isActivated && totalAnswered >= 20 && userAnswers[currentQuestion.id] === undefined) {
      setShowActivationModal(true);
      return;
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionKey,
    }));
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = sessionConfig?.questions?.length || 0;

    if (
      window.confirm(
        `You answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`
      )
    ) {
      setIsSubmitted(true);
      setIsExamStarted(false);
    }
  };

  useEffect(() => {
    if (!isExamStarted || isSubmitted || sessionConfig?.mode !== 'exam' || secondsLeft <= 0) return;

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
  }, [isExamStarted, isSubmitted, sessionConfig, secondsLeft]);

  // RENDER HOME SCREEN IF SESSION IS NOT STARTED
  if (!isExamStarted && !isSubmitted) {
    return (
      <HomeScreen
        isActivated={isActivated}
        user={user}
        onSignUp={handleSignUp}
        onStartSession={handleStartSession}
        onTriggerActivation={handlePaystackPayment}
      />
    );
  }

  // RENDER TEST SCREEN AFTER STARTING SESSION
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        examType={`${sessionConfig?.mode?.toUpperCase() || 'PRACTICE'} MODE`}
        studentName={user?.username ? `@${user.username}` : 'Candidate'}
        totalSeconds={sessionConfig?.mode === 'exam' ? secondsLeft : null}
      />

      {sessionConfig?.subjects?.length > 1 && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto">
            {sessionConfig.subjects.map((subject) => {
              const targetSub = subject.toString().trim().toLowerCase();
              const isActive =
                targetSub === activeSubjectTab.toString().trim().toLowerCase();
              const count = sessionConfig.questions.filter((q) => {
                const qSub = getQuestionSubject(q);
                return qSub === targetSub || qSub.includes(targetSub) || targetSub.includes(qSub);
              }).length;

              return (
                <button
                  key={subject}
                  onClick={() => {
                    setActiveSubjectTab(subject);
                    setCurrentQuestionIndex(0);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border ${
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {subject} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          {currentQuestion ? (
            <QuestionCard
              questionData={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedOption={userAnswers[currentQuestion.id]}
              onSelectOption={handleSelectOption}
              showFeedback={sessionConfig?.mode === 'practice'}
            />
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
              No questions found for this subject.
            </div>
          )}

          <Navigation
            currentIndex={currentQuestionIndex}
            totalQuestions={activeDisplayQuestions.length}
            onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            onNext={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(activeDisplayQuestions.length - 1, prev + 1)
              )
            }
            onSubmit={handleSubmit}
          />
        </div>

        <div className="lg:col-span-1">
          <QuestionPalette
            totalQuestions={activeDisplayQuestions.length}
            currentIndex={currentQuestionIndex}
            userAnswers={userAnswers}
            questions={activeDisplayQuestions}
            onSelectQuestion={(index) => setCurrentQuestionIndex(index)}
          />
        </div>
      </main>

      {showActivationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-amber-400">Trial Limit Reached</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have reached your trial limit. Activate your account now for 1-year full access.
            </p>

            <button
              onClick={() => handlePaystackPayment(user)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg"
            >
              Pay ₦2,500 via Paystack
            </button>

            <div className="border-t border-slate-800 pt-3 text-center">
              <button
                onClick={() => setShowActivationModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Close & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}