'use client'

import React, { useMemo, useState } from 'react'
import { useBettingData } from './BettingDataContext'
import { TrendingUp, TrendingDown, Target, Flame, Snowflake, Users, Disc } from 'lucide-react'

// European wheel order (physical layout)
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]

// Wheel groups (European layout)
const WHEEL_GROUPS = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25], // 17 numbers - 45.9%
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33], // 12 numbers - 32.4%
  orphelins: [17, 34, 6, 1, 20, 14, 31, 9] // 8 numbers - 21.6%
}

// Divide wheel into 4 quadrants (based on physical position)
const WHEEL_QUADRANTS = {
  q1: [0, 32, 15, 19, 4, 21, 2, 25, 17], // 0-17 on wheel
  q2: [34, 6, 27, 13, 36, 11, 30, 8, 23], // 17-23 on wheel
  q3: [10, 5, 24, 16, 33, 1, 20, 14, 31], // 23-31 on wheel
  q4: [9, 22, 18, 29, 7, 28, 12, 35, 3, 26] // 31-37 on wheel
}

interface WheelMetrics {
  wheelGroups: {
    voisins: { count: number; hitRate: number; expected: number }
    tiers: { count: number; hitRate: number; expected: number }
    orphelins: { count: number; hitRate: number; expected: number }
  }
  wheelQuadrants: {
    q1: { count: number; hitRate: number; expected: number }
    q2: { count: number; hitRate: number; expected: number }
    q3: { count: number; hitRate: number; expected: number }
    q4: { count: number; hitRate: number; expected: number }
  }
  neighborClustering: number // Average distance between consecutive spins on wheel
  sequentialPatterns: number // How often consecutive numbers land near each other
}

interface DealerMetrics {
  dealerId: number
  totalSpins: number
  numbers: number[]
  hotNumbers: { number: number; count: number; wheelPosition: number }[]
  coldNumbers: number[]
  wheelMetrics: WheelMetrics
}

interface DealerStatsProps {
  session?: any
  spinHistory?: number[]
}

