// components/BetCardDashboard.tsx
'use client'

import React from 'react'
import { Play, Lock, Check, X } from 'lucide-react'
import type { SessionState, BetCard } from '../types/bettingAssistant'

interface BetCardDashboardProps {
  session: SessionState
  onSelectCard: (index: number) => void
  onEndSession: () => void
}

export default function BetCardDashboard({ session, onSelectCard, onEndSession }: BetCardDashboardProps) {
  const completedCards = session.cards.filter(c => c.status === 'completed').length
  const failedCards = session.cards.filter(c => c.status === 'failed').length
  const totalProfit = session.currentBankroll - session.config.bankroll
  const roi = ((totalProfit / session.config.bankroll) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">🎯 Bet Card Dashboard</h1>
              <p className="text-sm text-gray-400">
                System: {session.config.bettingSystem.emoji || '🎲'} {session.config.bettingSystem.name} • 
                Base: ${session.config.bettingSystem.baseBet} → Current: ${session.config.bettingSystem.currentBet}
              </p>
            </div>
            <button 
              onClick={onEndSession} 
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-colors"
            >
              End Session
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-500/30 rounded-lg p-4">
              <p className="text-xs text-green-300 mb-1">Current Bankroll</p>
              <p className="text-2xl font-bold text-green-400">${session.currentBankroll}</p>
              <p className="text-xs text-green-300/70 mt-1">Start: ${session.config.bankroll}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-blue-300 mb-1">Total P/L</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}${totalProfit}
              </p>
              <p className="text-xs text-blue-300/70 mt-1">ROI: {roi}%</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-500/30 rounded-lg p-4">
              <p className="text-xs text-purple-300 mb-1">Cards Completed</p>
              <p className="text-2xl font-bold text-purple-400">{completedCards}</p>
              <p className="text-xs text-purple-300/70 mt-1">Failed: {failedCards}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 border border-orange-500/30 rounded-lg p-4">
              <p className="text-xs text-orange-300 mb-1">Total Wagered</p>
              <p className="text-2xl font-bold text-orange-400">${session.totalWagered}</p>
              <p className="text-xs text-orange-300/70 mt-1">Returned: ${session.totalReturned}</p>
            </div>
          </div>
        </div>

        {totalProfit <= -session.config.stopLoss && (
          <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-300 text-lg">Stop Loss Reached!</h3>
                <p className="text-sm text-red-200">
                  You've lost ${Math.abs(totalProfit)} (Limit: ${session.config.stopLoss}). Consider ending the session.
                </p>
              </div>
            </div>
          </div>
        )}

        {totalProfit >= session.config.stopProfit && (
          <div className="bg-green-900/30 border-2 border-green-500 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="font-bold text-green-300 text-lg">Profit Target Reached!</h3>
                <p className="text-sm text-green-200">
                  You've won ${totalProfit} (Target: ${session.config.stopProfit}). Great job! Consider ending on a high note.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">🗂️ Bet Cards</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-gray-500" />
                <span className="text-gray-400">Locked</span>
              </div>
              <div className="flex items-center gap-2">
                <Play size={16} className="text-yellow-400" />
                <span className="text-gray-400">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                <span className="text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <X size={16} className="text-red-400" />
                <span className="text-gray-400">Failed</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            {session.cards.map((card: BetCard, index: number) => {
              const isClickable = card.status !== 'locked'
              const progressPercent = (card.currentTotal / card.target) * 100
              
              return (
                <button 
                  key={card.id} 
                  onClick={() => isClickable && onSelectCard(index)}
                  disabled={card.status === 'locked'}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    card.status === 'active' 
                      ? 'bg-yellow-500/20 border-yellow-400 hover:bg-yellow-500/30 hover:scale-105' :
                    card.status === 'locked' 
                      ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed' :
                    card.status === 'completed' 
                      ? 'bg-green-500/20 border-green-400 hover:bg-green-500/30 hover:scale-105' :
                    card.status === 'failed' 
                      ? 'bg-red-500/20 border-red-400 hover:bg-red-500/30 hover:scale-105' 
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:scale-105'
                  }`}
                >
                  <div className="absolute top-2 right-2">
                    {card.status === 'locked' && <Lock size={16} className="text-gray-500" />}
                    {card.status === 'completed' && <Check size={20} className="text-green-400" />}
                    {card.status === 'failed' && <X size={20} className="text-red-400" />}
                    {card.status === 'active' && <Play size={18} className="text-yellow-400 animate-pulse" />}
                  </div>

                  <div className="text-3xl font-bold text-white mb-2">#{card.cardNumber}</div>
                  <div className="text-sm text-gray-400 mb-3">Target: ${card.target}</div>
                  
                  {card.status !== 'locked' && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            card.status === 'completed' ? 'bg-green-500' :
                            card.status === 'failed' ? 'bg-red-500' :
                            card.status === 'active' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={card.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${card.currentTotal}
                        </span>
                        <span className="text-gray-400">{card.betsUsed}/{card.maxBets} bets</span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-bold text-blue-300 mb-2">📋 How to Use</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Click any <span className="text-yellow-400 font-bold">Active</span> or <span className="text-green-400 font-bold">Completed</span> card to view/edit bets</li>
            <li>• <span className="text-gray-400">Locked</span> cards unlock automatically when previous card completes</li>
            <li>• Each card has a target of ${session.config.cardTargetAmount} and max {session.config.maxBetsPerCard} bets</li>
            <li>• Your betting system will adjust bet sizes automatically based on wins/losses</li>
          </ul>
        </div>
      </div>
    </div>
  )
}