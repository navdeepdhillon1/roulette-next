'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackNavigationClick } from '@/lib/analytics';

export default function Navigation() {
  const pathname = usePathname();
  
  // For now, show all 5 tabs - we'll add tier restrictions later with auth
  let userTier: 'free' | 'pro' | 'elite' = 'elite'; // ✅ allows all 3 types without literal narrowing
  
  // Dynamic links based on tier (use mapping to avoid literal-comparison errors)
  const linksByTier: Record<'free' | 'pro' | 'elite', Array<{ href: string; label: string; icon: string }>> = {
    free: [
      { href: '/', label: 'Home', icon: '🏠' },
      { href: '/tracker', label: 'Basic Tracker', icon: '📋' },
      { href: '/learn', label: 'Learning', icon: '📚' },
    ],
    pro: [
      { href: '/', label: 'Home', icon: '🏠' },
      { href: '/tracker', label: 'Basic Tracker', icon: '📋' },
      { href: '/analysis', label: 'Advanced Tracker', icon: '📊' },
      { href: '/learn', label: 'Learning', icon: '📚' },
    ],
    elite: [
      { href: '/', label: 'Home', icon: '🏠' },
      { href: '/tracker', label: 'Basic Tracker', icon: '📋' },
      { href: '/analysis', label: 'Advanced Tracker', icon: '📊' },
      { href: '/assistant', label: 'Betting Assistant', icon: '🎯' },
      { href: '/learn', label: 'Learning', icon: '📚' },
    ],
  };
  const links = linksByTier[userTier];
  
  return (
    <nav className="bg-black/60 backdrop-blur border-b border-yellow-400/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center gap-3">
            <div className="text-3xl">🎰</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                ROULETTE TRACKER
              </h1>
              <p className="text-yellow-400/60 text-xs tracking-widest">PROFESSIONAL EDITION</p>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => trackNavigationClick(link.label)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-400/50'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}