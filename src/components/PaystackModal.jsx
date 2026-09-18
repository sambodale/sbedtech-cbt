import React, { useState } from 'react';
import { requestExamActivationPin, verifyExamActivationPin } from '../services/authServices';

export default function PaystackModal({ isOpen, onClose, userEmail, userName, userId, onSuccess }) {
  if (!isOpen) return null;

  const [enteredPin, setEnteredPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handler for student to request an activation pin
  const handleRequestPin = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      await requestExamActivationPin(userId, userEmail, userName);
      setRequestSent(true);
    } catch (error) {
      console.error('Error requesting pin:', error);
      setErrorMessage('Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for student to submit and verify the admin-assigned pin
  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setErrorMessage('Please enter your activation pin.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      const isValid = await verifyExamActivationPin(userId, enteredPin);

      if (isValid) {
        alert('Exam Mode successfully unlocked!');
        if (onSuccess) onSuccess();
        onClose();
        window.location.reload(); // Refresh to sync active user profile state
      } else {
        setErrorMessage('Invalid or already used activation pin. Please check your code or contact the admin.');
      }
    } catch (error) {
      console.error('Error verifying pin:', error);
      setErrorMessage('An error occurred while verifying your pin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-inner">
            🔑
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">Unlock Full Exam Mode</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Full Exam Mode (4 subjects, 2 hours fixed timer) requires an admin-generated activation pin.
          </p>
        </div>

        {/* Status / Request Box */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Candidate Email:</span>
            <span className="font-medium text-slate-200 truncate max-w-[200px]">{userEmail || 'N/A'}</span>
          </div>

          {!requestSent ? (
            <div className="pt-2 border-t border-slate-700/60 space-y-2">
              <p className="text-[11px] text-slate-300">Don't have a pin yet? Send a request notification to the admin:</p>
              <button
                type="button"
                disabled={loading}
                onClick={handleRequestPin}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                {loading ? 'Sending Request...' : '📡 Request Activation Pin'}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 text-center font-medium">
              ✓ Request sent! Contact the admin to receive your pin.
            </div>
          )}
        </div>

        {/* Pin Entry Form */}
        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enter Activation Pin
            </label>
            <input
              type="text"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="e.g., SBED-EXAM-XXXX-XX"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono uppercase tracking-wider"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-xl font-medium">
              {errorMessage}
            </p>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition text-xs border border-slate-700 shadow-sm"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !enteredPin.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition text-xs shadow-lg shadow-emerald-600/20"
            >
              {loading ? 'Verifying...' : 'Unlock Exam Mode 🚀'}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-center text-slate-500">
          Secured Platform • Admin Verification Required
        </p>

      </div>
    </div>
  );
}