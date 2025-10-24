'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AuthModal from './AuthModal'

type SubscriptionTier = 'free' | 'pro' | 'elite'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredTier: SubscriptionTier
  featureName: string
}

export default function ProtectedRoute({ children, requiredTier, featureName }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier | null>(null) // null = loading
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const user = await getCurrentUser()

    if (!user) {
      setIsAuthenticated(false)
      setShowAuthModal(true)
      return
    }

    setIsAuthenticated(true)

    // Get user's subscription tier from API (server-side check)
    try {
      // Get the session to extract the access token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      console.log('[ProtectedRoute] Session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenPreview: session?.access_token?.substring(0, 20) + '...',
        sessionError: sessionError,
        userId: session?.user?.id,
      })

      if (!session?.access_token) {
        console.warn('[ProtectedRoute] No access token available - defaulting to free tier')
        setUserTier('free')
        return
      }

      // Call API with auth token
      console.log('[ProtectedRoute] Calling /api/subscription with auth token...')
      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      console.log('[ProtectedRoute] API response status:', response.status)

      const data = await response.json()
      console.log('[ProtectedRoute] Subscription data:', data)

      const tier = (data.tier || 'free') as SubscriptionTier
      console.log('[ProtectedRoute] Setting user tier to:', tier)
      setUserTier(tier)
    } catch (error) {
      console.error('[ProtectedRoute] Failed to fetch subscription:', error)
      setUserTier('free')
    }
  }

  // Still checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // User not authenticated - show login modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">
            Please sign in to access <strong className="text-yellow-400">{featureName}</strong>
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-400/50 transition-all"
          >
            Sign In / Sign Up
          </button>
        </div>

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false)
              router.push('/pricing')
            }}
            defaultPlan="pro"
          />
        )}
      </div>
    )
  }

  // Still checking subscription tier
  if (userTier === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mb-4"></div>
          <p className="text-gray-400">Checking subscription...</p>
        </div>
      </div>
    )
  }

  // Check if user has required subscription tier
  const hasAccess = checkTierAccess(userTier, requiredTier)

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="text-6xl mb-4">⬆️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Upgrade Required</h1>
          <p className="text-gray-400 mb-2">
            <strong className="text-yellow-400">{featureName}</strong> requires a <strong className="text-yellow-400">{requiredTier.toUpperCase()}</strong> subscription.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Your current plan: <strong>{userTier.toUpperCase()}</strong>
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-400/50 transition-all"
          >
            View Upgrade Options
          </button>
        </div>
      </div>
    )
  }

  // User has access - render the protected content
  return <>{children}</>
}

// Helper function to check if user's tier grants access
function checkTierAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 1,
    elite: 2,
  }

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier]
}
