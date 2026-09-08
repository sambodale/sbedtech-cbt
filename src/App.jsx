import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';
import ExamHistoryModal from './components/ExamHistoryModal';
import DashboardModal from './components/DashboardModal';
import { useAuth } from './context/AuthContext';
import { saveExamResult, getUserExamHistory } from './services/examServices';

const QuestionCard = lazy(() => import('./components/QuestionCard'));

export default function App() {
  // Firebase Auth Context
  const { currentUser, userProfile: firebaseProfile, isActivated: firebaseActivated } = useAuth();

  // Local fallback states for guests/offline usage
  const [localUserProfile, setLocalUserProfile] = useState(null);
  const [localActivated, setLocalActivated] = useState(false);
  
  // Modal visibility controls
  const [showSignUp, setShowSignUp] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  
  // Interceptor & Exam state
  const [pendingAction, setPendingAction] = useState(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [examMode, setExamMode] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Exam performance tracking state
  const [examHistory, setExamHistory] = useState([]);

  // Timer state management
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Combine Firebase Profile with Local Profile
  const activeUserProfile = currentUser 
    ? { email: currentUser.email, ...firebaseProfile }
    : localUserProfile;

  const isUserActivated = firebaseActivated || localActivated;

  // Sync LocalStorage & Firebase Exam History on Mount or User Change
  useEffect(() => {
    const loadUserData = async () => {
      // 1. Check LocalStorage fallback
      const savedUser = localStorage.getItem('sbedtech_user');
      const savedActivation = localStorage.getItem('sbedtech_activated');
      const savedHistory = localStorage.getItem('sbedtech_history');

      if (savedUser) {
        try { setLocalUserProfile(JSON.parse(savedUser)); } catch (e) { console.error(e); }
      }
      if (savedActivation === 'true') { setLocalActivated(true); }

      // 2. Fetch Firebase history if logged in, otherwise load LocalStorage history
      if (currentUser) {
        try {
          const remoteHistory = await getUserExamHistory(currentUser.uid);
          setExamHistory(remoteHistory);
          localStorage.setItem('sbedtech_history', JSON.stringify(remoteHistory));
        } catch (e) {
          console.error('Failed to sync Firestore history:', e);
          if (savedHistory) setExamHistory(JSON.parse(savedHistory));
        }
      } else if (savedHistory) {
        try { setExamHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
      }
    };

    loadUserData();
  }, [currentUser]);

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      alert('Time is up! Submitting your exam...');
      handleEndExam();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Save profile and execute pending exam launch
  const handleSaveProfile = (profileData) => {
    setLocalUserProfile(profileData);
    localStorage.setItem('sbedtech_user', JSON.stringify(profileData));
    setShowSignUp(false);

    if (pendingAction && pendingAction.type === 'startExam') {
      const { params } = pendingAction;
      setPendingAction(null);
      fetchExamQuestions(params);
    }
  };

  const fetchExamQuestions = async ({ subject, year, mode, limit, duration, durationInMinutes }) => {
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

          const totalMinutes = parseInt(durationInMinutes || duration, 10) || 90;
          setTimeLeft(totalMinutes * 60);
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

  const handleStartExam = (params) => {
    if (!currentUser && !localUserProfile) {
      setPendingAction({ type: 'startExam', params });
      setShowSignUp(true);
      return;
    }

    fetchExamQuestions(params);
  };

  const handleStartWeaknessDrill = (targetSubject) => {
    setShowDashboardModal(false);
    handleStartExam({
      subject: targetSubject || 'Use of English',
      year: 'Random',
      mode: 'practice',
      limit: 20,
      durationInMinutes: 30,
    });
  };

  const handleOpenActivation = () => {
    if (!currentUser && !localUserProfile) {
      setShowSignUp(true);
      return;
    }
    alert('Redirecting to payment gateway for Exam Mode activation...');
  };

  const handleEndExam = async (summaryData) => {
    if (summaryData) {
      const newRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        subject: activeSubject,
        mode: examMode,
        score: summaryData.score || 0,
        totalQuestions: summaryData.totalQuestions || questions.length || 40,
      };

      if (currentUser?.uid) {
        try {
          await saveExamResult(currentUser.uid, {
            subject: activeSubject,
            score: newRecord.score,
            totalQuestions: newRecord.totalQuestions,
            timeSpentSeconds: summaryData.timeSpentSeconds || 0,
            userAnswers: summaryData.userAnswers || {}
          });
        } catch (err) {
          console.error("Failed to sync result to Firestore:", err);
        }
      }

      const updatedHistory = [newRecord, ...examHistory];
      setExamHistory(updatedHistory);
      localStorage.setItem('sbedtech_history', JSON.stringify(updatedHistory));
    }

    setExamStarted(false);
    setQuestions([]);
    setIsTimerRunning(false);
    setTimeLeft(null);
  };

  const getCandidateName = () => {
    if (activeUserProfile?.fullName) return activeUserProfile.fullName;
    if (activeUserProfile?.username) return activeUserProfile.username;
    if (activeUserProfile?.name) return activeUserProfile.name;
    
    const fullName = `${activeUserProfile?.firstName || ''} ${activeUserProfile?.lastName || ''}`.trim();
    if (fullName) return fullName;

    if (currentUser?.email) return currentUser.email.split('@')[0];
    if (activeUserProfile?.email) return activeUserProfile.email.split('@')[0];

    return 'Guest User';
  };

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
        onOpenAuth={() => setShowSignUp(true)}
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
            userProfile={activeUserProfile}
            isActivated={isUserActivated}
            onStartExam={handleStartExam}
            onOpenSignUp={() => setShowSignUp(true)}
            onOpenActivation={handleOpenActivation}
            onOpenHistory={() => setShowHistoryModal(true)}
            onOpenDashboard={() => setShowDashboardModal(true)}
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

      {showSignUp && (
        <SignUpModal
          isOpen={showSignUp}
          onClose={() => setShowSignUp(false)}
          onSave={handleSaveProfile}
          onSuccess={() => {
            setShowSignUp(false);
            if (pendingAction && pendingAction.type === 'startExam') {
              const { params } = pendingAction;
              setPendingAction(null);
              fetchExamQuestions(params);
            }
          }}
        />
      )}

      {showHistoryModal && (
        <ExamHistoryModal
          history={examHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showDashboardModal && (
        <DashboardModal
          userProfile={activeUserProfile}
          history={examHistory}
          onClose={() => setShowDashboardModal(false)}
          onStartWeaknessDrill={handleStartWeaknessDrill}
        />
      )}
    </div>
  );
}