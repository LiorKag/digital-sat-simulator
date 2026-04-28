import React, { useState, useEffect } from 'react';
import TestEngine from './components/TestEngine';
import MainMenu from './components/MainMenu';
import HistoryView from './components/HistoryView';
import CustomTestBuilder from './components/CustomTestBuilder';
import DrillResults from './components/DrillResults';

export default function App() {
  const [appView, setAppView] = useState('menu'); // menu, test, history, custom, drillResults
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('sat_history') || '[]'));
  const [focusHistory, setFocusHistory] = useState(() => JSON.parse(localStorage.getItem('sat_focus_history') || '[]'));
  
  const [resumeMode, setResumeMode] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [focusModeDomain, setFocusModeDomain] = useState(null);
  const [customTestParams, setCustomTestParams] = useState(null);
  const [recentDrillResult, setRecentDrillResult] = useState(null);

  useEffect(() => {
    try {
      const capped = history.slice(-20);
      localStorage.setItem('sat_history', JSON.stringify(capped));
    } catch (e) {
      console.error('Failed to persist sat_history (storage quota exceeded?):', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      const capped = focusHistory.slice(-20);
      localStorage.setItem('sat_focus_history', JSON.stringify(capped));
    } catch (e) {
      console.error('Failed to persist sat_focus_history (storage quota exceeded?):', e);
    }
  }, [focusHistory]);

  const deleteExam = (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const deleteFocusDrill = (id) => {
    if (window.confirm("Are you sure you want to delete this drill?")) {
      setFocusHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const onTestComplete = (resultData) => {
    if (resultData.isFocusDrill || resultData.isCustomTest) {
      const drillData = {
        ...resultData,
        id: Date.now(),
        date: new Date().toISOString()
      };
      setFocusHistory(prev => [...prev, drillData]);
      setRecentDrillResult(drillData);
      setAppView('drillResults');
    } else {
      const examData = {
        ...resultData,
        id: Date.now(),
        date: new Date().toISOString()
      };
      setHistory(prev => [...prev, examData]);
      setAppView('history');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F3F4F6]">
      {appView === 'menu' && (
        <MainMenu 
          history={history}
          focusHistory={focusHistory}
          setAppView={setAppView}
          setResumeMode={setResumeMode}
          setReviewData={setReviewData}
          setFocusModeDomain={setFocusModeDomain}
        />
      )}

      {appView === 'history' && (
        <HistoryView 
          history={history}
          focusHistory={focusHistory}
          setAppView={setAppView}
          deleteExam={deleteExam}
          deleteFocusDrill={deleteFocusDrill}
          setReviewData={setReviewData}
        />
      )}

      {appView === 'custom' && (
        <CustomTestBuilder 
          onStart={(params) => {
            setCustomTestParams(params);
            setResumeMode(false);
            setReviewData(null);
            setFocusModeDomain(null);
            setAppView('test');
          }}
          onCancel={() => setAppView('menu')}
        />
      )}

      {appView === 'drillResults' && recentDrillResult && (
        <DrillResults
          result={recentDrillResult}
          setAppView={setAppView}
          setReviewData={setReviewData}
          setCustomTestParams={setCustomTestParams}
          setResumeMode={setResumeMode}
          setFocusModeDomain={setFocusModeDomain}
        />
      )}

      {appView === 'test' && (
        <TestEngine
          setAppView={setAppView}
          resume={resumeMode}
          reviewData={reviewData}
          focusModeDomain={focusModeDomain}
          customTestParams={customTestParams}
          onComplete={onTestComplete}
          onExit={() => setAppView('menu')}
        />
      )}
    </div>
  );
}