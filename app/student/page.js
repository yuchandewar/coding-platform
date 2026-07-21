'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin/admin.module.css'; // Reusing admin header styles

export default function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      // For now, fetch all tests (or we could fetch only published ones)
      const res = await fetch('/api/student/tests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
      } else {
        setTests([]);
        console.error('API Error:', data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Available Tests</h1>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2>Welcome to your Exam Portal</h2>
        <p style={{ color: '#94a3b8', marginTop: '12px' }}>
          Select a test below to begin. Once started, the timer cannot be paused.
        </p>
      </div>

      {loading ? <p>Loading tests...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {tests.length === 0 ? <p style={{ color: '#94a3b8' }}>No tests available at the moment.</p> : tests.map(test => (
            <div key={test._id} className="glass-panel" style={{ padding: '20px', transition: 'transform 0.2s', cursor: 'pointer' }} 
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '20px', color: '#f8fafc' }}>{test.title}</h3>
                <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  {test.timerMinutes} min
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px', minHeight: '40px' }}>
                {test.description || 'No description provided.'}
              </p>
              
              <button 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '20px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
                onClick={() => router.push(`/student/exam/${test._id}/instructions`)}
              >
                View Instructions
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
