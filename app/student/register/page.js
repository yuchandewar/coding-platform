'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

export default function StudentRegister() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, role: 'student' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/student/login');
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
          <div className={styles.logo}>🎓</div>
          <h1>Student Portal</h1>
          <p>Register to take tests</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. John Doe"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. john_doe"
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

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
          Already have an account? <a href="/student/login" style={{ color: 'var(--primary-color)' }}>Login here</a>
        </p>
      </div>
    </main>
  );
}
