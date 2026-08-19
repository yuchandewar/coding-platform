'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../admin.module.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/admin/users?page=${pageNum}&limit=20`);
      const data = await res.json();
      
      if (data.users) {
        setUsers(prev => pageNum === 1 ? data.users : [...prev, ...data.users]);
        setHasMore(data.hasMore);
      } else {
        // Fallback if API hasn't been fully updated yet during hot-reload
        setUsers(data);
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
      setPage(1); // Reset to first page
      fetchUsers(1);
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
          {loading && page === 1 ? <p style={{ marginTop: '20px' }}>Loading...</p> : (
            <div style={{ marginTop: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
              {users.length === 0 ? <p style={{ color: '#94a3b8' }}>No students found.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg, #1e293b)', zIndex: 10 }}>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Name</th>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Student ID</th>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500' }}>Created At</th>
                      <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => {
                      const isLastElement = index === users.length - 1;
                      return (
                        <tr 
                          key={user._id} 
                          ref={isLastElement ? lastElementRef : null}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <td style={{ padding: '12px 8px' }}>{user.name}</td>
                          <td style={{ padding: '12px 8px' }}>{user.username}</td>
                          <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button 
                              onClick={() => window.location.href = `/admin/users/${user._id}/performance`}
                              className="btn-primary" 
                              style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--primary-color)' }}
                            >
                              Performance
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
                  Loading more students...
                </div>
              )}
              {!hasMore && users.length > 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
                  End of student list
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
