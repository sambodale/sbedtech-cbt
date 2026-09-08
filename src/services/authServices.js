import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

/**
 * Registers a new candidate using Firebase Authentication.
 * @param {string} email 
 * @param {string} password 
 */
export const registerCandidate = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
    return userCredential.user;
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