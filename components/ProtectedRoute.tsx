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
  const [userTier, setUserTier] = useState<SubscriptionTier>('free')
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

    // Get user's subscription tier from Supabase
    const { supabase } = await import('@/lib/supabase')

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const tier = (subscription?.tier || 'free') as SubscriptionTier
    setUserTier(tier)
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
