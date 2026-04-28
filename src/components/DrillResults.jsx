import React, { useMemo } from 'react';
import { Target, RotateCcw, Home, CheckCircle, XCircle } from 'lucide-react';

export default function DrillResults({ result, setAppView, setReviewData, setCustomTestParams, setResumeMode, setFocusModeDomain }) {
  
  const domainAnalysis = result?.domainAnalysis || {};
  
  const domains = useMemo(() => {
    return Object.entries(domainAnalysis).map(([domain, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return { domain, correct: data.correct, total: data.total, pct };
    }).sort((a, b) => a.pct - b.pct);
  }, [domainAnalysis]);

  const weakDomains = domains.filter(d => d.pct < 75).map(d => d.domain);

  const startWeaknessDrill = () => {
    setCustomTestParams({
      subjects: ['rw', 'math'], // Include both, but filter by domain
      domains: weakDomains.length > 0 ? weakDomains : domains.map(d => d.domain),
      questionCount: 20
    });
    setResumeMode(false);
    setReviewData(null);
    setFocusModeDomain(null);
    setAppView('test');
  };

  const handleReview = () => {
    setCustomTestParams(null);
    setResumeMode(false);
    setFocusModeDomain(null);
    setReviewData(result);
    setAppView('test');
  };

  return (
    <div className="h-screen w-screen bg-[#F3F4F6] overflow-y-auto p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-[#2A275D] p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Drill Complete</h1>
          <p className="text-blue-200 text-lg">Here is how you performed on this specific test.</p>
        </div>

        <div className="p-8">
          <div className="flex justify-center mb-10">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Overall Score</p>
              <div className="flex items-end justify-center space-x-1">
                <span className="text-6xl font-black text-[#2A275D]">{result.correct || 0}</span>
                <span className="text-2xl font-bold text-slate-400 mb-1">/ {result.questionCount || result.total || 0}</span>
              </div>
              <p className="text-lg font-semibold text-slate-500 mt-2">
                {result.total ?? 0}% Accuracy
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Domain Breakdown</h2>
            <div className="space-y-4">
              {domains.map(({ domain, correct, total, pct }) => (
                <div key={domain} className="flex items-center space-x-4">
                  <span className="w-1/3 text-sm font-semibold text-slate-700">{domain}</span>
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' 
                      }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-bold text-slate-600">
                    {correct}/{total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-center">
            {weakDomains.length > 0 ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex justify-center items-center">
                  <Target className="mr-2 text-amber-500" /> Focus Areas Identified
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  You scored below 75% in <span className="font-bold text-slate-800">{weakDomains.join(', ')}</span>. 
                  We recommend starting a new drill focused exclusively on these topics.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-emerald-600 mb-2 flex justify-center items-center">
                  <CheckCircle className="mr-2" /> Excellent Performance
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  You scored above 75% in all tested domains. Keep up the great work!
                </p>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <button 
              onClick={handleReview}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <RotateCcw className="text-slate-400 group-hover:text-blue-500 mb-2" size={28} />
              <span className="font-bold text-slate-700 group-hover:text-blue-700 text-sm">Review Missed</span>
            </button>
            
            <button 
              onClick={startWeaknessDrill}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors group ${weakDomains.length > 0 ? 'border-amber-200 bg-amber-50 hover:border-amber-400' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'}`}
            >
              <Target className={`mb-2 ${weakDomains.length > 0 ? 'text-amber-500 group-hover:text-amber-600' : 'text-slate-400 group-hover:text-emerald-500'}`} size={28} />
              <span className={`font-bold text-sm ${weakDomains.length > 0 ? 'text-amber-700' : 'text-slate-700 group-hover:text-emerald-700'}`}>
                {weakDomains.length > 0 ? 'Drill Weak Areas' : 'Start New Drill'}
              </span>
            </button>

            <button 
              onClick={() => setAppView('menu')}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors group"
            >
              <Home className="text-slate-400 group-hover:text-slate-600 mb-2" size={28} />
              <span className="font-bold text-slate-700 group-hover:text-slate-800 text-sm">Return Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
