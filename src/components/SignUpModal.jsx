import React, { useState } from 'react';
import { registerCandidate, loginCandidate } from '../services/authServices';

export default function SignUpModal({ isOpen, onClose, onSuccess, onSave }) {
  const [isLogin, setIsLogin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginCandidate(email, password);
      } else {
        // Pass fullName and role inside extraData
        await registerCandidate(email, password, { fullName, role: 'student' });
      }
      
      const profileData = { email, fullName };

      // Reset form state
      setFullName('');
      setEmail('');
      setPassword('');

      if (onSave) {
        onSave(profileData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      const friendlyMsg = err.message
        .replace('Firebase: ', '')
        .replace('Error (auth/', '')
        .replace(').', '');
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-800">
            {isLogin ? 'Welcome Back' : 'Create Candidate Account'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isLogin 
              ? 'Sign in to access your saved CBT practice sessions.' 
              : 'Sign up to practice exam questions and store test history.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Render Full Name field only during registration */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Samuel John"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              required 
              placeholder="candidate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Password
            </label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm hover:shadow active:scale-[0.99]"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {isLogin ? "Don't have an account?" : "Already registered?"}
          </span>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            className="text-emerald-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}