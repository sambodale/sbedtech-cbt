import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getDeviceId } from '../services/deviceService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for login/logout state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch candidate activation status and role from the 'students' collection
          const userDoc = await getDoc(doc(db, 'students', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile in AuthContext:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Activation comes only from Firestore, and only on the device it was claimed on
  const deviceId = getDeviceId();
  const deviceOk = !userProfile?.boundDeviceId || userProfile.boundDeviceId === deviceId;
  const isActivated = Boolean(userProfile?.isExamModeUnlocked && deviceOk);

  const value = {
    currentUser,
    userProfile,
    isActivated,
    isAdmin: userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access across components
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
