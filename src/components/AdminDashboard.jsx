import React, { useState } from 'react';

export default function AdminDashboard({ history = [], stats = {}, onReturnHome }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);

  const {
    totalMockTests = history.length,
    totalQuestionsSolved = 0,
    overallAccuracy = 0,
    predictedJambScore = 180,
    subjectBreakdown = {},
  } = stats;

  // Filtered History Records
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject =
      selectedSubjectFilter === 'All' || item.subject === selectedSubjectFilter;

    return matchesSearch && matchesSubject;
  });

  const subjectsList = ['All', ...Object.keys(subjectBreakdown)];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-600 text-[10px] font-black uppercase rounded-full tracking-wider">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Live Monitoring & Analytics
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Exam History & Student Analytics
          </h1>
        </div>

        <button
          onClick={onReturnHome}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition border border-slate-700 self-start sm:self-auto"
        >
          ← Back to Student View
        </button>
      </div>

      {/* OVERALL SYSTEM METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total System Mock Tests
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
            {totalMockTests}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Questions Solved
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
            {totalQuestionsSolved}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Average System Accuracy
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {overallAccuracy}%
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Predicted Score
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-2xl sm:text-3xl font-black text-purple-600">
              {predictedJambScore}
            </h3>
            <span className="text-xs text-slate-400 font-bold">/ 400</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <input
          type="text"
          placeholder="🔍 Search exam history by subject or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0">Subject Filter:</label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* EXAM LOGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-sm">
            Backend Exam Logs ({filteredHistory.length})
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Sorted by Most Recent
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs font-semibold">
            No student exam attempts found matching the current search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Date / Time</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Mode</th>
                  <th className="py-3.5 px-5">Score</th>
                  <th className="py-3.5 px-5">Accuracy</th>
                  <th className="py-3.5 px-5">Time Spent</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredHistory.map((item) => {
                  const accuracy =
                    item.totalQuestions > 0
                      ? Math.round((item.score / item.totalQuestions) * 100)
                      : 0;
                  const minutes = Math.floor((item.timeSpentSeconds || 0) / 60);
                  const seconds = (item.timeSpentSeconds || 0) % 60;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 text-slate-500 font-medium">
                        {item.date || 'Recent'}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        {item.subject}
                      </td>
                      <td className="py-3.5 px-5 uppercase text-[10px] font-extrabold text-slate-500">
                        {item.mode || 'practice'}
                      </td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900">
                        {item.score} / {item.totalQuestions}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            accuracy >= 70
                              ? 'bg-emerald-100 text-emerald-700'
                              : accuracy >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {minutes}m {seconds}s
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedLog(item)}
                          className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-[11px] rounded-xl transition"
                        >
                          Inspect Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Exam Session Breakdown: <span className="text-purple-600">{selectedLog.subject}</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold">Total Score</span>
                <span className="text-slate-800 font-extrabold text-base">
                  {selectedLog.score} / {selectedLog.totalQuestions}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold">Date Taken</span>
                <span className="text-slate-800 font-extrabold text-xs">
                  {selectedLog.date}
                </span>
              </div>
            </div>

            {selectedLog.itemizedResults && selectedLog.itemizedResults.length > 0 ? (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold text-slate-700">Question Itemization</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedLog.itemizedResults.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        q.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                      }`}
                    >
                      <p className="font-bold text-slate-800">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">
                          Selected: <strong>{q.selectedOption?.toUpperCase() || 'None'}</strong>
                        </span>
                        <span className="text-slate-700 font-bold">
                          Correct: {q.correctOption?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No itemized question responses logged for this older attempt.
              </p>
            )}

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}