import React, { useState, useEffect } from 'react';
import { fetchAggregateLeaderboard } from '../services/examServices';

export default function DashboardView({ userProfile, history = [], onStartWeaknessDrill }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);

  // Fetch aggregate leaderboard data when expanded
  useEffect(() => {
    if (isLeaderboardOpen && leaders.length === 0) {
      async function loadLeaders() {
        setLoadingLeaders(true);
        const data = await fetchAggregateLeaderboard();
        setLeaders(data);
        setLoadingLeaders(false);
      }
      loadLeaders();
    }
  }, [isLeaderboardOpen]);

  // --- 1. PREDICTED AGGREGATE SCORE (OUT OF 400) ---
  const calculatePredictedScore = () => {
    if (!history || history.length === 0) return { score: 0, status: 'No Data' };
    
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
    if (!history || history.length === 0) return [];

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

  // --- 3. METRICS COMPUTATION ---
  const totalAttempts = history.length;
  const totalQuestionsAnswered = history.reduce((sum, h) => sum + (h.totalQuestions || 40), 0);
  const aggregateScore = calculatePredictedScore();
  const subjectMasteryList = getSubjectMastery();

  const weakSubjects = subjectMasteryList.filter((s) => s.accuracy < 60);

  // --- 4. EXPORT / PRINT HANDLER ---
  const handleExportPdf = () => {
    setIsCollapsed(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 transition-all duration-300 print:border-none print:shadow-none">
      {/* Title Header with Export & Collapse Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white print:hidden">
            📊
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Performance Dashboard</h2>
            <p className="text-xs text-slate-500">
              Candidate: <span className="text-blue-600 font-bold">{userProfile?.fullName || userProfile?.username || 'Candidate'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
            title="Download or Print Performance Report"
          >
            <span>📥 Export PDF Report</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition shadow-sm"
            title={isCollapsed ? "Expand Dashboard" : "Collapse Dashboard"}
          >
            <span>{isCollapsed ? 'Expand View' : 'Collapse View'}</span>
            <span className={`transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE BODY CONTENT */}
      {!isCollapsed && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* TOP METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Predicted JAMB Score</span>
              <div className="text-3xl font-black mt-1">
                {aggregateScore.score} <span className="text-sm font-normal opacity-70">/ 400</span>
              </div>
              <span className="inline-block mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                {aggregateScore.status}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mock Tests</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{totalAttempts}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{totalQuestionsAnswered} Questions Solved</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Time Per Question</span>
              <div className="text-3xl font-black text-slate-900 mt-1">48s</div>
              <p className="text-[11px] text-emerald-600 mt-1 font-bold">⚡ Good Exam Pace</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Study Streak</span>
              <div className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-1">
                🔥 5 <span className="text-xs font-bold text-slate-400">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Keep practicing daily!</p>
            </div>
          </div>

          {/* WEAKNESS DRILL ACTION */}
          {weakSubjects.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">⚠️ Action Needed: Weak Areas Detected</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your accuracy is below 60% in <span className="font-bold">{weakSubjects.map((s) => s.subject).join(', ')}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onStartWeaknessDrill && onStartWeaknessDrill(weakSubjects[0]?.subject)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow transition whitespace-nowrap"
              >
                🎯 Practice Targeted Drill
              </button>
            </div>
          )}

          {/* SUBJECT ACCURACY BREAKDOWN */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>🎯</span> Subject Accuracy Breakdown
            </h3>

            {subjectMasteryList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No exam attempts recorded yet. Select a subject below to begin your first test!
              </p>
            ) : (
              <div className="space-y-4">
                {subjectMasteryList.map((item) => (
                  <div key={item.subject} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800">{item.subject}</span>
                      <span className="text-slate-600">{item.accuracy}% Accuracy ({item.attempts} tests)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
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

          {/* UTME AGGREGATE LEADERBOARD (COLLAPSIBLE - PLACED AFTER METRICS) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50 print:hidden">
            <button
              onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
              className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">UTME Aggregate Leaderboard (Max 400)</h3>
                  <p className="text-xs text-slate-500">Compare your aggregate score against top registered candidates</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full hidden sm:inline-block">
                  {isLeaderboardOpen ? 'Hide Rankings' : 'View Rankings'}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-500 transform transition-transform duration-200 ${isLeaderboardOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isLeaderboardOpen && (
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-white animate-fadeIn">
                {loadingLeaders ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : leaders.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No complete 4-subject aggregate records found yet. Complete your tests across combinations to rank here!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider">
                          <th className="p-2.5 font-semibold">Rank</th>
                          <th className="p-2.5 font-semibold">Candidate</th>
                          <th className="p-2.5 font-semibold">Subjects Taken</th>
                          <th className="p-2.5 font-semibold text-right">Aggregate Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {leaders.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-2.5 font-bold text-slate-700">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </td>
                            <td className="p-2.5 font-medium text-slate-900">{item.userName}</td>
                            <td className="p-2.5 text-slate-500 max-w-xs truncate">
                              {item.subjectsTaken ? item.subjectsTaken.join(', ') : 'N/A'}
                            </td>
                            <td className="p-2.5 text-right text-blue-600 font-bold text-sm">
                              {item.score} <span className="text-[10px] font-normal text-slate-400">/ 400</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}