import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile } from '../services/authServices';

// Separate sign-in form for administrators only.
// Being an admin is decided by role === 'admin' on the student's Firestore document,
// which is the same field the Firestore security rules check.
export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const friendlyError = (err) => {
    const code = err?.code || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-email'
    ) {
      return 'Wrong email or password.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network problem. Check your connection and try again.';
    }
    return 'Sign in failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getUserProfile(credential.user.uid);

      if (profile?.role !== 'admin') {
        // Not an administrator: end this session straight away
        await signOut(auth);
        setError('This account does not have admin access.');
        return;
      }

      setPassword('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Admin sign in failed:', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 space-y-6 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-5 text-slate-500 hover:text-slate-300 font-bold text-sm disabled:opacity-50"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
            🛡️
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">Admin Sign In</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            For administrators only. Candidates should use the normal sign in from the home screen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-xl font-medium">
              {error}
            </p>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold py-3 rounded-xl transition text-xs border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition text-xs shadow-lg shadow-blue-600/20"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}