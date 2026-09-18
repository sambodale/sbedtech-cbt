import React from 'react';
import { useAuth } from '../context/AuthContext';

// Guard for logged-in users only
export function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-600 font-sans">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm mt-1">Please log in to view this page.</p>
      </div>
    );
  }

  return children;
}

// Guard specifically for Activated Accounts (Study Notes / AI Tutor / Exam Mode)
export function ActivatedRoute({ children, onOpenActivationModal }) {
  const { currentUser, isActivated } = useAuth();

  if (!currentUser) {
    return (
      <div className="p-8 text-center font-sans text-slate-600">
        Please log in to continue.
      </div>
    );
  }

  if (!isActivated) {
    return (
      <div className="p-8 text-center max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 my-10 font-sans">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl mb-3">
          🔒
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Account Not Activated</h2>
        <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
          Your account must be activated to access AI Expert Tutoring, Advanced Practice Modes, and exclusive study materials.
        </p>
        <button 
          onClick={onOpenActivationModal}
          className="mt-6 w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-extrabold rounded-2xl shadow-md transition"
        >
          Activate Account Now
        </button>
      </div>
    );
  }

  return children;
}