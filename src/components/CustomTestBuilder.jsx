import React, { useState } from 'react';
import { Target, CheckCircle } from 'lucide-react';

const RW_DOMAINS = ['Information and Ideas', 'Standard English Conventions', 'Expression of Ideas', 'Craft and Structure'];
const MATH_DOMAINS = ['Algebra', 'Advanced Math', 'Problem Solving and Data Analysis', 'Geometry and Trigonometry'];

export default function CustomTestBuilder({ onStart, onCancel }) {
  const [subjects, setSubjects] = useState(['rw', 'math']);
  const [selectedDomains, setSelectedDomains] = useState([...RW_DOMAINS, ...MATH_DOMAINS]);
  const [questionCount, setQuestionCount] = useState(20);

  const toggleSubject = (sub) => {
    setSubjects(prev => {
      let next = [...prev];
      if (next.includes(sub)) next = next.filter(s => s !== sub);
      else next.push(sub);
      
      let domains = [...selectedDomains];
      const targetDomains = sub === 'rw' ? RW_DOMAINS : MATH_DOMAINS;
      
      if (!prev.includes(sub)) {
        targetDomains.forEach(d => { if (!domains.includes(d)) domains.push(d); });
      } else {
        domains = domains.filter(d => !targetDomains.includes(d));
      }
      setSelectedDomains(domains);
      
      return next;
    });
  };

  const toggleDomain = (domain) => {
    setSelectedDomains(prev => {
      if (prev.includes(domain)) return prev.filter(d => d !== domain);
      return [...prev, domain];
    });
  };

  const handleStart = () => {
    if (subjects.length === 0 || selectedDomains.length === 0) return;
    onStart({ subjects, domains: selectedDomains, questionCount: Number(questionCount) });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#2A275D] p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Custom Test Builder</h2>
          <button onClick={onCancel} className="text-blue-200 hover:text-white font-bold">✕ Close</button>
        </div>
        
        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">1. Select Subjects</h3>
            <div className="flex space-x-4">
              <button 
                onClick={() => toggleSubject('rw')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${subjects.includes('rw') ? 'border-[#3B418E] bg-[#F0F7FF] text-[#3B418E]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                Reading & Writing
              </button>
              <button 
                onClick={() => toggleSubject('math')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${subjects.includes('math') ? 'border-[#3B418E] bg-[#F0F7FF] text-[#3B418E]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                Math
              </button>
            </div>
          </div>

          {subjects.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">2. Select Domains</h3>
              <div className="grid grid-cols-2 gap-3">
                {subjects.includes('rw') && RW_DOMAINS.map(domain => (
                  <button 
                    key={domain} 
                    onClick={() => toggleDomain(domain)}
                    className={`text-left px-4 py-3 rounded-md border text-sm font-medium flex items-center justify-between transition-colors ${selectedDomains.includes(domain) ? 'border-[#10B981] bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {domain}
                    {selectedDomains.includes(domain) && <CheckCircle size={16} className="text-[#10B981]" />}
                  </button>
                ))}
                {subjects.includes('math') && MATH_DOMAINS.map(domain => (
                  <button 
                    key={domain} 
                    onClick={() => toggleDomain(domain)}
                    className={`text-left px-4 py-3 rounded-md border text-sm font-medium flex items-center justify-between transition-colors ${selectedDomains.includes(domain) ? 'border-[#10B981] bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {domain}
                    {selectedDomains.includes(domain) && <CheckCircle size={16} className="text-[#10B981]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">3. Number of Questions</h3>
            <select 
              value={questionCount} 
              onChange={(e) => setQuestionCount(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#3B418E]"
            >
              <option value="10">10 Questions (approx. 15 mins)</option>
              <option value="20">20 Questions (approx. 30 mins)</option>
              <option value="40">40 Questions (approx. 60 mins)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button 
              onClick={handleStart}
              disabled={subjects.length === 0 || selectedDomains.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${subjects.length > 0 && selectedDomains.length > 0 ? 'bg-[#3B418E] hover:bg-[#2A2E6B] text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              <Target className="mr-2" /> Start Custom Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
