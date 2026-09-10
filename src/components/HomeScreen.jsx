import React, { useState } from 'react';
import DashboardView from './DashboardView';

const SUBJECT_LIST = [
  { name: 'Use of English', icon: '📖' },
  { name: 'Mathematics', icon: '📐' },
  { name: 'Physics', icon: '⚡' },
  { name: 'Chemistry', icon: '🧪' },
  { name: 'Biology', icon: '🧬' },
  { name: 'Economics', icon: '📚' },
  { name: 'Government', icon: '🏛️' },
  { name: 'Christian Religious Studies (CRS)', icon: '✝️' },
  { name: 'Geography', icon: '🗺️' },
  { name: 'Financial Accounting', icon: '📊' },
  { name: 'Commerce', icon: '🏢' },
  { name: 'Literature in English', icon: '🎭' },
  { name: 'Islamic Religious Studies (IRS)', icon: '🌙' },
  { name: 'Agricultural Science', icon: '🌱' },
  { name: 'Yoruba', icon: '🗣️' },
  { name: 'Hausa', icon: '🗣️' },
  { name: 'Igbo', icon: '🗣️' },
];

const SUBJECT_TOPICS = {
  'Use of English': [
    'Comprehension & Summary',
    'Lexis & Structure',
    'Oral English (Vowels, Consonants, Stress & Rhymes)',
    'Grammar & Sentence Construction',
    'Vocabulary Development (Synonyms, Antonyms, Idioms)',
    'The Lekki Headmaster (2026 Reading Text)',
  ],
  'Mathematics': [
    'Number & Numeration (Number Bases, Fractions, Indices, Logarithms, Surds, Sets)',
    'Algebra (Polynomials, Factorization, Equations, Variation, Binary Operations)',
    'Geometry & Mensuration (Angles, Circles, Polygons, Coordinate Geometry, Areas & Volumes)',
    'Trigonometry (Ratios, Identities, Angles of Elevation/Depression, Sine & Cosine Rules)',
    'Calculus (Differentiation, Integration, Rates of Change, Maxima & Minima)',
    'Statistics & Probability (Central Tendency, Dispersion, Permutation & Combination)',
  ],
  'Physics': [
    "Mechanics (Motion, Newton's Laws, Equilibrium, Work, Energy & Power, Simple Harmonic Motion)",
    'Properties of Matter (Density, Elasticity, Surface Tension, Viscosity)',
    'Thermal Physics (Temperature, Thermal Expansion, Heat Transfer, Gas Laws)',
    'Waves, Optics & Sound (Wave Properties, Light, Optical Instruments, Sound Waves)',
    'Electricity & Magnetism (Electrostatics, Current Electricity, Electromagnetic Induction, AC)',
    'Modern/Atomic Physics (Atomic Structure, Radioactivity, Nuclear Reactions)',
  ],
  'Chemistry': [
    'Atomic Structure & Chemical Bonding',
    'Stoichiometry & Chemical Equations',
    'States of Matter & Energy Changes',
    'Chemical Kinetics & Equilibrium',
    'Acids, Bases & Salts',
    'Periodicity & Inorganic Chemistry (Groups I–VII, Transition Metals)',
    'Organic Chemistry (Hydrocarbons, Alkanols, Alkanoic Acids, Polymers)',
    'Electrochemistry',
  ],
  'Biology': [
    'Cell Biology & Classification of Living Things',
    'Plant Nutrition, Transport & Reproduction',
    'Animal Nutrition, Transport, Respiration & Excretion',
    'Nervous Coordination & Reproductive Systems',
    'Genetics, Variation & Evolution',
    'Ecology (Ecosystems, Energy Flow, Population, Pollution & Conservation)',
  ],
  'Economics': [
    'Basic Economic Concepts & Economic Systems',
    'Production, Distribution & Consumption',
    'Consumer Behaviour & Demand/Supply',
    'Market Structures (Perfect Competition, Monopoly, Oligopoly)',
    'National Income & Economic Development',
    'Money & Banking',
    'Public Finance (Government Revenue, Expenditure & Taxation)',
    'International Trade & Balance of Payments',
  ],
  'Government': [
    'Basic Concepts in Government (Power, Authority, Sovereignty, Constitution)',
    'Political Structure & Constitution (Arms of Government, Separation of Powers)',
    'Nigerian Political History (Colonial Rule, Independence, Military Rule)',
    'Public Administration & Local Government',
    'Political Parties & Electoral Systems',
    'International Relations (UN, AU, ECOWAS, Foreign Policy)',
  ],
  'Christian Religious Studies (CRS)': [
    'Sovereignty of God & Creation',
    'The Patriarchs & Covenant (Leadership in the Old Testament)',
    'The Prophets & Kingship in Israel',
    'The Life and Teachings of Jesus Christ',
    'The Miracles & Parables of Jesus',
    'The Early Church & the Apostles',
    'The Missionary Journeys of Paul',
    'Christian Ethics & Morality',
  ],
  'Islamic Religious Studies (IRS)': [
    'Tawhid & Faith (Belief in Allah)',
    'The Holy Quran (Revelation, Themes & Interpretation)',
    'Hadith & Sunnah',
    'Fiqh (Islamic Jurisprudence & Ibadah)',
    'Life of the Prophet Muhammad (SAW)',
    'Islamic History & the Caliphates',
    'Islamic Culture, Civilization & Ethics',
  ],
  'Geography': [
    'Practical Geography (Map Reading, Scale, Field Survey Techniques)',
    'Physical Geography (Earth Structure, Landforms, Weather & Climate)',
    'Human Geography (Population, Settlement, Migration)',
    'Economic Geography (Agriculture, Industry, Trade, Transport)',
    'Geography of Nigeria & Regional Geography of Africa',
    'Environmental Issues & Resource Management',
  ],
  'Financial Accounting': [
    'Basic Accounting Concepts & Principles',
    'Source Documents & Books of Original Entry',
    'The Ledger, Trial Balance & Correction of Errors',
    'Final Accounts of Sole Traders',
    'Partnership Accounts',
    'Company Accounts',
    'Manufacturing Accounts',
    'Public Sector (Government) Accounting',
    'Accounting Ratios & Interpretation of Accounts',
  ],
  'Commerce': [
    'Introduction to Commerce (Trade & Production)',
    'Home & Foreign Trade',
    'Aids/Auxiliaries to Trade (Banking, Insurance, Transport, Warehousing)',
    'Business Units & Forms of Business Organization',
    'The Stock Exchange & Money Market',
    'Legal Aspects of Business',
    'Population & Its Effect on Commerce',
    'Government & Business (Public Enterprises)',
  ],
  'Literature in English': [
    'Literary Terms & Appreciation (Devices, Genres, Figures of Speech)',
    'African Prose',
    'Non-African Prose',
    'Drama (African & Non-African Plays)',
    'Poetry (African & Non-African Poems)',
  ],
  'Agricultural Science': [
    'Crop Production & Crop Protection',
    'Animal Husbandry & Livestock Production',
    'Soil Science (Formation, Properties & Fertility)',
    'Farm Management & Agricultural Economics',
    'Agricultural Extension & Rural Sociology',
    'Farm Mechanization & Agricultural Engineering',
    'Forestry, Fisheries & Wildlife',
    'Agro-allied Processing & Marketing',
  ],
  'Yoruba': [
    'Àpòpọ̀ Èdè (Grammar & Structure)',
    'Àṣà àti Ìṣe Ìbílẹ̀ (Culture & Tradition)',
    'Lítíréṣọ̀ (Oral & Written Literature)',
    'Ìtàn Àwọn Yorùbá (History of the Yoruba)',
  ],
  'Hausa': [
    'Grama (Grammar & Structure)',
    "Al'adu (Culture & Tradition)",
    'Adabi (Oral & Written Literature)',
    'Tarihin Hausawa (History of the Hausa)',
  ],
  'Igbo': [
    'Ụtọasụsụ (Grammar & Structure)',
    'Omenala na Ọdịnala (Culture & Tradition)',
    'Mmemme Agụmagụ (Oral & Written Literature)',
    'Akụkọ Ndị Igbo (History of the Igbo)',
  ],
};

