import React, { useState } from 'react';

export default function CalculatorModal({ isOpen, onClose }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  if (!isOpen) return null;

  const handleNumber = (num) => {
    setDisplay((prev) => (prev === '0' ? String(num) : prev + num));
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const handleOperator = (op) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleFunction = (func) => {
    try {
      const current = parseFloat(display);
      let result = current;

      switch (func) {
        case 'sqrt':
          if (current < 0) throw new Error('Invalid input');
          result = Math.sqrt(current);
          break;
        case 'square':
          result = Math.pow(current, 2);
          break;
        case 'reciprocal':
          if (current === 0) throw new Error('Division by zero');
          result = 1 / current;
          break;
        case 'negate':
          result = -current;
          break;
        case 'percent':
          result = current / 100;
          break;
        default:
          break;
      }
      setDisplay(String(result));
    } catch (error) {
      setDisplay('Error');
    }
  };

  const handleCalculate = () => {
    try {
      const fullExpression = equation + display;
      const sanitizedExpr = fullExpression.replace(/×/g, '*').replace(/÷/g, '/');
      
      // Safely evaluate using Function constructor instead of direct eval()
      const result = Function(`'use strict'; return (${sanitizedExpr})`)();
      
      setDisplay(String(result));
      setEquation('');
    } catch (error) {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center bg-slate-100 px-4 py-3 border-b border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Standard Calculator</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-0.5 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-900 text-right p-4 text-white">
          <div className="text-xs text-slate-400 min-h-[16px] truncate">{equation}</div>
          <div className="text-2xl font-mono font-bold tracking-wider truncate mt-1">{display}</div>
        </div>

        {/* Keypad Layout */}
        <div className="grid grid-cols-4 gap-1.5 p-3 bg-slate-50">
          {/* Row 1: Memory / Clear / Utility */}
          <button onClick={handleClear} className="p-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-bold text-xs transition">AC</button>
          <button onClick={handleBackspace} className="p-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition">⌫</button>
          <button onClick={() => handleFunction('percent')} className="p-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition">%</button>
          <button onClick={() => handleOperator('÷')} className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold text-sm transition">÷</button>

          {/* Row 2: Powers & Roots */}
          <button onClick={() => handleFunction('square')} className="p-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition">x²</button>
          <button onClick={() => handleFunction('sqrt')} className="p-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition">√x</button>
          <button onClick={() => handleFunction('reciprocal')} className="p-3 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition">1/x</button>
          <button onClick={() => handleOperator('×')} className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold text-sm transition">×</button>

          {/* Row 3: Numbers 7-9 */}
          <button onClick={() => handleNumber(7)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">7</button>
          <button onClick={() => handleNumber(8)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">8</button>
          <button onClick={() => handleNumber(9)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">9</button>
          <button onClick={() => handleOperator('-')} className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold text-sm transition">-</button>

          {/* Row 4: Numbers 4-6 */}
          <button onClick={() => handleNumber(4)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">4</button>
          <button onClick={() => handleNumber(5)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">5</button>
          <button onClick={() => handleNumber(6)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">6</button>
          <button onClick={() => handleOperator('+')} className="p-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold text-sm transition">+</button>

          {/* Row 5: Numbers 1-3 */}
          <button onClick={() => handleNumber(1)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">1</button>
          <button onClick={() => handleNumber(2)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">2</button>
          <button onClick={() => handleNumber(3)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">3</button>
          <button onClick={handleCalculate} className="row-span-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center transition shadow-sm">=</button>

          {/* Row 6: Negate, 0, Decimal */}
          <button onClick={() => handleFunction('negate')} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">±</button>
          <button onClick={() => handleNumber(0)} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">0</button>
          <button onClick={handleDecimal} className="p-3 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold transition">.</button>
        </div>

      </div>
    </div>
  );
}