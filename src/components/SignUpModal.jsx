// src/components/SignUpModal.jsx
import React, { useState } from 'react';

export default function SignUpModal({ onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone) return alert('Please fill in all fields');
    
    // Pass completed profile data back
    onSuccess({ fullName, email, phone });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-white shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-center">Create Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Full Name</label>
            <input 
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Phone Number</label>
            <input 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
              placeholder="+234..."
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Save & Continue to Take Exam
          </button>
        </form>
      </div>
    </div>
  );
}