import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';
import QuestionCard from './components/QuestionCard';

export default function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'startExam' | 'activate'

  // CBT Exam State
  const [examStarted, setExamStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState('');
  const [examMode, setExamMode] = useState('practice');

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedActivation = localStorage.getItem('isActivated') === 'true';

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    setIsActivated(savedActivation);
  }, []);

  // Trigger Paystack activation
  const handleOpenActivation = () => {
    if (!userProfile) {
      setPendingAction('activate');
      setShowSignUp(true);
      return;
    }
    
    // Launch Paystack checkout flow
    alert(`Redirecting ${userProfile.email} to Paystack Checkout...`);
    
    // Simulate successful Paystack verification (For testing/production hook)
    // localStorage.setItem('isActivated', 'true');
    // setIsActivated(true);
  };

  // Called after user completes profile form
  const handleSignUpSuccess = (profileData) => {
    setUserProfile(profileData);
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setShowSignUp(false);

    // Resume action user intended before signing up
    if (pendingAction === 'activate') {
      setPendingAction(null);
      alert(`Profile created! Redirecting ${profileData.email} to Paystack Checkout...`);
    } else {
      setPendingAction(null);
      // Returns user directly to HomeScreen with CBT Setup Selector active
    }
  };

  // Starts the exam once user submits options in CBT Setup Selector
  const handleStartExam = async ({ subject, mode, limit, durationInMinutes }) => {
    if (!userProfile) {
      setPendingAction('startExam');
      setShowSignUp(true);
      return;
    }

    setLoading(true);
    setActiveSubject(subject);
    setExamMode(mode);

    try {
      const response = await fetch(`/api/get-questions?subject=${subject}&limit=${limit}`);
      const result = await response.json();

      if (result && result.data) {
        setQuestions(Array.isArray(result.data) ? result.data : [result.data]);
        setExamStarted(true);
      } else {
        alert('Could not retrieve questions for this subject. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Failed to connect to the question server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header 
        userProfile={userProfile} 
        isActivated={isActivated} 
        onOpenSignUp={() => setShowSignUp(true)} 
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <p className="text-xl font-semibold text-blue-400 animate-pulse">
            Loading {activeSubject.toUpperCase()} Questions...
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
        <div className="p-6">
          <QuestionCard 
            questions={questions} 
            mode={examMode} 
            onExit={() => setExamStarted(false)} 
          />
        </div>
      )}

      {showSignUp && (
        <SignUpModal
          onClose={() => {
            setShowSignUp(false);
            setPendingAction(null);
          }}
          onSuccess={handleSignUpSuccess}
        />
      )}
    </div>
  );
}