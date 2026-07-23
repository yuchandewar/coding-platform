'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../admin.module.css';

export default function TestDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Test Config state
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testTimerMinutes, setTestTimerMinutes] = useState(60);
  const [testStatus, setTestStatus] = useState('draft');
  const [testStartTime, setTestStartTime] = useState('');
  const [testEndTime, setTestEndTime] = useState('');
  const [testAllowNegativeMarking, setTestAllowNegativeMarking] = useState(false);
  const [testDefaultNegativeMarks, setTestDefaultNegativeMarks] = useState(0);
  const [testRevealScores, setTestRevealScores] = useState(false);
  const [testAllowMultipleSubmissions, setTestAllowMultipleSubmissions] = useState(false);
  const [testStrictTimer, setTestStrictTimer] = useState(false);
  const [testMobileAccess, setTestMobileAccess] = useState(false);
  const [testForgiveTabSwitches, setTestForgiveTabSwitches] = useState(0);
  const [testShuffleQuestions, setTestShuffleQuestions] = useState(false);
  const [testIssueCertificate, setTestIssueCertificate] = useState(false);
  const [testOrganizationName, setTestOrganizationName] = useState('Coding Exam Platform');
  const [testEventName, setTestEventName] = useState('Programming Assessment');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  
  // Generic question state
  const [questionType, setQuestionType] = useState('programming');
  const [questionText, setQuestionText] = useState('');
  const [questionNegativeMarks, setQuestionNegativeMarks] = useState('');
  
  // Programming specific state
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', isHidden: false }]);
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [baseCode, setBaseCode] = useState({});
  const [driverCode, setDriverCode] = useState({});
  
  // Quiz specific state
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  
  // Fill in the blank specific state
  const [blankAnswers, setBlankAnswers] = useState(['']);
  
  // Pairing specific state
  const [pairs, setPairs] = useState([{ left: '', right: '' }]);

  const defaultBaseCode = {
    javascript: 'function solve(input) {\n  // Write your code here\n  return "";\n}',
    python: 'def solve(input_str):\n  # Write your code here\n  pass',
    java: 'class Solution {\n  public static String solve(String input) {\n    // Write your code here\n    return "";\n  }\n}',
    cpp: 'string solve(string input) {\n  // Write your code here\n  return "";\n}'
  };
  
  const defaultDriverCode = {
    javascript: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8");\n\n{{USER_CODE}}\n\nconsole.log(solve(input));',
    python: 'import sys\n\n{{USER_CODE}}\n\nif __name__ == "__main__":\n    input_str = sys.stdin.read()\n    print(solve(input_str))',
    java: 'import java.util.Scanner;\n\n{{USER_CODE}}\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String input = scanner.hasNext() ? scanner.nextLine() : "";\n    System.out.println(Solution.solve(input));\n  }\n}',
    cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n  string input;\n  getline(cin, input);\n  cout << solve(input) << endl;\n  return 0;\n}'
  };
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTest();
    // Initialize default code blocks
    setBaseCode({...defaultBaseCode});
    setDriverCode({...defaultDriverCode});
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${id}`);
      const data = await res.json();
      setTest(data);
      setTestTitle(data.title);
      setTestDescription(data.description || '');
      setTestTimerMinutes(data.timerMinutes);
      setTestStatus(data.status || 'draft');
      setTestStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '');
      setTestEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '');
      setTestAllowNegativeMarking(data.allowNegativeMarking || false);
      setTestDefaultNegativeMarks(data.defaultNegativeMarks || 0);
      setTestRevealScores(data.revealScores || false);
      setTestAllowMultipleSubmissions(data.allowMultipleSubmissions || false);
      setTestStrictTimer(data.strictTimer || false);
      setTestMobileAccess(data.mobileAccess || false);
      setTestForgiveTabSwitches(data.forgiveTabSwitches || 0);
      setTestShuffleQuestions(data.shuffleQuestions || false);
      setTestIssueCertificate(data.issueCertificate || false);
      setTestOrganizationName(data.organizationName || 'Coding Exam Platform');
      setTestEventName(data.eventName || 'Programming Assessment');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await fetch(`/api/admin/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: testTitle, 
          description: testDescription, 
          timerMinutes: testTimerMinutes, 
          status: testStatus,
          startTime: testStartTime ? new Date(testStartTime).toISOString() : null,
          endTime: testEndTime ? new Date(testEndTime).toISOString() : null,
          allowNegativeMarking: testAllowNegativeMarking,
          defaultNegativeMarks: testDefaultNegativeMarks,
          revealScores: testRevealScores,
          allowMultipleSubmissions: testAllowMultipleSubmissions,
          strictTimer: testStrictTimer,
          mobileAccess: testMobileAccess,
          forgiveTabSwitches: testForgiveTabSwitches,
          shuffleQuestions: testShuffleQuestions,
          issueCertificate: testIssueCertificate,
          organizationName: testOrganizationName,
          eventName: testEventName,
        })
      });
      const updatedTest = await res.json();
      setTest(updatedTest);
      setIsEditingConfig(false);
      alert('Test configuration updated successfully!');
    } catch (err) {
      alert('Failed to update configuration');
    } finally {
      setConfigSaving(false);
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const removeTestCase = (index) => {
    const updated = testCases.filter((_, i) => i !== index);
    setTestCases(updated);
  };
  
  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };
  
  const addOption = () => {
    setOptions([...options, '']);
  };
  
  const removeOption = (index) => {
    if (options.length <= 2) return alert('Minimum 2 options required');
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctOptionIndex === index) setCorrectOptionIndex(0);
    else if (correctOptionIndex > index) setCorrectOptionIndex(correctOptionIndex - 1);
  };

  const handleBlankChange = (index, value) => {
    const updated = [...blankAnswers];
    updated[index] = value;
    setBlankAnswers(updated);
  };
  const addBlank = () => setBlankAnswers([...blankAnswers, '']);
  const removeBlank = (index) => setBlankAnswers(blankAnswers.filter((_, i) => i !== index));

  const handlePairChange = (index, field, value) => {
    const updated = [...pairs];
    updated[index][field] = value;
    setPairs(updated);
  };
  const addPair = () => setPairs([...pairs, { left: '', right: '' }]);
  const removePair = (index) => setPairs(pairs.filter((_, i) => i !== index));

  const handleEditClick = (q) => {
    setEditingQuestionId(q._id);
    setQuestionType(q.type);
    setQuestionText(q.questionText || '');
    setQuestionNegativeMarks(q.negativeMarks !== undefined && q.negativeMarks !== null ? q.negativeMarks.toString() : '');
    
    if (q.type === 'programming') {
      setTestCases(q.testCases && q.testCases.length > 0 ? q.testCases : [{ input: '', expectedOutput: '', isHidden: false }]);
      const newBaseCode = {};
      const newDriverCode = {};
      ['javascript', 'python', 'java', 'cpp'].forEach(lang => {
        newBaseCode[lang] = q.baseCode?.[lang] || defaultBaseCode[lang];
        newDriverCode[lang] = q.driverCode?.[lang] || defaultDriverCode[lang];
      });
      setBaseCode(newBaseCode);
      setDriverCode(newDriverCode);
    } else if (q.type === 'quiz') {
      setOptions(q.options && q.options.length > 0 ? q.options : ['', '', '', '']);
      setCorrectOptionIndex(q.correctOptionIndex || 0);
    } else if (q.type === 'fill_in_the_blank') {
      setBlankAnswers(q.blankAnswers && q.blankAnswers.length > 0 ? q.blankAnswers : ['']);
    } else if (q.type === 'pairing') {
      setPairs(q.pairs && q.pairs.length > 0 ? q.pairs : [{ left: '', right: '' }]);
    }
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setQuestionNegativeMarks('');
    setTestCases([{ input: '', expectedOutput: '', isHidden: false }]);
    setBaseCode({...defaultBaseCode});
    setDriverCode({...defaultDriverCode});
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setBlankAnswers(['']);
    setPairs([{ left: '', right: '' }]);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const updatedQuestions = test.questions.filter(q => q._id !== questionId);
      const res = await fetch(`/api/admin/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updatedQuestions })
      });
      const updatedTest = await res.json();
      setTest(updatedTest);
      if (editingQuestionId === questionId) cancelEdit();
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let updatedQuestion = {
        type: questionType,
        questionText,
      };
      
      if (questionNegativeMarks.trim() !== '') {
        updatedQuestion.negativeMarks = Number(questionNegativeMarks);
      }
      
      if (questionType === 'programming') {
        updatedQuestion = {
          ...updatedQuestion,
          supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
          testCases,
          baseCode,
          driverCode
        };
      } else if (questionType === 'quiz') {
        updatedQuestion = {
          ...updatedQuestion,
          options,
          correctOptionIndex
        };
      } else if (questionType === 'fill_in_the_blank') {
        updatedQuestion = {
          ...updatedQuestion,
          blankAnswers: blankAnswers.filter(b => b.trim() !== '')
        };
      } else if (questionType === 'pairing') {
        updatedQuestion = {
          ...updatedQuestion,
          pairs: pairs.filter(p => p.left.trim() !== '' && p.right.trim() !== '')
        };
      }

      let updatedQuestions = [...(test.questions || [])];
      if (editingQuestionId) {
        updatedQuestions = updatedQuestions.map(q => 
          q._id === editingQuestionId ? { ...updatedQuestion, _id: q._id } : q
        );
      } else {
        updatedQuestions.push(updatedQuestion);
      }

      const res = await fetch(`/api/admin/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updatedQuestions })
      });
      
      const updatedTest = await res.json();
      setTest(updatedTest);
      cancelEdit();
      alert(editingQuestionId ? 'Question updated successfully!' : 'Question added successfully!');
    } catch (err) {
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;
  if (!test) return <div style={{ padding: '40px' }}>Test not found</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/admin/tests')} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back</button>
          <h1>{test.title} - Manage Questions</h1>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Test Configuration</h3>
          <button onClick={() => setIsEditingConfig(!isEditingConfig)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px', background: isEditingConfig ? 'rgba(255,255,255,0.1)' : 'var(--primary-color)' }}>
            {isEditingConfig ? 'Cancel' : 'Edit Configuration'}
          </button>
        </div>

        {isEditingConfig && (
          <form onSubmit={handleUpdateConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Test Title</label>
              <input type="text" className="input-field" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Description</label>
              <textarea className="input-field" value={testDescription} onChange={(e) => setTestDescription(e.target.value)} style={{ minHeight: '60px', resize: 'vertical' }}></textarea>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Timer (Minutes)</label>
              <input type="number" min="1" className="input-field" value={testTimerMinutes === '' ? '' : testTimerMinutes} onChange={(e) => setTestTimerMinutes(e.target.value === '' ? '' : parseInt(e.target.value))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Status</label>
              <select className="input-field" value={testStatus} onChange={(e) => setTestStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Start Time (Optional)</label>
              <input type="datetime-local" className="input-field" value={testStartTime} onChange={(e) => setTestStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>End Time (Optional)</label>
              <input type="datetime-local" className="input-field" value={testEndTime} onChange={(e) => setTestEndTime(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="allowNeg" checked={testAllowNegativeMarking} onChange={(e) => setTestAllowNegativeMarking(e.target.checked)} />
              <label htmlFor="allowNeg" style={{ fontSize: '14px', color: '#cbd5e1' }}>Allow Negative Marking</label>
            </div>
            {testAllowNegativeMarking && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Default Negative Penalty</label>
                <input type="number" step="0.5" min="0" className="input-field" value={testDefaultNegativeMarks === '' ? '' : testDefaultNegativeMarks} onChange={(e) => setTestDefaultNegativeMarks(e.target.value === '' ? '' : parseFloat(e.target.value))} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="revealScores" checked={testRevealScores} onChange={(e) => setTestRevealScores(e.target.checked)} />
              <label htmlFor="revealScores" style={{ fontSize: '14px', color: '#cbd5e1' }}>Reveal Scores to Students</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="allowMultiple" checked={testAllowMultipleSubmissions} onChange={(e) => setTestAllowMultipleSubmissions(e.target.checked)} />
              <label htmlFor="allowMultiple" style={{ fontSize: '14px', color: '#cbd5e1' }}>Allow Multiple Submissions</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
              <input type="checkbox" id="strictTimer" checked={testStrictTimer} onChange={(e) => setTestStrictTimer(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <div>
                <label htmlFor="strictTimer" style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>Enable Strict Timer</label>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Timer continues running on server if student leaves exam. Prevents refresh cheating.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
              <input type="checkbox" id="mobileAccess" checked={testMobileAccess} onChange={(e) => setTestMobileAccess(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <div>
                <label htmlFor="mobileAccess" style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>Allow Mobile Access</label>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>If disabled, students will be blocked from taking this exam on mobile devices.</div>
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <label htmlFor="forgiveTabSwitches" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>
                Tab Switch Forgiveness (Count)
              </label>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                If a student switches tabs this number of times or less, it will be completely forgiven (treated as 0 tab switches) on the Leaderboard.
              </div>
              <input 
                type="number" 
                id="forgiveTabSwitches" 
                className="input-field" 
                min="0" 
                value={testForgiveTabSwitches} 
                onChange={(e) => setTestForgiveTabSwitches(Number(e.target.value))} 
                style={{ width: '120px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="shuffleQuestions" checked={testShuffleQuestions} onChange={(e) => setTestShuffleQuestions(e.target.checked)} />
              <label htmlFor="shuffleQuestions" style={{ fontSize: '14px', color: '#cbd5e1' }}>Shuffle Questions for Students</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1', marginTop: '12px' }}>
              <input type="checkbox" id="issueCertificate" checked={testIssueCertificate} onChange={(e) => setTestIssueCertificate(e.target.checked)} />
              <label htmlFor="issueCertificate" style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 'bold', color: 'var(--primary-color)' }}>Generate Certificate on Completion</label>
            </div>
            {testIssueCertificate && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Organization Name</label>
                  <input type="text" className="input-field" value={testOrganizationName} onChange={(e) => setTestOrganizationName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Event / Course Name</label>
                  <input type="text" className="input-field" value={testEventName} onChange={(e) => setTestEventName(e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                  <button type="button" onClick={() => router.push(`/admin/tests/${id}/certificate`)} className="btn-primary" style={{ background: '#8b5cf6', width: '100%' }}>
                    🎨 Open Certificate Designer
                  </button>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>Design the visual layout and eligibility criteria for certificates.</p>
                </div>
              </>
            )}
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" disabled={configSaving}>
                {configSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        {/* Left Side: Existing Questions */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3>Existing Questions ({test.questions?.length || 0})</h3>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {test.questions?.map((q, idx) => (
              <div key={q._id || idx} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>Q{idx + 1}. {q.type.toUpperCase()}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditClick(q)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>Edit</button>
                    <button onClick={() => handleDeleteQuestion(q._id)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.5)', color: 'var(--danger-color)' }}>Delete</button>
                  </div>
                </div>
                <div style={{ marginTop: '8px', color: '#cbd5e1' }}>{q.questionText}</div>
                {(q.negativeMarks !== undefined && q.negativeMarks !== null) && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--danger-color)' }}>
                    Negative Marks: {q.negativeMarks}
                  </div>
                )}
                {q.type === 'programming' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    {q.testCases?.length || 0} Test Cases ({q.testCases?.filter(t => t.isHidden).length || 0} Hidden)
                  </div>
                )}
                {q.type === 'quiz' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    {q.options?.length || 0} Options
                  </div>
                )}
                {q.type === 'fill_in_the_blank' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    {q.blankAnswers?.length || 0} Acceptable Answers
                  </div>
                )}
                {q.type === 'pairing' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    {q.pairs?.length || 0} Pairs
                  </div>
                )}
              </div>
            ))}
            {(!test.questions || test.questions.length === 0) && <p style={{ color: '#94a3b8' }}>No questions added yet.</p>}
          </div>
        </div>

        {/* Right Side: Add New Question */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingQuestionId ? `Edit ${questionType === 'programming' ? 'Programming' : 'Quiz'} Question` : 'Add New Question'}</h3>
            {editingQuestionId && (
              <button onClick={cancelEdit} style={{ background: 'none', color: '#94a3b8', fontSize: '14px', textDecoration: 'underline' }}>Cancel Edit</button>
            )}
          </div>
          
          {!editingQuestionId && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => setQuestionType('programming')}
                className="btn-primary" 
                style={{ flex: 1, background: questionType === 'programming' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' }}
              >
                Programming
              </button>
              <button 
                onClick={() => setQuestionType('quiz')}
                className="btn-primary" 
                style={{ flex: 1, background: questionType === 'quiz' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' }}
              >
                Multiple Choice
              </button>
              <button 
                onClick={() => setQuestionType('fill_in_the_blank')}
                className="btn-primary" 
                style={{ flex: 1, background: questionType === 'fill_in_the_blank' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' }}
              >
                Fill in Blank
              </button>
              <button 
                onClick={() => setQuestionType('pairing')}
                className="btn-primary" 
                style={{ flex: 1, background: questionType === 'pairing' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' }}
              >
                Pairing
              </button>
            </div>
          )}

          <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Question Text</label>
              <textarea 
                className="input-field" 
                value={questionText} 
                onChange={e => setQuestionText(e.target.value)} 
                required 
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder={questionType === 'programming' ? "Write a function that..." : "What is the capital of..."}
              ></textarea>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Negative Mark Override (Optional)</label>
              <input type="number" step="0.5" min="0" className="input-field" value={questionNegativeMarks} onChange={(e) => setQuestionNegativeMarks(e.target.value)} placeholder="Leave blank to use default" />
            </div>
            
            {questionType === 'programming' && (
              <>
                {/* Base Code & Driver Code Section */}
                <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: '#f8fafc' }}>Language Templates</h4>
                    <select 
                      value={selectedLang} 
                      onChange={(e) => setSelectedLang(e.target.value)}
                      className="input-field"
                      style={{ width: 'auto', padding: '4px 8px' }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#cbd5e1' }}>Base Code (Student sees this)</label>
                      <textarea 
                        className="input-field" 
                        value={baseCode[selectedLang] || ''} 
                        onChange={e => setBaseCode({...baseCode, [selectedLang]: e.target.value})} 
                        style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' }}
                      ></textarea>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#cbd5e1' }}>Driver Code (Hidden wrapper)</label>
                      <textarea 
                        className="input-field" 
                        value={driverCode[selectedLang] || ''} 
                        onChange={e => setDriverCode({...driverCode, [selectedLang]: e.target.value})} 
                        style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' }}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: '#f8fafc' }}>Test Cases</h4>
                    <button type="button" onClick={addTestCase} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>+ Add Test Case</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {testCases.map((tc, index) => (
                      <div key={index} style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>Test Case {index + 1}</span>
                          {testCases.length > 1 && (
                            <button type="button" onClick={() => removeTestCase(index)} style={{ color: 'var(--danger-color)', background: 'none', fontSize: '12px' }}>Remove</button>
                          )}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#cbd5e1' }}>Input (stdin string)</label>
                            <textarea className="input-field" value={tc.input} onChange={e => handleTestCaseChange(index, 'input', e.target.value)} required style={{ minHeight: '40px', padding: '8px', fontSize: '13px' }} placeholder="e.g. 1 2"></textarea>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#cbd5e1' }}>Expected Output (stdout)</label>
                            <textarea className="input-field" value={tc.expectedOutput} onChange={e => handleTestCaseChange(index, 'expectedOutput', e.target.value)} required style={{ minHeight: '40px', padding: '8px', fontSize: '13px' }} placeholder="e.g. 3"></textarea>
                          </div>
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" id={`hidden-${index}`} checked={tc.isHidden} onChange={e => handleTestCaseChange(index, 'isHidden', e.target.checked)} />
                          <label htmlFor={`hidden-${index}`} style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>Hidden Test Case (Unseen by student)</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {questionType === 'quiz' && (
              <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ color: '#f8fafc' }}>Options</h4>
                  <button type="button" onClick={addOption} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>+ Add Option</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="radio" 
                        name="correctOption" 
                        checked={correctOptionIndex === idx} 
                        onChange={() => setCorrectOptionIndex(idx)} 
                        title="Mark as correct answer"
                        style={{ cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        className="input-field" 
                        value={opt} 
                        onChange={e => handleOptionChange(idx, e.target.value)} 
                        placeholder={`Option ${idx + 1}`} 
                        required 
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeOption(idx)} 
                        style={{ color: 'var(--danger-color)', background: 'none', padding: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
                  * Select the radio button next to the correct option.
                </p>
              </div>
            )}

            {questionType === 'fill_in_the_blank' && (
              <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ color: '#f8fafc' }}>Acceptable Answers</h4>
                  <button type="button" onClick={addBlank} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>+ Add Answer</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {blankAnswers.map((ans, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={ans} 
                        onChange={e => handleBlankChange(idx, e.target.value)} 
                        placeholder={`Acceptable Answer ${idx + 1}`} 
                        required 
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={() => removeBlank(idx)} style={{ color: 'var(--danger-color)', background: 'none', padding: '8px' }}>✕</button>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>* Any of these will be accepted as correct (case-insensitive).</p>
              </div>
            )}

            {questionType === 'pairing' && (
              <div style={{ background: 'rgba(15,23,42,0.5)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ color: '#f8fafc' }}>Pairs</h4>
                  <button type="button" onClick={addPair} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>+ Add Pair</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pairs.map((pair, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={pair.left} 
                        onChange={e => handlePairChange(idx, 'left', e.target.value)} 
                        placeholder="Left side item" 
                        required 
                        style={{ flex: 1 }}
                      />
                      <span style={{ color: '#94a3b8' }}>=</span>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={pair.right} 
                        onChange={e => handlePairChange(idx, 'right', e.target.value)} 
                        placeholder="Right side match" 
                        required 
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={() => removePair(idx)} style={{ color: 'var(--danger-color)', background: 'none', padding: '8px' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={saving}>
              {saving ? 'Saving...' : (editingQuestionId ? 'Update Question' : 'Save Question')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
