// api/get-questions.js

export default async function handler(req, res) {
  const { subject = 'english', year = 'random', limit = 40 } = req.query;
  const requestedLimit = parseInt(limit, 10) || 40;

  const subjectMap = {
    'use of english': 'english',
    'english': 'english',
    'mathematics': 'mathematics',
    'physics': 'physics',
    'chemistry': 'chemistry',
    'biology': 'biology',
    'economics': 'economics',
    'geography': 'geography',
    'agricultural science': 'agric',
    'financial accounting': 'accounting',
    'commerce': 'commerce',
    'literature in english': 'literature-in-english',
    'literature': 'literature-in-english',
    'yoruba': 'yoruba',
    'government': 'government',
    'crs': 'crk',
    'irs': 'irk'
  };

  const rawSubject = (subject || '').toLowerCase().trim();
  const formattedSubject = subjectMap[rawSubject] || rawSubject;

  // Helper: Fetch from ALOC API
  const fetchALOC = async () => {
    // Request extra items to safely account for any filtering/slicing
    const fetchLimit = requestedLimit + 10;
    let url = `https://questions.aloc.com.ng/api/v2/m?subject=${encodeURIComponent(formattedSubject)}&limit=${fetchLimit}`;
    
    if (year && year.toLowerCase() !== 'random') {
      url += `&year=${encodeURIComponent(year)}`;
    }

    const apiKey = process.env.ALOC_API_KEY || '';

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'AccessToken': apiKey // ALOC v2 requires the raw token here
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ALOC error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const list = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);

    return list.map((q, idx) => {
      // 1. Combine passage/section with question text for English comprehension or context sections
      let fullQuestionText = q.question || '';
      if (q.section && q.section.trim().length > 0) {
        fullQuestionText = `<div class="passage-block bg-slate-50 p-3 rounded mb-3 border-l-4 border-blue-500 font-serif text-sm">${q.section}</div>` + fullQuestionText;
      }

      // 2. Extract image URL if present
      let imageUrl = q.image || q.hasImage || null;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://questions.aloc.com.ng/storage/${imageUrl.replace(/^\//, '')}`;
      }

      // 3. Robust Option Parser (handles both Array and Object responses seamlessly)
      let optA = '', optB = '', optC = '', optD = '';
      const rawOpt = q.option || q.options;

      if (Array.isArray(rawOpt)) {
        optA = rawOpt[0] || '';
        optB = rawOpt[1] || '';
        optC = rawOpt[2] || '';
        optD = rawOpt[3] || '';
      } else if (rawOpt && typeof rawOpt === 'object') {
        optA = rawOpt.a || rawOpt.A || '';
        optB = rawOpt.b || rawOpt.B || '';
        optC = rawOpt.c || rawOpt.C || '';
        optD = rawOpt.d || rawOpt.D || '';
      }

      return {
        id: `aloc-${q.id || idx}`,
        source: 'ALOC',
        question: fullQuestionText,
        imageUrl: imageUrl,
        options: {
          a: optA,
          b: optB,
          c: optC,
          d: optD
        },
        answer: String(q.answer || '').toLowerCase().trim(),
        explanation: q.solution || 'No detailed solution available.',
        section: q.section || ''
      };
    });
  };

  try {
    let questions = await fetchALOC();

    // Ensure we strictly return up to the requested question count
    if (questions.length > requestedLimit) {
      questions = questions.slice(0, requestedLimit);
    }

    return res.status(200).json({
      status: 'success',
      subject: formattedSubject,
      year,
      total: questions.length,
      data: questions
    });

  } catch (err) {
    console.error('Fetch Error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve questions.',
      error: err.message
    });
  }
}