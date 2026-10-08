// api/tutor-balance.js
// Tracks each student's AI Tutor balance in Firestore, denominated in raw output
// tokens (the unit Gemini actually bills for) — but only touched at session
// boundaries, never per chat message. GET reads the balance once when the tutor
// opens (and grants the one-time 50,000-token free allowance on first use). POST
// is the batched deduction call: the client accumulates token usage locally
// during a chat session and flushes it here every ~10 messages, on modal close,
// and when the tab loses visibility, rather than on every single message.
//
// Needs FIREBASE_SERVICE_ACCOUNT (already used by api/verify-payment.js).

const FREE_TOKENS_ON_ACTIVATION = 50000;

let firebase = null;
async function loadFirebase() {
  if (!firebase) {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/auth'),
      import('firebase-admin/firestore'),
    ]);
    firebase = {
      initializeApp: appModule.initializeApp,
      getApps: appModule.getApps,
      cert: appModule.cert,
      getAuth: authModule.getAuth,
      getFirestore: firestoreModule.getFirestore,
    };
  }
  return firebase;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function ensureFirebase(fb) {
  if (!fb.getApps().length) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      throw new HttpError(500, 'Server setup problem. Please try again later.');
    }
    fb.initializeApp({ credential: fb.cert(serviceAccount) });
  }
}

async function verifyCaller(fb, req) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) throw new HttpError(401, 'Please log in again and retry.');
  try {
    return (await fb.getAuth().verifyIdToken(idToken)).uid;
  } catch {
    throw new HttpError(401, 'Your session expired. Please log in again and retry.');
  }
}

export default async function handler(req, res) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new HttpError(500, 'Server setup problem. Please try again later.');
    }
    let fb;
    try {
      fb = await loadFirebase();
    } catch (loadError) {
      console.error('tutor-balance: firebase-admin failed to load:', loadError);
      throw new HttpError(500, 'Server setup problem. Please try again later.');
    }
    ensureFirebase(fb);

    const uid = await verifyCaller(fb, req);
    const db = fb.getFirestore();
    const studentRef = db.doc(`students/${uid}`);

    if (req.method === 'GET') {
      // Opening the tutor: one read. Grants the free allowance on first-ever open,
      // but only for accounts that have actually unlocked Exam Mode.
      let balance;
      await db.runTransaction(async (t) => {
        const snap = await t.get(studentRef);
        const data = snap.exists ? snap.data() : null;
        if (!data?.isExamModeUnlocked) {
          throw new HttpError(403, 'The AI Expert Tutor requires an activated account.');
        }
        if (typeof data.tutorTokenBalance === 'number') {
          balance = data.tutorTokenBalance;
          return;
        }
        balance = FREE_TOKENS_ON_ACTIVATION;
        t.set(studentRef, { tutorTokenBalance: balance }, { merge: true });
      });
      return res.status(200).json({ status: 'success', balance });
    }

    if (req.method === 'POST') {
      // Batched flush from the client: subtract the tokens actually used since the
      // last sync. Clamped at 0 — never goes negative — so the stored balance is
      // the tamper-resistant source of truth even if a client briefly over-sent
      // within one unsynced batch window.
      const tokensUsed = Number(req.body?.tokensUsed);
      if (!Number.isFinite(tokensUsed) || tokensUsed < 0) {
        throw new HttpError(400, 'Invalid usage amount.');
      }

      let newBalance;
      await db.runTransaction(async (t) => {
        const snap = await t.get(studentRef);
        const current = typeof snap.data()?.tutorTokenBalance === 'number'
          ? snap.data().tutorTokenBalance
          : FREE_TOKENS_ON_ACTIVATION;
        newBalance = Math.max(0, current - tokensUsed);
        t.set(studentRef, { tutorTokenBalance: newBalance }, { merge: true });
      });
      return res.status(200).json({ status: 'success', balance: newBalance });
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error('tutor-balance error:', err);
    return res.status(status).json({
      status: 'error',
      message: status === 500 ? 'Something went wrong. Please try again.' : err.message,
    });
  }
}