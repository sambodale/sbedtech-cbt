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
 * Fetches user profile details from Firestore.
 * @param {string} uid 
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const userRef = doc(db, "students", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Checks if a user profile exists in Firestore and creates one if missing.
 * @param {Object} user - Firebase Auth user object
 */
export const ensureUserProfileExists = async (user) => {
  if (!user) return;

  const userRef = doc(db, "students", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      fullName: user.displayName || user.email?.split("@")[0] || "Candidate",
      role: "student",
      isExamModeUnlocked: false,
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
    if (extraData.fullName && !NAME_REGEX.test(extraData.fullName)) {
      throw new Error("Full name must contain only letters and be between 2 and 50 characters.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "students", user.uid), {
      uid: user.uid,
      email: user.email,
      fullName: extraData.fullName ? extraData.fullName.trim() : "",
      role: extraData.role || "student",
      isExamModeUnlocked: false,
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
 * @param {string} email 
 * @param {string} password 
 */
export const loginCandidate = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

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

/**
 * Student requests an activation pin for Exam Mode.
 * @param {string} uid 
 * @param {string} email 
 * @param {string} fullName 
 */
export const requestExamActivationPin = async (uid, email, fullName) => {
  if (!uid) throw new Error("User ID required for pin request.");
  try {
    const studentRef = doc(db, "students", uid);
    await setDoc(studentRef, {
      email: email || "",
      fullName: fullName || "Candidate",
      examActivationStatus: 'pending',
      requestedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true, message: "Activation request sent to admin." };
  } catch (error) {
    console.error("Error requesting exam pin:", error);
    throw error;
  }
};

/**
 * Candidate verifies the activation pin provided by the admin.
 * @param {string} uid 
 * @param {string} enteredPin 
 */
export const verifyExamActivationPin = async (uid, enteredPin) => {
  if (!uid || !enteredPin) return false;
  try {
    const studentRef = doc(db, "students", uid);
    const docSnap = await getDoc(studentRef);

    if (!docSnap.exists()) return false;

    const studentData = docSnap.data();

    if (
      studentData.assignedExamPin && 
      studentData.assignedExamPin.trim() === enteredPin.trim() && 
      studentData.examPinStatus !== 'used'
    ) {
      await setDoc(studentRef, {
        isExamModeUnlocked: true,
        examPinStatus: 'used',
        activatedAt: serverTimestamp(),
      }, { merge: true });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error verifying exam pin:", error);
    return false;
  }
};