// services/aiQuestionGenerator.js

export async function generateTopicQuestions({ subject, topic, limit = 20, year = '2026', examType = 'UTME' }) {
  const normalizedSubject = (subject || '').toLowerCase().trim();

  try {
    // Construct query parameters for your backend serverless handler
    const params = new URLSearchParams({
      subject: normalizedSubject,
      year: year || '2026',
      limit: limit || 20
    });

    if (topic && topic !== 'General JAMB Syllabus') {
      params.append('topic', topic);
    }

    // Call your backend handler endpoint securely
    const response = await fetch(`/api/get-questions?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned error status: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      return result.data; // Successfully returns real ALOC questions to App.jsx
    }

    throw new Error(result.message || 'No questions returned from backend.');

  } catch (error) {
    console.error('Error fetching questions from server handler:', error);
    throw error; // Let App.jsx catch this so it can show a friendly alert to the candidate
  }
}