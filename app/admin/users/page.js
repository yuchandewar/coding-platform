'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess('Student created successfully!');
      setName('');
      setUsername('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Manage Students</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3>Add New Student</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {error && <div style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success-color)', fontSize: '14px' }}>{success}</div>}
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Full Name</label>
              <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Student ID / Username</label>
              <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Create Student</button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3>Student List</h3>
          {loading ? <p style={{ marginTop: '20px' }}>Loading...</p> : (
            <div style={{ marginTop: '20px' }}>
              {users.length === 0 ? <p style={{ color: '#94a3b8' }}>No students found.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Name</th>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Student ID</th>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px' }}>{user.name}</td>
                        <td style={{ padding: '12px 8px' }}>{user.username}</td>
                        <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
