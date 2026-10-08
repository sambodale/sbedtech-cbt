// api/ai-tutor.js
// Answers one AI Expert Tutor message. Verifies login + activation, then calls
// Gemini 3.1 Flash-Lite for a grounded, NERDC/WAEC/NECO/UTME-structured answer.
//
// Deliberately does NOT touch the student's word balance — that's handled by
// api/tutor-balance.js on a batched schedule from the client, per the cost-control
// design. This endpoint only returns the answer text plus how many words it used,
// so the client can decrement its local session counter accurately.
//
// Needs these Vercel environment variables (never prefix them with VITE_):
//   GEMINI_API_KEY            from aistudio.google.com
//   FIREBASE_SERVICE_ACCOUNT  the same service account JSON used elsewhere

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const MAX_OUTPUT_TOKENS = 500; // caps a single response so no one message can blow through a whole balance

// Only used to show the student a friendly "~X words" estimate alongside their raw token
// balance in the UI. The real balance and all deductions are in tokens, matching what
// Gemini actually bills for.
const WORDS_PER_TOKEN = 0.75;

// A short topic list per subject, used only to ground answers to the right syllabus scope.
// Keep loosely in sync with SUBJECT_TOPICS in src/components/HomeScreen.jsx if that list changes.
const SUBJECT_TOPIC_HINTS = {
  'Use of English': 'Comprehension & Summary, Lexis & Structure, Oral English, Grammar & Sentence Construction, Vocabulary Development',
  'Mathematics': 'Number & Numeration, Algebra, Geometry & Mensuration, Trigonometry, Calculus, Statistics & Probability',
  'Physics': "Mechanics, Properties of Matter, Thermal Physics, Waves/Optics/Sound, Electricity & Magnetism, Modern/Atomic Physics",
  'Chemistry': 'Atomic Structure & Bonding, Stoichiometry, States of Matter, Kinetics & Equilibrium, Acids/Bases/Salts, Organic Chemistry, Electrochemistry',
  'Biology': 'Cell Biology, Plant Nutrition/Transport/Reproduction, Animal Nutrition/Transport/Respiration/Excretion, Nervous & Reproductive Systems, Genetics & Evolution, Ecology',
  'Economics': 'Basic Concepts & Systems, Production/Distribution/Consumption, Demand & Supply, Market Structures, National Income, Money & Banking, Public Finance, International Trade',
  'Government': 'Basic Concepts (Power/Authority/Sovereignty), Constitution & Separation of Powers, Nigerian Political History, Public Administration, Political Parties & Elections, International Relations',
};

let firebase = null;
async function loadFirebase() {
  if (!firebase) {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/auth'),
      import('firebase-admin/firestore'),
    ]);
    firebase = {
      initializeApp: appModule.initializeApp,
      getApps: appModule.getApps,
      cert: appModule.cert,
      getAuth: authModule.getAuth,
      getFirestore: firestoreModule.getFirestore,
    };
  }
  return firebase;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function ensureFirebase(fb) {
  if (!fb.getApps().length) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      throw new HttpError(500, 'Server setup problem. Please try again later.');
    }
    fb.initializeApp({ credential: fb.cert(serviceAccount) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  try {
    if (!process.env.GEMINI_API_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new HttpError(500, 'AI Tutor is not configured yet. Please try again later.');
    }

    let fb;
    try {
      fb = await loadFirebase();
    } catch (loadError) {
      console.error('ai-tutor: firebase-admin failed to load:', loadError);
      throw new HttpError(500, 'Server setup problem. Please try again later.');
    }
    ensureFirebase(fb);

    // 1. Who is calling, and are they activated? (Same check as tutor-balance.js —
    //    this endpoint doesn't touch the balance itself, but it must not answer
    //    for an account that was never unlocked.)
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!idToken) throw new HttpError(401, 'Please log in again and retry.');

    let uid;
    try {
      uid = (await fb.getAuth().verifyIdToken(idToken)).uid;
    } catch {
      throw new HttpError(401, 'Your session expired. Please log in again and retry.');
    }

    const studentSnap = await fb.getFirestore().doc(`students/${uid}`).get();
    if (!studentSnap.exists || !studentSnap.data()?.isExamModeUnlocked) {
      throw new HttpError(403, 'The AI Expert Tutor requires an activated account.');
    }

    // 2. What are they asking?
    const { query, subject, targetExam } = req.body || {};
    const cleanQuery = typeof query === 'string' ? query.trim().slice(0, 1000) : '';
    const cleanSubject = typeof subject === 'string' && subject.trim() ? subject.trim() : 'Use of English';
    const cleanExam = ['UTME', 'WAEC', 'NECO'].includes(targetExam) ? targetExam : 'UTME';
    if (!cleanQuery) throw new HttpError(400, 'Please type a question first.');

    // 3. Ask Gemini
    const topicHint = SUBJECT_TOPIC_HINTS[cleanSubject];
    const systemPrompt = [
      `You are SbedTech AI Expert Tutor, a curriculum tutor for Nigerian secondary school students preparing for ${cleanExam}.`,
      `You are trained on the NERDC Senior Secondary School Curriculum. The student's current subject is ${cleanSubject}.`,
      topicHint ? `Topics typically covered in this subject: ${topicHint}.` : '',
      'Structure every answer as:',
      `**[NERDC Objective Alignment: ${cleanSubject}]**`,
      `**${cleanExam} Core Concept:** a clear, correct explanation of the concept the student asked about. Write any formula in LaTeX, wrapped in $...$ for inline or $$...$$ for a standalone equation.`,
      '**Exam Tip:** one short, concrete tip for answering this kind of question quickly and accurately.',
      'Keep the whole answer under 200 words. Use plain language a Nigerian SS3 student would understand. If the question is outside the school curriculum or inappropriate, politely redirect to curriculum-relevant help instead of answering it.',
    ].filter(Boolean).join('\n');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: cleanQuery }] }],
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
      }),
    });

    const geminiJson = await geminiRes.json().catch(() => ({}));
    if (!geminiRes.ok) {
      console.error('ai-tutor: Gemini API error:', geminiJson);
      throw new HttpError(502, 'The AI Tutor could not respond right now. Please try again.');
    }

    const text = geminiJson.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) throw new HttpError(502, 'The AI Tutor could not respond right now. Please try again.');

    // The balance is token-denominated, so this is the number that actually gets deducted.
    // If Gemini ever omits usage metadata, fall back to a rough estimate from the word count
    // (reversing the same ratio) so the app never divides by a missing value.
    const reportedOutputTokens = geminiJson.usageMetadata?.candidatesTokenCount;
    const tokensUsed = Number.isFinite(reportedOutputTokens)
      ? Math.max(1, reportedOutputTokens)
      : Math.max(1, Math.round(text.trim().split(/\s+/).length / WORDS_PER_TOKEN));
    const approxWords = Math.max(1, Math.round(tokensUsed * WORDS_PER_TOKEN));

    return res.status(200).json({ status: 'success', text, tokensUsed, approxWords });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error('ai-tutor error:', err);
    return res.status(status).json({
      status: 'error',
      message: status === 500 ? 'Something went wrong. Please try again.' : err.message,
    });
  }
}