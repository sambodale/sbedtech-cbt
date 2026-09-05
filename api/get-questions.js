// api/get-questions.js

export default async function handler(req, res) {
  const { subject = 'english', year = 'random', limit = 40 } = req.query;

  // Comprehensive Subject mapping across providers
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
    'yorùbá': 'yoruba',
    'yòrùbá': 'yoruba',
    'igbo': 'igbo',
    'ìgbò': 'igbo',
    'hausa': 'hausa',
    'government': 'government',
    'crs': 'crk',
    'irs': 'irk'
  };

  const rawSubject = (subject || '').toLowerCase().trim();
  const formattedSubject = subjectMap[rawSubject] || rawSubject;

  // Helper: Fetch from ALOC API
  const fetchALOC = async () => {
    let url = `https://questions.aloc.com.ng/api/v2/m?subject=${encodeURIComponent(formattedSubject)}&limit=${limit}`;
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

    return list.map((q, idx) => ({
      id: `aloc-${q.id || idx}`,
      source: 'ALOC',
      question: q.question || '',
      options: {
        a: q.option?.a || '',
        b: q.option?.b || '',
        c: q.option?.c || '',
        d: q.option?.d || ''
      },
      answer: q.answer || '',
      explanation: q.solution || q.section || 'No detailed solution available.',
      section: q.section || ''
    }));
  };

  // Helper: Fetch from SDASH API
  const fetchSDASH = async () => {
    let url = `https://api.sdash.ng/v1/questions?subject=${encodeURIComponent(formattedSubject)}&limit=${limit}`;
    if (year && year.toLowerCase() !== 'random') {
      url += `&year=${encodeURIComponent(year)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SDASH_API_KEY || ''}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`SDASH error ${response.status}`);
    
    const json = await response.json();
    const list = Array.isArray(json.data) ? json.data : [];

    return list.map((q, idx) => ({
      id: `sdash-${q.id || idx}`,
      source: 'SDASH',
      question: q.question_text || q.question || '',
      options: {
        a: q.option_a || q.options?.a || '',
        b: q.option_b || q.options?.b || '',
        c: q.option_c || q.options?.c || '',
        d: q.option_d || q.options?.d || ''
      },
      answer: q.correct_option || q.answer || '',
      explanation: q.explanation || 'No detailed solution available.',
      section: q.section || ''
    }));
  };

  try {
    let questions = [];

    // Primary: Try fetching from ALOC
    try {
      questions = await fetchALOC();
      console.log(`Fetched ${questions.length} questions from ALOC`);
    } catch (alocErr) {
      console.warn('ALOC API failed. Falling back to SDASH:', alocErr.message);
      // Secondary: Fallback to SDASH if ALOC throws an error
      questions = await fetchSDASH();
      console.log(`Fetched ${questions.length} questions from SDASH`);
    }

    if (!questions || questions.length === 0) {
      throw new Error('Both ALOC and SDASH returned empty question payloads.');
    }

    return res.status(200).json({
      status: 'success',
      subject: formattedSubject,
      year,
      total: questions.length,
      data: questions
    });

  } catch (err) {
    console.error('Multi-Provider Fetch Error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve questions from ALOC and SDASH providers.',
      error: err.message
    });
  }
}