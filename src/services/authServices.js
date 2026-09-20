import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { verifyAndClaimExamPin } from './examServices';

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
 * The profile always starts as a locked student account.
 * @param {Object} user - Firebase Auth user object
 */
export const ensureUserProfileExists = async (user) => {
  if (!user) return;

  const userRef = doc(db, "students", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    // The security rules require a name between 2 and 50 characters
    let name = (user.displayName || user.email?.split("@")[0] || "Candidate").trim().slice(0, 50);
    if (name.length < 2) name = "Candidate";

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      fullName: name,
      role: "student",
      isExamModeUnlocked: false,
      createdAt: serverTimestamp(),
    });
  }
};

/**
 * Registers a new candidate and saves their profile to Firestore.
 * New accounts are always students. Admin access is granted only by editing the role in Firestore.
 * @param {string} email
 * @param {string} password
 * @param {Object} extraData - Additional info (fullName)
 */
export const registerCandidate = async (email, password, extraData = {}) => {
  try {
    const fullName = (extraData.fullName || "").trim();
    if (!NAME_REGEX.test(fullName)) {
      throw new Error("Full name must contain only letters and be between 2 and 50 characters.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "students", user.uid), {
      uid: user.uid,
      email: user.email,
      fullName,
      role: "student",
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
 * Uses the same device-bound claim as the pin modal, and returns true or false.
 * @param {string} uid
 * @param {string} enteredPin
 */
export const verifyExamActivationPin = async (uid, enteredPin) => {
  if (!uid || !enteredPin) return false;
  try {
    return await verifyAndClaimExamPin(uid, enteredPin);
  } catch (error) {
    console.error("Error verifying exam pin:", error);
    return false;
  }
};