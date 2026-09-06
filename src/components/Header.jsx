import React from 'react';

export default function Header({
  examType = 'JAMB CBT PORTAL',
  studentName = 'Guest User',
  totalSeconds
}) {
  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/50 px-3 py-1 rounded-full">
          {examType}
        </span>
        <span className="text-sm font-medium text-slate-300">
          Candidate: <strong className="text-white">{studentName}</strong>
        </span>
      </div>

      {totalSeconds !== null && totalSeconds !== undefined && (
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Time Left:
          </span>
          <span className="font-mono text-base font-bold text-amber-400">
            {formatTime(totalSeconds)}
          </span>
        </div>
      )}
    </header>
  );
}