import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Initialize Firebase services (ensure your firebase app config is imported/initialized)
const auth = getAuth();
const db = getFirestore();

/**
 * Retrieves user profile data along with their assigned role ('admin' | 'student').
 * @param {string} uid - The Firebase Auth UID of the user.
 * @returns {Promise<Object>} Profile object including role, fullName, email, etc.
 */
export const getUserProfile = async (uid) => {
  if (!uid) throw new Error('User UID is required to fetch profile');

  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      return {
        uid,
        fullName: data.fullName || 'Candidate',
        email: data.email || '',
        role: data.role || 'student', // Default to 'student' if role field is missing
        isActivated: Boolean(data.isActivated),
        createdAt: data.createdAt || null,
        ...data,
      };
    } else {
      // Fallback if auth user exists but Firestore profile record is not yet created
      return {
        uid,
        fullName: 'Candidate',
        email: auth.currentUser?.email || '',
        role: 'student',
        isActivated: false,
      };
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Signs in a user with email & password and retrieves their profile with role.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Object containing user credentials and profile data.
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(userCredential.user.uid);

    return {
      user: userCredential.user,
      profile,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Registers a new user and sets initial profile role in Firestore.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 * @param {string} [params.role='student'] Optional role parameter ('student' | 'admin')
 * @returns {Promise<Object>}
 */
export const registerUser = async ({ email, password, fullName, role = 'student' }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const profileData = {
      uid,
      fullName,
      email,
      role, // Ensures role is stored during account creation
      isActivated: false,
      createdAt: serverTimestamp(),
    };

    // Store in Firestore
    await setDoc(doc(db, 'users', uid), profileData);

    return {
      user: userCredential.user,
      profile: profileData,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Signs out the current user.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Listens to Auth state changes and returns both the Firebase user and their role-enriched profile.
 * @param {Function} callback Callback receiving (user, profile)
 * @returns {Unsubscribe} Firebase unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        callback(user, profile);
      } catch (err) {
        console.error('Failed to load profile on auth change:', err);
        callback(user, { uid: user.uid, email: user.email, role: 'student' });
      }
    } else {
      callback(null, null);
    }
  });
};