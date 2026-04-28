import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';

export default function HistoryView({ history, focusHistory, setAppView, deleteExam, deleteFocusDrill, setReviewData }) {
  const [activeTab, setActiveTab] = useState('full');
  const [expandedId, setExpandedId] = useState(null);

  const reversedHistory = useMemo(() => [...history].reverse(), [history]);
  const reversedFocusHistory = useMemo(() => [...focusHistory].reverse(), [focusHistory]);

  const domainAverages = useMemo(() => {
    const stats = {};
    history.forEach(h => {
      if (!h.domainAnalysis) return;
      Object.entries(h.domainAnalysis).forEach(([domain, data]) => {
        if (!stats[domain]) stats[domain] = { correct: 0, total: 0 };
        stats[domain].correct += data.correct;
        stats[domain].total += data.total;
      });
    });
    const avg = {};
    Object.entries(stats).forEach(([domain, data]) => {
      avg[domain] = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    });
    return avg;
  }, [history]);

  const aggregateStats = useMemo(() => {
    if (history.length === 0) return null;
    let totalScore = 0, rwScore = 0, mathScore = 0;
    history.forEach(h => {
      totalScore += (h.totalScore ?? h.total ?? 0);
      rwScore += (h.rwScore ?? h.rw ?? 0);
      mathScore += (h.mathScore ?? h.math ?? 0);
    });
    return {
      total: Math.round(totalScore / history.length),
      rw: Math.round(rwScore / history.length),
      math: Math.round(mathScore / history.length)
    };
  }, [history]);

  const latestWithDomains = useMemo(() => reversedHistory.find(h => h.domainAnalysis && Object.keys(h.domainAnalysis).length > 0), [reversedHistory]);

  const weakestDomains = useMemo(() => latestWithDomains
    ? Object.entries(latestWithDomains.domainAnalysis)
      .map(([domain, { correct, total }]) => ({ domain, correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
    : [], [latestWithDomains]);

  return (
    <div className="h-screen overflow-y-auto bg-[#F3F4F6] p-8 text-[#1E293B] font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center"><History className="mr-3 text-[#2A275D]" /> Past Scores</h1>
          <button onClick={() => setAppView('menu')} className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 font-medium text-sm">Return Home</button>
        </div>

        <div className="flex border-b border-slate-300 mb-8 -mt-2">
          <button 
            onClick={() => setActiveTab('full')}
            className={`py-3 px-6 font-bold text-lg border-b-[3px] transition-colors ${activeTab === 'full' ? 'border-[#2A275D] text-[#1E293B] bg-[#F0F7FF]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Full Practice Tests
          </button>
          <button 
            onClick={() => setActiveTab('focusDrill')}
            className={`py-3 px-6 font-bold text-lg border-b-[3px] transition-colors ${activeTab === 'focusDrill' ? 'border-[#2A275D] text-[#1E293B] bg-[#F0F7FF]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Custom/Focus Drills
          </button>
        </div>

        {activeTab === 'focusDrill' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#2A275D] px-6 py-4 border-b border-slate-300">
              <h2 className="text-xl font-bold text-white">Focus & Custom Drill History</h2>
            </div>
            {reversedFocusHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No drills completed yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4 rounded-tl-lg font-bold">Date</th>
                      <th className="p-4 font-bold">Domain(s)</th>
                      <th className="p-4 text-center font-bold">Score</th>
                      <th className="p-4 font-bold w-1/3 text-right">Accuracy</th>
                      <th className="p-4 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reversedFocusHistory.map((drill) => {
                      const isMultiDomain = drill.domain === 'Multiple';
                      const avg = isMultiDomain ? 0 : (domainAverages[drill.domain] || 0);
                      const diff = drill.accuracy - avg;
                      return (
                        <tr key={drill.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-medium text-slate-900">{new Date(drill.date).toLocaleDateString()}</td>
                          <td className="p-4">
                            {isMultiDomain ? <span className="text-xs bg-slate-100 px-2 py-1 rounded">Custom Test</span> : drill.domain}
                          </td>
                          <td className="p-4 text-center font-bold text-[#2A275D]">{drill.correct}/{drill.total}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3 justify-end">
                              <span className="font-bold w-10 text-right">{drill.accuracy}%</span>
                              <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden max-w-[150px]">
                                <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${drill.accuracy}%` }} />
                              </div>
                              <div className="w-6 text-right">
                                {!isMultiDomain && avg > 0 && Math.abs(diff) > 0.5 && (
                                  <span className={`text-sm font-bold ${diff > 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                                    {diff > 0 ? '↑' : '↓'}
                                  </span>
                                )}
                                {!isMultiDomain && avg > 0 && Math.abs(diff) <= 0.5 && (
                                  <span className="text-sm font-bold text-slate-400">-</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => deleteFocusDrill(drill.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline bg-transparent border-none cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">No tests completed yet.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white border border-slate-300 rounded-lg p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#2A275D] mb-6">Score Progression</h2>
                {history.length < 2 ? (
                  <div className="h-48 flex items-center justify-center text-sm font-medium text-slate-500">
                    Take more practice tests to unlock your progression graph.
                  </div>
                ) : (
                  <div className="flex items-end space-x-3 h-48 border-b border-slate-200">
                    {history.map((test, index) => {
                      const score = test.totalScore ?? test.total ?? 0;
                      const heightPct = (score / 1600) * 100;
                      return (
                        <div key={test.id || index} className="flex-1 flex flex-col justify-end items-center h-full">
                          <span className="text-[12px] font-bold text-slate-900 mb-1">{score}</span>
                          <div className="w-full max-w-[40px] bg-[#2A275D] rounded-t-sm" style={{ height: `${heightPct}%` }}></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="flex-1 border border-slate-300 bg-white p-4 text-center rounded-lg flex flex-col justify-center shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Avg Total Score</p>
                  <p className="text-3xl font-bold text-slate-900">{aggregateStats?.total || '—'}</p>
                </div>
                <div className="flex-1 border border-slate-300 bg-white p-4 text-center rounded-lg flex flex-col justify-center shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Avg R&amp;W Score</p>
                  <p className="text-2xl font-bold text-slate-900">{aggregateStats?.rw || '—'}</p>
                </div>
                <div className="flex-1 border border-slate-300 bg-white p-4 text-center rounded-lg flex flex-col justify-center shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Avg Math Score</p>
                  <p className="text-2xl font-bold text-slate-900">{aggregateStats?.math || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold text-center">Total</th>
                    <th className="p-4 font-semibold text-center">R&amp;W</th>
                    <th className="p-4 font-semibold text-center">R&amp;W Path</th>
                    <th className="p-4 font-semibold text-center">Math</th>
                    <th className="p-4 font-semibold text-center">Math Path</th>
                    <th className="p-4 font-semibold text-center">Details</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reversedHistory.map(h => {
                    const isOpen = expandedId === h.id;
                    const domainEntries = h.domainAnalysis ? Object.entries(h.domainAnalysis) : [];
                    return (
                      <React.Fragment key={h.id}>
                        <tr className="hover:bg-slate-50">
                          <td className="p-4 text-sm font-medium">
                            {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="p-4 text-center font-bold text-[#2A275D] text-lg">{h.totalScore ?? h.total ?? '—'}</td>
                          <td className="p-4 text-center font-semibold">{h.rwScore ?? h.rw ?? '—'}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${(h.rwPath ?? (h.isRwHard ? 'Hard' : 'Easy')) === 'Hard' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{h.rwPath ?? (h.isRwHard ? 'Hard' : 'Easy')}</span>
                          </td>
                          <td className="p-4 text-center font-semibold">{h.mathScore ?? h.math ?? '—'}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${(h.mathPath ?? (h.isMathHard ? 'Hard' : 'Easy')) === 'Hard' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{h.mathPath ?? (h.isMathHard ? 'Hard' : 'Easy')}</span>
                          </td>
                          <td className="p-4 text-center">
                            {domainEntries.length > 0 && (
                              <button
                                onClick={() => setExpandedId(isOpen ? null : h.id)}
                                className="text-[#2A275D] font-semibold text-xs border border-[#2A275D] rounded px-2 py-0.5 hover:bg-[#2A275D] hover:text-white transition-colors"
                              >
                                {isOpen ? 'Hide ▲' : 'View ▼'}
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {h.questionBreakdown && h.questionBreakdown.length > 0 && (
                              <button
                                onClick={() => { setReviewData(h); setAppView('test'); }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none cursor-pointer mr-3"
                              >
                                Review
                              </button>
                            )}
                            <button
                              onClick={() => deleteExam(h.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline bg-transparent border-none cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>

                        {isOpen && domainEntries.length > 0 && (
                          <tr>
                            <td colSpan={8} className="p-0 bg-slate-50 border-t border-slate-100">
                              <div className="px-6 py-5">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Domain Breakdown</p>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                  {domainEntries
                                    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
                                    .map(([domain, { correct, total, time }]) => {
                                      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                                      const avgTime = total > 0 ? Math.round((time || 0) / total) : 0;
                                      return (
                                        <div key={domain} className="flex items-center space-x-3">
                                          <span className="text-[13px] font-serif text-[#1E293B] w-52 shrink-0">{domain}</span>
                                          <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                            <div
                                              className="h-1.5 rounded-full"
                                              style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }}
                                            />
                                          </div>
                                          <div className="flex flex-col items-end w-20 shrink-0">
                                            <span className="text-[12px] font-bold text-[#1E293B] leading-tight">{correct}/{total} ({pct}%)</span>
                                            <span className="text-[10px] text-slate-500 font-semibold leading-tight">⏱️ {avgTime}s avg</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {weakestDomains.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-[#1E293B] px-6 py-3">
                  <p className="text-white font-bold text-sm tracking-wide">Top 3 Areas for Improvement</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Based on your most recent test</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {weakestDomains.map(({ domain, correct, total, pct }, i) => (
                    <div key={domain} className="flex items-center px-6 py-4 space-x-4">
                      <span className="text-2xl font-black text-slate-200 w-6 shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-serif text-[15px] font-semibold text-[#1E293B]">{domain}</p>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }}
                            />
                          </div>
                          <span className="text-[12px] font-bold text-slate-500 shrink-0">{correct}/{total} correct</span>
                        </div>
                      </div>
                      <span className={`text-lg font-black shrink-0 ${pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
