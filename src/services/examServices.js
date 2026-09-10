import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  where,
  limit as limitDocs
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Saves a completed exam session record to Firestore under `exam_results`.
 *
 * @param {string} userId - User UID
 * @param {Object} resultData - Result payload containing score, subject, answers, etc.
 */
export const saveExamResult = async (userId, resultData) => {
  try {
    const resultsRef = collection(db, "exam_results");
    const docRef = await addDoc(resultsRef, {
      userId: userId || "anonymous",
      ...resultData,
      timestamp: serverTimestamp(),
      dateString: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    });

    return {
      id: docRef.id,
      userId,
      ...resultData,
    };
  } catch (error) {
    console.error("Error saving exam result:", error);
    throw error;
  }
};

/**
 * Fetches user history for an individual candidate.
 *
 * @param {string} userId - Student UID
 * @returns {Promise<Array>}
 */
export const getUserExamHistory = async (userId) => {
  if (!userId) return [];

  try {
    const resultsRef = collection(db, "exam_results");
    const q = query(resultsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const history = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        date: data.dateString || "Recent",
      });
    });

    return history;
  } catch (error) {
    console.error("Error fetching user history:", error);
    return [];
  }
};

/**
 * Admin Service: Fetches ALL candidate exam entries across Firestore.
 *
 * @returns {Promise<Array>} List of all student attempts across the platform
 */
export const getAllUserExamResults = async () => {
  try {
    const resultsRef = collection(db, "exam_results");
    const q = query(resultsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    const allResults = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allResults.push({
        id: doc.id,
        ...data,
        date: data.dateString || "Recent",
      });
    });

    return allResults;
  } catch (error) {
    console.error("Error fetching all exam results for admin:", error);
    throw error;
  }
};

/**
 * Calculates aggregate performance metrics from a list of exam history records.
 *
 * @param {Array} historyRecords
 * @returns {Object} Calculated stats object
 */
export const calculateAggregateStats = (historyRecords = []) => {
  if (!historyRecords || historyRecords.length === 0) {
    return {
      totalMockTests: 0,
      totalQuestionsSolved: 0,
      overallAccuracy: 0,
      predictedJambScore: 180,
      subjectBreakdown: {},
    };
  }

  let totalSolved = 0;
  let totalCorrect = 0;
  const subjectBreakdown = {};

  historyRecords.forEach((item) => {
    const qCount = Number(item.totalQuestions || 0);
    const score = Number(item.score || 0);
    const subject = item.subject || "General";

    totalSolved += qCount;
    totalCorrect += score;

    if (!subjectBreakdown[subject]) {
      subjectBreakdown[subject] = { score: 0, total: 0 };
    }
    subjectBreakdown[subject].score += score;
    subjectBreakdown[subject].total += qCount;
  });

  const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
  const predictedJambScore = Math.min(400, Math.max(120, Math.round((overallAccuracy / 100) * 400)));

  return {
    totalMockTests: historyRecords.length,
    totalQuestionsSolved: totalSolved,
    overallAccuracy,
    predictedJambScore,
    subjectBreakdown,
  };
};

/**
 * Fetches practice questions filtered by subject, year, or topic.
 *
 * @param {Object} params
 */
export const fetchQuestions = async ({ subject, year = "Random", topic = "", limit = 40 }) => {
  try {
    const questionsRef = collection(db, "questions");
    const constraints = [where("subject", "==", subject)];

    if (year && year !== "Random") {
      constraints.push(where("year", "==", year));
    }

    if (topic && topic !== "All Topics") {
      constraints.push(where("topic", "==", topic));
    }

    constraints.push(limitDocs(limit));

    const q = query(questionsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const questions = [];

    querySnapshot.forEach((docSnap) => {
      questions.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    return questions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};