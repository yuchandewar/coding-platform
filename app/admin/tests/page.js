'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function ManageTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(60);
  const [status, setStatus] = useState('draft');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [strictTimer, setStrictTimer] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/admin/tests');
      const data = await res.json();
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, description, timerMinutes, status, 
          startTime: startTime ? new Date(startTime).toISOString() : null,
          endTime: endTime ? new Date(endTime).toISOString() : null,
          strictTimer,
          questions: [] 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess('Test created successfully!');
      setTitle('');
      setDescription('');
      setTimerMinutes(60);
      setStatus('draft');
      setStartTime('');
      setEndTime('');
      setStrictTimer(false);
      fetchTests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Manage Tests</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3>Create New Test</h3>
          <form onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {error && <div style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success-color)', fontSize: '14px' }}>{success}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Test Title</label>
              <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Description</label>
              <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Timer (Minutes)</label>
              <input type="number" min="1" className="input-field" value={timerMinutes === '' ? '' : timerMinutes} onChange={(e) => setTimerMinutes(e.target.value === '' ? '' : parseInt(e.target.value))} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Start Time (Optional)</label>
              <input type="datetime-local" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>End Time (Optional)</label>
              <input type="datetime-local" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={strictTimer} onChange={(e) => setStrictTimer(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>Enable Strict Timer</label>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Records start time. Timer continues running in background if student leaves.</span>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Create Test</button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3>Test List</h3>
          {loading ? <p style={{ marginTop: '20px' }}>Loading...</p> : (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tests.length === 0 ? <p style={{ color: '#94a3b8' }}>No tests created yet.</p> : tests.map(test => (
                <div key={test._id} style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '18px', color: 'var(--primary-color)' }}>{test.title}</h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: test.status === 'live' ? 'rgba(16, 185, 129, 0.2)' : (test.status === 'expired' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'), color: test.status === 'live' ? 'var(--success-color)' : (test.status === 'expired' ? 'var(--danger-color)' : '#fcd34d') }}>
                        {test.status.toUpperCase()}
                      </span>
                      <button 
                        onClick={() => window.location.href = `/admin/tests/${test._id}/leaderboard`}
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success-color)' }}
                      >
                        Leaderboard
                      </button>
                      <button 
                        onClick={() => window.location.href = `/admin/tests/${test._id}`}
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary-color)' }}
                      >
                        Manage Questions
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>{test.description || 'No description'}</p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                    <span>⏱ {test.timerMinutes} mins</span>
                    <span>📝 {test.questions?.length || 0} Questions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
