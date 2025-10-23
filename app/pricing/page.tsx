'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import AuthModal from '@/components/AuthModal'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-config'
import { getCurrentUser } from '@/lib/auth'

type BillingInterval = 'monthly' | 'annual'

export default function PricingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'elite'>('free')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
  const [isLoading, setIsLoading] = useState(false)

  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      monthlyPrice: '$0',
      annualPrice: '$0',
      period: 'forever',
      description: 'Perfect for casual players',
      features: [
        '50 spins per session',
        'Basic tracker with 6 common bets',
        'Simple number grid',
        'Local browser storage',
        'Heat map visualization',
      ],
      limitations: [
        'No cloud sync',
        'No export features',
        'No advanced analytics',
      ],
      highlight: false,
      cta: 'Start Free',
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      monthlyPrice: '$9.99',
      annualPrice: '$99.99',
      period: billingInterval === 'monthly' ? '/month' : '/year',
      description: 'For serious players',
      features: [
        'Unlimited spins',
        'All 47 betting groups tracked',
        'Advanced analytics dashboard',
        'CSV/JSON export',
        'Pattern detection engine',
        'Time correlation analysis',
        'Streak tracking',
        'Email support',
      ],
      limitations: [],
      highlight: true,
      cta: 'Start Pro Trial',
      badge: 'Most Popular',
    },
    {
      id: 'elite' as const,
      name: 'Elite',
      monthlyPrice: '$19.99',
      annualPrice: '$199.99',
      period: billingInterval === 'monthly' ? '/month' : '/year',
      description: 'For professional strategists',
      features: [
        'Everything in Pro, plus:',
        'Cloud storage & sync',
        'AI Betting Assistant',
        'Real-time recommendations',
        'Probability chamber predictions',
        'Dealer tracking',
        'Group performance matrix',
        'Session comparison',
        'Advanced wheel analysis',
        'Priority support',
        'Early access to new features',
      ],
      limitations: [],
      highlight: false,
      cta: 'Start Elite Trial',
      badge: 'Best Value',
    },
  ]

  const handleSelectPlan = async (planId: 'free' | 'pro' | 'elite') => {
    // Free plan - just show auth modal
    if (planId === 'free') {
      setSelectedPlan(planId)
      setShowAuthModal(true)
      return
    }

    // Paid plans - check auth then redirect to Stripe
    setIsLoading(true)

    try {
      // Check if user is authenticated
      const user = await getCurrentUser()

      if (!user) {
        // User not logged in - show auth modal
        setSelectedPlan(planId)
        setShowAuthModal(true)
        setIsLoading(false)
        return
      }

      // User is authenticated - get the correct price ID
      const priceId = STRIPE_PRICE_IDS[planId][billingInterval]

      // Call our checkout API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price_id: priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Start tracking smarter. Upgrade anytime. Cancel anytime.
          </p>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-full p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingInterval === 'annual'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-400 shadow-2xl shadow-yellow-400/20 scale-105'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-sm font-bold rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold text-yellow-400">
                    {billingInterval === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-gray-600 mt-1">✗</span>
                    <span className="text-gray-500 text-sm line-through">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg hover:shadow-yellow-400/50'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isLoading ? 'Loading...' : plan.cta}
              </button>

              {plan.id !== 'free' && (
                <p className="text-center text-gray-500 text-xs mt-3">
                  7-day free trial • Cancel anytime
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-bold">Free</th>
                  <th className="text-center py-4 px-4 text-yellow-400 font-bold">Pro</th>
                  <th className="text-center py-4 px-4 text-orange-400 font-bold">Elite</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Spins per session', free: '50', pro: 'Unlimited', elite: 'Unlimited' },
                  { feature: 'Betting groups tracked', free: '6 basic', pro: 'All 47', elite: 'All 47' },
                  { feature: 'Data export (CSV/JSON)', free: '✗', pro: '✓', elite: '✓' },
                  { feature: 'Cloud storage & sync', free: '✗', pro: '✗', elite: '✓' },
                  { feature: 'Pattern detection', free: '✗', pro: '✓', elite: '✓' },
                  { feature: 'AI Betting Assistant', free: '✗', pro: '✗', elite: '✓' },
                  { feature: 'Dealer tracking', free: '✗', pro: '✗', elite: '✓' },
                  { feature: 'Real-time recommendations', free: '✗', pro: '✗', elite: '✓' },
                  { feature: 'Probability predictions', free: '✗', pro: '✗', elite: '✓' },
                  { feature: 'Support', free: 'Community', pro: 'Email', elite: 'Priority' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-gray-300">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-gray-400">{row.free}</td>
                    <td className="py-3 px-4 text-center text-white">{row.pro}</td>
                    <td className="py-3 px-4 text-center text-white">{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes! Change your plan anytime from your account settings. Upgrades take effect immediately, downgrades at the end of your billing period.',
              },
              {
                q: 'Is there a free trial for paid plans?',
                a: 'Yes! Both Pro and Elite plans come with a 7-day free trial. No credit card required to start.',
              },
              {
                q: 'What happens to my data if I cancel?',
                a: 'Your data remains accessible in read-only mode for 30 days. You can export it anytime during this period.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          // TODO: Redirect to appropriate page based on selected plan
          window.location.href = selectedPlan === 'free' ? '/tracker' : '/analysis'
        }}
      />
    </div>
  )
}
