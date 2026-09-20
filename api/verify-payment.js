// api/verify-payment.js
// Verifies a Paystack payment on the server, then unlocks Exam Mode for the paying account.
// Needs these Vercel environment variables (never prefix them with VITE_):
//   PAYSTACK_SECRET_KEY      your Paystack secret key (sk_test_... or sk_live_...)
//   FIREBASE_SERVICE_ACCOUNT the full service account JSON from Firebase (paste the whole file)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Keep this equal to the amount in PaystackModal (in kobo: 300000 = N3,000)
const EXPECTED_AMOUNT_KOBO = 300000;

function ensureFirebase() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
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
    ensureFirebase();

    // 1. Who is calling? Verify the Firebase login token.
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) throw new HttpError(401, 'Please log in again and retry.');

    let uid;
    try {
      uid = (await getAuth().verifyIdToken(idToken)).uid;
    } catch {
      throw new HttpError(401, 'Your session expired. Please log in again and retry.');
    }

    // 2. What are they claiming?
    const { reference, deviceId } = req.body || {};
    if (typeof reference !== 'string' || !reference.trim()) {
      throw new HttpError(400, 'Missing payment reference.');
    }
    if (typeof deviceId !== 'string' || !deviceId.trim()) {
      throw new HttpError(400, 'This browser blocks storage, so the device cannot be registered.');
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
    if (paystack.data.currency !== 'NGN' || paystack.data.amount < EXPECTED_AMOUNT_KOBO) {
      throw new HttpError(402, 'The payment amount does not match the exam mode price.');
    }

    // 4. The payment must have been made for THIS account.
    const fields = paystack.data.metadata?.custom_fields || [];
    const paidForUid = fields.find((f) => f.variable_name === 'user_id')?.value;
    if (paidForUid !== uid) {
      throw new HttpError(403, 'This payment was made for a different account.');
    }

    // 5. Unlock, in one transaction: one payment can only be used once, one device only one account.
    const db = getFirestore();
    const studentRef = db.doc(`students/${uid}`);
    const deviceRef = db.doc(`devices/${deviceId}`);
    const paymentRef = db.doc(`payments/${reference.trim()}`);

    await db.runTransaction(async (t) => {
      const [paymentDoc, deviceDoc] = await Promise.all([t.get(paymentRef), t.get(deviceRef)]);

      if (paymentDoc.exists) {
        // Retrying a payment that already unlocked this same account is fine
        if (paymentDoc.data().uid === uid) return;
        throw new HttpError(409, 'This payment reference has already been used.');
      }
      if (deviceDoc.exists && deviceDoc.data().uid !== uid) {
        throw new HttpError(409, 'This device is already registered to another account.');
      }

      t.set(paymentRef, {
        uid,
        amount: paystack.data.amount,
        currency: paystack.data.currency,
        verifiedAt: FieldValue.serverTimestamp(),
      });
      if (!deviceDoc.exists) {
        t.set(deviceRef, { uid, boundAt: FieldValue.serverTimestamp() });
      }
      t.set(
        studentRef,
        {
          isExamModeUnlocked: true,
          paymentStatus: 'paid_online',
          paymentReference: reference.trim(),
          boundDeviceId: deviceId,
          activatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return res.status(200).json({ status: 'success' });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error('verify-payment error:', err);
    return res.status(status).json({
      status: 'error',
      message: status === 500 ? 'Could not verify the payment. Please try again.' : err.message,
    });
  }
}