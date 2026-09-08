import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import HomeScreen from './components/HomeScreen';
import SignUpModal from './components/SignUpModal';
import ExamHistoryModal from './components/ExamHistoryModal';
import DashboardModal from './components/DashboardModal';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getUserProfile } from './services/authServices';
import { saveExamResult, getUserExamHistory } from './services/examServices';

const QuestionCard = lazy(() => import('./components/QuestionCard'));

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseProfile, setFirebaseProfile] = useState(null);

  // Listen for Auth changes & fetch profile from Firestore
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
    });

    return () => unsubscribe();
  }, []);

  // Combine Auth state with fetched Firestore Profile
  const activeUserProfile = currentUser 
    ? { email: currentUser.email, ...firebaseProfile }
    : null;

  const getCandidateName = () => {
    if (activeUserProfile?.fullName) return activeUserProfile.fullName;
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Guest User';
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Header
        studentName={getCandidateName()}
        examType="JAMB CBT PORTAL"
      />
      
      {/* Test Display Banner */}
      <div className="p-4 m-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
        <p className="font-bold">Firestore Profile Test:</p>
        <p>Logged-in UID: {currentUser?.uid || 'None'}</p>
        <p>Full Name: {activeUserProfile?.fullName || 'Not loaded'}</p>
        <p>Email: {activeUserProfile?.email || 'Not loaded'}</p>
        <p>Role: {activeUserProfile?.role || 'Not loaded'}</p>
      </div>
    </div>
  );
}