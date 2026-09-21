// api/get-questions.js
// Fetches past questions from ALOC first, then falls back to SdashAPI.
// Both providers use the same question format, and both read their key from a Vercel variable:
//   ALOC_API_KEY   and   SDASH_API_KEY   (never prefix them with VITE_)

// Maps every name the app might send (human names and app slugs) to the provider slug.
const SUBJECT_SLUGS = {
  'use of english': 'english',
  'english': 'english',
  'mathematics': 'mathematics',
  'maths': 'mathematics',
  'physics': 'physics',
  'chemistry': 'chemistry',
  'biology': 'biology',
  'economics': 'economics',
  'government': 'government',
  'geography': 'geography',
  'commerce': 'commerce',
  'financial accounting': 'accounting',
  'accounting': 'accounting',
  'literature in english': 'englishlit',
  'literature-in-english': 'englishlit',
  'literature': 'englishlit',
  'englishlit': 'englishlit',
  'christian religious studies (crs)': 'crk',
  'crs': 'crk',
  'crk': 'crk',
  'islamic religious studies (irs)': 'irk',
  'irs': 'irk',
  'irk': 'irk',
  'agricultural science': 'agric',
  'agricultural-science': 'agric',
  'agric': 'agric',
  'yoruba': 'yoruba',
  'igbo': 'igbo',
  'hausa': 'hausa',
};

function normalizeQuestion(q, idx, source, imageBase) {
  // Join a shared passage (comprehension, tables, diagrams) to the question text
  let fullQuestionText = q.question || q.question_text || '';
  if (q.section && String(q.section).trim().length > 0) {
    fullQuestionText =
      `<div class="passage-block bg-slate-50 p-3 rounded mb-3 border-l-4 border-blue-500 font-serif text-sm">${q.section}</div>` +
      fullQuestionText;
  }

  // Image: keep only real strings, and make relative paths absolute
  let imageUrl = typeof q.image === 'string' && q.image.trim() ? q.image.trim() : null;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = imageBase + imageUrl.replace(/^\//, '');
  }

  // Options can arrive as an array or as an object
  let optA = '', optB = '', optC = '', optD = '';
  const rawOpt = q.option || q.options;
  if (Array.isArray(rawOpt)) {
    [optA, optB, optC, optD] = [rawOpt[0] || '', rawOpt[1] || '', rawOpt[2] || '', rawOpt[3] || ''];
  } else if (rawOpt && typeof rawOpt === 'object') {
    optA = rawOpt.a || rawOpt.A || '';
    optB = rawOpt.b || rawOpt.B || '';
    optC = rawOpt.c || rawOpt.C || '';
    optD = rawOpt.d || rawOpt.D || '';
  }

  return {
    id: `${source.toLowerCase()}-${q.id || idx}`,
    source,
    question: fullQuestionText,
    imageUrl,
    options: { a: optA, b: optB, c: optC, d: optD },
    answer: String(q.answer || '').toLowerCase().trim(),
    explanation: q.solution || 'No detailed solution available.',
    section: q.section || '',
  };
}

// Returns a list of questions (possibly empty). Throws only when the provider itself fails.
async function fetchProvider(provider) {
  const response = await fetch(provider.url, { headers: provider.headers });

  // Both providers use 404 to mean "nothing matched these filters"
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`${provider.name} error ${response.status}`);

  const json = await response.json();
  const raw = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
  return raw.map((q, idx) => normalizeQuestion(q, idx, provider.name, provider.imageBase));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', code: 'method_not_allowed', message: 'Method not allowed.' });
  }

  // Clean and limit the inputs
  const rawSubject = String(req.query.subject || 'english').toLowerCase().trim().slice(0, 60);
  const slug = SUBJECT_SLUGS[rawSubject] || rawSubject.replace(/[^a-z0-9-]/g, '');
  const yearInput = String(req.query.year || 'random').trim();
  const year = /^\d{4}$/.test(yearInput) ? yearInput : 'random';
  const requested = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);
  const fetchLimit = requested + 10; // small buffer in case some items are dropped

  if (!slug) {
    return res.status(400).json({ status: 'error', code: 'bad_subject', message: 'Please choose a subject.' });
  }

  const yearPart = year !== 'random' ? `&year=${encodeURIComponent(year)}` : '';
  const providers = [];

  if (process.env.ALOC_API_KEY) {
    providers.push({
      name: 'ALOC',
      url: `https://questions.aloc.com.ng/api/v2/m?subject=${encodeURIComponent(slug)}&limit=${fetchLimit}${yearPart}`,
      headers: { Accept: 'application/json', AccessToken: process.env.ALOC_API_KEY },
      imageBase: 'https://questions.aloc.com.ng/storage/',
    });
  }
  if (process.env.SDASH_API_KEY) {
    providers.push({
      name: 'SDASH',
      url: `https://sdashapi.com/api/v1/q?subject=${encodeURIComponent(slug)}&type=utme&limit=${fetchLimit}${yearPart}`,
      headers: { Accept: 'application/json', AccessToken: process.env.SDASH_API_KEY },
      imageBase: 'https://sdashapi.com/',
    });
  }

  if (providers.length === 0) {
    console.error('get-questions: no provider key is set (ALOC_API_KEY / SDASH_API_KEY).');
    return res.status(500).json({
      status: 'error',
      code: 'not_configured',
      message: 'Questions are not available right now. Please try again later.',
    });
  }

  let reachedAProvider = false;

  for (const provider of providers) {
    try {
      const list = await fetchProvider(provider);
      reachedAProvider = true;

      if (list.length > 0) {
        const questions = list.slice(0, requested);
        return res.status(200).json({
          status: 'success',
          subject: slug,
          year,
          source: provider.name,
          total: questions.length,
          data: questions,
        });
      }
      console.log(`get-questions: ${provider.name} had no questions for ${slug} (${year}). Trying the next provider.`);
    } catch (err) {
      console.warn(`get-questions: ${provider.name} failed:`, err.message);
    }
  }

  if (reachedAProvider) {
    return res.status(404).json({
      status: 'error',
      code: 'no_questions',
      message:
        year === 'random'
          ? `No questions are available for this subject yet.`
          : `No questions are available for this subject in ${year}. Try another year or Random.`,
    });
  }

  return res.status(502).json({
    status: 'error',
    code: 'providers_unavailable',
    message: 'The question service is not responding right now. Please try again in a moment.',
  });
}