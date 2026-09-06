import React from 'react';

export default function Header({ studentName, examType, totalSeconds = 0 }) {
  // Format totalSeconds into HH:MM:SS or MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center shadow-sm gap-4">
      {/* Portal / Exam Title */}
      <div className="flex items-center gap-3">
        <span className="font-black text-blue-600 text-lg tracking-tight">
          {examType}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Timer Clock (Displays whenever timer is active) */}
        {totalSeconds > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm animate-pulse">
            <span>⏱️ Time Remaining:</span>
            <span className="font-mono text-sm tracking-wider">{formatTime(totalSeconds)}</span>
          </div>
        )}

        {/* Dynamic Candidate Name */}
        <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <span className="text-slate-400">Candidate:</span>
          <span className="text-blue-600">{studentName || 'Guest User'}</span>
        </div>
      </div>
    </header>
  );
}