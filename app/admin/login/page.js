'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Access Denied. You are not an administrator.');
      }

      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.loginCard}`}>
        <div className={styles.header}>
          <div className={styles.logo} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>🛡️</div>
          <h1>Admin Portal</h1>
          <p>Login to manage tests</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. admin_user"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
          Don't have an admin account? <a href="/admin/register" style={{ color: '#10b981' }}>Register here</a>
        </p>
      </div>
    </main>
  );
}
