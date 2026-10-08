// api/verify-tutor-topup.js
// Verifies a Paystack payment for an AI Tutor word top-up pack, then credits the
// words to the student's Firestore balance. Mirrors the pattern already used in
// api/verify-payment.js for the Exam Mode unlock.
//
// Needs PAYSTACK_SECRET_KEY and FIREBASE_SERVICE_ACCOUNT (already used elsewhere).

// The only two packs a client is allowed to buy — amount and word credit are
// enforced here from this list, never trusted from the request body, so a
// tampered client request can't buy words for less than the real price.
const TUTOR_WORD_TIERS = {
  basic: { amountKobo: 50000, tokens: 50000, label: 'Basic (50,000 tokens)' },      // N500
  premium: { amountKobo: 100000, tokens: 150000, label: 'Premium (150,000 tokens)' }, // N1,000
};

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
      FieldValue: firestoreModule.FieldValue,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  try {
    if (!process.env.PAYSTACK_SECRET_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new HttpError(500, 'Server is not configured for payment verification.');
    }

    let fb;
    try {
      fb = await loadFirebase();
    } catch (loadError) {
      console.error('verify-tutor-topup: firebase-admin failed to load:', loadError);
      throw new HttpError(500, 'Server setup problem. Please try again later.');
    }
    ensureFirebase(fb);

    // 1. Who is calling?
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) throw new HttpError(401, 'Please log in again and retry.');

    let uid;
    try {
      uid = (await fb.getAuth().verifyIdToken(idToken)).uid;
    } catch {
      throw new HttpError(401, 'Your session expired. Please log in again and retry.');
    }

    // 2. What are they claiming?
    const { reference, tier } = req.body || {};
    if (typeof reference !== 'string' || !reference.trim()) {
      throw new HttpError(400, 'Missing payment reference.');
    }
    const tierInfo = TUTOR_WORD_TIERS[tier];
    if (!tierInfo) {
      throw new HttpError(400, 'Unknown top-up pack.');
    }

    // 3. Ask Paystack whether the payment really happened.
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const paystack = await paystackRes.json().catch(() => ({}));

    if (!paystackRes.ok || !paystack.status || paystack.data?.status !== 'success') {
      throw new HttpError(402, 'Paystack has not confirmed this payment yet.');
    }
    if (paystack.data.currency !== 'NGN' || paystack.data.amount < tierInfo.amountKobo) {
      throw new HttpError(402, 'The payment amount does not match the selected pack.');
    }

    const fields = paystack.data.metadata?.custom_fields || [];
    const paidForUid = fields.find((f) => f.variable_name === 'user_id')?.value;
    if (paidForUid !== uid) {
      throw new HttpError(403, 'This payment was made for a different account.');
    }

    // 4. Credit the words, once per payment reference.
    const db = fb.getFirestore();
    const studentRef = db.doc(`students/${uid}`);
    const paymentRef = db.doc(`tutor_payments/${reference.trim()}`);

    let newBalance;
    await db.runTransaction(async (t) => {
      const [paymentDoc, studentDoc] = await Promise.all([t.get(paymentRef), t.get(studentRef)]);

      if (paymentDoc.exists) {
        // Retrying a payment that already credited this account is fine — just report the current balance
        newBalance = studentDoc.data()?.tutorTokenBalance;
        return;
      }

      const currentBalance = typeof studentDoc.data()?.tutorTokenBalance === 'number'
        ? studentDoc.data().tutorTokenBalance
        : 0;
      newBalance = currentBalance + tierInfo.tokens;

      t.set(paymentRef, {
        uid,
        tier,
        tokens: tierInfo.tokens,
        amount: paystack.data.amount,
        verifiedAt: fb.FieldValue.serverTimestamp(),
      });
      t.set(studentRef, { tutorTokenBalance: newBalance }, { merge: true });
    });

    return res.status(200).json({ status: 'success', balance: newBalance });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error('verify-tutor-topup error:', err);
    return res.status(status).json({
      status: 'error',
      message: status === 500 ? 'Could not verify the payment. Please try again.' : err.message,
    });
  }
}