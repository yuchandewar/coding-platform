'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';

export default function ManageSubmissions() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef();
  
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchSubmissions(page);
  }, [page]);

  const fetchSubmissions = async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/admin/submissions?page=${pageNum}&limit=20`);
      const data = await res.json();
      
      if (data.submissions) {
        setSubmissions(prev => pageNum === 1 ? data.submissions : [...prev, ...data.submissions]);
        setHasMore(data.hasMore);
      } else {
        // Fallback if API hasn't been fully updated yet during hot-reload
        setSubmissions(data);
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Student Submissions</h1>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading && page === 1 ? <p>Loading submissions...</p> : (
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
                  {submissions.map((sub, index) => {
                    const isLastElement = index === submissions.length - 1;
                    return (
                      <tr 
                        key={sub._id} 
                        ref={isLastElement ? lastElementRef : null}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
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
                    );
                  })}
                </tbody>
              </table>
            )}
            
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                Loading more submissions...
              </div>
            )}
            {!hasMore && submissions.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
                End of submissions
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
