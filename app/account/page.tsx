'use client'

import Navigation from '@/components/Navigation'
import SubscriptionDashboard from '@/components/SubscriptionDashboard'

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27]">
      <Navigation />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent mb-2">
            Account Settings
          </h1>
          <p className="text-gray-400">
            Manage your subscription and account preferences
          </p>
        </div>

        {/* Subscription Dashboard */}
        <SubscriptionDashboard />
      </div>
    </div>
  )
}
