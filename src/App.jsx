import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';
import ExamHistoryModal from './components/ExamHistoryModal';
import AiTutorModal from './components/AiTutorModal';
import AdminDashboard from './components/AdminDashboard';
import PaystackModal from './components/PaystackModal';
import AdminPinModal from './components/AdminPinModal';
import AdminLoginModal from './components/AdminLoginModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { getUserProfile, ensureUserProfileExists } from './services/authServices';
import { getDeviceId } from './services/deviceService';
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

// Maps a display subject name to the slug the /api/get-questions endpoint expects
const SUBJECT_API_SLUGS = {
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

const mapSubjectSlug = (subject) => {
  const raw = (subject || '').toLowerCase().trim();
  return SUBJECT_API_SLUGS[raw] || raw;
};

// Normalizes provider question objects into the shape QuestionCard/QuestionPalette expect,
// applies the correct-novel filter for English comprehension, and tags each question with
// the subject it belongs to (subjectTag), which QuestionPalette groups by.
const formatFetchedQuestions = (fetchedQuestions, cleanSubject, year, subjectTag) => {
  let list = fetchedQuestions;

  if (cleanSubject === 'english' && list && list.length > 0) {
    const selectedYear = (year === 'Random' || !year) ? '2026' : year;
    const targetNovel = JAMB_ENGLISH_NOVELS[selectedYear] || 'The Lekki Headmaster';

    list = list.filter((q) => {
      if (q.category === 'comprehension' || q.passage || q.novel) {
        if (q.novel) return q.novel.toLowerCase() === targetNovel.toLowerCase();
        const otherNovels = Object.values(JAMB_ENGLISH_NOVELS).filter((n) => n !== targetNovel);
        const queryText = (q.question + ' ' + (q.passage || '')).toLowerCase();
        return !otherNovels.some((other) => queryText.includes(other.toLowerCase()));
      }
      return true;
    });
  }

  return (list || []).map((q) => {
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
      subjectTag,
    };
  });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [viewMode, setViewMode] = useState('candidate');

  const [localUserProfile, setLocalUserProfile] = useState(null);
  const [localActivated, setLocalActivated] = useState(false);

  const [showSignUp, setShowSignUp] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAiTutorModal, setShowAiTutorModal] = useState(false);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [pendingAction, setPendingAction] = useState(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [examMode, setExamMode] = useState('practice');
  const [questions, setQuestions] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [examHistory, setExamHistory] = useState([]);

  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const submitExamRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Load the profile, creating a valid one if this account has none yet
          let profileData = await getUserProfile(user.uid);
          if (!profileData) {
            await ensureUserProfileExists(user);
            profileData = await getUserProfile(user.uid);
          }

          // Device check: a device activated by one account cannot be used by another
          const deviceId = getDeviceId();
          if (deviceId && profileData?.role !== 'admin') {
            const deviceSnap = await getDoc(doc(db, 'devices', deviceId));
            if (deviceSnap.exists() && deviceSnap.data().uid !== user.uid) {
              await signOut(auth);
              alert('This device is registered to another activated account. Please use your own device.');
              return;
            }
          }

          setFirebaseProfile(profileData);

          // Exam mode is active only if unlocked in Firestore and bound to this device
          const unlocked = Boolean(profileData?.isExamModeUnlocked);
          const deviceOk = !profileData?.boundDeviceId || profileData.boundDeviceId === deviceId;
          setLocalActivated(unlocked && deviceOk);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setFirebaseProfile(null);
        setLocalActivated(false);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const activeUserProfile = currentUser
    ? { email: currentUser.email, ...firebaseProfile }
    : localUserProfile;

  // Admin status comes from the same Firestore field that the security rules check
  const isAdmin = firebaseProfile?.role === 'admin';

  useEffect(() => {
    const loadUserData = async () => {
      const savedUser = localStorage.getItem('sbedtech_user');
      const savedHistory = localStorage.getItem('sbedtech_history');

      if (savedUser) {
        try { setLocalUserProfile(JSON.parse(savedUser)); } catch (e) { console.error(e); }
      }

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

  useEffect(() => {
    if (!isTimerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);

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

  // Handles both Exam Mode (params.subjects is an array of exactly 4, English included)
  // and Practice Mode (params.subject is a single subject string).
  const fetchExamQuestions = async (params) => {
    setLoadingQuestions(true);

    try {
      if (params.mode === 'exam' && Array.isArray(params.subjects)) {
        const { subjects, year, durationInMinutes, limit } = params;

        const results = await Promise.all(
          subjects.map(async (subjectName) => {
            const cleanSubject = mapSubjectSlug(subjectName);
            const fetched = await generateTopicQuestions({
              subject: cleanSubject,
              topic: 'General JAMB Syllabus',
              limit: parseInt(limit, 10) || 40,
              year: year || '2026',
              examType: 'UTME',
            });
            const formatted = formatFetchedQuestions(fetched, cleanSubject, year, subjectName);
            return { subjectName, questions: formatted };
          })
        );

        const emptySubjects = results.filter((r) => r.questions.length === 0).map((r) => r.subjectName);
        if (emptySubjects.length > 0) {
          alert(`Could not load questions for: ${emptySubjects.join(', ')}. Please pick a different subject for those and try again.`);
          return;
        }

        const combined = results.flatMap((r) => r.questions);

        setActiveSubject(subjects.join(' • '));
        setExamMode('exam');
        setQuestions(combined);
        setTimeLeft((parseInt(durationInMinutes, 10) || 120) * 60);
        setIsTimerRunning(true);
        setExamStarted(true);
        return;
      }

      // Practice Mode: single subject
      const { subject, year, topic, mode, limit, durationInMinutes } = params;
      const cleanSubject = mapSubjectSlug(subject);

      setActiveSubject(subject);
      setExamMode(mode || 'practice');

      const fetched = await generateTopicQuestions({
        subject: cleanSubject,
        topic: topic || 'General JAMB Syllabus',
        limit: parseInt(limit, 10) || 20,
        year: year || '2026',
        examType: 'UTME',
      });
      const formatted = formatFetchedQuestions(fetched, cleanSubject, year, subject);

      if (!formatted || formatted.length === 0) {
        throw new Error('Could not generate questions.');
      }

      setQuestions(formatted);
      setTimeLeft((parseInt(durationInMinutes, 10) || 90) * 60);
      setIsTimerRunning(true);
      setExamStarted(true);
    } catch (error) {
      console.error('Error loading questions:', error);
      const message = error?.message || '';
      const showServerMessage = [
        'No questions',
        'The question service',
        'Questions are not available',
      ].some((start) => message.startsWith(start));

      alert(
        showServerMessage
          ? message
          : 'Could not load questions. Please check your connection and try again.'
      );
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
    // Pins belong to one account, so a logged-in user is required
    if (!currentUser) {
      setShowSignUp(true);
      return;
    }
    setShowPaystackModal(true);
  };

  const handleOpenPinActivation = () => {
    if (!currentUser) {
      setShowSignUp(true);
      return;
    }
    setShowPinModal(true);
  };

  // Admin sign in success: the modal has already confirmed role === 'admin'
  const handleAdminLoginSuccess = () => {
    setShowAdminLogin(false);
    setViewMode('admin');
  };

  // Admin sign out: end the session and reload so no admin data stays in memory
  const handleAdminSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Admin sign out failed:', error);
    }
    setViewMode('candidate');
    window.location.reload();
  };

  // PaystackModal verifies the pin itself and shows its own success message
  const handlePaymentSuccess = () => {
    setLocalActivated(true);
    setShowPaystackModal(false);
  };

  // AdminPinModal has already verified and claimed the pin before calling this
  const handlePinVerified = () => {
    setLocalActivated(true);
    setShowPinModal(false);
    alert('Exam Mode successfully unlocked via Activation Pin!');
    window.location.reload(); // Refresh so every part of the app sees the new activation
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
        summary: summaryData.summary || []
      };

      if (currentUser?.uid) {
        try {
          await saveExamResult(
            currentUser.uid,
            getCandidateName(),
            {
              subject: activeSubject,
              score: newRecord.score,
              totalQuestions: newRecord.totalQuestions,
              timeSpentSeconds: summaryData.timeSpentSeconds || 0,
              userAnswers: summaryData.userAnswers || {},
              summary: newRecord.summary,
              date: formattedDate
            }
          );
        } catch (err) {
          console.error('Failed to sync result to Firestore:', err);
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

    return 'Candidate';
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
        viewMode={viewMode}
        setViewMode={setViewMode}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
        onAdminSignOut={handleAdminSignOut}
        onOpenAuth={() => setShowSignUp(true)}
      />

      <main className="container mx-auto px-4 py-6">
        {viewMode === 'admin' && isAdmin ? (
          <AdminDashboard currentUser={currentUser} userProfile={activeUserProfile} />
        ) : loadingQuestions ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-semibold text-sm">
              Generating practice questions and aligning with selected JAMB syllabus...
            </p>
          </div>
        ) : !examStarted ? (
          <HomeScreen
            userProfile={activeUserProfile}
            currentUser={currentUser}
            history={examHistory}
            isActivated={localActivated}
            onStartExam={handleStartExam}
            onStartWeaknessDrill={handleStartWeaknessDrill}
            onOpenSignUp={() => setShowSignUp(true)}
            onOpenActivation={handleOpenActivation}
            onOpenPinActivation={handleOpenPinActivation}
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

      {showPaystackModal && (
        <PaystackModal
          isOpen={showPaystackModal}
          onClose={() => setShowPaystackModal(false)}
          userEmail={currentUser?.email || activeUserProfile?.email}
          userName={getCandidateName()}
          userId={currentUser?.uid || localUserProfile?.id || 'guest_user'}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showPinModal && (
        <AdminPinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onPinVerified={handlePinVerified}
          currentUser={currentUser}
        />
      )}

      {showAdminLogin && (
        <AdminLoginModal
          isOpen={showAdminLogin}
          onClose={() => setShowAdminLogin(false)}
          onSuccess={handleAdminLoginSuccess}
        />
      )}
    </div>
  );
}