import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2, Calculator } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import { Rnd } from 'react-rnd';

function DraggableDesmosModal({ onClose }) {
  const calculatorRef = useRef(null);

  useEffect(() => {
    let calculator = null;
    let resizeTimer = null;
    let checkInterval = null;

    const initDesmos = () => {
      if (!calculatorRef.current) return;
      const elt = calculatorRef.current;
      elt.innerHTML = ''; 
      calculator = window.Desmos.GraphingCalculator(elt, {
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        keypad: true
      });
      
      resizeTimer = setTimeout(() => {
        if (calculator && calculator.resize) calculator.resize();
      }, 50);
    };

    if (window.Desmos) {
      initDesmos();
    } else {
      checkInterval = setInterval(() => {
        if (window.Desmos) {
          clearInterval(checkInterval);
          initDesmos();
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (calculator) calculator.destroy();
    };
  }, []);

  return (
    <Rnd
      default={{
        x: window.innerWidth - 450,
        y: 100,
        width: 400,
        height: 500,
      }}
      minWidth={300}
      minHeight={400}
      bounds="window"
      className="bg-white shadow-2xl border border-slate-300 rounded-lg flex flex-col z-50 overflow-hidden"
      dragHandleClassName="desmos-drag-handle"
      onResizeStop={() => {
        if (calculatorRef.current && window.Desmos) {
           window.dispatchEvent(new Event('resize'));
        }
      }}
    >
      <div className="desmos-drag-handle flex justify-between items-center bg-slate-100 px-3 py-2 border-b border-slate-300 cursor-move shrink-0">
        <span className="font-bold text-slate-700 text-sm">Graphing Calculator</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold px-2 cursor-pointer pointer-events-auto">✕</button>
      </div>
      <div className="bg-white relative w-full" style={{ height: 'calc(100% - 37px)' }}>
        <div ref={calculatorRef} className="desmos-wrapper absolute inset-0"></div>
      </div>
    </Rnd>
  );
}

// ── LaTeX Math Renderer ─────────────────────────────────────────────────────
export function TextWithMath({ text, className = '', isOption = false }) {
  if (!text || text === 'null') return null;
  let str = typeof text === 'object' ? (text.text || '') : String(text);
  if (!str) return null;

  str = str.replace(/\\(\$)/g, '$1');
  str = str.replace(/\*([^*]+)\*/g, '$$$1$$');
  str = str.replace(/\\\(|\\\)/g, '$');
  const CURR_MARKER = '###CURR###';
  str = str.replace(/\$(\d+(?:[,.]\d+)?)(?![a-zA-Z]|\s*[-+=\/^]|\$)/g, CURR_MARKER + '$1');

  const hasLatexCmd = /\\(pi|frac|sqrt|alpha|beta|theta)|[\^_]/.test(str);
  const isAlreadyDelimited = str.includes('$');
  if (isOption && hasLatexCmd && !isAlreadyDelimited) {
    str = `$${str}$`;
  }

  const parts = str.split(/(\$[^$]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const restore = (s) => s.replaceAll(CURR_MARKER, '$');
        if (part.startsWith('$') && part.endsWith('$')) {
          const mathContent = part.slice(1, -1);
          try {
            const html = katex.renderToString(restore(mathContent), { throwOnError: false, displayMode: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={i}>{restore(part)}</span>;
          }
        }
        return <span key={i}>{restore(part)}</span>;
      })}
    </span>
  );
}

export const FALLBACK_DATABASE = [
  { domain: 'Craft and Structure', difficulty: 'medium', text: "In recommending Bao Phi's collection Song I Sing, a librarian noted that pieces by the spoken-word poet don't lose their _____ nature when printed.", question: "Which choice completes the text with the most logical and precise word or phrase?", options: ["scholarly", "melodic", "jarring", "personal"], correct: 1 },
  { domain: 'Information and Ideas', difficulty: 'easy', text: "Scientists studying deep-sea vents have discovered organisms that thrive in conditions once thought incapable of sustaining life.", question: "Which finding most directly supports the claim?", options: ["Organisms near vents rely on chemosynthesis.", "Deep-sea vents are rare.", "Most marine life requires sunlight.", "Vent ecosystems are identical to shallow-water ones."], correct: 0 },
  { domain: 'Standard English Conventions', difficulty: 'medium', text: "The architect, along with her team of engineers, _____ finalizing the blueprints.", question: "Which choice is grammatically correct?", options: ["are", "is", "were", "have been"], correct: 1 },
  { domain: 'Expression of Ideas', difficulty: 'hard', text: "A recent meta-analysis found that students who take handwritten notes retain information significantly better.", question: "Which revision best improves the precision?", options: ["retain more information", "always remember more", "perform better academically", "have a superior memory"], correct: 0 },
  { domain: 'Algebra', difficulty: 'medium', text: "", question: "If 3x + 7 = 22, what is the value of x?", options: ["3", "5", "7", "15"], correct: 1 },
  { domain: 'Advanced Math', difficulty: 'hard', text: "", question: "Which is equivalent to (x^2 - 9) / (x - 3)?", options: ["x - 3", "x + 3", "x^2 + 3", "x - 9"], correct: 1 },
  { domain: 'Problem Solving and Data Analysis', difficulty: 'medium', text: "A survey of 200 students found that 60% prefer online classes.", question: "How many students prefer in-person classes?", options: ["60", "80", "120", "140"], correct: 1 },
  { domain: 'Geometry and Trigonometry', difficulty: 'hard', text: "", question: "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?", options: ["10", "12", "14", "sqrt(48)"], correct: 0 },
];

export const CONFIG = {
  rwLength: 27,
  mathLength: 22,
  rwTime: 32 * 60,
  mathTime: 35 * 60,
};

export default function TestEngine({ onExit, onComplete, resume, reviewData, focusModeDomain, customTestParams }) {
  const reviewMode = !!reviewData;
  const [stage, setStage] = useState('loading');
  const [testData, setTestData] = useState(null);

  const [scores, setScores] = useState({ rw1: 0, rw2: 0, math1: 0, math2: 0 });
  const [isRwHard, setIsRwHard] = useState(false);
  const [isMathHard, setIsMathHard] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [allAnswers, setAllAnswers] = useState({});
  const [eliminated, setEliminated] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);

  const [timeSpent, setTimeSpent] = useState({});
  const questionStartTime = useRef(Date.now());

  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const mainRef = useRef(null);

  const [showReviewGrid, setShowReviewGrid] = useState(false);
  const [notes, setNotes] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);



  useEffect(() => {
    const fetchAndPrepareData = async () => {
      let rwRaw = null;
      let mathRaw = null;

      try {
        const fetchEnglish = window.api ? window.api.fetchQuestions('english') : fetch('/api/questions?section=english').then(r => r.json());
        const fetchMath = window.api ? window.api.fetchQuestions('math') : fetch('/api/questions?section=math').then(r => r.json());

        const [engRes, mathRes] = await Promise.allSettled([fetchEnglish, fetchMath]);

        if (engRes.status === 'fulfilled' && engRes.value) {
          const engData = engRes.value;
          rwRaw = Array.isArray(engData) ? engData : (engData.questions || null);
        } else {
          console.warn('English API unreachable – using offline fallback');
        }
        
        if (mathRes.status === 'fulfilled' && mathRes.value) {
          const mathData = mathRes.value;
          mathRaw = Array.isArray(mathData) ? mathData : (mathData.questions || null);
        } else {
          console.warn('Math API unreachable – using offline fallback');
        }
      } catch (err) {
        console.warn('API fetch failed globally:', err.message);
      }

      const formatQ = (q, index, prefix) => {
        if (q.question && typeof q.question === 'object' && q.question.choices) {
          const qData = q.question;
          const choicesObj = qData.choices || {};
          const optionsArray = ['A', 'B', 'C', 'D'].filter(k => choicesObj[k] !== undefined).map(k => choicesObj[k]);
          const correctLetter = (qData.correct_answer || 'A').trim().toUpperCase();
          const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

          return {
            id: `${prefix}_${index}`,
            text: qData.paragraph || '',
            question: qData.question || '',
            options: optionsArray.length === 4 ? optionsArray : ['A', 'B', 'C', 'D'],
            correct: correctIndex >= 0 ? correctIndex : 0,
            domain: q.domain || 'Uncategorized',
            explanation: qData.explanation || 'No explanation available for this question.',
          };
        }

        return {
          id: `${prefix}_${index}`,
          text: q.text || '',
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          correct: q.correct !== undefined ? q.correct : 0,
          domain: q.domain || 'Uncategorized',
          explanation: q.explanation || 'No explanation available for this question.',
        };
      };

      const RW_DOMAINS = ['Information and Ideas', 'Standard English Conventions', 'Expression of Ideas', 'Craft and Structure'];
      const MATH_DOMAINS = ['Algebra', 'Advanced Math', 'Problem Solving and Data Analysis', 'Geometry and Trigonometry'];

      const rwPool = (rwRaw && rwRaw.length > 0) ? rwRaw : FALLBACK_DATABASE.filter(q => RW_DOMAINS.includes(q.domain));
      const mathPool = (mathRaw && mathRaw.length > 0) ? mathRaw : FALLBACK_DATABASE.filter(q => MATH_DOMAINS.includes(q.domain));

      const shuffledRwPool = [...rwPool].sort(() => Math.random() - 0.5);
      const shuffledMathPool = [...mathPool].sort(() => Math.random() - 0.5);

      const buildModule = (pool, targetLength, prefix, startIndex = 0) => {
        const src = pool.length > 0 ? pool : FALLBACK_DATABASE;
        const slice = src.slice(startIndex, startIndex + targetLength);

        if (slice.length < targetLength) {
          let remaining = targetLength - slice.length;
          while (remaining > 0) {
            const fill = src.slice(0, Math.min(remaining, src.length));
            slice.push(...fill);
            remaining -= fill.length;
          }
        }

        return Array.from({ length: targetLength }, (_, i) => formatQ(slice[i % slice.length], i, prefix));
      };

      if (customTestParams) {
        const { subjects, domains, questionCount } = customTestParams;
        let pool = [];
        if (subjects.includes('rw')) pool.push(...rwPool);
        if (subjects.includes('math')) pool.push(...mathPool);
        
        if (domains && domains.length > 0) {
          pool = pool.filter(q => domains.includes(q.domain));
        }
        
        const shuffledPool = pool.sort(() => Math.random() - 0.5);
        setTestData({ customTest: buildModule(shuffledPool, questionCount, 'custom', 0) });
        setTimeLeft(Math.floor(questionCount * 1.5 * 60));
        setStage('customTest');
        return;
      }

      if (focusModeDomain) {
        const pool = [...rwPool, ...mathPool].filter(q => q.domain === focusModeDomain);
        const shuffledPool = pool.sort(() => Math.random() - 0.5);
        setTestData({ focus: buildModule(shuffledPool, 10, 'focus', 0) });
        setTimeLeft(15 * 60);
        setStage('focusDrill');
        return;
      }

      setTestData({
        rw1: buildModule(shuffledRwPool, CONFIG.rwLength, 'rw1', 0),
        rw2Easy: buildModule(shuffledRwPool, CONFIG.rwLength, 'rw2e', CONFIG.rwLength),
        rw2Hard: buildModule(shuffledRwPool, CONFIG.rwLength, 'rw2h', CONFIG.rwLength * 2),
        math1: buildModule(shuffledMathPool, CONFIG.mathLength, 'm1', 0),
        math2Easy: buildModule(shuffledMathPool, CONFIG.mathLength, 'm2e', CONFIG.mathLength),
        math2Hard: buildModule(shuffledMathPool, CONFIG.mathLength, 'm2h', CONFIG.mathLength * 2),
      });

      if (reviewData) {
        setIsRwHard(reviewData.rwPath === 'Hard');
        setIsMathHard(reviewData.mathPath === 'Hard');

        const rebuiltAnswers = {};
        reviewData.questionBreakdown?.forEach(q => {
          if (q.userAnswer !== null && q.userAnswer !== undefined) {
            rebuiltAnswers[q.id] = q.userAnswer;
          }
        });
        setAnswers(rebuiltAnswers);
        setAllAnswers(rebuiltAnswers);

        setTestData({ reviewQuestions: reviewData.questionBreakdown || [] });
        setStage('reviewModeStage');
        return;
      }

      if (resume) {
        try {
          const savedStr = localStorage.getItem('sat_in_progress');
          if (savedStr) {
            const saved = JSON.parse(savedStr);
            setScores(saved.scores || { rw1: 0, rw2: 0, math1: 0, math2: 0 });
            setIsRwHard(saved.isRwHard || false);
            setIsMathHard(saved.isMathHard || false);
            setCurrentIndex(saved.currentIndex || 0);
            setAnswers(saved.answers || {});
            setAllAnswers(saved.allAnswers || {});
            setEliminated(saved.eliminated || {});
            if (saved.markedForReview) setMarkedForReview(new Set(saved.markedForReview));
            if (saved.notes) setNotes(saved.notes);
            if (saved.timeSpent) setTimeSpent(saved.timeSpent);
            setTimeLeft(saved.timeLeft || 0);

            setStage(saved.stage || 'intro');
            return;
          }
        } catch (e) {
          console.error('Failed to resume', e);
        }
      }

      setStage('intro');
    };
    fetchAndPrepareData();
  }, [resume, focusModeDomain, reviewData, customTestParams]);



  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !mainRef.current) return;
      const containerRect = mainRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 80) newWidth = 80;
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const endTimeRef = useRef(null);
  const isActiveTestStage = ['focusDrill', 'customTest', 'rw1', 'rw2', 'math1', 'math2'].includes(stage);
  const prevStageRef = useRef(null);


  const moduleData = useMemo(() => {
    if (reviewMode && testData) return testData.reviewQuestions || [];
    switch (stage) {
      case 'customTest': return testData?.customTest || [];
      case 'focusDrill': return testData?.focus || [];
      case 'rw1': return testData?.rw1 || [];
      case 'rw2': return isRwHard ? testData?.rw2Hard || [] : testData?.rw2Easy || [];
      case 'math1': return testData?.math1 || [];
      case 'math2': return isMathHard ? testData?.math2Hard || [] : testData?.math2Easy || [];
      default: return [];
    }
  }, [stage, testData, isRwHard, isMathHard, reviewMode, reviewData]);

  const currentData = moduleData || [];
  const currentQuestion = currentData[currentIndex] || {};

  const recordTimeSpent = () => {
    if (!reviewMode && currentQuestion.id && !showReviewGrid && !showSettingsModal) {
      const delta = Math.max(0, Math.floor((Date.now() - questionStartTime.current) / 1000));
      setTimeSpent(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + delta
      }));
    }
  };

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex, stage]);

  const getModuleName = () => {
    if (reviewMode) return "Interactive Review Mode";
    switch (stage) {
      case 'customTest': return "Custom Practice Drill";
      case 'focusDrill': return `Focus Drill: ${focusModeDomain}`;
      case 'rw1': return "Section 1: Reading and Writing";
      case 'rw2': return "Section 1: Reading and Writing";
      case 'math1': return "Section 2: Math";
      case 'math2': return "Section 2: Math";
      default: return "";
    }
  };

  const handleSelect = (id, idx) => {
    if (eliminated[`${id}-${idx}`]) return;
    setAnswers(prev => ({ ...prev, [id]: idx }));
  };

  const toggleEliminate = (e, id, idx) => {
    e.stopPropagation();
    setEliminated(prev => ({
      ...prev,
      [`${id}-${idx}`]: !prev[`${id}-${idx}`]
    }));
    if (answers[id] === idx) {
      const newAnswers = { ...answers };
      delete newAnswers[id];
      setAnswers(newAnswers);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentData.length - 1) {
      recordTimeSpent();
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      recordTimeSpent();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleReviewMark = () => {
    const id = moduleData[currentIndex].id;
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const saveProgressAndExit = () => {
    recordTimeSpent();
    const snapshot = {
      stage, scores, isRwHard, isMathHard, currentIndex, answers, allAnswers,
      eliminated, timeLeft, notes, timeSpent, markedForReview: Array.from(markedForReview)
    };
    localStorage.setItem('sat_in_progress', JSON.stringify(snapshot));
    onExit();
  };

  const handleModuleSubmit = useCallback(() => {
    recordTimeSpent();


    let score = 0;
    moduleData.forEach(q => { if (answers[q.id] === q.correct) score++; });

    const updatedAllAnswers = { ...allAnswers, ...answers };
    setAllAnswers(updatedAllAnswers);

    const passThreshold = moduleData.length * 0.65;

    const resetPhaseState = () => {
      setAnswers({});
      setEliminated({});
      setMarkedForReview(new Set());
      setCurrentIndex(0);
    };

    if (stage === 'rw1') {
      const routeHard = score >= passThreshold;
      setScores(p => ({ ...p, rw1: score }));
      setIsRwHard(routeHard);
      resetPhaseState();
      setStage('rwBreak');

    } else if (stage === 'rw2') {
      setScores(p => ({ ...p, rw2: score }));
      resetPhaseState();
      setStage('rw2Break');

    } else if (stage === 'math1') {
      const routeHard = score >= passThreshold;
      setScores(p => ({ ...p, math1: score }));
      setIsMathHard(routeHard);
      resetPhaseState();
      setStage('mathBreak');

    } else if (stage === 'focusDrill' || stage === 'customTest') {
      const finalScores = { ...scores, [stage]: score };
      
      if (stage === 'focusDrill') {
        const drillResult = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          domain: focusModeDomain,
          correct: score,
          total: moduleData.length,
          accuracy: Math.round((score / moduleData.length) * 100),
          timeSpent: Object.values(timeSpent).reduce((acc, curr) => acc + curr, 0)
        };
        try {
          const existingFocusHistory = JSON.parse(localStorage.getItem('sat_focus_history') || '[]');
          localStorage.setItem('sat_focus_history', JSON.stringify([...existingFocusHistory, drillResult]));
        } catch (e) {
          console.error("Failed to save focus drill history", e);
        }
      }

      const questionBreakdown = moduleData.map(q => ({
        id: q.id,
        text: q.text || '',
        question: q.question || '',
        options: q.options || [],
        correct: q.correct,
        domain: q.domain || 'Uncategorized',
        explanation: q.explanation || 'No explanation available for this question.',
        isCorrect: updatedAllAnswers[q.id] === q.correct,
        userAnswer: updatedAllAnswers[q.id] ?? null,
        timeSpent: timeSpent[q.id] || 0,
      }));

      const domainAnalysis = {};
      questionBreakdown.forEach(({ domain, isCorrect, timeSpent: ts }) => {
        if (!domainAnalysis[domain]) domainAnalysis[domain] = { correct: 0, total: 0, time: 0 };
        domainAnalysis[domain].total += 1;
        if (isCorrect) domainAnalysis[domain].correct += 1;
        domainAnalysis[domain].time += (ts || 0);
      });

      setScores(finalScores);
      localStorage.removeItem('sat_in_progress');
      onComplete({
        correct: score,
        questionCount: moduleData.length,
        total: Math.round((score / moduleData.length) * 100),
        rw: null,
        math: null,
        isRwHard: false,
        isMathHard: false,
        questionBreakdown,
        domainAnalysis,
        isFocusDrill: stage === 'focusDrill',
        isCustomTest: stage === 'customTest'
      });
      // DO NOT call setStage here — onComplete unmounts this component via parent.

    } else if (stage === 'math2') {
      const finalScores = { ...scores, math2: score };

      const rwM1Pts = (finalScores.rw1 / CONFIG.rwLength) * 300;
      const rwM2Max = isRwHard ? 300 : 190;
      const rwM2Pts = (finalScores.rw2 / CONFIG.rwLength) * rwM2Max;
      const rwRaw = 200 + rwM1Pts + rwM2Pts;

      const mathM1Pts = (finalScores.math1 / CONFIG.mathLength) * 300;
      const mathM2Max = isMathHard ? 300 : 190;
      const mathM2Pts = (finalScores.math2 / CONFIG.mathLength) * mathM2Max;
      const mathRaw = 200 + mathM1Pts + mathM2Pts;

      const r10 = (n) => Math.round(n / 10) * 10;
      const rw = Math.min(800, Math.max(200, r10(rwRaw)));
      const math = Math.min(800, Math.max(200, r10(mathRaw)));
      const total = Math.min(1600, rw + math);

      const rw2Module = isRwHard ? testData.rw2Hard : testData.rw2Easy;
      const math2Module = isMathHard ? testData.math2Hard : testData.math2Easy;
      const allQuestions = [
        ...testData.rw1,
        ...rw2Module,
        ...testData.math1,
        ...math2Module,
      ];

      const questionBreakdown = allQuestions.map(q => ({
        id: q.id,
        text: q.text || '',
        question: q.question || '',
        options: q.options || [],
        correct: q.correct,
        domain: q.domain || 'Uncategorized',
        explanation: q.explanation || 'No explanation available for this question.',
        isCorrect: updatedAllAnswers[q.id] === q.correct,
        userAnswer: updatedAllAnswers[q.id] ?? null,
        timeSpent: timeSpent[q.id] || 0,
      }));

      const domainAnalysis = {};
      questionBreakdown.forEach(({ domain, isCorrect, timeSpent: ts }) => {
        if (!domainAnalysis[domain]) domainAnalysis[domain] = { correct: 0, total: 0, time: 0 };
        domainAnalysis[domain].total += 1;
        if (isCorrect) domainAnalysis[domain].correct += 1;
        domainAnalysis[domain].time += (ts || 0);
      });

      setScores(finalScores);
      onComplete({ rw, math, total, isRwHard, isMathHard, questionBreakdown, domainAnalysis });
      localStorage.removeItem('sat_in_progress');
      setStage('results');
    }
  }, [moduleData, stage, answers, allAnswers, timeSpent, scores, isRwHard, isMathHard, testData, focusModeDomain, onComplete, onExit]);

  useEffect(() => {
    if (isActiveTestStage && !reviewMode) {
      // Only reset the wall-clock anchor when first entering a new active stage.
      // This prevents handleModuleSubmit identity changes from restarting the timer.
      if (prevStageRef.current !== stage) {
        endTimeRef.current = Date.now() + (timeLeft * 1000);
        prevStageRef.current = stage;
      }
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          handleModuleSubmit();
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, reviewMode, handleModuleSubmit, isActiveTestStage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (reviewMode || (!['customTest', 'focusDrill', 'rw1', 'rw2', 'math1', 'math2'].includes(stage) && !reviewMode)) return;

      const key = e.key.toUpperCase();
      if (key === 'ARROWRIGHT') {
        if (currentIndex < currentData.length - 1) { recordTimeSpent(); setCurrentIndex(currentIndex + 1); }
      } else if (key === 'ARROWLEFT') {
        if (currentIndex > 0) { recordTimeSpent(); setCurrentIndex(currentIndex - 1); }
      } else if (['A', '1'].includes(key)) {
        if (!eliminated[`${currentQuestion?.id}-0`]) handleSelect(currentQuestion?.id, 0);
      } else if (['B', '2'].includes(key)) {
        if (!eliminated[`${currentQuestion?.id}-1`]) handleSelect(currentQuestion?.id, 1);
      } else if (['C', '3'].includes(key)) {
        if (!eliminated[`${currentQuestion?.id}-2`]) handleSelect(currentQuestion?.id, 2);
      } else if (['D', '4'].includes(key)) {
        if (!eliminated[`${currentQuestion?.id}-3`]) handleSelect(currentQuestion?.id, 3);
      } else if (['F', 'M'].includes(key)) {
        toggleReviewMark();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentData, currentQuestion, stage, reviewMode, answers, eliminated]);

  if (stage === 'loading') return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-[#2A275D]" size={40} /></div>;
  if (stage === 'intro' && !reviewMode) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="bg-white p-8 rounded shadow text-center border"><h2 className="text-2xl font-bold mb-4">Start Testing</h2><button onClick={() => { setCurrentIndex(0); setTimeLeft(CONFIG.rwTime); setStage('rw1'); }} className="px-6 py-2 bg-[#3B418E] text-white rounded-full font-bold">Begin Module 1</button></div></div>;
  if (stage.includes('Break')) {
    const handleContinue = () => {
      setCurrentIndex(0);
      if (stage === 'rwBreak') {
        setTimeLeft(CONFIG.rwTime);
        setStage('rw2');
      } else if (stage === 'rw2Break') {
        setTimeLeft(CONFIG.mathTime);
        setStage('math1');
      } else if (stage === 'mathBreak') {
        setTimeLeft(CONFIG.mathTime);
        setStage('math2');
      }
    };
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="bg-white p-8 rounded shadow text-center border"><h2 className="text-2xl font-bold mb-4">{stage === 'rw2Break' ? '10 Minute Break' : 'Module Complete'}</h2><button onClick={handleContinue} className="px-6 py-2 bg-[#3B418E] text-white rounded-full font-bold">Continue</button></div></div>;
  }
  if (stage === 'results') return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="bg-white p-10 rounded shadow text-center border"><h2 className="text-3xl font-bold mb-4">Test Finished</h2><p className="mb-6 text-slate-500">Your score has been saved to the dashboard.</p><button onClick={onExit} className="px-6 py-3 bg-slate-800 text-white rounded-full font-bold">Return to Dashboard</button></div></div>;

  if (!currentQuestion || Object.keys(currentQuestion).length === 0 || !currentQuestion.options) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-[#2A275D]" size={40} /></div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden text-slate-900 font-sans select-none relative">
      {showCalculator && <DraggableDesmosModal onClose={() => setShowCalculator(false)} />}
      <header className="h-20 flex justify-between items-center px-10 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold text-slate-800">{getModuleName()}</h1>
          <button className="text-sm font-semibold text-slate-600 text-left flex items-center mt-1 hover:text-black w-max">
            Directions <span className="ml-1 text-[10px]">▼</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          {reviewMode ? (
            <span className="text-xl font-bold text-slate-500 tracking-wide mt-1">Review Mode</span>
          ) : hideTimer ? (
            <span className="text-[26px] font-bold text-transparent tracking-wide select-none">00:00</span>
          ) : (
            <span className="text-[26px] font-bold text-black tracking-wide">
              {Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}
            </span>
          )}
          {!reviewMode && (
            <button onClick={() => setHideTimer(!hideTimer)} className="border border-slate-400 rounded-full px-4 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 mt-1">
              {hideTimer ? 'Show' : 'Hide'}
            </button>
          )}
        </div>

        <div className="flex items-center space-x-6 text-sm font-semibold text-slate-700">
          <button onClick={() => setShowCalculator(!showCalculator)} className={`flex flex-col items-center hover:text-black transition-colors ${showCalculator ? 'text-black' : ''}`}>
            <Calculator className="mb-0.5" size={20} />
            <span>Calculator</span>
          </button>
          <button onClick={() => setShowNotesModal(!showNotesModal)} className={`flex flex-col items-center hover:text-black transition-colors ${showNotesModal ? 'text-black' : ''}`}>
            <span className="text-lg">✎</span>
            <span>Highlights & Notes</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={`flex flex-col items-center hover:text-black transition-colors ${showMoreMenu ? 'text-black' : ''}`}>
              <span className="text-lg">⋮</span>
              <span>More</span>
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-semibold transition-colors" onClick={() => { setShowMoreMenu(false); setShowSettingsModal(true); }}>Settings</button>
                {reviewMode ? (
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 font-semibold border-t border-slate-100 transition-colors" onClick={onExit}>Exit Review</button>
                ) : (stage === 'customTest' || stage === 'focusDrill') ? (
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 font-semibold border-t border-slate-100 transition-colors" onClick={() => {
                    if (window.confirm("Are you sure you want to exit? Your progress in this drill will not be saved.")) {
                      onExit();
                    }
                  }}>Exit Drill</button>
                ) : (
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 font-semibold border-t border-slate-100 transition-colors" onClick={saveProgressAndExit}>Save & Exit</button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 flex flex-row overflow-hidden relative">
        <section className="h-full overflow-y-auto px-16 py-14" style={{ width: `${leftWidth}%` }}>
          {(currentQuestion.text && currentQuestion.text !== 'null') ? (
            <p className="font-serif text-[19px] leading-[1.8] text-black whitespace-pre-wrap">
              <TextWithMath text={currentQuestion.text} />
            </p>
          ) : null}
        </section>

        <div className="w-[3px] h-full bg-[#CBD5E1] relative shrink-0 hover:bg-slate-400 transition-colors cursor-col-resize z-30" onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1E293B] text-white w-3 h-8 flex items-center justify-center rounded-sm cursor-col-resize shadow-sm hover:bg-slate-800 transition-colors">
            <span className="text-[10px] transform rotate-90">⬍</span>
          </div>
        </div>

        <section className="h-full overflow-y-auto px-16 py-14 bg-white" style={{ width: `${100 - leftWidth}%` }}>
          <div className="flex justify-between items-end border-b-[3px] border-dashed border-slate-400 pb-3 mb-6">
            <div className="flex items-center">
              <div className="bg-[#1E293B] text-white font-bold w-7 h-7 flex items-center justify-center rounded-sm mr-4 text-lg">
                {currentIndex + 1}
              </div>
              <button onClick={() => !reviewMode && toggleReviewMark()} className={`flex items-center font-semibold text-sm ${reviewMode ? 'text-slate-400 cursor-default' : 'text-slate-700 hover:text-black'}`}>
                <span className={`text-lg ${markedForReview.has(currentQuestion.id) ? 'text-red-600' : ''}`}>⚑</span>
                <span className="ml-2">Mark for Review</span>
              </button>
              {reviewMode && currentQuestion.timeSpent !== undefined && (
                <span className="ml-4 font-semibold text-sm text-slate-500 flex items-center">
                  ⏱️ {currentQuestion.timeSpent}s
                </span>
              )}
            </div>
            <button className="bg-[#3B82F6] text-white px-2 py-1 rounded text-xs font-bold">
              ABC
            </button>
          </div>

          <p className="font-serif text-[19px] leading-[1.8] text-black mb-6">
            <TextWithMath text={currentQuestion.question} />
          </p>

          <div className="space-y-4">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = answers[currentQuestion.id] === idx;
              const isEliminated = eliminated[`${currentQuestion.id}-${idx}`];
              const letter = String.fromCharCode(65 + idx);
              const optText = typeof opt === 'object' ? opt.text : opt;

              let btnClasses = '';
              let circleClasses = '';

              if (reviewMode) {
                const isCorrectAnswer = idx === currentQuestion.correct;
                const isUserIncorrect = isSelected && !isCorrectAnswer;
                if (isCorrectAnswer) {
                  btnClasses = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
                  circleClasses = 'bg-emerald-500 text-white border-emerald-500';
                } else if (isUserIncorrect) {
                  btnClasses = 'border-red-400 bg-red-50 ring-1 ring-red-400';
                  circleClasses = 'bg-red-400 text-white border-red-400';
                } else {
                  btnClasses = 'border-slate-300 bg-white opacity-70 cursor-default';
                  circleClasses = 'border-slate-400 text-slate-400';
                }
              } else {
                btnClasses = isSelected
                  ? 'border-[#004182] bg-[#F0F7FF] ring-1 ring-[#004182]'
                  : isEliminated
                    ? 'border-slate-300 bg-white opacity-50 cursor-not-allowed'
                    : 'border-[#94A3B8] bg-white hover:bg-slate-50';
                circleClasses = isSelected
                  ? 'bg-[#004182] text-white border-[#004182]'
                  : 'border-slate-500 text-slate-600';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !reviewMode && handleSelect(currentQuestion.id, idx)}
                  disabled={isEliminated || reviewMode}
                  className={`w-full flex justify-between items-center border-[1.5px] rounded-xl p-4 transition-colors ${btnClasses}`}
                >
                  <div className={`flex items-center ${isEliminated && !reviewMode ? 'line-through text-slate-500' : ''}`}>
                    <div className={`w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center font-bold text-sm mr-4 shrink-0 ${circleClasses}`}>
                      {letter}
                    </div>
                    <span className="font-serif text-[18px] text-black text-left"><TextWithMath text={optText} isOption={true} /></span>
                  </div>
                  {!reviewMode && (
                    <div
                      onClick={(e) => toggleEliminate(e, currentQuestion.id, idx)}
                      className={`w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-[10px] shrink-0 hover:bg-slate-200 cursor-pointer ${isEliminated ? 'bg-slate-200 text-slate-600 font-bold' : 'text-slate-400'}`}
                    >
                      <span className="line-through">{letter}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {reviewMode && (
            <div className="border border-slate-300 bg-slate-50 p-6 mt-6 rounded-md">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Explanation</h4>
              <p className="font-serif text-[17px] leading-[1.6] text-black">
                <TextWithMath text={currentQuestion.explanation || "No detailed explanation is available for this question. Review the correct choice against your selected answer."} />
              </p>
            </div>
          )}
        </section>
      </main>

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white w-[400px] rounded shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Preferences</h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-black font-bold">✕</button>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Data & Storage</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Clear all locally stored testing history, domain analysis, and saved in-progress sessions. This action cannot be undone.
              </p>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete all saved data?")) {
                    localStorage.removeItem('sat_history');
                    localStorage.removeItem('sat_in_progress');
                    localStorage.removeItem('sat_focus_history');
                    alert("Local test data cleared successfully.");
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 rounded text-sm w-full transition-colors"
              >
                Clear Local Test History
              </button>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-right">
              <button onClick={() => setShowSettingsModal(false)} className="px-6 py-2 bg-[#1E293B] text-white font-bold text-sm rounded hover:bg-black transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewGrid && (
        <div className="absolute bottom-[80px] left-0 w-full h-[50%] bg-[#F8FAFC] border-t-2 border-slate-300 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)] p-8 overflow-y-auto z-40">
          <div className="max-w-5xl mx-auto flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Review Questions</h2>
              <button onClick={() => setShowReviewGrid(false)} className="text-slate-500 hover:text-black font-semibold text-sm transition-colors">Close ✕</button>
            </div>
            <div className="flex flex-wrap gap-4">
              {currentData.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = markedForReview.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(idx); setShowReviewGrid(false); }}
                    className={`relative w-12 h-12 flex items-center justify-center font-bold text-lg rounded-sm transition-all shadow-sm ${isCurrent ? 'ring-4 ring-[#3B82F6] ring-offset-2 ring-offset-[#F8FAFC]' : ''
                      } ${isAnswered ? 'bg-[#1E293B] text-white border-none' : 'bg-white text-slate-700 border-[2.5px] border-dashed border-slate-300 hover:bg-slate-50'}`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <div className="absolute -top-1.5 -right-1.5 text-red-600 text-[16px] drop-shadow-sm bg-white rounded-full leading-none p-0 flex items-center justify-center aspect-square">⚑</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showNotesModal && (
        <div className="absolute top-24 right-10 w-80 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] rounded-lg border border-slate-200 z-50 overflow-hidden flex flex-col">
          <div className="bg-[#1E293B] text-white px-4 py-2.5 flex justify-between items-center">
            <span className="font-bold text-sm tracking-wide">Notes - Q{currentIndex + 1}</span>
            <button onClick={() => setShowNotesModal(false)} className="hover:text-slate-300 transition-colors">✕</button>
          </div>
          <textarea
            className="w-full h-40 p-4 resize-none focus:outline-none text-slate-800 text-sm font-medium"
            placeholder="Type your notes here..."
            value={notes[currentQuestion?.id] || ''}
            onChange={(e) => setNotes({ ...notes, [currentQuestion?.id]: e.target.value })}
          />
        </div>
      )}

      <div className="w-full border-t-[3px] border-dashed border-slate-400 shrink-0 relative z-30"></div>

      <footer className="h-20 flex justify-between items-center px-10 shrink-0 bg-white z-50 relative">
        <div className="font-bold text-slate-800 text-lg">Student</div>

        <button onClick={() => setShowReviewGrid(!showReviewGrid)} className="bg-[#1E293B] text-white font-bold text-sm px-6 py-2.5 rounded-md flex items-center hover:bg-black transition-colors">
          Question {currentIndex + 1} of {currentData.length} <span className="ml-2 text-[10px]">{showReviewGrid ? '▼' : '▲'}</span>
        </button>

        {currentIndex < currentData.length - 1 ? (
          <button onClick={handleNext} className="bg-[#3B418E] hover:bg-[#2A2E6B] text-white font-bold text-[15px] px-10 py-2.5 rounded-full transition-colors">
            Next
          </button>
        ) : (
          <button onClick={reviewMode ? onExit : handleModuleSubmit} className="bg-[#3B418E] hover:bg-[#2A2E6B] text-white font-bold text-[15px] px-10 py-2.5 rounded-full transition-colors">
            {reviewMode ? 'Finish Review' : 'Submit'}
          </button>
        )}
      </footer>
    </div>
  );
}
