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
            <BetAdvisor />
          )}
          {activeTab === 'performance' && (
            <div className="p-4">
              <CompletePerformanceTab session={session} />
            </div>
          )}
          {activeTab === 'dealers' && (
            <DealerStats session={session} spinHistory={spinHistory} />
          )}
        </div>
      </div>
    </div>
  )
}
