import React, { useState } from 'react';

export default function AiTutorModal({ isOpen, onClose, userProfile }) {
  const [targetExam, setTargetExam] = useState('UTME'); // 'UTME' | 'WAEC' | 'NECO'
  const [selectedSubject, setSelectedSubject] = useState('Use of English');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${userProfile?.fullName || 'Student'}! I am your SbedTech AI Expert Tutor, trained directly on the NERDC Senior Secondary School Curriculum (WAEC/NECO/UTME). How can I assist your revision today?`,
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');
    setIsThinking(true);

    // AI Response generation structured per system rules
    setTimeout(() => {
      let aiResponseText = '';

      if (targetExam === 'UTME') {
        aiResponseText = `**[NERDC Objective Alignment: ${selectedSubject}]**\n\n` +
          `**UTME Core Concept & Elimination Strategy:**\n` +
          `For questions regarding "${currentQuery}", UTME focuses on rapid recognition. Eliminate options that confuse definitions with secondary traits.\n\n` +
          `**Key Takeaway:** Focus on recurring past concepts from the last 20 years to maintain speed under exam conditions.`;
      } else {
        aiResponseText = `**[NERDC Performance Objective: ${selectedSubject}]**\n\n` +
          `**Section A (Objective Strategy):**\n` +
          `Identify exact terminology for "${currentQuery}". Ensure you do not mix up similar definitions.\n\n` +
          `**Section B (Theory & Essay Requirements):**\n` +
          `• **Definition:** Provide clear, verbatim definitions without slang.\n` +
          `• **Units & Formulae:** State SI units where applicable.\n` +
          `• **Diagrams:** Use sharp, fully labeled diagrams with titles.`;
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText }]);
      setIsThinking(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                SbedTech AI Expert Tutor
              </h3>
              <p className="text-[11px] text-indigo-200 font-medium">
                NERDC Curriculum • WAEC • NECO • UTME
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-600">Target Exam:</span>
            {['UTME', 'WAEC', 'NECO'].map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => setTargetExam(exam)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  targetExam === exam
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {exam}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-600">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-slate-300 font-semibold text-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Use of English">Use of English</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Economics">Economics</option>
              <option value="Government">Government</option>
            </select>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-100/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-br-none shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-bl-none p-3.5 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                Searching NERDC Performance Objectives...
              </div>
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask a question on ${selectedSubject}...`}
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow"
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}