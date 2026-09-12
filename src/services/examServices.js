import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

export async function saveExamResult(userId, resultData) {
  try {
    await addDoc(collection(db, 'exam_results'), {
      userId,
      subject: resultData.subject,
      score: resultData.score,
      totalQuestions: resultData.totalQuestions,
      timeSpentSeconds: resultData.timeSpentSeconds || 0,
      userAnswers: resultData.userAnswers || {},
      date: Timestamp.now()
    });
  } catch (error) {
    console.error("Error saving exam result:", error);
    throw error;
  }
}

export async function getUserExamHistory(userId) {
  try {
    const q = query(
      collection(db, 'exam_results'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate().toISOString() || new Date().toISOString()
    }));

    // Sort locally in JavaScript by date (newest first)
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error fetching user history:", error);
    return [];
  }
}

export async function getAllExamResults() {
  try {
    const snapshot = await getDocs(collection(db, 'exam_results'));
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate().toISOString() || new Date().toISOString()
    }));

    // Sort locally in JavaScript by date (newest first)
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error fetching global exam results:", error);
    return [];
  }
}