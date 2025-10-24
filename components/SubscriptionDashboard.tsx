'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'

interface SubscriptionData {
  tier: 'free' | 'pro' | 'elite'
  status: string
  current_period_end?: string
  cancel_at_period_end?: boolean
}

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [managingBilling, setManagingBilling] = useState(false)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      // Get subscription details
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setManagingBilling(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert('Please sign in to manage billing')
        setManagingBilling(false)
        return
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url
      } else {
        const errorMessage = data.error || 'Failed to create portal session'

        // Show more helpful error message
        if (errorMessage.includes('not configured')) {
          alert(
            '⚙️ Stripe Customer Portal Setup Required\n\n' +
            'The billing portal needs to be configured in Stripe:\n\n' +
            '1. Go to: https://dashboard.stripe.com/settings/billing/portal\n' +
            '2. Click "Activate" or "Turn on"\n' +
            '3. Configure the portal settings\n' +
            '4. Save changes\n\n' +
            'Then try again!'
          )
        } else {
          alert(`Failed to open billing portal:\n${errorMessage}`)
        }

        setManagingBilling(false)
      }
    } catch (error: any) {
      console.error('Failed to open billing portal:', error)
      alert(`Failed to open billing portal:\n${error?.message || 'Please try again.'}`)
      setManagingBilling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl p-6">
        <p className="text-gray-400 text-center">Please sign in to view your subscription</p>
      </div>
    )
  }

  const tier = subscription?.tier || 'free'
  const status = subscription?.status || 'inactive'
  const isActive = status === 'active'

  // Tier display configuration
  const tierConfig = {
    free: {
      name: 'Free',
      icon: '🆓',
      color: 'from-gray-600 to-gray-700',
      borderColor: 'border-gray-500',
    },
    pro: {
      name: 'Pro',
      icon: '⭐',
      color: 'from-yellow-500 to-yellow-600',
      borderColor: 'border-yellow-400',
    },
    elite: {
      name: 'Elite',
      icon: '👑',
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-400',
    },
  }

  const config = tierConfig[tier]

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-yellow-400/30 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Subscription</h2>
        {isActive && (
          <span className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm font-medium">
            ✓ Active
          </span>
        )}
      </div>

      {/* Current Plan */}
      <div className={`relative overflow-hidden rounded-lg border-2 ${config.borderColor} p-6 bg-gradient-to-r ${config.color}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{config.icon}</span>
            <div>
              <h3 className="text-2xl font-bold text-white">{config.name} Plan</h3>
              <p className="text-white/80 text-sm">
                {tier === 'free' && 'Basic tracking features'}
                {tier === 'pro' && 'Advanced analytics & tracking'}
                {tier === 'elite' && 'Full access + betting assistant'}
              </p>
            </div>
          </div>

          {subscription?.current_period_end && isActive && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/80 text-sm">
                {subscription.cancel_at_period_end ? (
                  <>
                    <span className="text-yellow-300 font-medium">⚠️ Cancels on:</span>{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </>
                ) : (
                  <>
                    <span className="font-medium">Renews on:</span>{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Access</h4>
        <div className="space-y-2">
          <FeatureItem enabled={true} text="Basic Tracker" />
          <FeatureItem enabled={tier === 'pro' || tier === 'elite'} text="Advanced Analytics" />
          <FeatureItem enabled={tier === 'elite'} text="Betting Assistant" />
          <FeatureItem enabled={tier === 'pro' || tier === 'elite'} text="47 Betting Groups" />
          <FeatureItem enabled={tier === 'elite'} text="AI Predictions" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-700">
        {tier === 'free' && (
          <a
            href="/pricing"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-400/50 transition-all text-center"
          >
            Upgrade Now
          </a>
        )}

        {(tier === 'pro' || tier === 'elite') && isActive && (
          <>
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {managingBilling ? 'Opening Portal...' : 'Manage Billing'}
            </button>
            {tier === 'pro' && (
              <a
                href="/pricing"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-400/50 transition-all text-center"
              >
                Upgrade to Elite
              </a>
            )}
          </>
        )}
      </div>

      {/* Account Info */}
      <div className="pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-500">
          Account: <span className="text-gray-300">{user.email}</span>
        </p>
      </div>
    </div>
  )
}

function FeatureItem({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <span className="text-green-400">✓</span>
      ) : (
        <span className="text-gray-600">✗</span>
      )}
      <span className={enabled ? 'text-gray-300' : 'text-gray-600'}>{text}</span>
    </div>
  )
}
