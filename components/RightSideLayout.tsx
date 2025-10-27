// components/RightSideLayout.tsx
'use client'

import React, { useState } from 'react'
import BetAdvisor from './BetAdvisor'
import DealerStats from './DealerStats'
import CommonGroupsTable from './CommonGroupsTable'
import SpecialBetsTable from './SpecialBetsTable'
import WheelBetGroups from './roulette/WheelBetGroups'
import CompletePerformanceTab from './CompletePerformanceTab'
import NumbersStatsTab from './NumbersStatsTab'
import type { SessionState } from '../types/bettingAssistant'

interface RightSideLayoutProps {
  session: SessionState
  spinHistory: number[]
}

export default function RightSideLayout({ session, spinHistory }: RightSideLayoutProps) {
  const [activeTab, setActiveTab] = useState<'quickscan' | 'stats' | 'performance' | 'dealers'>('stats')
  const [quickScanView, setQuickScanView] = useState<'common' | 'special' | 'wheel' | 'numbers'>('common')
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({
    quickscan: false,
    stats: false,
    performance: false,
    dealers: false
  })

  const toggleHelp = (tab: string) => {
    setShowHelp(prev => ({ ...prev, [tab]: !prev[tab] }))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tabbed View (Quick Scan OR Game Stats OR Dealer Stats) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 rounded-lg border border-gray-600/50 shadow-2xl">
        {/* Tab Buttons */}
        <div className="flex gap-2 p-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-cyan-500/20 shadow-lg">
          <button
            onClick={() => setActiveTab('quickscan')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all transform hover:scale-105 ${
              activeTab === 'quickscan'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/50'
            }`}
          >
            🔍 Quick Scan
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all transform hover:scale-105 ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/50'
            }`}
          >
            📊 Game Stats
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all transform hover:scale-105 ${
              activeTab === 'performance'
                ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white shadow-lg shadow-green-500/50'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/50'
            }`}
          >
            📈 Performance
          </button>
          <button
            onClick={() => setActiveTab('dealers')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all transform hover:scale-105 ${
              activeTab === 'dealers'
                ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-600/50'
            }`}
          >
            🎰 Dealer Stats
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'quickscan' && (
            <div className="h-full flex flex-col">
              {/* Help Panel for Quick Scan */}
              <div className="border-b border-purple-500/20">
                <button
                  onClick={() => toggleHelp('quickscan')}
                  className="w-full px-4 py-2 bg-purple-900/20 hover:bg-purple-900/30 transition-colors flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    Quick Scan Help
                  </span>
                  <span className="text-purple-400 text-xl">{showHelp.quickscan ? '−' : '+'}</span>
                </button>
                {showHelp.quickscan && (
                  <div className="bg-purple-950/30 border-t border-purple-500/20 p-4 text-sm text-gray-300 space-y-2">
                    <p className="font-semibold text-purple-300">What is Quick Scan?</p>
                    <p>Quick Scan provides rapid analysis of betting patterns across all 47 betting groups (26 table + 21 wheel-based).</p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">📊 Table Common:</span>
                        <span>Standard bets like Red/Black, Even/Odd, Dozens, and Columns</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">⭐ Table Special:</span>
                        <span>Alternative groupings like A/B splits, AA/BB zones, and First/Last 18</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold">🎡 Wheel:</span>
                        <span>Physical wheel sectors (Voisins, Tiers, Orphelins) and quadrants</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">🔢 Numbers:</span>
                        <span>Individual number statistics including hot/cold analysis</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-400 italic">
                      Use Quick Scan to identify which betting groups are currently hot or cold based on recent spins.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Scan Sub-Tabs */}
              <div className="flex gap-2 p-2 bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 border-b border-purple-500/20">
                <button
                  onClick={() => setQuickScanView('common')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    quickScanView === 'common'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border border-gray-600/40'
                  }`}
                >
                  📊 Table Common
                </button>
                <button
                  onClick={() => setQuickScanView('special')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    quickScanView === 'special'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border border-gray-600/40'
                  }`}
                >
                  ⭐ Table Special
                </button>
                <button
                  onClick={() => setQuickScanView('wheel')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    quickScanView === 'wheel'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/30'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border border-gray-600/40'
                  }`}
                >
                  🎡 Wheel
                </button>
                <button
                  onClick={() => setQuickScanView('numbers')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    quickScanView === 'numbers'
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-md shadow-yellow-500/30'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border border-gray-600/40'
                  }`}
                >
                  🔢 Numbers
                </button>
              </div>

              {/* Quick Scan Content */}
              <div className="flex-1 overflow-y-auto p-2">
                {quickScanView === 'common' && <CommonGroupsTable spinHistory={spinHistory} />}
                {quickScanView === 'special' && <SpecialBetsTable spinHistory={spinHistory} />}
                {quickScanView === 'wheel' && <WheelBetGroups spinHistory={spinHistory} />}
                {quickScanView === 'numbers' && <NumbersStatsTab history={spinHistory} />}
              </div>
            </div>
          )}
          {activeTab === 'stats' && (
            <div className="h-full flex flex-col">
              {/* Help Panel for Game Stats */}
              <div className="border-b border-blue-500/20">
                <button
                  onClick={() => toggleHelp('stats')}
                  className="w-full px-4 py-2 bg-blue-900/20 hover:bg-blue-900/30 transition-colors flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    Game Stats Help
                  </span>
                  <span className="text-blue-400 text-xl">{showHelp.stats ? '−' : '+'}</span>
                </button>
                {showHelp.stats && (
                  <div className="bg-blue-950/30 border-t border-blue-500/20 p-4 text-sm text-gray-300 space-y-2">
                    <p className="font-semibold text-blue-300">What is Game Stats?</p>
                    <p>Real-time statistical analysis and betting recommendations based on pattern recognition across multiple time windows.</p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">🔥 Hot/Cold Alerts:</span>
                        <span>Groups hitting above/below expected frequency (requires 5+ spins)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">📊 Pattern Analysis:</span>
                        <span>Multi-window voting system (5, 10, 15 spins) identifies trends</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">✅ BET Recommendations:</span>
                        <span>High confidence suggestions based on pattern strength</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">⏸️ SKIP Signals:</span>
                        <span>Defensive pauses when patterns are weak or volatile</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-400 italic">
                      Game Stats uses AI-powered decision engine to analyze momentum, flips, z-scores, and entropy for optimal betting timing.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                <BetAdvisor />
              </div>
            </div>
          )}
          {activeTab === 'performance' && (
            <div className="h-full flex flex-col">
              {/* Help Panel for Performance */}
              <div className="border-b border-green-500/20">
                <button
                  onClick={() => toggleHelp('performance')}
                  className="w-full px-4 py-2 bg-green-900/20 hover:bg-green-900/30 transition-colors flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-green-300 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    Performance Help
                  </span>
                  <span className="text-green-400 text-xl">{showHelp.performance ? '−' : '+'}</span>
                </button>
                {showHelp.performance && (
                  <div className="bg-green-950/30 border-t border-green-500/20 p-4 text-sm text-gray-300 space-y-2">
                    <p className="font-semibold text-green-300">What is Performance?</p>
                    <p>Comprehensive session analytics including profitability, betting style analysis, and behavioral insights.</p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">📈 Overview:</span>
                        <span>Win rate, ROI, total profit, and top performing groups</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">🧠 Style Analysis:</span>
                        <span>AI profile of your betting personality (Sniper, Diversified, Balanced)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">📊 Advanced Charts:</span>
                        <span>Risk evolution, P/L timeline, streaks, heatmaps, and pattern detection</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">⚠️ Red Flags:</span>
                        <span>Automatic alerts for loss chasing, escalating bets, or high risk behavior</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-400 italic">
                      Use Performance to understand your strengths, identify weaknesses, and refine your strategy with data-driven insights.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <CompletePerformanceTab session={session} />
              </div>
            </div>
          )}
          {activeTab === 'dealers' && (
            <div className="h-full flex flex-col">
              {/* Help Panel for Dealer Stats */}
              <div className="border-b border-cyan-500/20">
                <button
                  onClick={() => toggleHelp('dealers')}
                  className="w-full px-4 py-2 bg-cyan-900/20 hover:bg-cyan-900/30 transition-colors flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    Dealer Stats Help
                  </span>
                  <span className="text-cyan-400 text-xl">{showHelp.dealers ? '−' : '+'}</span>
                </button>
                {showHelp.dealers && (
                  <div className="bg-cyan-950/30 border-t border-cyan-500/20 p-4 text-sm text-gray-300 space-y-2">
                    <p className="font-semibold text-cyan-300">What is Dealer Stats?</p>
                    <p>Advanced wheel analysis to detect dealer-specific patterns, biases, and physical wheel sector performance.</p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">🎡 Wheel Groups:</span>
                        <span>Voisins (17 nos), Tiers (12 nos), Orphelins (8 nos) - French bet sectors</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">📍 Wheel Quadrants:</span>
                        <span>Q1-Q4 performance showing which quarter of the wheel is hot/cold</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">🔥 Hot Numbers:</span>
                        <span>Top 5 most frequent numbers with their physical wheel positions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">🎯 Clustering:</span>
                        <span>Neighbor analysis - how often consecutive spins land within 5 pockets</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-400 italic">
                      Dealer Stats become statistically significant with 100+ spins. Use this to exploit dealer signature or wheel biases.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                <DealerStats session={session} spinHistory={spinHistory} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
