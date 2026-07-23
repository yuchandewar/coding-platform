'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../../admin.module.css';

export default function LeaderboardPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [id]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${id}/leaderboard`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      console.error(err);
      alert('Error fetching leaderboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDisqualify = async (submissionId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 're-qualify' : 'disqualify'} this student?`)) return;
    
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/disqualify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disqualified: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Refetch from server to automatically apply correct re-ranking and sorting
      await fetchLeaderboard();
    } catch (err) {
      alert('Error updating disqualification status: ' + err.message);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleDownloadCSV = () => {
    if (!data || !data.leaderboard || data.leaderboard.length === 0) return;
    
    const headers = ['Rank', 'Student Name', 'Username', 'Score', 'Time Taken', 'Tab Switches', 'Submitted On'];
    const csvRows = [headers.join(',')];
    
    data.leaderboard.forEach(sub => {
      const row = [
        sub.rank,
        `"${sub.studentName || ''}"`,
        `"${sub.studentUsername || ''}"`,
        sub.score?.toFixed(2) || 0,
        formatTime(sub.timeTaken),
        sub.tabSwitches || 0,
        `"${new Date(sub.createdAt).toLocaleString()}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.testTitle?.replace(/[^a-zA-Z0-9]/g, '_')}_leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push(`/admin/tests/${id}`)} className="btn-primary" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>← Back to Test</button>
          <h1>Leaderboard: {data?.testTitle || 'Loading...'}</h1>
        </div>
        <button 
          onClick={handleDownloadCSV} 
          disabled={!data || data.leaderboard.length === 0}
          className="btn-primary"
          style={{ padding: '8px 16px', background: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>📥 Download CSV</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <p>Loading leaderboard...</p>
        ) : (
          <div style={{ marginTop: '10px' }}>
            {data.leaderboard.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No submissions yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: 'bold' }}>Rank</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Student</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Score</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Time Taken</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Tab Switches</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Submitted On</th>
                    <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((sub) => (
                    <tr key={sub.submissionId} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      background: sub.rank === 1 ? 'rgba(251, 191, 36, 0.1)' : sub.rank === 2 ? 'rgba(226, 232, 240, 0.1)' : sub.rank === 3 ? 'rgba(180, 83, 9, 0.1)' : 'transparent',
                      opacity: sub.disqualified ? 0.5 : 1,
                      textDecoration: sub.disqualified ? 'line-through' : 'none'
                    }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', fontSize: '18px', color: sub.rank === 1 ? '#fbbf24' : sub.rank === 2 ? '#e2e8f0' : sub.rank === 3 ? '#b45309' : '#94a3b8' }}>
                        {sub.rank === '-' ? '-' : `#${sub.rank}`}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 'bold', color: sub.disqualified ? '#ef4444' : 'white' }}>
                          {sub.studentName} {sub.disqualified && '(Disqualified)'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {sub.studentUsername}</div>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: sub.score >= 50 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {sub.score?.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>
                        {formatTime(sub.timeTaken)}
                      </td>
                      <td style={{ padding: '12px 8px', color: sub.tabSwitches > 0 ? 'var(--danger-color)' : '#cbd5e1', fontWeight: sub.tabSwitches > 0 ? 'bold' : 'normal' }}>
                        {sub.tabSwitches || 0}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '14px' }}>
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <button
                          onClick={() => handleToggleDisqualify(sub.submissionId, sub.disqualified)}
                          style={{
                            padding: '6px 12px',
                            background: sub.disqualified ? 'rgba(255,255,255,0.1)' : 'var(--danger-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {sub.disqualified ? 'Undo Disqualify' : 'X'}
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
