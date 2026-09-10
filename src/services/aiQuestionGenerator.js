// src/services/aiQuestionGenerator.js

export async function generateTopicQuestions({ subject, topic, limit = 20, year = '2026', examType = 'UTME' }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const generatedQuestions = [];

  for (let i = 1; i <= limit; i++) {
    generatedQuestions.push({
      id: `ai-gen-${subject}-${Date.now()}-${i}`,
      question: `[JAMB UTME - ${topic}] Question ${i}: Practice question for ${topic} in ${subject}.`,
      option: {
        a: 'Option A statement',
        b: 'Option B statement',
        c: 'Option C statement',
        d: 'Option D statement',
      },
      answer: 'a',
      explanation: `Correct concept for ${topic} in ${subject}.`,
      isAiGenerated: true,
      topic,
    });
  }

  return generatedQuestions;
}