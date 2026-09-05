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
    'literature in english': 'englishlit',
    'yoruba': 'yoruba',
    'government': 'government',
    'crs': 'crk',
    'irs': 'irk'
  };

  const rawSubject = (subject || '').toLowerCase().trim();
  const formattedSubject = subjectMap[rawSubject] || rawSubject;

  // Helper: Fetch ALOC API
  const fetchALOC = async () => {
    // Request 25% extra questions from ALOC to guarantee we meet requestedLimit
    const fetchLimit = requestedLimit + 10;
    let url = `https://questions.aloc.com.ng/api/v2/m?subject=${encodeURIComponent(formattedSubject)}&limit=${fetchLimit}`;
    
    if (year && year.toLowerCase() !== 'random') {
      url += `&year=${encodeURIComponent(year)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'AccessToken': process.env.ALOC_API_KEY || ''
      }
    });

    if (!response.ok) throw new Error(`ALOC error ${response.status}`);

    const json = await response.json();
    const list = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);

    return list.map((q, idx) => {
      // 1. Combine passage/section with question for English comprehension
      let fullQuestionText = q.question || '';
      if (q.section && q.section.trim().length > 0) {
        fullQuestionText = `<div class="passage-block bg-slate-50 p-3 rounded mb-3 border-l-4 border-blue-500 font-serif text-sm">${q.section}</div>` + fullQuestionText;
      }

      // 2. Extract image URL if present
      let imageUrl = q.image || q.hasImage || null;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://questions.aloc.com.ng/storage/${imageUrl.replace(/^\//, '')}`;
      }

      return {
        id: `aloc-${q.id || idx}`,
        source: 'ALOC',
        question: fullQuestionText,
        imageUrl: imageUrl,
        options: {
          a: q.option?.a || '',
          b: q.option?.b || '',
          c: q.option?.c || '',
          d: q.option?.d || ''
        },
        answer: q.answer || '',
        explanation: q.solution || 'No detailed solution available.',
        section: q.section || ''
      };
    });
  };

  try {
    let questions = await fetchALOC();

    // Slice to match the exact requested count (e.g. 40)
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