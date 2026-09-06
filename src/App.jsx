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

  // Timer state management
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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

  // Timer countdown interval effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      alert('Time is up! Submitting your exam...');
      // Clean up exam view when time expires
      handleEndExam();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

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

  const fetchExamQuestions = async ({ subject, year, mode, limit, duration }) => {
    setLoading(true);

    const subjectMap = {
      'yoruba': 'yoruba',
      'yorùbá': 'yoruba',
      'yòrùbá': 'yoruba',
      'igbo': 'igbo',
      'ìgbò': 'igbo',
      'hausa': 'hausa'
    };

    const rawSubject = (subject || '').toLowerCase().trim();
    const cleanSubject = subjectMap[rawSubject] || rawSubject;

    setActiveSubject(subject);
    setExamMode(mode || 'practice');

    try {
      const response = await fetch(
        `/api/get-questions?subject=${encodeURIComponent(cleanSubject)}&year=${encodeURIComponent(year || 'random')}&limit=${limit || 40}`
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

          // Calculate duration in seconds (defaults to 15 minutes if not provided)
          const durationMinutes = parseInt(duration, 10) || 15;
          setTimeLeft(durationMinutes * 60);
          setIsTimerRunning(true);

          setExamStarted(true);
          return;
        }
      }
      throw new Error(`No questions returned for ${subject}.`);
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert(`Could not fetch questions for ${subject}. Please check your network connection or try selecting a specific year.`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = ({ subject, year, mode, limit, duration }) => {
    if (!userProfile) {
      setPendingAction({ type: 'startExam', params: { subject, year, mode, limit, duration } });
      setShowSignUp(true);
      return;
    }

    fetchExamQuestions({ subject, year, mode, limit, duration });
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
    setIsTimerRunning(false);
    setTimeLeft(null);
  };

  // Derive candidate name logic
  const getCandidateName = () => {
    if (!userProfile) return 'Guest User';
    if (userProfile.username) return userProfile.username;
    const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
    return fullName || 'Guest User';
  };

  // Derive active exam title badge logic
  const getExamTypeLabel = () => {
    if (!examStarted) return 'JAMB CBT PORTAL';
    const sub = activeSubject ? activeSubject.toUpperCase() : 'CBT EXAM';
    const mode = examMode ? examMode.toUpperCase() : 'PRACTICE';
    return `${sub} (${mode})`;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Header
        studentName={getCandidateName()}
        examType={getExamTypeLabel()}
        totalSeconds={timeLeft}
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
              timeLeft={timeLeft}
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