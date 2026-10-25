import { useState, useEffect, useRef } from 'react';
import { usePaystackPayment } from 'react-paystack';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { auth } from '../firebase/config';

// Two fixed top-up packs — amounts here are only what's shown to the user;
// api/verify-tutor-topup.js re-validates the real price server-side.
const TUTOR_TOPUP_TIERS = {
  basic: { amountKobo: 50000, label: 'Basic', priceLabel: '₦500', tokensLabel: '50,000 tokens' },
  premium: { amountKobo: 100000, label: 'Premium', priceLabel: '₦1,000', tokensLabel: '150,000 tokens' },
};

const WORDS_PER_TOKEN = 0.75; // Display-only estimate — the real balance is tracked in tokens

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Renders **bold**, line breaks, and $inline$ / $$block$$ LaTeX formulae from an AI
// response into safe-ish HTML. Non-math text is escaped first; math segments go
// through KaTeX with throwOnError disabled so a malformed formula never breaks the chat.
function renderTutorMessage(rawText) {
  const segments = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: rawText.slice(lastIndex, match.index) });
    segments.push(
      match[1] !== undefined
        ? { type: 'block-math', value: match[1] }
        : { type: 'inline-math', value: match[2] }
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < rawText.length) segments.push({ type: 'text', value: rawText.slice(lastIndex) });

  return segments
    .map((seg) => {
      if (seg.type === 'text') {
        return escapeHtml(seg.value)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br/>');
      }
      try {
        return katex.renderToString(seg.value, { throwOnError: false, displayMode: seg.type === 'block-math' });
      } catch {
        return escapeHtml(seg.value);
      }
    })
    .join('');
}

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
  const [errorMessage, setErrorMessage] = useState('');

  // Token balance: one Firestore read on open, then tracked purely in memory during
  // the session. Deductions are only written back in batches (see flushUsage below).
  const [remainingTokens, setRemainingTokens] = useState(null); // null while loading
  const [balanceError, setBalanceError] = useState('');
  const pendingBatchTokensRef = useRef(0);
  const messagesSinceSyncRef = useRef(0);

  // Top-up purchase state
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpTier, setTopUpTier] = useState(null);
  const [topUpStatus, setTopUpStatus] = useState('');
  const [topUpReference, setTopUpReference] = useState('');

  // --- Load balance once when the tutor opens ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Please log in again to use the AI Tutor.');
        const res = await fetch('/api/tutor-balance', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load your AI Tutor balance.');
        if (!cancelled) setRemainingTokens(data.balance);
      } catch (err) {
        if (!cancelled) setBalanceError(err.message || 'Could not load your AI Tutor balance.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // --- Batched sync: sends accumulated usage to Firestore, not on every message ---
  async function flushUsage() {
    const tokensUsed = pendingBatchTokensRef.current;
    if (tokensUsed <= 0) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/tutor-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        keepalive: true, // lets this survive a tab close / backgrounding
        body: JSON.stringify({ tokensUsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        pendingBatchTokensRef.current = 0;
        messagesSinceSyncRef.current = 0;
        setRemainingTokens(data.balance);
      }
    } catch (err) {
      console.warn('AI Tutor usage sync failed, will retry at next batch point:', err.message);
    }
  }

  // Flush when the tab is backgrounded/hidden — covers app-switching and most tab closes
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) flushUsage();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = async () => {
    await flushUsage();
    onClose();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim() || isThinking) return;

    if (remainingTokens !== null && remainingTokens <= 0) {
      setShowTopUp(true);
      return;
    }

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');
    setIsThinking(true);
    setErrorMessage('');

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please log in again, then retry.');

      // Send the last few turns so Gemini has conversational context (it otherwise
      // treats every request as a fresh, unrelated question). Drop the hardcoded
      // welcome message (index 0) — it's UI-only, not a real exchange — and cap how
      // much history we send to keep each request's token cost bounded.
      const MAX_HISTORY_TURNS = 10;
      const history = messages
        .slice(1)
        .slice(-MAX_HISTORY_TURNS)
        .map((m) => ({ role: m.sender === 'ai' ? 'model' : 'user', text: m.text }));

      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: currentQuery, subject: selectedSubject, targetExam, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'The AI Tutor could not respond right now.');

      setMessages((prev) => [...prev, { sender: 'ai', text: data.text }]);

      const tokensUsed = data.tokensUsed || 0;
      setRemainingTokens((prev) => Math.max(0, (prev ?? 0) - tokensUsed));
      pendingBatchTokensRef.current += tokensUsed;
      messagesSinceSyncRef.current += 1;
      if (messagesSinceSyncRef.current >= 10) flushUsage();
    } catch (error) {
      console.error('AI Tutor request failed:', error);
      setErrorMessage(error.message || 'The AI Tutor could not respond right now. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  // --- Top-up purchase flow ---
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const currentTierInfo = topUpTier ? TUTOR_TOPUP_TIERS[topUpTier] : null;
  const topUpConfig = {
    reference: topUpReference || 'pending',
    email: auth.currentUser?.email || 'candidate@sbedtech.com',
    amount: currentTierInfo ? currentTierInfo.amountKobo : 100,
    publicKey,
    metadata: {
      custom_fields: [
        { display_name: 'User ID', variable_name: 'user_id', value: auth.currentUser?.uid || 'guest_user' },
        { display_name: 'Tier', variable_name: 'tier', value: topUpTier || 'none' },
      ],
    },
  };
  const initializeTopUp = usePaystackPayment(topUpConfig);

  async function verifyTopUp(reference, tier) {
    setTopUpStatus('Verifying payment...');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please log in again, then retry.');
      const response = await fetch('/api/verify-tutor-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference, tier }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Payment verification failed.');
      setRemainingTokens(data.balance);
      setTopUpStatus('');
      setShowTopUp(false);
    } catch (err) {
      setTopUpStatus(err.message || 'Payment verification failed.');
    }
  }

  // Picking a tier just records which one + a fresh payment reference; the actual
  // Paystack popup is launched from the effect below once both are set.
  function handleSelectTier(tier) {
    if (!publicKey) {
      setTopUpStatus('Online top-up is not configured yet. Please contact the admin.');
      return;
    }
    setTopUpStatus('');
    setTopUpReference(`SBEDTUTOR-${Date.now()}`);
    setTopUpTier(tier);
  }

  useEffect(() => {
    if (!topUpTier || !topUpReference) return;
    initializeTopUp({
      onSuccess: (ref) => {
        const usedRef = ref?.reference || ref?.trxref || topUpReference;
        verifyTopUp(usedRef, topUpTier);
        setTopUpTier(null);
      },
      onClose: () => setTopUpTier(null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topUpTier, topUpReference]);

  const approxWordsRemaining = remainingTokens !== null ? Math.round(remainingTokens * WORDS_PER_TOKEN) : null;

  if (!isOpen) return null;

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
            onClick={handleClose}
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

        {/* Balance Bar */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-2 flex items-center justify-between text-[11px]">
          <span className="font-bold text-indigo-900">
            {remainingTokens === null
              ? balanceError || 'Loading your balance...'
              : `${remainingTokens.toLocaleString()} tokens left (~${approxWordsRemaining.toLocaleString()} words)`}
          </span>
          <button
            type="button"
            onClick={() => setShowTopUp((v) => !v)}
            className="font-bold text-indigo-700 hover:text-indigo-900 underline"
          >
            🪙 Buy more
          </button>
        </div>

        {showTopUp && (
          <div className="bg-white border-b border-slate-200 px-5 py-3 space-y-2">
            {Object.entries(TUTOR_TOPUP_TIERS).map(([key, tier]) => (
              <button
                key={key}
                type="button"
                disabled={Boolean(topUpTier)}
                onClick={() => handleSelectTier(key)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 transition"
              >
                <span>{tier.label} — {tier.tokensLabel}</span>
                <span>{tier.priceLabel}</span>
              </button>
            ))}
            {topUpStatus && (
              <p className="text-[11px] text-slate-600 font-medium">{topUpStatus}</p>
            )}
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-100/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' ? (
                <div
                  className="max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                  dangerouslySetInnerHTML={{ __html: renderTutorMessage(msg.text) }}
                />
              ) : (
                <div className="max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed bg-blue-600 text-white font-medium rounded-br-none shadow-sm">
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-bl-none p-3.5 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                Thinking through your {selectedSubject} question...
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex justify-start">
              <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl p-3.5 text-xs font-semibold shadow-sm max-w-[82%]">
                {errorMessage}
              </div>
            </div>
          )}

          {remainingTokens === 0 && (
            <div className="flex justify-start">
              <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl p-3.5 text-xs font-semibold shadow-sm max-w-[82%]">
                You've used up your AI Tutor tokens. Tap "🪙 Buy more" above to keep going.
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
            disabled={isThinking || remainingTokens === 0}
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!query.trim() || isThinking || remainingTokens === 0}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow"
          >
            {isThinking ? '...' : 'Send'}
          </button>
        </form>

      </div>
    </div>
  );
}