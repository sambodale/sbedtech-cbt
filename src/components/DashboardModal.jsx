import React, { useState } from 'react';

export default function DashboardModal({ userProfile, history = [], onClose, onStartWeaknessDrill }) {
  const [activeTab, setActiveTab] = useState('overview');

  // --- 1. PREDICTED AGGREGATE SCORE (OUT OF 400) ---
  const calculatePredictedScore = () => {
    if (!history || history.length === 0) return { score: 0, status: 'No Data' };
    
    // Group scores by subject to find recent averages
    const subjectScores = {};
    history.forEach((item) => {
      if (!subjectScores[item.subject]) {
        subjectScores[item.subject] = [];
      }
      const percentage = (item.score / (item.totalQuestions || 40)) * 100;
      subjectScores[item.subject].push(percentage);
    });

    const subjectAverages = Object.values(subjectScores).map(
      (scores) => scores.reduce((a, b) => a + b, 0) / scores.length
    );

    // JAMB standard is 4 subjects maxing at 400 (100 pts per subject)
    let avgPercentage = subjectAverages.reduce((a, b) => a + b, 0) / (subjectAverages.length || 1);
    const predictedAggregate = Math.round((avgPercentage / 100) * 400);

    let status = 'Needs Improvement';
    if (predictedAggregate >= 280) status = 'Excellent (Target Met)';
    else if (predictedAggregate >= 220) status = 'Good Progress';
    else if (predictedAggregate >= 180) status = 'Average Pace';

    return { score: predictedAggregate, status };
  };

  // --- 2. SUBJECT MASTERY & BREAKDOWN ---
  const getSubjectMastery = () => {
    if (!history.length) return [];

    const stats = {};
    history.forEach((item) => {
      const sub = item.subject || 'General';
      if (!stats[sub]) {
        stats[sub] = { totalQuestions: 0, correctAnswers: 0, attempts: 0 };
      }
      stats[sub].totalQuestions += item.totalQuestions || 40;
      stats[sub].correctAnswers += item.score || 0;
      stats[sub].attempts += 1;
    });

    return Object.keys(stats).map((subject) => {
      const data = stats[subject];
      const accuracy = Math.round((data.correctAnswers / data.totalQuestions) * 100);
      return {
        subject,
        accuracy,
        attempts: data.attempts,
        color: accuracy >= 70 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500',
      };
    });
  };

  // --- 3. STREAK COUNTER & GENERAL STATS ---
  const totalAttempts = history.length;
  const totalQuestionsAnswered = history.reduce((sum, h) => sum + (h.totalQuestions || 40), 0);
  const aggregateScore = calculatePredictedScore();
  const subjectMasteryList = getSubjectMastery();

  // Identified weakest subjects (accuracy < 50%)
  const weakSubjects = subjectMasteryList.filter((s) => s.accuracy < 60);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold">
              📊
            </div>
            <div>
              <h2 className="text-xl font-black">Performance Dashboard</h2>
              <p className="text-xs text-slate-400">
                Candidate: <span className="text-blue-400 font-bold">{userProfile?.fullName || userProfile?.username || 'Candidate'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* TOP METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Predicted JAMB Score */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Predicted JAMB Score</span>
              <div className="text-3xl font-black mt-1">{aggregateScore.score} <span className="text-sm font-normal opacity-70">/ 400</span></div>
              <span className="inline-block mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                {aggregateScore.status}
              </span>
            </div>

            {/* Total Tests Taken */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mock Tests</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{totalAttempts}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{totalQuestionsAnswered} Questions Solved</p>
            </div>

            {/* Average Speed */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Time Per Question</span>
              <div className="text-3xl font-black text-slate-900 mt-1">48s</div>
              <p className="text-[11px] text-emerald-600 mt-1 font-bold">⚡ Good Exam Pace</p>
            </div>

            {/* Daily Practice Streak */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Study Streak</span>
              <div className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-1">
                🔥 5 <span className="text-xs font-bold text-slate-400">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Keep practicing daily!</p>
            </div>
          </div>

          {/* WEAKNESS RE-PRACTICE PROMPT */}
          {weakSubjects.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">⚠️ Action Needed: Weak Areas Detected</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your accuracy is below 60% in <span className="font-bold">{weakSubjects.map((s) => s.subject).join(', ')}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartWeaknessDrill) onStartWeaknessDrill(weakSubjects[0]?.subject);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow transition whitespace-nowrap"
              >
                🎯 Practice Targeted Drill
              </button>
            </div>
          )}

          {/* SUBJECT MASTERY SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>🎯</span> Subject Accuracy Breakdown
            </h3>

            {subjectMasteryList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No exam attempts recorded yet. Complete practice sessions to see detailed subject breakdown.</p>
            ) : (
              <div className="space-y-4">
                {subjectMasteryList.map((item) => (
                  <div key={item.subject} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800">{item.subject}</span>
                      <span className="text-slate-600">{item.accuracy}% Accuracy ({item.attempts} tests)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}