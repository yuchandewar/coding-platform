'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from '../admin/admin.module.css'; // Reusing admin styles for layout

export default function StudentLayout({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const pathname = usePathname();
  const isExamPage = pathname.includes('/exam/');
  const isCertificatePage = pathname.includes('/certificate/');

  if (isExamPage || isCertificatePage) {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={`glass-panel ${styles.sidebar}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>&lt;/&gt;</div>
          <h2>Student</h2>
        </div>
        <nav className={styles.nav}>
          <Link href="/student" className={`${styles.navItem} ${pathname === '/student' ? styles.active : ''}`}>
            My Tests
          </Link>
          <Link href="/student/results" className={`${styles.navItem} ${pathname === '/student/results' ? styles.active : ''}`}>
            Results
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
