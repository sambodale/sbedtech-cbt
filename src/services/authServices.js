import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

// Regex patterns for client-side validation
const NAME_REGEX = /^[a-zA-Z\s]{2,50}$/;

/**
 * Checks if a user profile exists in Firestore and creates one if missing.
 * Prevents missing profile issues for legacy users who registered before Firestore profile creation was added.
 * @param {Object} user - Firebase Auth user object
 */
export const ensureUserProfileExists = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      fullName: user.displayName || user.email?.split("@")[0] || "Candidate",
      role: "student",
      createdAt: serverTimestamp(),
    });
  }
};

/**
 * Registers a new candidate and saves their profile to Firestore.
 * @param {string} email 
 * @param {string} password 
 * @param {Object} extraData - Additional info (fullName, role, etc.)
 */
export const registerCandidate = async (email, password, extraData = {}) => {
  try {
    // 1. Client-side pattern validation
    if (extraData.fullName && !NAME_REGEX.test(extraData.fullName)) {
      throw new Error("Full name must contain only letters and be between 2 and 50 characters.");
    }

    // 2. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 3. Save extra user details to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      fullName: extraData.fullName ? extraData.fullName.trim() : "",
      role: extraData.role || "student",
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (error) {
    console.error("Error signing up candidate:", error);
    throw error;
  }
};

/**
 * Logs in an existing candidate using Firebase Authentication.
 * Automatically backfills missing Firestore documents for older candidate accounts.
 * @param {string} email 
 * @param {string} password 
 */
export const loginCandidate = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Automatically check and backfill missing Firestore profile document upon login
    await ensureUserProfileExists(user);

    return user;
  } catch (error) {
    console.error("Error signing in candidate:", error);
    throw error;
  }
};

/**
 * Logs out the currently authenticated candidate.
 */
export const logoutCandidate = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out candidate:", error);
    throw error;
  }
};