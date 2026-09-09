import React, { useState } from 'react';
import DashboardView from './DashboardView';

const SUBJECT_LIST = [
  { name: 'Use of English', icon: '📖' },
  { name: 'Mathematics', icon: '📐' },
  { name: 'Physics', icon: '⚡' },
  { name: 'Chemistry', icon: '🧪' },
  { name: 'Biology', icon: '🧬' },
  { name: 'Economics', icon: '📚' },
  { name: 'Government', icon: '🏛️' },
  { name: 'Christian Religious Studies (CRS)', icon: '✝️' },
  { name: 'Geography', icon: '🗺️' },
  { name: 'Financial Accounting', icon: '📊' },
  { name: 'Commerce', icon: '🏢' },
  { name: 'Literature in English', icon: '🎭' },
  { name: 'Islamic Religious Studies (IRS)', icon: '🌙' },
  { name: 'Agricultural Science', icon: '🌱' },
  { name: 'Yoruba', icon: '🗣️' },
  { name: 'Hausa', icon: '🗣️' },
  { name: 'Igbo', icon: '🗣️' },
];

export default function HomeScreen({
  userProfile,
  history = [],
  isActivated = false,
  onStartExam,
  onStartWeaknessDrill,
  onOpenActivation,
  onOpenHistory,
}) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSetupPanel, setShowSetupPanel] = useState(false);

  // CBT Setup form states
  const [examYearMode, setExamYearMode] = useState('Random Questions');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [totalQuestions, setTotalQuestions] = useState('40');

  const handleSubjectChange = (e) => {
    const subjectName = e.target.value;
    setSelectedSubject(subjectName);
    if (subjectName) {
      setShowSetupPanel(true);
    }
  };

  const handleLaunchCbt = (e) => {
    e.preventDefault();
    if (!selectedSubject) return;

    const hoursInMins = parseInt(durationHours || '0', 10) * 60;
    const mins = parseInt(durationMinutes || '0', 10);
    const totalDuration = hoursInMins + mins || 90;

    const cleanYear = examYearMode.includes('Random')
      ? 'Random'
      : examYearMode.replace(/\D/g, '');

    onStartExam({
      subject: selectedSubject,
      mode: 'practice',
      year: cleanYear || 'Random',
      durationInMinutes: totalDuration,
      limit: parseInt(totalQuestions, 10) || 40,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 font-sans">
      
      {/* 1. TOP HERO SECTION (2-COLUMN GRID ON DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* SBEDTECH CBT PORTAL HEADER CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5 relative z-20 h-full flex flex-col justify-center">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
              SbedTech CBT Portal
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
              Welcome back, <span className="font-bold text-slate-800">{userProfile?.fullName || 'Candidate'}</span>! Select a subject to configure your setup.
            </p>
          </div>

          {/* SUBJECT DROPDOWN SELECTOR */}
          <div className="relative max-w-md mx-auto w-full">
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition cursor-pointer text-center appearance-none focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              <option value="" disabled className="bg-slate-900 text-white">
                👇 Select Subject to Begin Practice
              </option>
              {SUBJECT_LIST.map((sub) => (
                <option 
                  key={sub.name} 
                  value={sub.name} 
                  className="bg-slate-900 text-white font-semibold"
                >
                  {sub.icon} {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* ATTEMPT HISTORY BUTTON */}
          <div>
            <button
              onClick={onOpenHistory}
              className="px-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl shadow-sm transition inline-flex items-center gap-2"
            >
              📜 Attempt History
            </button>
          </div>
        </div>

        {/* CBT SETUP FORM OR ACTION REQUIRED BANNER */}
        {showSetupPanel && selectedSubject ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">
                CBT Setup: <span className="text-blue-600">{selectedSubject}</span>
              </h3>
              <button
                onClick={() => setShowSetupPanel(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleLaunchCbt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600">
                    Exam Year / Mode
                  </label>
                  <select
                    value={examYearMode}
                    onChange={(e) => setExamYearMode(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Random Questions">🎲 Random Questions</option>
                    <option value="2023">2023 Past Questions</option>
                    <option value="2022">2022 Past Questions</option>
                    <option value="2021">2021 Past Questions</option>
                    <option value="2020">2020 Past Questions</option>
                    <option value="2019">2019 Past Questions</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition"
              >
                Start {selectedSubject} ({examYearMode.includes('Random') ? 'Random' : examYearMode}) - Practice Mode
              </button>
            </form>
          </div>
        ) : (
          !isActivated && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Action Required: Activate Exam Mode
                </h4>
                <p className="text-xs text-amber-800 font-medium">
                  Unlock full platform capabilities and expert exam tools:
                </p>
              </div>

              <ul className="space-y-2 text-xs text-amber-950 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Full timed mock examinations with official JAMB grading algorithms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Access to Comprehensive study materials
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Live AI Tutor / Fully Trained Expert System
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> One-on-One online Tutorial
                </li>
              </ul>

              <button
                type="button"
                onClick={onOpenActivation}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-2xl shadow transition"
              >
                Unlock Exam Mode Now
              </button>
            </div>
          )
        )}
      </div>

      {/* 2. EMBEDDED INLINE DASHBOARD */}
      <DashboardView
        userProfile={userProfile}
        history={history}
        onStartWeaknessDrill={onStartWeaknessDrill}
      />
    </div>
  );
}