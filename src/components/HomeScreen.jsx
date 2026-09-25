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

// Exam Mode always requires exactly this many subjects, with English locked in
const EXAM_SUBJECT_COUNT = 4;
const MANDATORY_SUBJECT = 'Use of English';
const EXAM_DURATION_MINUTES = 120; // Fixed 2 hours, matching real UTME sittings
const EXAM_QUESTIONS_PER_SUBJECT = 40;

export default function HomeScreen({
  userProfile,
  history = [],
  isActivated = false,
  onStartExam,
  onStartWeaknessDrill,
  onOpenActivation,
  onOpenPinActivation, // 🔑 Dedicated admin pin modal trigger
  onOpenHistory,
  onOpenAiTutor,
}) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSetupPanel, setShowSetupPanel] = useState(false);

  // CBT Setup form states (Practice Mode)
  const [examYearMode, setExamYearMode] = useState('Random Questions');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [totalQuestions, setTotalQuestions] = useState('40');

  // Test Mode toggle (requires activation for 'exam')
  const [testMode, setTestMode] = useState('practice');

  // Exam Mode subject picker: always includes English, up to 4 total
  const [examSubjects, setExamSubjects] = useState([MANDATORY_SUBJECT]);

  const handleSubjectChange = (e) => {
    const subjectName = e.target.value;
    setSelectedSubject(subjectName);
    setSelectedTopic('All Topics');
    setTestMode('practice');
    if (subjectName) {
      setShowSetupPanel(true);
    }
  };

  const handleModeChange = (mode) => {
    setTestMode(mode);
    if (mode === 'exam') {
      // Seed the exam subject list with English plus whatever was picked up top
      setExamSubjects((prev) => {
        const base = prev.includes(MANDATORY_SUBJECT) ? prev : [MANDATORY_SUBJECT, ...prev];
        if (selectedSubject && !base.includes(selectedSubject) && base.length < EXAM_SUBJECT_COUNT) {
          return [...base, selectedSubject];
        }
        return base;
      });
    }
  };

  const toggleExamSubject = (name) => {
    if (name === MANDATORY_SUBJECT) return; // English is locked, cannot be removed
    setExamSubjects((prev) => {
      if (prev.includes(name)) {
        return prev.filter((s) => s !== name);
      }
      if (prev.length >= EXAM_SUBJECT_COUNT) return prev; // already at 4, ignore
      return [...prev, name];
    });
  };

  const handleLaunchCbt = (e) => {
    e.preventDefault();

    const cleanYear = examYearMode.includes('Random')
      ? 'Random'
      : examYearMode.replace(/\D/g, '');

    if (testMode === 'exam') {
      // 🔒 Enforce that Exam Mode requires activation
      if (!isActivated) {
        alert('Official Exam Mode requires an admin-confirmed activation pin or online payment verification.');
        onOpenPinActivation();
        return;
      }

      if (examSubjects.length !== EXAM_SUBJECT_COUNT || !examSubjects.includes(MANDATORY_SUBJECT)) {
        alert(`Please select exactly ${EXAM_SUBJECT_COUNT} subjects for Exam Mode, including Use of English.`);
        return;
      }

      onStartExam({
        mode: 'exam',
        subjects: examSubjects,
        year: cleanYear || 'Random',
        durationInMinutes: EXAM_DURATION_MINUTES,
        limit: EXAM_QUESTIONS_PER_SUBJECT,
      });
      return;
    }

    // Practice Mode: single subject, as before
    if (!selectedSubject) return;

    const hoursInMins = parseInt(durationHours || '0', 10) * 60;
    const mins = parseInt(durationMinutes || '0', 10);
    const totalDuration = hoursInMins + mins || 90;

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
  const canLaunchExam = examSubjects.length === EXAM_SUBJECT_COUNT;

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
              Welcome back, <span className="font-bold text-slate-800">{userProfile?.fullName || userProfile?.username || userProfile?.email || 'Candidate'}</span>! Select a subject to configure your setup.
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
              📜 Attempt History
            </button>
          </div>
        </div>

        {/* CBT SETUP FORM OR ACTION REQUIRED BANNER */}
        {showSetupPanel && selectedSubject ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">
                CBT Setup{testMode === 'practice' && <>: <span className="text-blue-600">{selectedSubject}</span></>}
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

                {/* Session Mode Selector: Practice vs Official Exam */}
                <div className="space-y-1 sm:col-span-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <label className="block text-xs font-black text-blue-900 uppercase tracking-wider mb-1.5">
                    Select Session Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleModeChange('exam')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition ${
                        testMode === 'exam'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🚀 Full Exam Mode {!isActivated && '🔒'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('practice')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition ${
                        testMode === 'practice'
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      📚 Practice Mode (Free)
                    </button>
                  </div>
                  {testMode === 'exam' && !isActivated && (
                    <p className="text-[11px] text-amber-700 font-bold mt-1">
                      ⚠️ Requires activation pin confirmed by admin after payment.
                    </p>
                  )}
                </div>

                {/* EXAM MODE: 4-subject picker (English locked in) */}
                {testMode === 'exam' && (
                  <div className="space-y-1.5 sm:col-span-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-black text-emerald-900 uppercase tracking-wider">
                        Choose {EXAM_SUBJECT_COUNT} Subjects
                      </label>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          canLaunchExam ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {examSubjects.length} / {EXAM_SUBJECT_COUNT} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                      {SUBJECT_LIST.map((sub) => {
                        const isMandatory = sub.name === MANDATORY_SUBJECT;
                        const isChecked = examSubjects.includes(sub.name);
                        const isDisabled = isMandatory || (!isChecked && examSubjects.length >= EXAM_SUBJECT_COUNT);
                        return (
                          <label
                            key={sub.name}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                              isChecked
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isDisabled
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => toggleExamSubject(sub.name)}
                            />
                            <span>{sub.icon}</span>
                            <span className="truncate">
                              {sub.name}
                              {isMandatory ? ' (required)' : ''}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {!canLaunchExam && (
                      <p className="text-[11px] text-amber-700 font-bold">
                        Pick {EXAM_SUBJECT_COUNT - examSubjects.length} more subject{EXAM_SUBJECT_COUNT - examSubjects.length === 1 ? '' : 's'} to continue.
                      </p>
                    )}
                  </div>
                )}

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

                {/* Topic Selector Filter (Practice Mode only — a topic filter across 4 subjects doesn't apply) */}
                {testMode === 'practice' && (
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
                )}

                {testMode === 'exam' ? (
                  <div className="space-y-1 sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-700">
                      ⏱️ Fixed Duration: 2 Hours &nbsp;•&nbsp; 📝 40 Questions per subject ({EXAM_QUESTIONS_PER_SUBJECT * EXAM_SUBJECT_COUNT} total)
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={testMode === 'exam' && !canLaunchExam}
                className={`w-full py-3.5 font-extrabold text-sm rounded-2xl shadow-md transition text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  testMode === 'exam'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {testMode === 'exam'
                  ? `🚀 Launch ${EXAM_SUBJECT_COUNT}-Subject UTME Mock (2 Hours)`
                  : `▶ Start ${selectedSubject} Practice`}
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
                  Practice mode is completely free. To unlock official timed mock exams and expert tools, choose your preferred option below:
                </p>
              </div>

              <ul className="space-y-2 text-xs text-amber-950 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Full timed mock examinations with official JAMB grading algorithms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Access to comprehensive study materials
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Live AI Tutor / Fully Trained Expert System
                </li>
              </ul>

              <div className="space-y-2 pt-2">
                {/* 1. Pay Online via Paystack */}
                <button
                  type="button"
                  onClick={onOpenActivation}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>💳 Pay Online via Paystack</span>
                </button>

                {/* 2. Admin Pin Entry */}
                <button
                  type="button"
                  onClick={onOpenPinActivation}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <span>🔑 Enter Activation Pin from Admin</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* 2. SBEDTECH AI EXPERT TUTOR HYBRID CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
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
                  className="w-full md:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>💳 Unlock AI Tutor via Paystack</span>
                </button>
                <p className="text-[10px] text-amber-200/80 text-center md:text-right font-medium">
                  Requires Exam Mode Activation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. EMBEDDED INLINE DASHBOARD */}
      <DashboardView
        userProfile={userProfile}
        history={history}
        onStartWeaknessDrill={onStartWeaknessDrill}
      />
    </div>
  );
}