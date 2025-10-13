'use client'

import React, { useState } from 'react'
import { useBettingData } from './BettingDataContext'
import BettingAssistant from './BettingAssistant'
import BetAdvisor from './BetAdvisor'
import { Brain, CreditCard, X } from 'lucide-react'

export default function IntegratedBettingSystem() {
  const { 
    isAdvisorOpen, 
    setIsAdvisorOpen,
    isBetCardOpen,
    setIsBetCardOpen,
    currentRecommendation,
    setCurrentRecommendation,
    spinHistory,
    sessionStats
  } = useBettingData()

  const [activeView, setActiveView] = useState<'assistant' | 'advisor'>('assistant')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Floating Control Panel */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
        {/* Toggle Button */}
        <button
          onClick={() => setActiveView(activeView === 'assistant' ? 'advisor' : 'assistant')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-2xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center gap-2">
            {activeView === 'assistant' ? (
              <>
                <Brain className="w-5 h-5" />
                <span>Open Advisor</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Back to Session</span>
              </>
            )}
          </div>
        </button>

        {/* Stats Panel */}
        {spinHistory.length > 0 && (
          <div className="bg-gray-900/95 backdrop-blur border-2 border-cyan-400/50 rounded-xl p-4 shadow-2xl">
            <div className="text-xs font-bold text-cyan-400 mb-2">📊 Session Stats</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Spins:</span>
                <span className="text-white font-bold">{spinHistory.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Wagered:</span>
                <span className="text-white font-bold">${sessionStats.totalWagered}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">ROI:</span>
                <span className={`font-bold ${sessionStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {sessionStats.roi >= 0 ? '+' : ''}{sessionStats.roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Banner */}
      {currentRecommendation && activeView === 'assistant' && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] max-w-lg w-full px-4">
          <div className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur border-2 border-purple-400 rounded-xl p-4 shadow-2xl animate-pulse">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-purple-200 mb-1">
                  ⚡ Advisor Recommendation
                </div>
                <div className="text-xl font-bold text-white mb-2">
                  {currentRecommendation.groupName}
                </div>
                <div className="text-xs text-purple-300 mb-3">
                  {currentRecommendation.reason}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    currentRecommendation.confidence === 'HIGH' ? 'bg-green-500/30 text-green-300 border border-green-400' :
                    currentRecommendation.confidence === 'MEDIUM' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400' :
                    'bg-gray-500/30 text-gray-300 border border-gray-400'
                  }`}>
                    {currentRecommendation.confidence} CONFIDENCE
                  </span>
                  <span className="text-xs text-purple-200 font-semibold">
                    💰 Suggested: ${currentRecommendation.suggestedAmount}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentRecommendation(null)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={activeView === 'assistant' ? 'block' : 'hidden'}>
        <BettingAssistant />
      </div>

      <div className={activeView === 'advisor' ? 'block' : 'hidden'}>
        <BetAdvisor />
      </div>
    </div>
  )
}