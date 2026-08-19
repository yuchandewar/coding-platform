'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PerformanceTrack() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance();
  }, [id]);

  const fetchPerformance = async () => {
    try {
      const res = await fetch(`/api/student/performance/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading performance analysis...</div>;
  if (error) return <div style={{ padding: '40px', color: 'var(--danger-color)' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/student/results')} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back to Results</button>
        <h1>Performance Analysis: {data.testTitle}</h1>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--primary-color)', marginBottom: '8px' }}>Overall Score: {data.score} / {data.maxScore}</h2>
        <p style={{ color: '#94a3b8' }}>Here is a detailed breakdown of your performance by category.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {data.categories.map((cat, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '24px', borderLeft: `4px solid ${cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', margin: 0 }}>{cat.category}</h3>
              <span style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                backgroundColor: cat.label === 'Strong' ? 'rgba(16, 185, 129, 0.2)' : cat.label === 'Weak' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'
              }}>
                {cat.label} ({cat.percentage}%)
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', color: '#cbd5e1' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Marks Obtained</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{cat.obtainedMarks} / {cat.totalMarks}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Questions Attempted</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{cat.attemptedQuestions} / {cat.totalQuestions}</div>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <strong style={{ color: 'var(--primary-color)', display: 'block', marginBottom: '8px' }}>💡 Suggestion</strong>
              <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>{cat.suggestion}</p>
            </div>
          </div>
        ))}
        {data.categories.length === 0 && (
          <div style={{ color: '#94a3b8' }}>No category data available for this test.</div>
        )}
      </div>
    </div>
  );
}
