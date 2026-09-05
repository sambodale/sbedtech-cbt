import React, { useState } from 'react';
import Navigation from './Navigation';

export default function QuestionCard({ questions, mode, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit your exam?')) {
      onExit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Question Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-white">
        <h3 className="text-lg font-bold mb-4">Question {currentIndex + 1}</h3>
        <p className="text-slate-300 mb-6">{currentQuestion?.question}</p>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {['a', 'b', 'c', 'd'].map((optionKey) => (
            currentQuestion?.option?.[optionKey] && (
              <label 
                key={optionKey}
                className="flex items-center p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-800 transition"
              >
                <input type="radio" name="option" className="mr-3" />
                <span className="uppercase font-bold mr-2 text-blue-400">{optionKey}.</span>
                <span>{currentQuestion.option[optionKey]}</span>
              </label>
            )
          ))}
        </div>
      </div>

      {/* Navigation Toolbar */}
      <Navigation
        currentQuestion={currentIndex + 1}
        totalQuestions={totalQuestions}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmit}
      />
    </div>
  );
}