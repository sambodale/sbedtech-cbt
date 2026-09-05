import React, { useState, useEffect } from 'react';

export default function ExamHistoryModal({ onClose }) {
  const [history, setHistory] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sbedtech_exam_history') || '[]');
    setHistory(saved);
  }, []);

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
            {selectedAttempt.summary.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-sm ${
                  item.isCorrect ? 'border-green-200 bg-green-50/20' : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div className="flex justify-between font-bold mb-1">
                  <span>Q{idx + 1}. {item.question}</span>
                  <span className={item.isCorrect ? 'text-green-600' : 'text-red-500'}>
                    {item.isCorrect ? 'Correct' : 'Missed'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Your Answer: <strong className="uppercase">{item.userAnswer || 'None'}</strong> | Correct: <strong className="uppercase">{item.correctAnswer}</strong>
                </p>
                <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs text-slate-600">
                  <strong>Explanation:</strong> {item.explanation}
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-y-auto space-y-3 pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAttempt(item)}
                className="flex justify-between items-center p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition"
              >
                <div>
                  <h3 className="font-bold text-slate-800">{item.subject}</h3>
                  <p className="text-xs text-slate-500">{item.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">{item.score}/{item.total}</span>
                  <p className="text-xs text-slate-500">({item.percentage}%)</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-slate-500 text-sm">No exam history recorded yet.</p>
        )}
      </div>
    </div>
  );
}