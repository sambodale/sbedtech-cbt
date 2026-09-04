import React, { useState } from 'react';

const AVAILABLE_SUBJECTS = [
  { id: 'english', name: 'Use of English', icon: '📖' },
  { id: 'mathematics', name: 'Mathematics', icon: '📐' },
  { id: 'physics', name: 'Physics', icon: '⚡' },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪' },
  { id: 'biology', name: 'Biology', icon: '🧬' },
  { id: 'government', name: 'Government', icon: '🏛️' },
  { id: 'economics', name: 'Economics', icon: '📊' },
  { id: 'commerce', name: 'Commerce', icon: '💼' },
];

export default function HomeScreen({
  isActivated = false,
  user = null,
  onSignUp,
  onStartSession,
  onTriggerActivation,
}) {
  const [selectedMode, setSelectedMode] = useState('practice');
  const [selectedSubjects, setSelectedSubjects] = useState(['english', 'mathematics']);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Handle toggling subject cards
  const toggleSubject = (subjectId) => {
    if (!user) {
      setPendingAction('start');
      setShowSignUpModal(true);
      return;
    }

    if (selectedSubjects.includes(subjectId)) {
      if (selectedSubjects.length === 1) return;
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      if (selectedSubjects.length >= 4) {
        alert('You can select a maximum of 4 subjects.');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  // Handle mode selection click
  const handleSelectMode = (mode) => {
    if (!user) {
      setPendingAction('start');
      setShowSignUpModal(true);
      return;
    }

    if (mode === 'exam' && !isActivated) {
      alert('Exam Mode requires full app activation.');
      return;
    }

    setSelectedMode(mode);
  };

  // Main Start Practice Button
  const handleStart = () => {
    if (!user) {
      setPendingAction('start');
      setShowSignUpModal(true);
      return;
    }

    if (selectedMode === 'exam' && !isActivated) {
      alert('Exam Mode requires full app activation. Please activate below.');
      return;
    }

    onStartSession({
      mode: selectedMode,
      subjects: selectedSubjects,
    });
  };

  // Activation Button Click
  const handleActivateClick = () => {
    if (!user) {
      setPendingAction('activate');
      setShowSignUpModal(true);
      return;
    }
    onTriggerActivation(user);
  };

  // Handle Sign-Up Form Submit
  const handleSignUpSubmit = (e) => {
    e.preventDefault();

    const formattedUsername = username.trim().toLowerCase();
    if (!formattedUsername) {
      alert('Please enter a valid unique username.');
      return;
    }

    const userData = {
      fullName: fullName.trim(),
      username: formattedUsername,
      phone: phone.trim(),
      email: email.trim(),
    };

    onSignUp(userData);
    setShowSignUpModal(false);

    if (pendingAction === 'activate') {
      onTriggerActivation(userData);
    } else {
      onStartSession({
        mode: selectedMode,
        subjects: selectedSubjects,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4">
      {/* Top Banner */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">SbedTech CBT Portal</h1>

        {user ? (
          <div className="mt-2 flex items-center justify-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              Welcome, <span className="text-blue-600">@{user.username}</span>! 👋
            </h2>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('sbedtech_cbt_user');
                window.location.reload();
              }}
              className="text-xs text-red-500 hover:underline font-semibold"
            >
              (Clear Profile)
            </button>
          </div>
        ) : (
          <p className="text-slate-500 text-sm mt-1">
            First-time user? Click below or select any subject to register your profile.
          </p>
        )}

        {!isActivated && (
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium">
            <span>⚡ Trial Access: 20 Practice Questions available</span>
          </div>
        )}
      </div>

      {/* Mode & Subject Selection */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Mode</label>
          <div className="grid grid-cols-2 gap-4 items-start">
            <button
              type="button"
              onClick={() => handleSelectMode('practice')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedMode === 'practice'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Practice Mode</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">Unlocked</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Instant answer corrections & explanations.</p>
            </button>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectMode('exam')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'exam'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Exam Mode</span>
                  {!isActivated ? (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">🔒 Locked</span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">Unlocked</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Timed simulation without live corrections.</p>
              </button>

              {!isActivated && (
                <button
                  type="button"
                  onClick={handleActivateClick}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1"
                >
                  <span>⚡ Activate App (1-Year Access)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-700">
              Select Subjects ({selectedSubjects.length}/4)
            </label>
            <span className="text-xs text-slate-400">Pick up to 4 subjects</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AVAILABLE_SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white font-semibold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{subject.icon}</span>
                  <span className="text-xs">{subject.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-base"
        >
          {user ? 'Start Practice Session' : 'Sign Up to Start Practice'}
        </button>
      </div>

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900">Create Profile</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please complete registration to access practice tests and full features.
            </p>

            <form onSubmit={handleSignUpSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(false)}
                  className="w-1/2 py-2.5 text-slate-600 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md"
                >
                  Complete Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}