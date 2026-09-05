export default async function handler(req, res) {
  const { subject = 'english', year = 'random', limit = 40, provider = 'auto' } = req.query;

  // Subject mapping across APIs
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

  const formattedSubject = subjectMap[subject.toLowerCase()] || subject.toLowerCase();

  // Helper: Fetch from ALOC API
  const fetchALOC = async () => {
    let url = `https://questions.aloc.com.ng/api/v2/m?subject=${formattedSubject}&limit=${limit}`;
    if (year && year.toLowerCase() !== 'random') url += `&year=${year}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'AccessToken': process.env.ALOC_API_KEY || ''
      }
    });

    if (!res.ok) throw new Error(`ALOC error ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : [json.data];

    return list.map((q, idx) => ({
      id: `aloc-${q.id || idx}`,
      source: 'ALOC',
      question: q.question,
      options: [
        `A) ${q.option?.a || ''}`,
        `B) ${q.option?.b || ''}`,
        `C) ${q.option?.c || ''}`,
        `D) ${q.option?.d || ''}`
      ].filter(opt => opt.trim().length > 3),
      answer: q.answer ? `Option ${q.answer.toUpperCase()}` : '',
      explanation: q.solution || 'No detailed solution available.',
      section: q.section || ''
    }));
  };

  // Helper: Fetch from SDASH API
  const fetchSDASH = async () => {
    // Replace URL & headers with your actual SDASH endpoint specification
    let url = `https://api.sdash.ng/v1/questions?subject=${formattedSubject}&limit=${limit}`;
    if (year && year.toLowerCase() !== 'random') url += `&year=${year}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SDASH_API_KEY || ''}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`SDASH error ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : [];

    return list.map((q, idx) => ({
      id: `sdash-${q.id || idx}`,
      source: 'SDASH',
      question: q.question_text || q.question,
      options: q.options || [
        `A) ${q.option_a}`,
        `B) ${q.option_b}`,
        `C) ${q.option_c}`,
        `D) ${q.option_d}`
      ],
      answer: q.correct_option || q.answer,
      explanation: q.explanation || 'No detailed solution available.',
      section: q.section || ''
    }));
  };

  try {
    let questions = [];

    // Fallback Logic: Try ALOC first, fallback to SDASH
    try {
      questions = await fetchALOC();
      console.log(`Fetched ${questions.length} questions from ALOC API`);
    } catch (alocErr) {
      console.warn('ALOC API failed or unavailable. Falling back to SDASH:', alocErr.message);
      questions = await fetchSDASH();
      console.log(`Fetched ${questions.length} questions from SDASH API`);
    }

    // If both return empty or fail, handle exception
    if (!questions || questions.length === 0) {
      throw new Error('Both ALOC and SDASH returned empty question arrays.');
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
      message: 'Failed to retrieve questions from both ALOC and SDASH API providers.',
      error: err.message
    });
  }
}