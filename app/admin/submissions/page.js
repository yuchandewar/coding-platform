'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';

export default function ManageSubmissions() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/submissions');
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Student Submissions</h1>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? <p>Loading submissions...</p> : (
          <div style={{ marginTop: '10px' }}>
            {submissions.length === 0 ? <p style={{ color: '#94a3b8' }}>No submissions yet.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Student</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Test</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Submitted On</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Score</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Feedback</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div>{sub.studentId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {sub.studentId?.username || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{sub.testId?.title || 'Unknown Test'}</td>
                      <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{new Date(sub.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: sub.score >= 50 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {sub.score !== undefined ? `${sub.score.toFixed(2)}` : 'Pending'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {sub.rating ? <span style={{ color: '#fbbf24', fontSize: '16px' }}>{'★'.repeat(sub.rating)}</span> : <span style={{ color: '#64748b' }}>None</span>}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => router.push(`/admin/submissions/${sub._id}`)}>
                          View Code
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
