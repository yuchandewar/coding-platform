'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../admin/admin.module.css'; // Reusing layout styles

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/student/results');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>My Exam Results</h1>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? <p>Loading your results...</p> : (
          <div style={{ marginTop: '10px' }}>
            {results.length === 0 ? <p style={{ color: '#94a3b8' }}>You haven't taken any exams yet.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {results.map(sub => (
                  <div key={sub._id} style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize: '20px', color: '#f8fafc', marginBottom: '12px' }}>
                      {sub.testId?.title || 'Unknown Test'}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
                      <span>Submitted On:</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sub.disqualified ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Status:</span>
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger-color)', textAlign: 'right' }}>Disqualified</span>
                        </div>
                      ) : (sub.testId?.revealScores && sub.score !== undefined) ? (
                        <>
                          {(sub.testId.resultMetrics ? sub.testId.resultMetrics.includes('marks') : false) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Marks:</span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>
                                {sub.score} / {sub.maxScore || '?'}
                              </span>
                            </div>
                          )}
                          {(sub.testId.resultMetrics ? sub.testId.resultMetrics.includes('correct_answers') : false) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Correct Answers:</span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>
                                {sub.correctAnswers || 0}
                              </span>
                            </div>
                          )}
                          {(sub.testId.resultMetrics ? sub.testId.resultMetrics.includes('percentage') : true) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Percentage:</span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: sub.score >= (sub.maxScore ? sub.maxScore / 2 : 50) ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                {sub.maxScore ? ((sub.score / sub.maxScore) * 100).toFixed(2) : (sub.score !== undefined ? sub.score.toFixed(2) : 0)}%
                              </span>
                            </div>
                          )}
                          {(sub.testId.resultMetrics?.includes('percentile')) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Percentile:</span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {sub.percentile}%
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Result:</span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b', textAlign: 'right' }}>Pending / Not Declared</span>
                        </div>
                      )}
                    </div>
                    {sub.isCertificateEligible && (
                      <div style={{ marginTop: '16px' }}>
                        <Link 
                          href={`/student/certificate/${sub._id}`} 
                          target="_blank"
                          style={{ textDecoration: 'none' }}
                        >
                          <button 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '10px', background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                          >
                            🏅 View Certificate
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
