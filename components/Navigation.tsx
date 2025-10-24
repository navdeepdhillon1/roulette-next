'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { trackNavigationClick } from '@/lib/analytics';
import { getCurrentUser, signOut } from '@/lib/auth';
import AuthModal from './AuthModal';

export default function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'elite'>('free');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    // If user is signed in, check their subscription tier
    if (currentUser) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          const response = await fetch('/api/subscription', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          const data = await response.json();
          setUserTier(data.tier || 'free');
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
        setUserTier('free');
      }
    } else {
      // Not signed in = free tier
      setUserTier('free');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setUserTier('free');
    setShowUserMenu(false);
    window.location.reload(); // Refresh to clear session
  };

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
    <>
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
          
          {/* Navigation Links + Auth */}
          <div className="flex gap-2 items-center">
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

            {/* Auth Buttons / User Menu */}
            {!user ? (
              <>
                <button
                  onClick={() => {
                    trackNavigationClick('Sign In');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                >
                  <span>🔐</span>
                  <span className="hidden md:inline">Sign In</span>
                </button>
                <Link
                  href="/pricing"
                  onClick={() => trackNavigationClick('Get Started')}
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                >
                  <span>🚀</span>
                  <span className="hidden md:inline">Get Started</span>
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <span>👤</span>
                  <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => {
                        setShowUserMenu(false)
                        trackNavigationClick('Account')
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-all"
                    >
                      ⚙️ Account Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-all"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* Auth Modal - Rendered outside nav to avoid z-index issues */}
    {showAuthModal && (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Refresh user state after auth
          checkAuth();
        }}
        onSuccess={() => {
          setShowAuthModal(false);
          // Refresh user state after successful auth
          checkAuth();
        }}
      />
    )}
    </>
  );
}