const EXAM_YEARS = Array.from({ length: 2026 - 2005 + 1 }, (_, i) => (2026 - i).toString());

export default function HomeScreen({
  userProfile,
  history = [],
  stats = {},
  isActivated = false,
  onStartExam,
  onStartWeaknessDrill,
  onOpenActivation,
  onOpenHistory,
  onOpenAiTutor,
}) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSetupPanel, setShowSetupPanel] = useState(false);

  // CBT Setup form states
  const [examYearMode, setExamYearMode] = useState('Random Questions');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [totalQuestions, setTotalQuestions] = useState('40');

  // Extract synchronized stats with fallbacks
  const {
    totalMockTests = history.length,
    totalQuestionsSolved = 0,
    overallAccuracy = 0,
    predictedJambScore = 0,
    subjectBreakdown = {},
  } = stats;

  const handleSubjectChange = (e) => {
    const subjectName = e.target.value;
    setSelectedSubject(subjectName);
    setSelectedTopic('All Topics');
    if (subjectName) {
      setShowSetupPanel(true);
    }
  };

  const handleLaunchCbt = (e) => {
    e.preventDefault();
    if (!selectedSubject) return;

    const hoursInMins = parseInt(durationHours || '0', 10) * 60;
    const mins = parseInt(durationMinutes || '0', 10);
    const totalDuration = hoursInMins + mins || 90;

    const cleanYear = examYearMode.includes('Random')
      ? 'Random'
      : examYearMode.replace(/\D/g, '');

    onStartExam({
      subject: selectedSubject,
      mode: 'practice',
      year: cleanYear || 'Random',
      topic: selectedTopic === 'All Topics' ? '' : selectedTopic,
      durationInMinutes: totalDuration,
      limit: parseInt(totalQuestions, 10) || 40,
    });
  };

  const availableTopics = SUBJECT_TOPICS[selectedSubject] || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 font-sans">
      
      {/* 1. TOP HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* SBEDTECH CBT PORTAL HEADER CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5 relative z-20 h-full flex flex-col justify-center">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
              SbedTech CBT Portal
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
              Welcome back, <span className="font-bold text-slate-800">{userProfile?.fullName || 'Candidate'}</span>! Select a subject to configure your setup.
            </p>
          </div>

          {/* SUBJECT DROPDOWN SELECTOR */}
          <div className="relative max-w-md mx-auto w-full">
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition cursor-pointer text-center appearance-none focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              <option value="" disabled className="bg-slate-900 text-white">
                👇 Select Subject to Begin Practice
              </option>
              {SUBJECT_LIST.map((sub) => (
                <option 
                  key={sub.name} 
                  value={sub.name} 
                  className="bg-slate-900 text-white font-semibold"
                >
                  {sub.icon} {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* ATTEMPT HISTORY BUTTON */}
          <div>
            <button
              onClick={onOpenHistory}
              className="px-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl shadow-sm transition inline-flex items-center gap-2"
            >
              📜 Attempt History ({totalMockTests})
            </button>
          </div>
        </div>

        {/* CBT SETUP FORM OR ACTION REQUIRED BANNER */}
        {showSetupPanel && selectedSubject ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">
                CBT Setup: <span className="text-blue-600">{selectedSubject}</span>
              </h3>
              <button
                onClick={() => setShowSetupPanel(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleLaunchCbt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Exam Year / Mode */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600">
                    Exam Year / Mode
                  </label>
                  <select
                    value={examYearMode}
                    onChange={(e) => setExamYearMode(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Random Questions">🎲 Random Questions</option>
                    {EXAM_YEARS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} Past Questions
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Selector Filter */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600">
                    Filter by Topic (Optional)
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All Topics">📚 All Topics (Full Syllabus)</option>
                    {availableTopics.map((top) => (
                      <option key={top} value={top}>
                        🎯 {top}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Hours */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Duration Minutes */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Total Questions */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition"
              >
                Start {selectedSubject} ({selectedTopic !== 'All Topics' ? selectedTopic : examYearMode}) - Practice Mode
              </button>
            </form>
          </div>
        ) : (
          !isActivated && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Action Required: Activate Exam Mode
                </h4>
                <p className="text-xs text-amber-800 font-medium">
                  Unlock full platform capabilities and expert exam tools:
                </p>
              </div>

              <ul className="space-y-2 text-xs text-amber-950 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Full timed mock examinations with official JAMB grading algorithms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Access to Comprehensive study materials
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Live AI Tutor / Fully Trained Expert System
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> One-on-One online Tutorial
                </li>
              </ul>

              <button
                type="button"
                onClick={onOpenActivation}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-2xl shadow transition"
              >
                Unlock Exam Mode Now
              </button>
            </div>
          )
        )}
      </div>

      {/* 2. SYNCHRONIZED ANALYTICS DASHBOARD WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Predicted JAMB Score</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {predictedJambScore}
            </h3>
            <span className="text-xs text-slate-400 font-bold">/ 400</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mock Tests</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
            {totalMockTests}
          </h3>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Questions Solved</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
            {totalQuestionsSolved}
          </h3>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Accuracy</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1">
            {overallAccuracy}%
          </h3>
        </div>
      </div>

      {/* 3. SUBJECT PERFORMANCE ACCURACY BREAKDOWN */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-800 text-sm">Subject Accuracy Breakdown</h4>
          <button
            onClick={onOpenHistory}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View Full Exam History →
          </button>
        </div>

        {Object.keys(subjectBreakdown).length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No practice history available yet. Complete a test session to view your real-time subject accuracy breakdown.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subjectBreakdown).map(([subject, data]) => {
              const accuracy = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
              return (
                <div key={subject} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="uppercase tracking-wider">{subject}</span>
                    <span>{accuracy}% ({data.score}/{data.total})</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        accuracy >= 70 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SBEDTECH AI EXPERT TUTOR HYBRID CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Background Accent Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* Card Left Header Details */}
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                NERDC Aligned
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-slate-300 text-[10px] font-extrabold uppercase tracking-wider rounded-full backdrop-blur-md">
                WAEC • NECO • UTME
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>🤖</span> SbedTech AI Expert Tutor
            </h2>

            <p className="text-xs sm:text-sm font-normal text-slate-300 leading-relaxed">
              Trained on the Nigerian NERDC curriculum across all subjects. Get exact Performance Objectives, WAEC/NECO theory breakdowns, and UTME speed strategies using localized real-world examples.
            </p>
          </div>

          {/* Card Right Action Area */}
          <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2 shrink-0">
            {isActivated ? (
              <button
                type="button"
                onClick={onOpenAiTutor}
                className="w-full md:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>Ask AI Expert Tutor</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ) : (
              <div className="space-y-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={onOpenActivation}
                  className="w-full md:w-auto px-7 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>🔒 Unlock AI Tutor Access</span>
                </button>
                <p className="text-[10px] text-amber-200/80 text-center md:text-right font-medium">
                  Requires Exam Mode Activation
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 5. EMBEDDED INLINE DASHBOARD */}
      <DashboardView
        userProfile={userProfile}
        history={history}
        onStartWeaknessDrill={onStartWeaknessDrill}
      />
    </div>
  );
}