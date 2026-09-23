export default function QuestionPalette({
  questions = [],
  currentIndex,
  userAnswers,
  onSelectQuestion
}) {
  // Group questions by their subject tag (falling back to 'General' if not specified)
  const groupedQuestions = questions.reduce((acc, q, idx) => {
    const sub = q.subjectTag || 'General';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push({ ...q, originalIndex: idx });
    return acc;
  }, {});

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

      {/* Grouped Palette Sections */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {Object.entries(groupedQuestions).map(([subName, subQuestions]) => {
          const isActiveSubject = subQuestions.some((q) => q.originalIndex === currentIndex);
          const firstIndexInSubject = subQuestions[0]?.originalIndex;

          return (
            <div key={subName} className="space-y-2">
              <button
                type="button"
                onClick={() => onSelectQuestion(firstIndexInSubject)}
                className={`w-full flex items-center justify-between text-left rounded-lg px-1.5 py-1 -mx-1.5 transition ${
                  isActiveSubject ? 'bg-blue-950/60' : 'hover:bg-slate-800/60'
                }`}
                title={`Jump to ${subName}`}
              >
                <span className={`text-[11px] font-bold uppercase tracking-wide ${isActiveSubject ? 'text-blue-300' : 'text-blue-400'}`}>
                  📚 {subName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {subQuestions.filter(q => userAnswers[q.originalIndex] !== undefined).length} / {subQuestions.length}
                </span>
              </button>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                {subQuestions.map((q) => {
                  const index = q.originalIndex;
                  const qNum = index + 1;
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
                      key={qNum}
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
          );
        })}
      </div>
    </div>
  );
}