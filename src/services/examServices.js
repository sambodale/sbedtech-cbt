import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * Saves a completed exam result to the 'exam_results' collection in Firestore.
 * @param {string} userId - The unique UID of the candidate.
 * @param {Object} examData - Exam details (subject, score, totalQuestions, timeSpentSeconds, userAnswers).
 */
export const saveExamResult = async (userId, examData) => {
  try {
    const docRef = await addDoc(collection(db, 'exam_results'), {
      userId,
      subject: examData.subject || '',
      score: examData.score || 0,
      totalQuestions: examData.totalQuestions || 40,
      percentage: Math.round(((examData.score || 0) / (examData.totalQuestions || 40)) * 100),
      timeSpentSeconds: examData.timeSpentSeconds || 0,
      userAnswers: examData.userAnswers || {},
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving exam result to Firestore:", error);
    throw error;
  }
};

/**
 * Fetches all past exam history for a specific student from Firestore.
 * @param {string} userId - The candidate's Firebase user ID.
 * @returns {Array} List of past exam attempt records.
 */
export const getUserExamHistory = async (userId) => {
  try {
    const examRef = collection(db, 'exam_results');
    const q = query(
      examRef, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];

    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort newest results first
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error("Error fetching candidate exam history:", error);
    return [];
  }
};