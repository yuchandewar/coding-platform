'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../admin.module.css';

export default function StudentPerformance() {
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
      const res = await fetch(`/api/admin/users/${id}/performance`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading performance...</div>;
  if (error) return <div style={{ padding: '40px', color: 'var(--danger-color)' }}>{error}</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/admin/users')} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back to Students</button>
          <h1>Performance: {data.studentName} ({data.studentUsername})</h1>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '8px' }}>Overall Past Exam Performance</h3>
        <p style={{ color: '#94a3b8' }}>Total Graded Exams Taken: {data.totalExamsTaken}</p>
        <p style={{ color: '#cbd5e1', marginTop: '12px', fontSize: '14px' }}>
          This page helps you analyze the student's historical performance across all test categories to identify weak points and appreciate strong points.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {data.categories.map((cat, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '24px', borderTop: `4px solid ${cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>{cat.category}</h3>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                backgroundColor: cat.label === 'Strong' ? 'rgba(16, 185, 129, 0.2)' : cat.label === 'Weak' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'
              }}>
                {cat.label} ({cat.percentage}%)
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', color: '#cbd5e1' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Marks Obtained</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{cat.obtainedMarks} / {cat.totalMarks}</div>
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <strong style={{ color: 'var(--primary-color)', display: 'block', marginBottom: '4px', fontSize: '12px' }}>Admin Suggestion</strong>
              <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: '1.4' }}>{cat.suggestion}</p>
            </div>
          </div>
        ))}
        {data.categories.length === 0 && (
          <div style={{ color: '#94a3b8' }}>No categorized performance data available yet.</div>
        )}
      </div>
    </div>
  );
}
