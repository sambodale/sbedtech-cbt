import React, { useRef, useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { auth } from '../firebase/config';
import { getDeviceId } from '../services/deviceService';

export default function PaystackModal({
  isOpen,
  onClose,
  userEmail,
  userName,
  userId,
  onSuccess,
  amount = 300000 // Default to N3,000 in kobo. Keep equal to EXPECTED_AMOUNT_KOBO in api/verify-payment.js
}) {
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paidReference, setPaidReference] = useState('');

  // One reference per opening of the modal
  const referenceRef = useRef(`SBED-${Date.now()}`);

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const isLoggedIn = Boolean(userId) && userId !== 'guest_user';

  const config = {
    reference: referenceRef.current,
    email: userEmail || 'candidate@sbedtech.com',
    amount: amount,
    publicKey: publicKey,
    metadata: {
      custom_fields: [
        {
          display_name: 'Candidate Name',
          variable_name: 'candidate_name',
          value: userName || 'N/A'
        },
        {
          display_name: 'User ID',
          variable_name: 'user_id',
          value: userId || 'guest_user'
        }
      ]
    }
  };

  // The hook must run on every render, so it sits above the early return
  const initializePayment = usePaystackPayment(config);

  if (!isOpen) return null;

  // Ask our server to confirm the payment with Paystack and unlock Exam Mode
  const verifyPayment = async (reference) => {
    setVerifying(true);
    setErrorMessage('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please log in again, then retry verification.');

      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reference, deviceId: getDeviceId() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Payment verification failed.');

      alert('Payment verified. Exam Mode is now unlocked!');
      if (onSuccess) onSuccess(reference);
      onClose();
      window.location.reload(); // Refresh so the whole app sees the new activation
    } catch (error) {
      console.error('Payment verification failed:', error);
      setErrorMessage(error.message || 'Payment verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePaystackSuccessAction = (reference) => {
    const ref = reference?.reference || reference?.trxref || referenceRef.current;
    setPaidReference(ref);
    verifyPayment(ref);
  };

  const handlePaystackCloseAction = () => {
    console.log('Payment modal closed by user.');
  };

  const handlePayNow = () => {
    if (!isLoggedIn) {
      setErrorMessage('Please log in to your account before paying.');
      return;
    }
    if (!publicKey) {
      setErrorMessage('Online payment is not configured yet. Please contact the admin.');
      return;
    }
    setErrorMessage('');
    initializePayment({
      onSuccess: handlePaystackSuccessAction,
      onClose: handlePaystackCloseAction
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center text-white space-y-5">

        {/* Header Icon */}
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 text-2xl border border-emerald-500/20 shadow-inner">
          💳
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-white">Unlock Full Exam Mode</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Make a secure online payment of <span className="font-semibold text-emerald-400">₦{amount / 100}</span> via Paystack for instant full access.
          </p>
        </div>

        {/* User Details Preview Box */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/60 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Candidate Name:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">{userName || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-slate-700/40">
            <span className="text-slate-400">Billing Email:</span>
            <span className="font-medium text-slate-200 truncate max-w-[180px]">{userEmail || 'N/A'}</span>
          </div>
        </div>

        {verifying && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl font-medium">
            Payment received. Verifying with Paystack, please do not close this window...
          </p>
        )}

        {errorMessage && (
          <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-xl font-medium text-left space-y-1">
            <p>{errorMessage}</p>
            {paidReference && (
              <p className="text-slate-300">
                Your payment reference is <span className="font-mono font-bold">{paidReference}</span>. Keep it, and tap Retry Verification. If it keeps failing, send the reference to the admin.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl font-bold transition text-xs border border-slate-700 shadow-sm"
          >
            Cancel
          </button>

          {paidReference ? (
            <button
              type="button"
              disabled={verifying}
              onClick={() => verifyPayment(paidReference)}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-emerald-900/20 text-xs flex items-center justify-center gap-2"
            >
              {verifying ? 'Verifying...' : 'Retry Verification'}
            </button>
          ) : (
            <button
              type="button"
              disabled={verifying}
              onClick={handlePayNow}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-emerald-900/20 text-xs flex items-center justify-center gap-2"
            >
              Pay Now 🚀
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
          <span>🔒 Secured by Paystack</span>
        </div>

      </div>
    </div>
  );
}