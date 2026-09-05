import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';

const QuestionCard = lazy(() => import('./components/QuestionCard'));

export default function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  const [pendingAction, setPendingAction] = useState(null);
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

  // Save new registration profile & trigger pending action if present
  const handleSaveProfile = (profileData) => {
    setUserProfile(profileData);
    localStorage.setItem('sbedtech_user', JSON.stringify(profileData));
    setShowSignUp(false);

    // If candidate clicked a subject before registering, launch that exam automatically
    if (pendingAction && pendingAction.type === 'startExam') {
      const { params } = pendingAction;
      setPendingAction(null);
      fetchExamQuestions(params);
    }
  };

  // Direct fetch call for ALOC/SDASH provider endpoint
  const fetchExamQuestions = async ({ subject, year, mode, limit }) => {
    setLoading(true);
    setActiveSubject(subject);
    setExamMode(mode || 'practice');

    try {
      const response = await fetch(
        `/api/get-questions?subject=${encodeURIComponent(subject)}&year=${encodeURIComponent(year || 'random')}&limit=${limit || 40}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.length > 0) {
          setQuestions(result.data);
          setExamStarted(true);
          return;
        }
      }
      throw new Error('No questions returned from upstream provider.');
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Could not fetch questions from the server. Please verify network connectivity and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Triggered from HomeScreen when selecting a subject/year
  const handleStartExam = ({ subject, year, mode, limit }) => {
    if (!userProfile) {
      setPendingAction({ type: 'startExam', params: { subject, year, mode, limit } });
      setShowSignUp(true);
      return;
    }

    fetchExamQuestions({ subject, year, mode, limit });
  };

  const handleOpenActivation = () => {
    if (!userProfile) {
      setShowSignUp(true);
      return;
    }
    alert('Redirecting to payment gateway for Exam Mode activation...');
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
              Fetching questions from ALOC & SDASH APIs...
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

      {/* Candidate Profile / Sign Up Modal */}
      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}