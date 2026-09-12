import React, { useState } from 'react';

export default function ExamHistoryModal({ history = [], onClose }) {
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';
    try {
      // Handles numeric timestamps, ISO strings, or formatted locale strings
      const date = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue); // Fallback to raw string if invalid
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return String(dateValue);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {selectedAttempt ? `${selectedAttempt.subject} Details` : 'Exam History'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {selectedAttempt ? (
          <div className="overflow-y-auto space-y-4 pr-1">
            <button
              onClick={() => setSelectedAttempt(null)}
              className="text-xs text-blue-600 font-bold hover:underline mb-2 block"
            >
              ← Back to History List
            </button>

            {Array.isArray(selectedAttempt.summary) && selectedAttempt.summary.length > 0 ? (
              selectedAttempt.summary.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-sm ${
                    item.isCorrect ? 'border-green-200 bg-green-50/20' : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex justify-between font-bold mb-1">
                    <span dangerouslySetInnerHTML={{ __html: `Q${idx + 1}. ${item.question}` }} />
                    <span className={item.isCorrect ? 'text-green-600' : 'text-red-500'}>
                      {item.isCorrect ? 'Correct' : 'Missed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Your Answer: <strong className="uppercase">{item.userAnswer || 'None'}</strong> | Correct: <strong className="uppercase">{item.correctAnswer}</strong>
                  </p>
                  <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs text-slate-600">
                    <strong>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: item.explanation || 'No explanation provided.' }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800 mb-1">
                    Score: {selectedAttempt.score}/{selectedAttempt.total || selectedAttempt.totalQuestions || 40} ({selectedAttempt.percentage || Math.round((selectedAttempt.score / (selectedAttempt.total || selectedAttempt.totalQuestions || 40)) * 100)}%)
                  </p>
                  <p className="text-xs text-slate-500">
                    Taken on {formatDate(selectedAttempt.timestamp || selectedAttempt.date)}
                  </p>
                </div>
                <p className="text-center py-4 text-slate-400 text-xs">
                  Detailed question-by-question breakdown isn't available for this attempt.
                </p>
              </div>
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-y-auto space-y-3 pr-1">
            {history.map((item) => {
              const totalQ = item.total || item.totalQuestions || 40;
              const percent = item.percentage || Math.round((item.score / totalQ) * 100);
              const recordDate = item.timestamp || item.date;

              return (
                <div
                  key={item.id || Math.random()}
                  onClick={() => setSelectedAttempt(item)}
                  className="flex justify-between items-center p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition"
                >
                  <div>
                    <h3 className="font-bold text-slate-800">{item.subject}</h3>
                    <p className="text-xs text-slate-500">{formatDate(recordDate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{item.score}/{totalQ}</span>
                    <p className="text-xs text-slate-500">({percent}%)</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-8 text-slate-500 text-sm">No exam history recorded yet.</p>
        )}
      </div>
    </div>
  );
}