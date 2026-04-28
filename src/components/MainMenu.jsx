import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Play, Target, Sliders } from 'lucide-react';

export default function MainMenu({ history, focusHistory, setAppView, setResumeMode, setReviewData, setFocusModeDomain }) {
  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sat_in_progress')) {
      setHasSavedSession(true);
    }
  }, []);

  const weakestDomain = useMemo(() => {
    const domainStats = {};
    const now = Date.now();
    const msInDay = 1000 * 60 * 60 * 24;

    const processEntry = (dateStr, domain, correct, total) => {
        const daysOld = (now - new Date(dateStr).getTime()) / msInDay;
        let weight = 0.5;
        if (daysOld <= 7) weight = 1.5;
        else if (daysOld <= 30) weight = 1.0;
        
        if (!domainStats[domain]) domainStats[domain] = { weightedCorrect: 0, weightedTotal: 0, rawTotal: 0 };
        domainStats[domain].weightedCorrect += (correct * weight);
        domainStats[domain].weightedTotal += (total * weight);
        domainStats[domain].rawTotal += total;
    };

    if (history && history.length > 0) {
      history.forEach(h => {
        if (!h.domainAnalysis) return;
        const testDate = h.date || new Date().toISOString();
        Object.entries(h.domainAnalysis).forEach(([domain, stats]) => {
            processEntry(testDate, domain, stats.correct, stats.total);
        });
      });
    }

    if (focusHistory && focusHistory.length > 0) {
      focusHistory.forEach(drill => {
         processEntry(drill.date, drill.domain, drill.correct, drill.total);
      });
    }

    let minPct = Infinity;
    let weakest = null;
    let fallback = null;
    for (const [domain, stats] of Object.entries(domainStats)) {
      if (stats.rawTotal > 0 && !fallback) fallback = domain;
      if (stats.rawTotal >= 3) {
        const pct = stats.weightedTotal > 0 ? stats.weightedCorrect / stats.weightedTotal : 0;
        if (pct < minPct) {
          minPct = pct;
          weakest = domain;
        }
      }
    }
    return weakest || fallback || null;
  }, [history, focusHistory]);

  return (
    <div className="h-screen overflow-y-auto bg-[#F3F4F6] p-6 font-sans text-slate-800">
      <div className="min-h-full flex items-center justify-center w-full py-8">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-[#2A275D] p-12 text-white text-center">
            <h1 className="text-4xl font-bold mb-2 tracking-tight">SAT Simulator</h1>
            <p className="text-blue-200 text-lg font-light">Local Adaptive Engine</p>
          </div>
          <div className="p-10 flex flex-col space-y-6">
            {hasSavedSession && (
              <button onClick={() => { setResumeMode(true); setAppView('test'); }} className="px-8 py-6 w-full bg-[#3B418E] hover:bg-[#2A2E6B] text-white rounded-xl transition-all text-left flex items-center group shadow-md hover:shadow-lg border-none">
                <div className="bg-white/20 p-3 rounded-full mr-6 shrink-0">
                  <Play className="text-white" size={28} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">Resume In-Progress Test</h2>
                  <p className="text-blue-200 text-sm">Pick up exactly where you left off from your last session.</p>
                </div>
              </button>
            )}
            <div className="grid md:grid-cols-3 gap-6">
              <button onClick={() => { setResumeMode(false); setReviewData(null); setAppView('test'); setFocusModeDomain(null); }} className="p-8 bg-white border-2 border-[#E2E8F0] hover:border-[#2A275D] rounded-xl transition-all text-left flex flex-col justify-between group shadow-sm hover:shadow-md">
                <Play className="text-[#2A275D] mb-4" size={40} fill="currentColor" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Practice Test</h2>
                <p className="text-slate-500 text-sm">Full-length adaptive exam. Interface mimics the official application.</p>
              </button>
              <button onClick={() => setAppView('custom')} className="p-8 bg-white border-2 border-[#E2E8F0] hover:border-[#3B82F6] rounded-xl transition-all text-left flex flex-col justify-between group shadow-sm hover:shadow-md">
                <Sliders className="text-[#3B82F6] mb-4" size={40} />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Custom Test</h2>
                <p className="text-slate-500 text-sm">Build your own drill with selected subjects and domains.</p>
              </button>
              <button onClick={() => setAppView('history')} className="p-8 bg-white border-2 border-[#E2E8F0] hover:border-[#10B981] rounded-xl transition-all text-left flex flex-col justify-between group shadow-sm hover:shadow-md">
                <LineChart className="text-[#10B981] mb-4" size={40} />
                <h2 className="text-xl font-bold text-slate-800 mb-2">My Scores</h2>
                <p className="text-slate-500 text-sm">Review your past performance and adaptive path history.</p>
              </button>
            </div>

            <div className="border-t border-slate-200 mt-6 pt-6">
              <button
                disabled={!weakestDomain}
                onClick={() => { setFocusModeDomain(weakestDomain); setResumeMode(false); setReviewData(null); setAppView('test'); }}
                className={`w-full p-6 border-2 rounded-xl text-left flex items-center group transition-all shadow-sm ${weakestDomain ? 'bg-amber-50 border-amber-200 hover:border-amber-400 cursor-pointer' : 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'}`}
                title={!weakestDomain ? 'Take a practice test to unlock' : undefined}
              >
                <div className={`p-3 rounded-full mr-4 shrink-0 transition-colors ${weakestDomain ? 'bg-amber-200 text-amber-800 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Target size={28} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold mb-1 ${weakestDomain ? 'text-amber-900' : 'text-slate-500'}`}>Focus Drill: {weakestDomain || 'Locked'}</h2>
                  <p className={`text-sm ${weakestDomain ? 'text-amber-700' : 'text-slate-400'}`}>
                    {weakestDomain ? `Target your weakest domain with a 10-question, 15-minute quick drill.` : 'Take a practice test to unlock targeted weakness drills.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
