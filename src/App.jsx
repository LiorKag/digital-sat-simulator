import React, { useState, useEffect } from 'react';
import TestEngine from './components/TestEngine';
import MainMenu from './components/MainMenu';
import HistoryView from './components/HistoryView';
import CustomTestBuilder from './components/CustomTestBuilder';
import DrillResults from './components/DrillResults';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-slate-800">
          <div className="bg-white border border-red-200 rounded-lg shadow-xl p-8 max-w-3xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
            <p className="mb-4">The application crashed. Please share this error message:</p>
            <div className="bg-slate-100 p-4 rounded text-sm font-mono overflow-auto max-h-[400px]">
              <div className="font-bold mb-2">{this.state.error && this.state.error.toString()}</div>
              <div className="whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</div>
            </div>
            <button onClick={() => window.location.reload()} className="mt-6 bg-[#2A275D] text-white px-6 py-2 rounded font-bold hover:bg-slate-800 transition-colors">
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}