import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';
import ExamHistoryModal from './components/ExamHistoryModal';
import AiTutorModal from './components/AiTutorModal';
import AdminDashboard from './components/AdminDashboard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getUserProfile } from './services/authServices';
import { saveExamResult, getUserExamHistory } from './services/examServices';
import { generateTopicQuestions } from './services/aiQuestionGenerator';

const QuestionCard = lazy(() => import('./components/QuestionCard'));

// JAMB UTME Official Prescribed Reading Texts mapping for Use of English
export const JAMB_ENGLISH_NOVELS = {
  '2011': 'The Virtuous Woman',
  '2012': 'The Successors',
  '2013': 'The Successors',
  '2014': 'The Successors',
  '2015': "The Potter's Wheel",
  '2016': 'The Last Days at Forcados High School',
  '2017': 'In Dependence',
  '2018': 'In Dependence',
  '2019': 'Sweet Sixteen',
  '2020': 'Sweet Sixteen',
  '2021': 'The Life Changer',
  '2022': 'The Life Changer',
  '2023': 'The Life Changer',
  '2024': 'The Life Changer',
  '2025': 'The Life Changer',
  '2026': 'The Lekki Headmaster',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Portal View Mode ('candidate' or 'admin')
  const [viewMode, setViewMode] = useState('candidate');

  // Local fallback states
  const [localUserProfile, setLocalUserProfile] = useState(null);
  const [localActivated, setLocalActivated] = useState(false);
  
  // Modals
  const [showSignUp, setShowSignUp] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAiTutorModal, setShowAiTutorModal] = useState(false);
  
  // Exam state
  const [pendingAction, setPendingAction] = useState(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [examMode, setExamMode] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // History tracking
  const [examHistory, setExamHistory] = useState([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Ref for auto-submitting when timer hits zero
  const submitExamRef = useRef(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profileData = await getUserProfile(user.uid);
          setFirebaseProfile(profileData);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setFirebaseProfile(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Combined Active Profile
  const activeUserProfile = currentUser 
    ? { email: currentUser.email, ...firebaseProfile }
    : localUserProfile;

  // Sync History & Activation Status
  useEffect(() => {
    const loadUserData = async () => {
      const savedUser = localStorage.getItem('sbedtech_user');
      const savedActivation = localStorage.getItem('sbedtech_activated');
      const savedHistory = localStorage.getItem('sbedtech_history');

      if (savedUser) {
        try { setLocalUserProfile(JSON.parse(savedUser)); } catch (e) { console.error(e); }
      }
      if (savedActivation === 'true') { setLocalActivated(true); }

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

  // Timer Countdown Effect with Real Auto-Submit Integration
  useEffect(() => {
    if (!isTimerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      
      // Instantly invoke QuestionCard's submit handler to grade active answers
      if (submitExamRef.current) {
        submitExamRef.current();
      } else {
        handleEndExam({ score: 0, totalQuestions: questions.length || 40, timeSpentSeconds: 0, summary: [] });
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, questions]);
   
  const handleSaveProfile = (profileData) => {
    setLocalUserProfile(profileData);
    localStorage.setItem('sbedtech_user', JSON.stringify(profileData));
    setShowSignUp(false);

    if (pendingAction) {
      if (pendingAction.type === 'startExam') {
        fetchExamQuestions(pendingAction.params);
      } else if (pendingAction.type === 'openAiTutor') {
        if (localActivated) {
          setShowAiTutorModal(true);
        } else {
          handleOpenActivation();
        }
      }
      setPendingAction(null);
    }
  };

  const fetchExamQuestions = async ({ subject, year, topic, mode, limit, durationInMinutes }) => {
    setLoadingQuestions(true);

    const subjectMap = {
      'use of english': 'english',
      'english': 'english',
      'mathematics': 'mathematics',
      'maths': 'mathematics',
      'physics': 'physics',
      'chemistry': 'chemistry',
      'biology': 'biology',
      'economics': 'economics',
      'government': 'government',
      'christian religious studies (crs)': 'crs',
      'crs': 'crs',
      'geography': 'geography',
      'financial accounting': 'accounting',
      'commerce': 'commerce',
      'literature in english': 'literature-in-english',
      'literature': 'literature-in-english',
      'islamic religious studies (irs)': 'irs',
      'irs': 'irs',
      'agricultural science': 'agricultural-science',
      'agric': 'agricultural-science',
      'yoruba': 'yoruba',
      'igbo': 'igbo',
      'hausa': 'hausa',
    };

    const rawSubject = (subject || '').toLowerCase().trim();
    const cleanSubject = subjectMap[rawSubject] || rawSubject;

    setActiveSubject(subject);
    setExamMode(mode || 'practice');

    try {
      const topicParam = topic && topic !== 'All Topics' ? `&topic=${encodeURIComponent(topic)}` : '';
      const response = await fetch(
        `/api/get-questions?subject=${encodeURIComponent(cleanSubject)}&year=${encodeURIComponent(year || 'random')}${topicParam}&limit=${limit || 40}`
      );

      let fetchedQuestions = [];

      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.length > 0) {
          fetchedQuestions = result.data;
        }
      }

      // Filter by Official JAMB Prescribed Text for English
      if (cleanSubject === 'english') {
        const selectedYear = (year === 'Random' || !year) ? '2026' : year;
        const targetNovel = JAMB_ENGLISH_NOVELS[selectedYear] || 'The Lekki Headmaster';

        fetchedQuestions = fetchedQuestions.filter((q) => {
          if (q.category === 'comprehension' || q.passage || q.novel || (topic && topic.includes('Lekki Headmaster'))) {
            if (q.novel) return q.novel.toLowerCase() === targetNovel.toLowerCase();

            const otherNovels = Object.values(JAMB_ENGLISH_NOVELS).filter((n) => n !== targetNovel);
            const queryText = (q.question + ' ' + (q.passage || '')).toLowerCase();
            return !otherNovels.some((other) => queryText.includes(other.toLowerCase()));
          }
          return true;
        });
      }

      // AI Expert Tutor Fallback
      if (fetchedQuestions.length === 0) {
        console.log(`No database questions found for ${cleanSubject}. Generating via AI Tutor...`);
        fetchedQuestions = await generateTopicQuestions({
          subject: cleanSubject,
          topic: topic || 'General JAMB Syllabus',
          limit: parseInt(limit, 10) || 20,
          year: year || '2026',
          examType: 'UTME',
        });
      }

      if (fetchedQuestions.length > 0) {
        const formattedQuestions = fetchedQuestions.map((q) => {
          let options = q.option || q.options || {};

          if (typeof options === 'object' && !Array.isArray(options)) {
            options = {
              a: options.a || q.optionA || q.a || '',
              b: options.b || q.optionB || q.b || '',
              c: options.c || q.optionC || q.c || '',
              d: options.d || q.optionD || q.d || '',
            };
          }

          const selectedYear = (year === 'Random' || !year) ? '2026' : year;

          return {
            ...q,
            question: q.question || q.questionText || '',
            options,
            answer: q.answer || q.correctAnswer || '',
            prescribedText: cleanSubject === 'english' ? (JAMB_ENGLISH_NOVELS[selectedYear] || 'The Lekki Headmaster') : null,
          };
        });

        setQuestions(formattedQuestions);

        const totalMinutes = parseInt(durationInMinutes, 10) || 90;
        setTimeLeft(totalMinutes * 60);
        setIsTimerRunning(true);
        setExamStarted(true);
        return;
      }

      throw new Error('Could not retrieve or generate questions.');
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert(`Could not fetch questions for ${subject}. Generating AI topic drill...`);
    } finally {
      setLoadingQuestions(false);
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

  const handleOpenAiTutor = () => {
    if (!currentUser && !localUserProfile) {
      setPendingAction({ type: 'openAiTutor' });
      setShowSignUp(true);
      return;
    }

    if (!localActivated) {
      handleOpenActivation();
      return;
    }

    setShowAiTutorModal(true);
  };

  const handleStartWeaknessDrill = (targetSubject) => {
    handleStartExam({
      subject: targetSubject || 'Use of English',
      year: '2026',
      topic: '',
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
      const currentTime = Date.now();
      const formattedDate = new Date().toISOString();
      const totalQ = summaryData.totalQuestions || questions.length || 40;
      const scoreVal = summaryData.score || 0;

      const newRecord = {
        id: currentTime,
        timestamp: currentTime,
        date: formattedDate,
        subject: activeSubject,
        mode: examMode,
        score: scoreVal,
        totalQuestions: totalQ,
        percentage: summaryData.percentage || Math.round((scoreVal / totalQ) * 100),
        summary: summaryData.summary || [] // Captures the full breakdown correctly!
      };

      if (currentUser?.uid) {
        try {
          await saveExamResult(currentUser.uid, {
            subject: activeSubject,
            score: newRecord.score,
            totalQuestions: newRecord.totalQuestions,
            timeSpentSeconds: summaryData.timeSpentSeconds || 0,
            userAnswers: summaryData.userAnswers || {},
            summary: newRecord.summary,
            date: formattedDate
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
    if (viewMode === 'admin') return 'ADMIN CONTROL PORTAL';
    if (!examStarted) return 'JAMB CBT PORTAL';
    const sub = activeSubject ? activeSubject.toUpperCase() : 'CBT EXAM';
    const mode = examMode ? examMode.toUpperCase() : 'PRACTICE';
    return `${sub} (${mode})`;
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Header
        studentName={getCandidateName()}
        examType={getExamTypeLabel()}
        totalSeconds={viewMode === 'admin' ? 0 : timeLeft}
        userEmail={currentUser?.email || activeUserProfile?.email}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAuth={() => setShowSignUp(true)}
      />

      <main className="container mx-auto px-4 py-6">
        {viewMode === 'admin' ? (
          <AdminDashboard currentUser={currentUser} userProfile={activeUserProfile} />
        ) : loadingQuestions ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-semibold text-sm">
              Fetching questions and aligning with selected JAMB topic...
            </p>
          </div>
        ) : !examStarted ? (
          <HomeScreen
            userProfile={activeUserProfile}
            history={examHistory}
            isActivated={localActivated}
            onStartExam={handleStartExam}
            onStartWeaknessDrill={handleStartWeaknessDrill}
            onOpenSignUp={() => setShowSignUp(true)}
            onOpenActivation={handleOpenActivation}
            onOpenHistory={() => setShowHistoryModal(true)}
            onOpenAiTutor={handleOpenAiTutor}
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
              onSubmitRef={submitExamRef}
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
            if (pendingAction) {
              if (pendingAction.type === 'startExam') {
                fetchExamQuestions(pendingAction.params);
              } else if (pendingAction.type === 'openAiTutor') {
                if (localActivated) {
                  setShowAiTutorModal(true);
                } else {
                  handleOpenActivation();
                }
              }
              setPendingAction(null);
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

      {showAiTutorModal && (
        <AiTutorModal
          isOpen={showAiTutorModal}
          onClose={() => setShowAiTutorModal(false)}
          userProfile={activeUserProfile}
        />
      )}
    </div>
  );
}