export default function DealerStats({ session, spinHistory: propSpinHistory }: DealerStatsProps) {
  const { spinHistory: contextSpinHistory, sessionStats } = useBettingData()
  const spinHistory = propSpinHistory || contextSpinHistory

  // Helper: Get dealer name from session config
  const getDealerName = (dealerId: number): string => {
    // If we have session config with dealer info
    if (session?.config) {
      // If this is dealer 1 and we have a current dealer name, use it
      if (dealerId === 1 && session.config.dealerName) {
        return session.config.dealerName
      }

      // If we have available dealers list, try to map by index
      if (session.config.availableDealers && session.config.availableDealers.length > 0) {
        const dealer = session.config.availableDealers[dealerId - 1]
        if (dealer) {
          return dealer.nickname || dealer.name
        }
      }
    }

    // Fallback to generic label
    return `Dealer ${dealerId}`
  }

  // Helper: Get wheel position of a number
  const getWheelPosition = (num: number): number => {
    return WHEEL_ORDER.indexOf(num)
  }

  // Helper: Calculate distance between two numbers on the wheel
  const getWheelDistance = (num1: number, num2: number): number => {
    const pos1 = getWheelPosition(num1)
    const pos2 = getWheelPosition(num2)
    const directDist = Math.abs(pos2 - pos1)
    const wrapDist = WHEEL_ORDER.length - directDist
    return Math.min(directDist, wrapDist)
  }

  // Calculate dealer-specific metrics
  const dealerMetrics = useMemo(() => {
    const dealers: Record<number, DealerMetrics> = {}
    let currentDealer = 1

    spinHistory.forEach((spin) => {
      // Check if it's a dealer change
      if ((spin as any).isDealerChange) {
        currentDealer = (spin as any).dealerNumber
        return
      }

      // Initialize dealer if not exists
      if (!dealers[currentDealer]) {
        dealers[currentDealer] = {
          dealerId: currentDealer,
          totalSpins: 0,
          numbers: [],
          hotNumbers: [],
          coldNumbers: [],
          wheelMetrics: {
            wheelGroups: {
              voisins: { count: 0, hitRate: 0, expected: 45.9 },
              tiers: { count: 0, hitRate: 0, expected: 32.4 },
              orphelins: { count: 0, hitRate: 0, expected: 21.6 }
            },
            wheelQuadrants: {
              q1: { count: 0, hitRate: 0, expected: 25 },
              q2: { count: 0, hitRate: 0, expected: 25 },
              q3: { count: 0, hitRate: 0, expected: 25 },
              q4: { count: 0, hitRate: 0, expected: 25 }
            },
            neighborClustering: 0,
            sequentialPatterns: 0
          }
        }
      }

      // Track the spin
      dealers[currentDealer].totalSpins++
      dealers[currentDealer].numbers.push(spin.number)
    })

    // Calculate metrics for each dealer
    Object.values(dealers).forEach((dealer) => {
      const { numbers } = dealer

      // Hot numbers (top 5 most frequent) with wheel positions
      const numberCounts: Record<number, number> = {}
      numbers.forEach((num) => {
        numberCounts[num] = (numberCounts[num] || 0) + 1
      })
      dealer.hotNumbers = Object.entries(numberCounts)
        .map(([num, count]) => ({
          number: parseInt(num),
          count,
          wheelPosition: getWheelPosition(parseInt(num))
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Cold numbers (haven't appeared)
      const appearedNumbers = new Set(numbers)
      dealer.coldNumbers = Array.from({ length: 37 }, (_, i) => i)
        .filter((num) => !appearedNumbers.has(num))
        .slice(0, 10)

      // Wheel Groups Performance
      const voisinsCount = numbers.filter(n => WHEEL_GROUPS.voisins.includes(n)).length
      const tiersCount = numbers.filter(n => WHEEL_GROUPS.tiers.includes(n)).length
      const orphelinsCount = numbers.filter(n => WHEEL_GROUPS.orphelins.includes(n)).length

      dealer.wheelMetrics.wheelGroups = {
        voisins: {
          count: voisinsCount,
          hitRate: (voisinsCount / numbers.length) * 100,
          expected: 45.9
        },
        tiers: {
          count: tiersCount,
          hitRate: (tiersCount / numbers.length) * 100,
          expected: 32.4
        },
        orphelins: {
          count: orphelinsCount,
          hitRate: (orphelinsCount / numbers.length) * 100,
          expected: 21.6
        }
      }

      // Wheel Quadrants Performance
      const q1Count = numbers.filter(n => WHEEL_QUADRANTS.q1.includes(n)).length
      const q2Count = numbers.filter(n => WHEEL_QUADRANTS.q2.includes(n)).length
      const q3Count = numbers.filter(n => WHEEL_QUADRANTS.q3.includes(n)).length
      const q4Count = numbers.filter(n => WHEEL_QUADRANTS.q4.includes(n)).length

      dealer.wheelMetrics.wheelQuadrants = {
        q1: { count: q1Count, hitRate: (q1Count / numbers.length) * 100, expected: 25 },
        q2: { count: q2Count, hitRate: (q2Count / numbers.length) * 100, expected: 25 },
        q3: { count: q3Count, hitRate: (q3Count / numbers.length) * 100, expected: 25 },
        q4: { count: q4Count, hitRate: (q4Count / numbers.length) * 100, expected: 25 }
      }

      // Neighbor Clustering Analysis
      let totalDistance = 0
      let clusteredSpins = 0
      for (let i = 1; i < numbers.length; i++) {
        const distance = getWheelDistance(numbers[i-1], numbers[i])
        totalDistance += distance
        if (distance <= 5) { // Within 5 pockets on the wheel
          clusteredSpins++
        }
      }
      dealer.wheelMetrics.neighborClustering = numbers.length > 1 ? totalDistance / (numbers.length - 1) : 0
      dealer.wheelMetrics.sequentialPatterns = numbers.length > 1 ? (clusteredSpins / (numbers.length - 1)) * 100 : 0
    })

    return dealers
  }, [spinHistory])

  const dealers = Object.values(dealerMetrics).sort((a, b) => a.dealerId - b.dealerId)

  if (dealers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="text-gray-600 mb-4" size={64} />
        <h3 className="text-2xl font-bold text-white mb-2">No Dealer Data Yet</h3>
        <p className="text-gray-400">Start spinning to collect dealer statistics</p>
      </div>
    )
  }

  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

  const [overviewTab, setOverviewTab] = useState<'summary' | 'compare'>('summary')

  // Calculate session duration and spins per hour
  const sessionMetrics = useMemo(() => {
    if (!session) return null

    const startTime = session.startTime || session.createdAt
    const endTime = session.endTime || new Date().toISOString()

    if (!startTime) return null

    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    const totalSpins = spinHistory.length
    const spinsPerHour = durationHours > 0 ? totalSpins / durationHours : 0

    return {
      startTime: start,
      endTime: session.endTime ? end : null,
      durationMs,
      durationHours,
      totalSpins,
      spinsPerHour
    }
  }, [session, spinHistory])

  // Format duration as HH:MM:SS
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Session Context Header */}
      {session && session.config && sessionMetrics && (
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-cyan-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Current Session</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Casino & Dealer Info */}
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Casino</div>
              <div className="text-lg font-bold text-white truncate">
                {session.config.casinoName || 'Not Set'}
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Dealer</div>
              <div className="text-lg font-bold text-cyan-400 truncate">
                {session.config.dealerName || 'Not Set'}
              </div>
              {session.config.dealerId && (
                <div className="text-xs text-gray-500">ID: {session.config.dealerId}</div>
              )}
            </div>

            {/* Session Timing */}
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-bold text-white">
                {formatDuration(sessionMetrics.durationMs)}
              </div>
              <div className="text-xs text-gray-500">
                Started: {sessionMetrics.startTime.toLocaleTimeString()}
              </div>
            </div>

            {/* Spins & Rate */}
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Total Spins</div>
              <div className="text-lg font-bold text-green-400">
                {sessionMetrics.totalSpins}
              </div>
              <div className="text-xs text-gray-500">
                {sessionMetrics.spinsPerHour.toFixed(1)} spins/hr
              </div>
            </div>
          </div>

          {/* Optional: Session end time if completed */}
          {sessionMetrics.endTime && (
            <div className="mt-3 text-xs text-gray-400 text-center">
              Session ended: {sessionMetrics.endTime.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Overall Dealer Summary with Tabs */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="text-cyan-400" />
          Dealer Performance Overview
        </h2>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setOverviewTab('summary')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              overviewTab === 'summary'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setOverviewTab('compare')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              overviewTab === 'compare'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Compare Dealers
          </button>
        </div>

        {/* Summary View */}
        {overviewTab === 'summary' && (
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((dealerId) => {
              const dealer = dealers.find((d) => d.dealerId === dealerId)
              const totalSpins = dealer?.totalSpins || 0
              const percentage = sessionStats.totalSpins > 0
                ? ((totalSpins / sessionStats.totalSpins) * 100).toFixed(1)
                : '0.0'

              return (
                <div
                  key={dealerId}
                  className={`rounded-lg p-4 border-2 ${
                    totalSpins > 0
                      ? 'bg-blue-900/20 border-blue-500/50'
                      : 'bg-gray-800/20 border-gray-600'
                  }`}
                >
                  <div className="text-sm text-gray-400 mb-1">{getDealerName(dealerId)}</div>
                  <div className="text-3xl font-bold text-white">{totalSpins}</div>
                  <div className="text-xs text-gray-500 mt-2">{percentage}% of spins</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Compare Dealers View */}
        {overviewTab === 'compare' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left p-3 text-sm font-bold text-gray-300 bg-gray-700/50">Group</th>
                  {[1, 2, 3, 4, 5].map((dealerId) => (
                    <th key={dealerId} className="text-center p-3 text-sm font-bold text-white bg-gray-700/50">
                      {getDealerName(dealerId)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total Spins Row */}
                <tr className="border-b border-gray-700 bg-blue-900/10">
                  <td className="p-3 text-sm font-bold text-cyan-300">Total Spins</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const totalSpins = dealer?.totalSpins || 0
                    const percentage = sessionStats.totalSpins > 0
                      ? ((totalSpins / sessionStats.totalSpins) * 100).toFixed(1)
                      : '0.0'
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className="font-bold text-white">{totalSpins}</div>
                        <div className="text-xs text-gray-400">{percentage}%</div>
                      </td>
                    )
                  })}
                </tr>

                {/* Wheel Groups */}
                <tr className="border-b border-gray-700">
                  <td className="p-3 text-sm font-semibold text-purple-300">Voisins (17)</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelGroups.voisins.hitRate || 0
                    const variance = hitRate - 45.9
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 50 ? 'text-red-400' :
                          hitRate < 40 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-700">
                  <td className="p-3 text-sm font-semibold text-blue-300">Tiers (12)</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelGroups.tiers.hitRate || 0
                    const variance = hitRate - 32.4
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 37 ? 'text-red-400' :
                          hitRate < 27 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-700">
                  <td className="p-3 text-sm font-semibold text-indigo-300">Orphelins (8)</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelGroups.orphelins.hitRate || 0
                    const variance = hitRate - 21.6
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 27 ? 'text-red-400' :
                          hitRate < 17 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Wheel Quadrants */}
                <tr className="border-b border-gray-700 bg-gray-700/20">
                  <td className="p-3 text-sm font-semibold text-cyan-300">Quadrant 1</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelQuadrants.q1.hitRate || 0
                    const variance = hitRate - 25
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 30 ? 'text-red-400' :
                          hitRate < 20 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-700 bg-gray-700/20">
                  <td className="p-3 text-sm font-semibold text-cyan-300">Quadrant 2</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelQuadrants.q2.hitRate || 0
                    const variance = hitRate - 25
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 30 ? 'text-red-400' :
                          hitRate < 20 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-700 bg-gray-700/20">
                  <td className="p-3 text-sm font-semibold text-cyan-300">Quadrant 3</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelQuadrants.q3.hitRate || 0
                    const variance = hitRate - 25
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 30 ? 'text-red-400' :
                          hitRate < 20 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-700 bg-gray-700/20">
                  <td className="p-3 text-sm font-semibold text-cyan-300">Quadrant 4</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const hitRate = dealer?.wheelMetrics.wheelQuadrants.q4.hitRate || 0
                    const variance = hitRate - 25
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          hitRate > 30 ? 'text-red-400' :
                          hitRate < 20 ? 'text-blue-400' : 'text-white'
                        }`}>
                          {hitRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Clustering Metrics */}
                <tr className="border-b border-gray-700 bg-yellow-900/10">
                  <td className="p-3 text-sm font-semibold text-yellow-300">Neighbor Clustering</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const clustering = dealer?.wheelMetrics.neighborClustering || 0
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className="font-bold text-yellow-400">
                          {clustering.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">pockets</div>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-700 bg-yellow-900/10">
                  <td className="p-3 text-sm font-semibold text-yellow-300">Sequential Hits</td>
                  {[1, 2, 3, 4, 5].map((dealerId) => {
                    const dealer = dealers.find((d) => d.dealerId === dealerId)
                    const sequential = dealer?.wheelMetrics.sequentialPatterns || 0
                    return (
                      <td key={dealerId} className="p-3 text-center">
                        <div className={`font-bold ${
                          sequential > 20 ? 'text-red-400' : 'text-white'
                        }`}>
                          {sequential.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">within 5</div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Dealer Analysis */}
      {dealers.map((dealer) => (
        <div
          key={dealer.dealerId}
          className="bg-gray-800/50 rounded-xl border border-gray-700 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Disc className="text-cyan-400" />
            {getDealerName(dealer.dealerId)} - Wheel Analysis
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Hot Numbers on Wheel */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
                <Flame size={18} />
                Hot Numbers (Wheel Position)
              </h4>
              <div className="space-y-2">
                {dealer.hotNumbers.map(({ number, count, wheelPosition }) => (
                  <div key={number} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          number === 0
                            ? 'bg-green-600'
                            : RED_NUMBERS.includes(number)
                            ? 'bg-red-600'
                            : 'bg-black border border-gray-600'
                        }`}
                      >
                        {number}
                      </div>
                      <div>
                        <span className="text-white font-semibold text-sm">{count} hits</span>
                        <span className="text-xs text-gray-500 block">Position {wheelPosition}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {((count / dealer.totalSpins) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Numbers */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                <Snowflake size={18} />
                Cold Numbers (Not Hit)
              </h4>
              <div className="flex flex-wrap gap-2">
                {dealer.coldNumbers.length > 0 ? (
                  dealer.coldNumbers.map((number) => (
                    <div
                      key={number}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white opacity-50 ${
                        number === 0
                          ? 'bg-green-600'
                          : RED_NUMBERS.includes(number)
                          ? 'bg-red-600'
                          : 'bg-black border border-gray-600'
                      }`}
                    >
                      {number}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">All numbers have hit!</span>
                )}
              </div>
            </div>

            {/* Wheel Groups Performance */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="font-bold text-purple-400 mb-3">Wheel Groups Performance</h4>
              <div className="space-y-3">
                {/* Voisins */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Voisins (17)</span>
                    <span className={`text-sm font-bold ${
                      dealer.wheelMetrics.wheelGroups.voisins.hitRate > 50 ? 'text-red-400' :
                      dealer.wheelMetrics.wheelGroups.voisins.hitRate < 40 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {dealer.wheelMetrics.wheelGroups.voisins.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${Math.min(dealer.wheelMetrics.wheelGroups.voisins.hitRate, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: 45.9% • Variance: {(dealer.wheelMetrics.wheelGroups.voisins.hitRate - 45.9).toFixed(1)}%
                  </div>
                </div>

                {/* Tiers */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Tiers (12)</span>
                    <span className={`text-sm font-bold ${
                      dealer.wheelMetrics.wheelGroups.tiers.hitRate > 37 ? 'text-red-400' :
                      dealer.wheelMetrics.wheelGroups.tiers.hitRate < 27 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {dealer.wheelMetrics.wheelGroups.tiers.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${Math.min(dealer.wheelMetrics.wheelGroups.tiers.hitRate, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: 32.4% • Variance: {(dealer.wheelMetrics.wheelGroups.tiers.hitRate - 32.4).toFixed(1)}%
                  </div>
                </div>

                {/* Orphelins */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Orphelins (8)</span>
                    <span className={`text-sm font-bold ${
                      dealer.wheelMetrics.wheelGroups.orphelins.hitRate > 27 ? 'text-red-400' :
                      dealer.wheelMetrics.wheelGroups.orphelins.hitRate < 17 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {dealer.wheelMetrics.wheelGroups.orphelins.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(dealer.wheelMetrics.wheelGroups.orphelins.hitRate, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: 21.6% • Variance: {(dealer.wheelMetrics.wheelGroups.orphelins.hitRate - 21.6).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Wheel Quadrants & Clustering */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="font-bold text-cyan-400 mb-3">Wheel Sectors & Patterns</h4>

              {/* Quadrants */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Wheel Quadrants</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(dealer.wheelMetrics.wheelQuadrants).map(([key, data]) => (
                    <div key={key} className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">{key.toUpperCase()}</div>
                      <div className={`text-lg font-bold ${
                        data.hitRate > 30 ? 'text-red-400' :
                        data.hitRate < 20 ? 'text-blue-400' : 'text-white'
                      }`}>
                        {data.hitRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">{data.count} hits</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clustering Metrics */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Neighbor Clustering</span>
                    <span className="text-sm font-bold text-yellow-400">
                      {dealer.wheelMetrics.neighborClustering.toFixed(1)} pockets
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg distance between spins on wheel
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Sequential Hits</span>
                    <span className={`text-sm font-bold ${
                      dealer.wheelMetrics.sequentialPatterns > 20 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {dealer.wheelMetrics.sequentialPatterns.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Spins landing within 5 pockets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Insights */}
      {dealers.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-cyan-300 mb-3">💡 Wheel Pattern Insights</h3>
          <div className="space-y-2 text-sm text-gray-300">
            {(() => {
              // Find dealer with most spins
              const mostActiveDealer = dealers.reduce((prev, curr) =>
                curr.totalSpins > prev.totalSpins ? curr : prev
              )

              // Find dealer with highest clustering
              const highestClustering = dealers.reduce((best, curr) => {
                return curr.wheelMetrics.sequentialPatterns > best.wheelMetrics.sequentialPatterns ? curr : best
              })

              // Find dealer with most skewed wheel group
              const mostSkewedDealer = dealers.reduce((best, curr) => {
                const currMaxVariance = Math.max(
                  Math.abs(curr.wheelMetrics.wheelGroups.voisins.hitRate - 45.9),
                  Math.abs(curr.wheelMetrics.wheelGroups.tiers.hitRate - 32.4),
                  Math.abs(curr.wheelMetrics.wheelGroups.orphelins.hitRate - 21.6)
                )
                const bestMaxVariance = Math.max(
                  Math.abs(best.wheelMetrics.wheelGroups.voisins.hitRate - 45.9),
                  Math.abs(best.wheelMetrics.wheelGroups.tiers.hitRate - 32.4),
                  Math.abs(best.wheelMetrics.wheelGroups.orphelins.hitRate - 21.6)
                )
                return currMaxVariance > bestMaxVariance ? curr : best
              })

              return (
                <>
                  <div>
                    • <strong>Most Active:</strong> {getDealerName(mostActiveDealer.dealerId)} with{' '}
                    {mostActiveDealer.totalSpins} spins
                  </div>
                  <div>
                    • <strong>Clustering Alert:</strong> {getDealerName(highestClustering.dealerId)} shows{' '}
                    {highestClustering.wheelMetrics.sequentialPatterns.toFixed(1)}% sequential hits
                  </div>
                  <div>
                    • <strong>Wheel Bias:</strong> {getDealerName(mostSkewedDealer.dealerId)} shows notable wheel group variance
                  </div>
                  <div className="text-xs text-gray-400 mt-3">
                    Note: Wheel patterns become statistically significant with 100+ spins per dealer. Focus on Voisins/Tiers/Orphelins groups as they represent physical wheel sectors.
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
