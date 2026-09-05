import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';
import ExamHistoryModal from './components/ExamHistoryModal';

const QuestionCard = lazy(() => import('./components/QuestionCard'));

export default function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [pendingAction, setPendingAction] = useState(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [examMode, setExamMode] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore user profile from LocalStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sbedtech_user');
    const savedActivation = localStorage.getItem('sbedtech_activated');

    if (savedUser) {
      try {
        setUserProfile(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse stored user profile:', e);
      }
    }
    if (savedActivation === 'true') {
      setIsActivated(true);
    }
  }, []);

  const handleSaveProfile = (profileData) => {
    setUserProfile(profileData);
    localStorage.setItem('sbedtech_user', JSON.stringify(profileData));
    setShowSignUp(false);

    if (pendingAction && pendingAction.type === 'startExam') {
      const { params } = pendingAction;
      setPendingAction(null);
      fetchExamQuestions(params);
    }
  };

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
          const formattedQuestions = result.data.map((q) => {
            let options = q.option || q.options || {};

            if (typeof options === 'object' && !Array.isArray(options)) {
              options = {
                a: options.a || q.optionA || q.a || '',
                b: options.b || q.optionB || q.b || '',
                c: options.c || q.optionC || q.c || '',
                d: options.d || q.optionD || q.d || '',
              };
            }

            return {
              ...q,
              question: q.question || q.questionText || '',
              options,
              answer: q.answer || q.correctAnswer || ''
            };
          });

          setQuestions(formattedQuestions);
          setExamStarted(true);
          return;
        }
      }
      throw new Error('No valid questions array returned.');
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Could not fetch questions from the server. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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
        onOpenHistory={() => setShowHistoryModal(true)}
      />

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-semibold text-sm">
              Loading past questions...
            </p>
          </div>
        ) : !examStarted ? (
          <HomeScreen
            userProfile={userProfile}
            isActivated={isActivated}
            onStartExam={handleStartExam}
            onOpenSignUp={() => setShowSignUp(true)}
            onOpenActivation={handleOpenActivation}
            onOpenHistory={() => setShowHistoryModal(true)}
          />
        ) : (
          <Suspense
            fallback={
              <div className="text-center py-10 font-bold text-slate-600">
                Preparing Exam Environment...
              </div>
            }
          >
            <QuestionCard
              subject={activeSubject}
              mode={examMode}
              questions={questions}
              onEndExam={handleEndExam}
            />
          </Suspense>
        )}
      </main>

      {/* Candidate Sign Up / Profile Modal */}
      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Exam History Modal */}
      {showHistoryModal && (
        <ExamHistoryModal
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}