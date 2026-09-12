// services/aiQuestionGenerator.js

export async function generateTopicQuestions({ subject, topic, limit = 20, year = '2026', examType = 'UTME' }) {
  const normalizedSubject = (subject || '').toLowerCase().trim();
  
  // Custom generator prompt for Literature in English
  if (normalizedSubject === 'literature' || normalizedSubject === 'literature-in-english') {
    return generateLiteratureQuestions(limit, year);
  }

  // Fallback generic generator for other subjects
  const questions = [];
  for (let i = 1; i <= limit; i++) {
    questions.push({
      id: `ai-${normalizedSubject}-${i}`,
      question: `[${examType} - ${topic || 'General Syllabus'}] Question ${i}: Which of the following best explains a core concept in ${subject}?`,
      options: {
        a: `Primary theoretical definition for option A in ${subject}`,
        b: `Secondary practical application for option B`,
        c: `Contradictory or alternative premise for option C`,
        d: `Extraneous or unrelated factor for option D`
      },
      answer: 'a',
      explanation: `The correct option is A because it accurately follows standard syllabus guidelines for ${subject}.`
    });
  }
  return questions;
}

// Specialized generator for JAMB Literature questions
function generateLiteratureQuestions(limit, year) {
  const litQuestions = [
    {
      question: "In drama, a speech delivered by a character alone on stage to express their inner thoughts is known as a:",
      options: { a: "Aside", b: "Soliloquy", c: "Monologue", d: "Prologue" },
      answer: "b",
      explanation: "A soliloquy is a device used in drama where a character speaks aloud to themselves, revealing inner thoughts directly to the audience."
    },
    {
      question: "The recurring element, image, or idea that helps to develop and inform the central theme of a literary work is called a:",
      options: { a: "Motif", b: "Climax", c: "Plot", d: "Satire" },
      answer: "a",
      explanation: "A motif is a recurring thematic element or pattern that structures and deepens the underlying meaning of a story."
    },
    {
      question: "A poem consisting of fourteen lines with a formal rhyme scheme, typically addressing themes of love or mortality, is a:",
      options: { a: "Ballad", b: "Ode", c: "Sonnet", d: "Elegy" },
      answer: "c",
      explanation: "A sonnet is a 14-line poem with a rigid rhyme structure, famously utilized by Shakespeare and Milton."
    },
    {
      question: "The deliberate exaggeration of a statement for emphasis or comic effect, rather than to be taken literally, is:",
      options: { a: "Metaphor", b: "Hyperbole", c: "Irony", d: "Oxymoron" },
      answer: "b",
      explanation: "Hyperbole is an extravagant exaggeration used to create strong emotional impact or humor."
    },
    {
      question: "Which literary device involves attributing human characteristics, feelings, or behaviors to inanimate objects or abstract ideas?",
      options: { a: "Simile", b: "Personification", c: "Onomatopoeia", d: "Alliteration" },
      answer: "b",
      explanation: "Personification breathes life into non-human entities by granting them human traits."
    }
  ];

  // Map or loop to fulfill the requested limit
  const results = [];
  for (let i = 0; i < limit; i++) {
    const template = litQuestions[i % litQuestions.length];
    results.push({
      id: `lit-gen-${i + 1}`,
      question: `[JAMB UTME Literature - ${year}] ${template.question}`,
      options: template.options,
      answer: template.answer,
      explanation: template.explanation
    });
  }
  return results;
}