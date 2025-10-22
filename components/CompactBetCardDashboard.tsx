// components/CompactBetCardDashboard.tsx
'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Play, Lock, Check, X } from 'lucide-react'
import type { SessionState, BetCard } from '../types/bettingAssistant'

interface CompactBetCardDashboardProps {
  session: SessionState
  onSelectCard: (index: number) => void
}

export default function CompactBetCardDashboard({ session, onSelectCard }: CompactBetCardDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const completedCards = session.cards.filter(c => c.status === 'completed').length
  const failedCards = session.cards.filter(c => c.status === 'failed').length
  const activeCard = session.cards.find(c => c.status === 'active')
  const pendingCards = session.cards.filter(c => c.status === 'locked').length

  return (
    <div className="bg-gray-900/50 rounded-lg border border-yellow-400/30 overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-yellow-400">🗂️ Bet Cards</h2>

          {/* Summary Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Check size={14} className="text-green-400" />
              <span className="text-green-400 font-bold">{completedCards}</span>
            </div>
            <div className="flex items-center gap-1">
              <Play size={14} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold">1</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock size={14} className="text-gray-400" />
              <span className="text-gray-400 font-bold">{pendingCards}</span>
            </div>
            <div className="flex items-center gap-1">
              <X size={14} className="text-red-400" />
              <span className="text-red-400 font-bold">{failedCards}</span>
            </div>
          </div>

          {/* Active Card Quick View */}
          {activeCard && (
            <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-400 rounded text-xs">
              <span className="text-gray-400">Active: </span>
              <span className="text-white font-bold">#{activeCard.cardNumber}</span>
              <span className={`ml-2 font-bold ${activeCard.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {activeCard.currentTotal >= 0 ? '+' : ''}${activeCard.currentTotal.toFixed(0)}
              </span>
              <span className="text-gray-400 ml-1">/ ${activeCard.target}</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button className="p-1 hover:bg-gray-700 rounded transition-colors">
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded View - All Cards Grid */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-700 bg-gray-900/30">
          <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {session.cards.map((card: BetCard, index: number) => {
              const isClickable = card.status !== 'locked'
              const progressPercent = (card.currentTotal / card.target) * 100

              return (
                <button
                  key={card.id}
                  onClick={() => isClickable && onSelectCard(index)}
                  disabled={card.status === 'locked'}
                  className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                    card.status === 'active'
                      ? 'bg-yellow-500/20 border-yellow-400 hover:bg-yellow-500/30' :
                    card.status === 'locked'
                      ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed' :
                    card.status === 'completed'
                      ? 'bg-green-500/20 border-green-400 hover:bg-green-500/30' :
                    card.status === 'failed'
                      ? 'bg-red-500/20 border-red-400 hover:bg-red-500/30'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="absolute top-2 right-2">
                    {card.status === 'locked' && <Lock size={12} className="text-gray-500" />}
                    {card.status === 'completed' && <Check size={14} className="text-green-400" />}
                    {card.status === 'failed' && <X size={14} className="text-red-400" />}
                    {card.status === 'active' && <Play size={12} className="text-yellow-400 animate-pulse" />}
                  </div>

                  {/* Card Number & P/L */}
                  <div className="text-xl font-bold text-white mb-1">#{card.cardNumber}</div>
                  <div className={`text-sm font-bold mb-1 ${card.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {card.currentTotal >= 0 ? '+' : ''}${card.currentTotal.toFixed(0)}
                  </div>

                  {/* Target & Progress */}
                  <div className="text-[10px] text-gray-400 mb-2">
                    Target: ${card.target}
                  </div>

                  {/* Progress Bar */}
                  {card.status !== 'locked' && (
                    <>
                      <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden mb-1">
                        <div
                          className={`h-full transition-all ${
                            card.status === 'completed' ? 'bg-green-500' :
                            card.status === 'failed' ? 'bg-red-500' :
                            card.status === 'active' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>

                      {/* Bets Used */}
                      <div className="text-[10px] text-gray-400">
                        {card.betsUsed}/{card.maxBets} bets
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
