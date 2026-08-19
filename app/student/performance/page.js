'use client';

import { useState, useEffect } from 'react';
import styles from '../../admin/admin.module.css';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default function StudentOverallPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/student/performance');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading performance history...</div>;
  if (error) return <div style={{ padding: '40px', color: 'var(--danger-color)' }}>{error}</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Overall Performance Track</h1>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <p style={{ color: '#cbd5e1', fontSize: '15px' }}>
          This dashboard calculates your aggregate performance across all past exams where analytics are enabled.
        </p>
        <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '8px' }}>
          Total Exams Analyzed: {data.testsAnalyzed}
        </p>
      </div>

      {data.testsAnalyzed === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>📊</span>
          <p>No performance data available yet.</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Complete more tests that have performance tracking enabled to see your analytics here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Radar Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Skill Radar</h3>
              {data.categories.length > 2 ? (
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.categories}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="category" stroke="#cbd5e1" fontSize={13} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="My Skills" dataKey="percentage" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  Not enough categories to generate a radar chart (minimum 3 required).
                </div>
              )}
            </div>

            {/* Line Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Performance Over Time</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={data.historyLine} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="score" name="Score (%)" stroke="var(--success-color)" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', color: '#f8fafc' }}>Category Strengths & Action Plan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {data.categories.map((cat, idx) => (
                <div key={idx} style={{ 
                  padding: '20px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '12px', 
                  borderTop: `4px solid ${cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'}` 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '18px', color: '#f8fafc' }}>{cat.category}</strong>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: cat.label === 'Strong' ? 'rgba(16, 185, 129, 0.2)' : cat.label === 'Weak' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: cat.label === 'Strong' ? 'var(--success-color)' : cat.label === 'Weak' ? 'var(--danger-color)' : '#f59e0b'
                    }}>
                      {cat.percentage}% ({cat.label})
                    </span>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--primary-color)', display: 'block', marginBottom: '4px' }}>Action Plan:</strong>
                    <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>{cat.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
