'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className={styles.adminLayout}>
      <aside className={`glass-panel ${styles.sidebar}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>&lt;/&gt;</div>
          <h2>Admin</h2>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin" className={`${styles.navItem} ${pathname === '/admin' ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link href="/admin/users" className={`${styles.navItem} ${pathname.includes('/admin/users') ? styles.active : ''}`}>
            Manage Students
          </Link>
          <Link href="/admin/tests" className={`${styles.navItem} ${pathname.includes('/admin/tests') ? styles.active : ''}`}>
            Manage Tests
          </Link>
          <Link href="/admin/submissions" className={`${styles.navItem} ${pathname.includes('/admin/submissions') ? styles.active : ''}`}>
            Submissions
          </Link>
        </nav>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
