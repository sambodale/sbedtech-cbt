import { db } from '../firebase/config';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getDeviceId } from './deviceService';

export async function saveExamResult(userId, userName, resultData) {
  try {
    // Save to general exam history
    await addDoc(collection(db, 'exam_results'), {
      userId,
      userName: userName || 'Candidate',
      subject: resultData.subject,
      score: resultData.score,
      totalQuestions: resultData.totalQuestions,
      timeSpentSeconds: resultData.timeSpentSeconds || 0,
      userAnswers: resultData.userAnswers || {},
      date: Timestamp.now()
    });

    // Automatically update individual subject leaderboard
    await updateLeaderboard(userId, userName, resultData);

    // Automatically update aggregate 4-subject UTME leaderboard (out of 400)
    await updateAggregateLeaderboard(userId, userName, resultData.subject, resultData.score);
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

// 1. Function to update the individual subject leaderboard
export async function updateLeaderboard(userId, userName, resultData) {
  try {
    const subject = resultData.subject;
    if (!subject) return;

    const leaderboardId = `${userId}_${subject.toLowerCase().trim()}`;
    const docRef = doc(db, 'leaderboards', leaderboardId);
    const existingDoc = await getDoc(docRef);

    const score = resultData.score || 0;
    const timeSpent = resultData.timeSpentSeconds || 0;

    if (!existingDoc.exists() || score >= existingDoc.data().score) {
      await setDoc(docRef, {
        userId,
        userName: userName || 'Candidate',
        subject: subject,
        score: score,
        totalQuestions: resultData.totalQuestions || 40,
        timeSpentSeconds: timeSpent,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error updating leaderboard:", error);
  }
}

// 2. Function to fetch individual subject rankings
export async function fetchLeaderboard(subjectName) {
  try {
    const q = query(
      collection(db, 'leaderboards'),
      where('subject', '==', subjectName),
      orderBy('score', 'desc'),
      orderBy('timeSpentSeconds', 'asc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

// 3. Function to update the 4-Subject Aggregate UTME Leaderboard (Max 400)
export async function updateAggregateLeaderboard(userId, userName, currentSubject, currentScore) {
  try {
    if (!userId || !currentSubject) return;

    const userAggregateId = `${userId}_aggregate`;
    const docRef = doc(db, 'leaderboard_aggregates', userAggregateId);
    const existingDoc = await getDoc(docRef);

    let subjectScores = existingDoc.exists() ? existingDoc.data().subjectScores || {} : {};
    let subjectsTaken = existingDoc.exists() ? existingDoc.data().subjectsTaken || [] : [];

    subjectScores[currentSubject] = currentScore;

    if (!subjectsTaken.includes(currentSubject)) {
      subjectsTaken.push(currentSubject);
    }

    const hasEnglish = subjectsTaken.some(s => s.toLowerCase().includes('english'));
    const totalScore = Object.values(subjectScores).reduce((a, b) => a + b, 0);

    await setDoc(docRef, {
      userId,
      userName: userName || 'Candidate',
      subjectScores,
      subjectsTaken,
      score: totalScore,
      totalSubjectsCount: subjectsTaken.length,
      hasEnglish,
      updatedAt: Timestamp.now()
    }, { merge: true });

  } catch (error) {
    console.error("Error updating aggregate leaderboard:", error);
  }
}

// 4. Function to fetch top candidates sorted by aggregate score out of 400
export async function fetchAggregateLeaderboard() {
  try {
    const q = query(
      collection(db, 'leaderboard_aggregates'),
      where('hasEnglish', '==', true),
      orderBy('score', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching aggregate leaderboard:", error);
    return [];
  }
}

// 5. Function to verify if a candidate has unlocked paid exam mode
export async function verifyCandidateExamAccess(userId) {
  try {
    const docRef = doc(db, 'students', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return Boolean(docSnap.data().isExamModeUnlocked);
    }
    return false;
  } catch (error) {
    console.error("Error verifying candidate exam access:", error);
    return false;
  }
}

// 6. Admin function to manually confirm payment and generate an exclusive activation pin.
// Issuing a new pin also lets a candidate re-activate on a new device.
export async function adminConfirmAndGeneratePin(targetUserId) {
  try {
    if (!targetUserId) throw new Error("Target user ID is required to generate a pin.");

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const uniquePin = `SBED-EXAM-${randomNum}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

    const studentRef = doc(db, 'students', targetUserId);

    await setDoc(studentRef, {
      assignedExamPin: uniquePin,
      examPinStatus: 'unused',
      paymentStatus: 'confirmed_by_admin', // Admin manually verified payment
      examActivationStatus: 'pin_assigned',
      pinAssignedAt: Timestamp.now()
    }, { merge: true });

    return uniquePin;
  } catch (error) {
    console.error("Error confirming payment and generating pin:", error);
    throw error;
  }
}

// 7. Candidate function to verify and claim their assigned activation pin.
// The pin is claimed together with a device registration in one atomic batch.
export async function verifyAndClaimExamPin(userId, pinInput) {
  try {
    if (!userId) throw new Error('User session not found. Please log in again.');
    if (!pinInput || !pinInput.trim()) throw new Error('Please enter an activation pin.');
    const cleanPin = pinInput.trim().toUpperCase();

    const studentRef = doc(db, 'students', userId);
    const studentSnap = await getDoc(studentRef);
    const studentData = studentSnap.exists() ? studentSnap.data() : null;

    // The pin must be the one assigned to this exact account
    if (!studentData?.assignedExamPin || studentData.assignedExamPin.trim().toUpperCase() !== cleanPin) {
      throw new Error('Invalid Activation Pin. Please check your code or contact the admin.');
    }

    if (studentData.examPinStatus === 'used') {
      throw new Error('This Activation Pin has already been used.');
    }

    if (studentData.paymentStatus !== 'confirmed_by_admin') {
      throw new Error('Payment for this pin has not yet been confirmed by an administrator.');
    }

    // Register this device to the account
    const deviceId = getDeviceId();
    if (!deviceId) {
      throw new Error('This browser blocks storage, so the device cannot be registered. Please try another browser.');
    }

    const deviceRef = doc(db, 'devices', deviceId);
    const deviceSnap = await getDoc(deviceRef);
    if (deviceSnap.exists() && deviceSnap.data().uid !== userId) {
      throw new Error('This device is already registered to another account.');
    }

    const batch = writeBatch(db);
    batch.update(studentRef, {
      isExamModeUnlocked: true,
      examPinStatus: 'used',
      activatedAt: serverTimestamp(),
      claimPin: studentData.assignedExamPin,
      boundDeviceId: deviceId,
    });
    if (!deviceSnap.exists()) {
      batch.set(deviceRef, { uid: userId, boundAt: serverTimestamp() });
    }

    try {
      await batch.commit();
    } catch (commitError) {
      if (commitError.code === 'permission-denied') {
        throw new Error('The pin could not be claimed. This device may already be registered to another account.');
      }
      throw commitError;
    }

    return true;
  } catch (error) {
    console.error('Error claiming exam pin:', error);
    throw error;
  }
}

// 8. Direct unlock is disabled. Exam mode can only be unlocked by claiming an admin-issued pin,
// because the security rules do not allow candidates to change their own unlock status.
export async function unlockStudentExamMode() {
  throw new Error('Exam mode can only be unlocked with an activation pin issued by the admin.');
}