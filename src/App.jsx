import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';

const QuestionCard = lazy(() => import('./components/QuestionCard'));

// Fallback test question bank in case API requests fail or go offline
const MOCK_QUESTIONS = {
  mathematics: [
    {
      id: 'local-1',
      question: 'Solve for x: 2x + 5 = 15',
      options: ['A) x = 5', 'B) x = 10', 'C) x = 7.5', 'D) x = 2'],
      answer: 'Option A',
      explanation: '2x = 15 - 5 => 2x = 10 => x = 5.'
    }
  ],
  english: [
    {
      id: 'local-2',
      question: 'Choose the option opposite in meaning to "PERMANENT":',
      options: ['A) Temporary', 'B) Lasting', 'C) Durable', 'D) Constant'],
      answer: 'Option A',
      explanation: 'Temporary means lasting for only a limited period of time.'
    }
  ]
};

export default function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  const [activeSubject, setActiveSubject] = useState('');
  const [examMode, setExamMode] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore user profile from LocalStorage on load
  useEffect(() => {
    const savedUser = localStorage.getItem('sbedtech_user');
    const savedActivation = localStorage.getItem('sbedtech_activated');

    if (savedUser) {
      setUserProfile(JSON.parse(savedUser));
    }
    if (savedActivation === 'true') {
      setIsActivated(true);
    }
  }, []);

  // Save new registration profile
  const handleSaveProfile = (profileData) => {
    setUserProfile(profileData);
    localStorage.setItem('sbedtech_user', JSON.stringify(profileData));
    setShowSignUp(false);
  };

  // Launch Activation / Paystack Modal
  const handleOpenActivation = () => {
    if (!userProfile) {
      setShowSignUp(true);
      return;
    }
    alert("Redirecting to Paystack payment gateway for Exam Mode activation...");
  };

  // Handle starting exam with ALOC/SDASH provider API
  const handleStartExam = async ({ subject, year, mode, limit, durationInMinutes }) => {
    if (!userProfile) {
      setShowSignUp(true);
      return;
    }

    setLoading(true);
    setActiveSubject(subject);
    setExamMode(mode);

    try {
      const response = await fetch(
        `/api/get-questions?subject=${encodeURIComponent(subject)}&year=${encodeURIComponent(year)}&limit=${limit}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.length > 0) {
          setQuestions(result.data);
          setExamStarted(true);
          setLoading(false);
          return;
        }
      }
      throw new Error('API request failed or returned empty question dataset.');
    } catch (error) {
      console.warn('API error encountered. Falling back to local dataset:', error.message);
      
      const key = subject.toLowerCase();
      const localBank = MOCK_QUESTIONS[key] || MOCK_QUESTIONS['mathematics'];
      setQuestions(localBank);
      setExamStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEndExam = () => {
    setExamStarted(false);
    setQuestions([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Header
        userProfile={userProfile}
        isActivated={isActivated}
        onOpenSignUp={() => setShowSignUp(true)}
        onOpenActivation={handleOpenActivation}
      />

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-semibold text-sm">
              Fetching questions from ALOC & SDASH Servers...
            </p>
          </div>
        ) : !examStarted ? (
          <HomeScreen
            userProfile={userProfile}
            isActivated={isActivated}
            onStartExam={handleStartExam}
            onOpenSignUp={() => setShowSignUp(true)}
            onOpenActivation={handleOpenActivation}
          />
        ) : (
          <Suspense fallback={
            <div className="text-center py-10 font-bold text-slate-600">
              Loading Exam Dashboard...
            </div>
          }>
            <QuestionCard
              subject={activeSubject}
              mode={examMode}
              questions={questions}
              onEndExam={handleEndExam}
            />
          </Suspense>
        )}
      </main>

      {/* SignUp / Candidate Profile Modal */}
      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}