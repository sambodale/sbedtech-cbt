import React, { useState } from 'react';
import { verifyAndClaimExamPin } from '../services/examServices';

export default function AdminPinModal({ isOpen, onClose, onPinVerified, currentUser }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter a valid activation pin.');
      return;
    }

    if (!currentUser?.uid) {
      setError('User session not found. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calls your secure backend to check the database assignment, payment status, and single-use lock
      await verifyAndClaimExamPin(currentUser.uid, pin);
      
      // If verification succeeds, notify parent component
      onPinVerified(pin.trim());
      onClose();
    } catch (err) {
      console.error('Pin verification failed:', err);
      setError(err.message || 'Invalid activation pin. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold text-sm"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
            🔑
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Enter Activation Pin
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Enter the secure admin activation pin provided after payment confirmation to unlock full exam mode.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Activation Pin
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. SBED-EXAM-XXXX-XX"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Verifying with Database...' : 'Verify & Unlock Exam Mode'}
          </button>
        </form>
      </div>
    </div>
  );
}