'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Dashboard Analytics</h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2>Welcome to CodeXam Admin</h2>
        <p style={{ color: '#94a3b8', marginTop: '12px' }}>
          Overview of your coding platform's performance and security metrics.
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Loading analytics...</div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid var(--primary-color)' }}>
            <h3 style={{ color: '#cbd5e1', fontSize: '14px' }}>Total Students</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginTop: '12px' }}>{stats.totalStudents}</p>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid var(--success-color)' }}>
            <h3 style={{ color: '#cbd5e1', fontSize: '14px' }}>Published Tests</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginTop: '12px' }}>{stats.totalTests}</p>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ color: '#cbd5e1', fontSize: '14px' }}>Total Submissions</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginTop: '12px' }}>{stats.totalSubmissions}</p>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #8b5cf6' }}>
            <h3 style={{ color: '#cbd5e1', fontSize: '14px' }}>Average Score</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginTop: '12px' }}>{stats.averageScore}%</p>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderTop: `4px solid ${stats.totalTabSwitches > 0 ? '#ef4444' : '#10b981'}` }}>
            <h3 style={{ color: '#cbd5e1', fontSize: '14px' }}>Tab-Switches Logged (Anti-Cheating)</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: stats.totalTabSwitches > 0 ? '#ef4444' : '#10b981', marginTop: '12px' }}>
              {stats.totalTabSwitches}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ color: '#ef4444' }}>Failed to load stats.</div>
      )}
    </div>
  );
}
