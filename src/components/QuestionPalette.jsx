import { useState, useEffect } from 'react';

export default function QuestionPalette({
  questions = [],
  currentIndex,
  userAnswers,
  onSelectQuestion
}) {
  // Group questions by subject, preserving the order subjects first appear in (English first, etc.)
  const groupedQuestions = questions.reduce((acc, q, idx) => {
    const sub = q.subjectTag || 'General';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push({ ...q, originalIndex: idx });
    return acc;
  }, {});
  const subjectNames = Object.keys(groupedQuestions);

  const [activeTab, setActiveTab] = useState(subjectNames[0] || 'General');

  // Keep the tab in sync when the candidate navigates (Next/Previous) across a subject boundary
  useEffect(() => {
    const currentSubject = questions[currentIndex]?.subjectTag || 'General';
    if (currentSubject && currentSubject !== activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the tab UI to the externally-driven currentIndex
      setActiveTab(currentSubject);
    }
    // Only react to the current question changing, not to activeTab (which we set ourselves here)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions]);

  const handleTabClick = (subName) => {
    setActiveTab(subName);
    const firstIndexInSubject = groupedQuestions[subName]?.[0]?.originalIndex;
    if (firstIndexInSubject !== undefined) {
      onSelectQuestion(firstIndexInSubject);
    }
  };

  const activeSubQuestions = groupedQuestions[activeTab] || [];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Question Palette
        </h4>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600/40 border border-emerald-500"></span>
            <span className="text-slate-400">Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></span>
            <span className="text-slate-400">Unanswered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-slate-400">Current</span>
          </div>
        </div>
      </div>

      {/* Subject Tabs — only shown when there's more than one subject (Exam Mode) */}
      {subjectNames.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {subjectNames.map((subName) => {
            const subQuestions = groupedQuestions[subName];
            const answeredCount = subQuestions.filter((q) => userAnswers[q.originalIndex] !== undefined).length;
            const isActive = subName === activeTab;
            return (
              <button
                key={subName}
                type="button"
                onClick={() => handleTabClick(subName)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
                title={`Switch to ${subName}`}
              >
                📚 {subName} <span className="opacity-70">({answeredCount}/{subQuestions.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid for the active subject only, numbered locally (1..N within this subject) */}
      <div className="max-h-[55vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
          {activeSubQuestions.map((q, localIdx) => {
            const index = q.originalIndex;
            const qNum = localIdx + 1; // local numbering within this subject, not global
            const isCurrent = currentIndex === index;
            const isAnswered = Boolean(userAnswers[index]);

            let buttonStyle = 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500';

            if (isAnswered) {
              buttonStyle = 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-semibold';
            }

            if (isCurrent) {
              buttonStyle = 'bg-blue-600 border-blue-400 text-white font-bold ring-2 ring-blue-500/40';
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => onSelectQuestion(index)}
                className={`h-8 rounded-md text-xs border flex items-center justify-center transition ${buttonStyle}`}
              >
                {qNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}