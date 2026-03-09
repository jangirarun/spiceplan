import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'SpicePlan v2',
  description: 'Weekly Indian vegetarian meal planner'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">SpicePlan</Link>
          <nav className="nav">
            <Link href="/">Planner</Link>
            <Link href="/library">Dish Library</Link>
            <Link href="/shopping">Shopping List</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
