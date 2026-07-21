import './globals.css';

export const metadata = {
  title: 'CodeXam Platform',
  description: 'A Next.js based coding exam platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
