import React from 'react';
import { useAuth } from '../context/AuthContext';

// Guard for logged-in users only
export function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-gray-600">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm mt-1">Please log in to view this page.</p>
      </div>
    );
  }

  return children;
}

// Guard specifically for Activated Accounts (Study Notes / AI Tutor)
export function ActivatedRoute({ children, onOpenActivationModal }) {
  const { currentUser, isActivated } = useAuth();

  if (!currentUser) {
    return <div className="p-8 text-center">Please log in to continue.</div>;
  }

  if (!isActivated) {
    return (
      <div className="p-8 text-center max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 my-10">
        <div className="text-4xl mb-2">🔒</div>
        <h2 className="text-xl font-bold text-gray-800">Account Not Activated</h2>
        <p className="text-sm text-gray-500 mt-2">
          Your account must be activated to access Study Materials and AI Expert Tutoring.
        </p>
        <button 
          onClick={onOpenActivationModal}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
        >
          Activate Account
        </button>
      </div>
    );
  }

  return children;
}