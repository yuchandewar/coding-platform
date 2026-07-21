'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InstructionsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/student/tests/${id}`);
      const data = await res.json();
      if (res.ok) {
        setTest(data);
      } else {
        setTest({ error: data.error || 'Test unavailable' });
      }
    } catch (err) {
      console.error(err);
      setTest({ error: 'Failed to load test' });
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!agreed) return;
    router.push(`/student/exam/${id}`);
  };

  if (loading) return <div style={{ padding: '40px', color: '#f8fafc' }}>Loading instructions...</div>;
  if (!test || test.error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#f8fafc', fontSize: '18px' }}>{test?.error || 'Test not found or unavailable.'}</p>
          <button onClick={() => router.push('/student')} className="btn-primary" style={{ marginTop: '24px' }}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const totalQuestions = test.questions?.length || 0;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div className="glass-panel" style={{ padding: '40px' }}>
        <h1 style={{ color: '#f8fafc', marginBottom: '12px' }}>{test.title} - Instructions</h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '32px' }}>{test.description}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Duration</div>
            <div style={{ color: '#f8fafc', fontSize: '24px', fontWeight: 'bold' }}>{test.timerMinutes} Minutes</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>Total Questions</div>
            <div style={{ color: '#f8fafc', fontSize: '24px', fontWeight: 'bold' }}>{totalQuestions}</div>
          </div>
        </div>

        <h3 style={{ color: '#f8fafc', marginBottom: '16px' }}>General Guidelines</h3>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '32px' }}>
          <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
          <li>When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
          <li>Do not switch tabs or windows during the examination. Doing so may result in automatic submission or penalty.</li>
          {test.allowNegativeMarking && (
            <li>
              <strong style={{ color: 'var(--danger-color)' }}>Negative Marking is Enabled.</strong> Default penalty for an incorrect answer is {test.defaultNegativeMarks} marks. (Some questions may have specific overrides). Unattempted questions will not be penalized.
            </li>
          )}
        </ul>
        
        <h3 style={{ color: '#f8fafc', marginBottom: '16px' }}>Navigating & Answering</h3>
        <ul style={{ color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '32px' }}>
          <li>Use the Question Palette on the right side to jump to any question.</li>
          <li>Click <strong>Save & Next</strong> to save your answer and move to the next question.</li>
          <li>Click <strong>Mark for Review & Next</strong> to save your answer but flag it for later review. (These answers will be evaluated if submitted).</li>
          <li>Click <strong>Clear Response</strong> to clear your selected answer.</li>
        </ul>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '32px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <input 
            type="checkbox" 
            id="agree" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="agree" style={{ color: '#f8fafc', cursor: 'pointer' }}>
            I have read and understood the instructions. I agree that in case of not adhering to the instructions, I will be disqualified.
          </label>
        </div>

        <button 
          onClick={handleStart}
          disabled={!agreed}
          className="btn-primary"
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '18px',
            background: agreed ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
            cursor: agreed ? 'pointer' : 'not-allowed'
          }}
        >
          I am ready to begin
        </button>

      </div>
    </div>
  );
}
