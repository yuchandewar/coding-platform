'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  
  // Navigation State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Answers tracking: { [questionId]: { code, language, selectedOptionIndex } }
  const [answers, setAnswers] = useState({});
  
  // Status tracking: { [questionId]: 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked' }
  const [questionStatuses, setQuestionStatuses] = useState({});
  
  // Editor / Runner State for current programming question
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // Anti-Cheating
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sessionSubmissionIdRef = useRef(null);

  const syncWarning = async (newCount) => {
    if (sessionSubmissionIdRef.current) {
      try {
        await fetch(`/api/student/submissions/${sessionSubmissionIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tabSwitches: newCount })
        });
      } catch (err) {
        console.error('Failed to sync warning', err);
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isFullscreen) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          setWarningMessage(`Warning: You have left the exam window! This has been recorded. (Warning ${newCount})`);
          syncWarning(newCount);
          return newCount;
        });
      }
    };

    // Catch OS-level interrupts (Windows key, Alt-Tab, clicking another monitor)
    const handleWindowBlur = () => {
      if (isFullscreen) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          setWarningMessage(`Warning: Exam window lost focus! (Windows Key / Alt-Tab detected). This has been recorded. (Warning ${newCount})`);
          syncWarning(newCount);
          return newCount;
        });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setTabSwitches(prev => {
          const newCount = prev + 1;
          setWarningMessage(`Warning: You exited fullscreen mode! This has been recorded. (Warning ${newCount})`);
          syncWarning(newCount);
          return newCount;
        });
      } else {
        setIsFullscreen(true);
      }
    };

    // Block right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      setNotification({ type: 'warning', message: 'Right-click is disabled during the exam.' });
      setTimeout(() => setNotification(null), 3000);
    };

    // Block specific keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent F1-F12
      if (e.key.startsWith('F') && !isNaN(e.key.slice(1))) {
        e.preventDefault();
        setNotification({ type: 'warning', message: 'Function keys are disabled.' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      // Prevent Ctrl, Alt, Meta (Windows/Cmd) combinations
      if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
        setNotification({ type: 'warning', message: 'Keyboard shortcuts (Ctrl/Alt/Win) are disabled.' });
        setTimeout(() => setNotification(null), 3000);
      }
    };

    // Prevent dragging text/images
    const handleDragStart = (e) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && test) {
      handleAutoSubmit();
    }
  }, [timeLeft, test]);

  // Handle visiting a question
  useEffect(() => {
    if (!test || !test.questions) return;
    const qId = test.questions[currentQuestionIndex]?._id;
    if (qId) {
      setQuestionStatuses(prev => {
        if (!prev[qId] || prev[qId] === 'not_visited') {
          return { ...prev, [qId]: 'not_answered' };
        }
        return prev;
      });
    }
  }, [currentQuestionIndex, test]);

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/student/tests/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Shuffle questions if configured
      if (data.shuffleQuestions && data.questions && data.questions.length > 0) {
        for (let i = data.questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data.questions[i], data.questions[j]] = [data.questions[j], data.questions[i]];
        }
      }

      setTest(data);
      if (data.sessionSubmissionId) {
        sessionSubmissionIdRef.current = data.sessionSubmissionId;
      }
      if (data.initialTabSwitches) {
        setTabSwitches(data.initialTabSwitches);
      }
      setTimeLeft(data.serverTimeLeft !== undefined ? data.serverTimeLeft : data.timerMinutes * 60);
      
      // Initialize answers and statuses
      const initialAnswers = {};
      const initialStatuses = {};
      data.questions.forEach((q, idx) => {
        initialStatuses[q._id] = 'not_visited';
        if (q.type === 'programming') {
          initialAnswers[q._id] = {
            code: q.baseCode?.['javascript'] || '// Write your code here\n',
            language: 'javascript',
            baseCodeOriginal: q.baseCode?.['javascript'] || '// Write your code here\n'
          };
        } else if (q.type === 'quiz') {
          initialAnswers[q._id] = {
            selectedOptionIndex: null
          };
        } else if (q.type === 'fill_in_the_blank') {
          initialAnswers[q._id] = {
            textResponse: ''
          };
        } else if (q.type === 'pairing') {
          initialAnswers[q._id] = {
            pairedResponses: q.pairs ? q.pairs.map(p => ({ left: p.left, right: '' })) : []
          };
        }
      });
      setAnswers(initialAnswers);
      setQuestionStatuses(initialStatuses);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error loading test' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = test?.questions?.[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?._id] || {};
  
  const currentNegativeMark = currentQuestion 
    ? (currentQuestion.negativeMarks !== undefined && currentQuestion.negativeMarks !== null
        ? currentQuestion.negativeMarks
        : (test?.allowNegativeMarking ? (test?.defaultNegativeMarks || 0) : 0))
    : 0;

  const handleUpdateAnswer = (updates) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion._id]: {
        ...prev[currentQuestion._id],
        ...updates
      }
    }));
  };

  const handleLanguageChange = (newLang) => {
    if (!currentQuestion) return;
    const newCode = currentQuestion.baseCode?.[newLang] || '// Write your code here\n';
    handleUpdateAnswer({ language: newLang, code: newCode, baseCodeOriginal: newCode });
  };

  const hasAnsweredCurrentQuestion = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === 'quiz') {
      return currentAnswer.selectedOptionIndex !== null && currentAnswer.selectedOptionIndex !== undefined;
    }
    if (currentQuestion.type === 'programming') {
      return currentAnswer.code && currentAnswer.code.trim() !== currentAnswer.baseCodeOriginal?.trim();
    }
    if (currentQuestion.type === 'fill_in_the_blank') {
      return currentAnswer.textResponse && currentAnswer.textResponse.trim() !== '';
    }
    if (currentQuestion.type === 'pairing') {
      return currentAnswer.pairedResponses && currentAnswer.pairedResponses.length > 0 && currentAnswer.pairedResponses.every(pr => pr.right.trim() !== '');
    }
    return false;
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTestResults(null);
    }
  };

  const handleSaveAndNext = () => {
    const qId = currentQuestion._id;
    const answered = hasAnsweredCurrentQuestion();
    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: answered ? 'answered' : 'not_answered'
    }));
    goToNextQuestion();
  };

  const handleMarkForReviewAndNext = () => {
    const qId = currentQuestion._id;
    const answered = hasAnsweredCurrentQuestion();
    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: answered ? 'answered_marked' : 'marked'
    }));
    goToNextQuestion();
  };

  const handleClearResponse = () => {
    const qId = currentQuestion._id;
    if (currentQuestion.type === 'quiz') {
      handleUpdateAnswer({ selectedOptionIndex: null });
    } else if (currentQuestion.type === 'programming') {
      handleUpdateAnswer({ code: currentAnswer.baseCodeOriginal });
    } else if (currentQuestion.type === 'fill_in_the_blank') {
      handleUpdateAnswer({ textResponse: '' });
    } else if (currentQuestion.type === 'pairing') {
      handleUpdateAnswer({ pairedResponses: currentQuestion.pairs.map(p => ({ left: p.left, right: '' })) });
    }
    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: 'not_answered'
    }));
  };

  const handleRunCode = async () => {
    if (running || !currentQuestion || currentQuestion.type !== 'programming') return;
    setRunning(true);
    setTestResults(null);
    
    try {
      const res = await fetch('/api/student/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: id,
          questionId: currentQuestion._id,
          code: currentAnswer.code,
          language: currentAnswer.language
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTestResults(data.results);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to run code: ' + err.message });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setRunning(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await processSubmission(true);
  };

  const handlePreSubmit = (e) => {
    if (e) e.preventDefault();
    
    const count = test.questions.filter(q => {
      const status = questionStatuses[q._id] || 'not_visited';
      return status === 'not_visited' || status === 'not_answered' || status === 'marked';
    }).length;
    
    setUnansweredCount(count);
    setShowSubmitModal(true);
  };

  const processSubmission = async (autoSubmit = false) => {
    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const finalAnswersArray = Object.keys(answers).map(qId => {
        const q = test.questions.find(x => x._id === qId);
        const ans = answers[qId];
        if (q.type === 'programming') {
          return { questionId: qId, type: 'programming', code: ans.code, language: ans.language };
        } else if (q.type === 'quiz') {
          return { questionId: qId, type: 'quiz', selectedOptionIndex: ans.selectedOptionIndex };
        } else if (q.type === 'fill_in_the_blank') {
          return { questionId: qId, type: 'fill_in_the_blank', textResponse: ans.textResponse };
        } else if (q.type === 'pairing') {
          return { questionId: qId, type: 'pairing', pairedResponses: ans.pairedResponses };
        }
      });

      const timeTaken = test.timerMinutes * 60 - timeLeft;

      const res = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: id,
          answers: finalAnswersArray,
          tabSwitches,
          timeTaken
        })
      });
      
      if (res.ok) {
        if (autoSubmit) {
          setNotification({ type: 'success', message: 'Time is up! Exam auto-submitted.' });
          setTimeout(() => router.push(`/student/exam/${id}/feedback`), 2000);
        } else {
          router.push(`/student/exam/${id}/feedback`);
        }
      } else {
        const err = await res.json();
        setNotification({ type: 'error', message: 'Error submitting: ' + err.error });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to submit' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        setNotification({ type: 'error', message: `Error attempting to enable fullscreen mode: ${err.message}` });
        setTimeout(() => setNotification(null), 5000);
      });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'answered': return '#10b981'; // Green
      case 'not_answered': return '#ef4444'; // Red
      case 'marked': return '#8b5cf6'; // Purple
      case 'answered_marked': return '#6366f1'; // Indigo
      case 'not_visited':
      default: return '#334155'; // Gray
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Exam...</div>;
  if (!test) return <div style={{ padding: '40px', textAlign: 'center' }}>Test not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', position: 'relative', userSelect: 'none', WebkitUserSelect: 'none' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: notification.type === 'error' ? '#ef4444' : (notification.type === 'warning' ? '#f59e0b' : '#10b981'),
          color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 10000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)', fontWeight: 'bold', display: 'flex', alignItems: 'center'
        }}>
          {notification.message}
          <button onClick={() => setNotification(null)} style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '12px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {/* Warning Modal */}
      {warningMessage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(239, 68, 68, 0.2)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center', border: '1px solid #ef4444' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Anti-Cheating Warning</h2>
            <p style={{ color: '#f8fafc', marginBottom: '24px', fontWeight: 'bold' }}>
              {warningMessage}
            </p>
            <button 
              onClick={() => { setWarningMessage(null); enterFullscreen(); }}
              className="btn-primary" 
              style={{ background: '#ef4444', width: '100%' }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {!isFullscreen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '24px' }}>Fullscreen Required</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '32px', maxWidth: '500px', textAlign: 'center', lineHeight: '1.6' }}>
            This exam must be taken in fullscreen mode. Exiting fullscreen or switching tabs will be recorded as a violation.
          </p>
          <button onClick={enterFullscreen} className="btn-primary" style={{ padding: '12px 24px', fontSize: '16px' }}>
            Enter Fullscreen to Continue
          </button>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && isFullscreen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: '#f8fafc', marginBottom: '16px' }}>Confirm Submission</h2>
            {unansweredCount > 0 ? (
              <p style={{ color: '#ef4444', marginBottom: '24px', fontWeight: 'bold' }}>
                You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}! Are you sure you want to submit?
              </p>
            ) : (
              <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
                Are you sure you want to submit the exam? Once submitted, you cannot change your answers.
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="btn-primary" 
                style={{ background: 'rgba(255,255,255,0.1)', flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => processSubmission(false)}
                className="btn-primary" 
                style={{ background: '#10b981', flex: 1 }}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <div style={{ height: '60px', background: 'rgba(30, 41, 59, 1)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, color: '#f8fafc' }}>{test.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 'bold' }}>Time Left:</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: timeLeft < 300 ? '#ef4444' : '#f8fafc', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '4px' }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Layout (Left Content + Right Sidebar) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Question & Response Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Question Title Bar */}
          <div style={{ padding: '12px 24px', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Question {currentQuestionIndex + 1}</h3>
            {currentNegativeMark > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                -{currentNegativeMark} Negative Marks
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* MCQ View */}
            {currentQuestion?.type === 'quiz' && (
              <div style={{ padding: '32px' }}>
                <div style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '24px', lineHeight: '1.6' }}>
                  {currentQuestion.questionText}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentQuestion.options?.map((opt, idx) => (
                    <label 
                      key={idx} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                        background: currentAnswer.selectedOptionIndex === idx ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)', 
                        border: `1px solid ${currentAnswer.selectedOptionIndex === idx ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="radio" 
                        name={`quiz-${currentQuestion._id}`} 
                        checked={currentAnswer.selectedOptionIndex === idx}
                        onChange={() => handleUpdateAnswer({ selectedOptionIndex: idx })}
                        style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                      />
                      <span style={{ color: '#cbd5e1', fontSize: '16px' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Fill in the Blank View */}
            {currentQuestion?.type === 'fill_in_the_blank' && (
              <div style={{ padding: '32px' }}>
                <div style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '24px', lineHeight: '1.6' }}>
                  {currentQuestion.questionText}
                </div>
                <div>
                  <input 
                    type="text" 
                    value={currentAnswer.textResponse || ''}
                    onChange={(e) => handleUpdateAnswer({ textResponse: e.target.value })}
                    placeholder="Type your answer here..."
                    style={{ width: '100%', maxWidth: '500px', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '16px' }}
                  />
                </div>
              </div>
            )}

            {/* Pairing View */}
            {currentQuestion?.type === 'pairing' && (
              <div style={{ padding: '32px' }}>
                <div style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '24px', lineHeight: '1.6' }}>
                  {currentQuestion.questionText}
                </div>
                
                <div style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
                  {currentQuestion.pairs?.map((pair, idx) => {
                    const rightOptions = [...new Set(currentQuestion.pairs.map(p => p.right))].sort();
                    const selectedVal = currentAnswer.pairedResponses?.find(pr => pr.left === pair.left)?.right || '';
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1, color: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }}>{pair.left}</div>
                        <div style={{ color: '#94a3b8' }}>matches with</div>
                        <select 
                          value={selectedVal}
                          onChange={(e) => {
                            const newPairs = [...(currentAnswer.pairedResponses || [])];
                            const pIdx = newPairs.findIndex(pr => pr.left === pair.left);
                            if (pIdx >= 0) newPairs[pIdx].right = e.target.value;
                            handleUpdateAnswer({ pairedResponses: newPairs });
                          }}
                          style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: '#0f172a', color: 'white', fontSize: '14px' }}
                        >
                          <option value="">Select a match...</option>
                          {rightOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Programming View (Top/Bottom Split) */}
            {currentQuestion?.type === 'programming' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Top: Question Text */}
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.4)', flex: '0 0 35%', overflowY: 'auto' }}>
                  <div style={{ fontSize: '16px', color: '#f8fafc', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {currentQuestion.questionText}
                  </div>
                  {currentQuestion.testCases && currentQuestion.testCases.filter(tc => !tc.isHidden).length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>Example Test Cases</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentQuestion.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                          <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Input:</span>
                              <div style={{ fontFamily: 'monospace', color: '#e2e8f0', marginTop: '4px' }}>{tc.input}</div>
                            </div>
                            <div>
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Expected Output:</span>
                              <div style={{ fontFamily: 'monospace', color: '#e2e8f0', marginTop: '4px' }}>{tc.expectedOutput}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom: Editor & Console */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ padding: '8px 16px', background: 'rgba(30,41,59,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <select 
                      value={currentAnswer.language || 'javascript'} 
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      style={{ background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                    <button onClick={handleRunCode} style={{ padding: '6px 12px', fontSize: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} disabled={running || submitting}>
                      {running ? 'Running...' : 'Run Code (Test Cases)'}
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                      <Editor
                        height="100%"
                        theme="vs-dark"
                        language={currentAnswer.language || 'javascript'}
                        value={currentAnswer.code || ''}
                        onChange={(value) => handleUpdateAnswer({ code: value || '' })}
                        options={{ minimap: { enabled: false }, fontSize: 14 }}
                      />
                    </div>
                    {testResults && (
                      <div style={{ height: '250px', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '8px 12px', background: '#0f172a', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Test Results</span>
                          <button onClick={() => setTestResults(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        </div>
                        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', fontSize: '13px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                          {testResults.map((tr, idx) => (
                            <div key={idx} style={{ padding: '12px', borderRadius: '4px', background: tr.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderLeft: `3px solid ${tr.passed ? '#10b981' : '#ef4444'}` }}>
                              <div style={{ fontWeight: 'bold', color: tr.passed ? '#10b981' : '#ef4444', marginBottom: '8px' }}>Case {idx + 1}: {tr.passed ? 'PASS' : 'FAIL'}</div>
                              <div style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                <div style={{ marginBottom: '4px' }}><strong style={{ color: '#cbd5e1' }}>Input:</strong> {tr.input}</div>
                                <div><strong style={{ color: '#cbd5e1' }}>Expected:</strong> {tr.expectedOutput}</div>
                              </div>
                              {!tr.passed && (
                                <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                  <strong style={{ color: '#fca5a5' }}>Got:</strong> {tr.actualOutput}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div style={{ background: '#1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleMarkForReviewAndNext}
                style={{ background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Mark for Review & Next
              </button>
              <button 
                onClick={handleClearResponse}
                style={{ background: 'transparent', border: '1px solid #64748b', color: '#cbd5e1', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Clear Response
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setCurrentQuestionIndex(c => Math.max(0, c - 1)); setTestResults(null); }}
                disabled={currentQuestionIndex === 0}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer' }}>
                ← Previous
              </button>
              <button 
                onClick={handleSaveAndNext}
                style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '8px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Save & Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Palette */}
        <div style={{ width: '320px', background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
          
          {/* User Info / Placeholder */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#cbd5e1' }}>
              👤
            </div>
            <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 'bold' }}>{user ? (user.name || user.username) : 'Loading...'}</div>
          </div>

          {/* Status Legend */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Legend</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: getStatusColor('answered'), borderRadius: '2px' }}></div> Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: getStatusColor('not_answered'), borderRadius: '2px' }}></div> Not Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: getStatusColor('marked'), borderRadius: '2px' }}></div> Marked
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: getStatusColor('not_visited'), borderRadius: '2px' }}></div> Not Visited
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Question Palette</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {test.questions.map((q, idx) => {
                const status = questionStatuses[q._id] || 'not_visited';
                const isActive = currentQuestionIndex === idx;
                return (
                  <button
                    key={q._id}
                    onClick={() => { setCurrentQuestionIndex(idx); setTestResults(null); }}
                    style={{
                      width: '40px', height: '40px',
                      background: getStatusColor(status),
                      border: isActive ? '2px solid white' : 'none',
                      color: 'white',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {idx + 1}
                    {status === 'answered_marked' && (
                      <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '8px', height: '8px', background: '#10b981', borderRadius: '4px', border: '1px solid white' }}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Final Submit */}
          <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={handlePreSubmit} 
              disabled={submitting || running}
              style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
