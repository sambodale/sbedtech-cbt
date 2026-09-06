import React, { useState } from 'react';

export default function HomeScreen({ userProfile, isActivated, onStartExam, onOpenSignUp, onOpenActivation }) {
  const [selectedSubject, setSelectedSubject] = useState('Use of English');
  const [selectedYear, setSelectedYear] = useState('Random');
  const [mode, setMode] = useState('practice');
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(40);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Subject List
  const subjects = [
    { name: 'Use of English', icon: '📖' },
    { name: 'Mathematics', icon: '📐' },
    { name: 'Physics', icon: '⚡' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Economics', icon: '📚' },
    { name: 'Geography', icon: '🗺️' },
    { name: 'Agricultural Science', icon: '🌱' },
    { name: 'Financial Accounting', icon: '📊' },
    { name: 'Commerce', icon: '🏢' },
    { name: 'Literature in English', icon: '🎭' },
    { name: 'Yoruba', icon: '🗣️' },
    { name: 'Government', icon: '🏛️' },
    { name: 'CRS', icon: '✝️' },
    { name: 'IRS', icon: '☪️' },
  ];

  // Generates array of years from 2026 down to 2005
  const years = ['Random', ...Array.from({ length: 2026 - 2005 + 1 }, (_, i) => (2026 - i).toString())];

  const handleSubjectSelect = (subjectName) => {
    if (!userProfile) {
      onOpenSignUp();
      return;
    }
    setSelectedSubject(subjectName);
    setIsSettingUp(true);
  };

  const handleStartExamSubmit = () => {
    if (!userProfile) {
      onOpenSignUp();
      return;
    }

    const durationInMinutes = Number(hours) * 60 + Number(minutes);

    onStartExam({
      subject: selectedSubject.toLowerCase(),
      year: selectedYear,
      mode,
      limit: Number(totalQuestions),
      durationInMinutes
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-3">
        <h1 className="text-3xl font-black text-blue-600">SbedTech CBT Portal</h1>
        <p className="text-slate-500 text-sm font-medium">
          {!userProfile
            ? "First-time user? Click below or select any subject to register your profile."
            : `Welcome back, ${userProfile.fullName || userProfile.username || 'Candidate'}! Select a subject to configure your setup.`}
        </p>
      </div>

      {!isSettingUp ? (
        /* STEP 1: Main Subject Grid View */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Select Subject to Begin</h2>
            <span className="text-xs text-slate-400">Click any subject to open CBT Setup</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {subjects.map((sub) => (
              <button
                key={sub.name}
                type="button"
                onClick={() => handleSubjectSelect(sub.name)}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50/30 text-slate-700 transition flex flex-col items-center justify-center gap-2 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{sub.icon}</span>
                <span className="text-xs font-bold text-center">{sub.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* STEP 2: CBT Setup View */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">CBT Setup</span>
              <h2 className="text-xl font-bold text-slate-900">{selectedSubject}</h2>
            </div>

            {/* Subject Selector Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Select Mode:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Practice Mode Card */}
              <div
                onClick={() => setMode('practice')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                  mode === 'practice'
                    ? 'border-blue-500 bg-blue-50/30 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900 text-sm">Practice Mode</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    Unlocked
                  </span>
                </div>
                <p className="text-xs text-slate-500">Instant corrections, answer key & detailed explanations.</p>
              </div>

              {/* Exam Mode Card with Feature Breakdown */}
              <div
                onClick={() => {
                  if (isActivated) {
                    setMode('exam');
                  } else {
                    onOpenActivation();
                  }
                }}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                  mode === 'exam'
                    ? 'border-blue-500 bg-blue-50/30 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-900 text-sm">Exam Mode</span>
                    {isActivated ? (
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-md bg-amber-500 text-white shadow-md ring-2 ring-amber-300 flex items-center gap-1 animate-bounce">
                        🔒 Activation Required
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">✓</span> Standard Exam Simulation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">✓</span> Access to Live AI Tutor
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold:">✓</span> Downloadable Study Materials
                    </li>
                  </ul>
                </div>

                {!isActivated && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenActivation();
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 animate-pulse"
                  >
                    ⚡ Activate Exam Mode Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Exam Configuration: Year, Duration, Total Questions */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Year / Mode</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y === 'Random' ? '🎲 Random Questions' : `${y} Past Questions`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Hours)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Questions</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Launch Exam Button */}
          <button
            type="button"
            onClick={handleStartExamSubmit}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-md active:scale-[0.99]"
          >
            Start {selectedSubject} ({selectedYear === 'Random' ? 'Random' : selectedYear}) - {mode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
          </button>
        </div>
      )}
    </div>
  );
}