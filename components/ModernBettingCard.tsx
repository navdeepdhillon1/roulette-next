// components/ModernBettingCard.tsx
'use client'

import React, { useState } from 'react'
import RightSideLayout from './RightSideLayout'
import GameControlBar from './GameControlBar'
import MyGroupsBettingCards from './MyGroupsBettingCards'
import WheelHistory from './WheelHistory'
import type { SessionState, BetCard } from '../types/bettingAssistant'

interface ModernBettingCardProps {
  card: BetCard
  sessionState: SessionState
  onBack: () => void
}

export default function ModernBettingCard({
  card,
  sessionState,
  onBack
}: ModernBettingCardProps) {
  const [currentView, setCurrentView] = useState<'layout' | 'wheelLayout' | 'my-groups'>('layout')
  const [manualBets, setManualBets] = useState<Record<string, string>>({})
  const [betResults, setBetResults] = useState<Record<string, { status: 'win' | 'loss', amount: string } | null>>({})

  // Extract spin history from card bets (with safety checks)
  const spinHistory = (card.bets || []).map(bet => ({
    number: bet.numberHit || 0,
    timestamp: Date.now(),
    sessionId: sessionState.id,
    cardId: card.id
  }))

  const spinNumbers = (card.bets || []).map(bet => bet.numberHit || 0)

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 overflow-hidden">
      {/* Header Bar */}
      <div className="h-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-cyan-500/30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-bold text-white transition-all"
          >
            ← Back to Dashboard
          </button>
          <div className="text-2xl font-bold text-yellow-400">
            Card #{card.cardNumber}
          </div>
          <div className={`text-xl font-bold ${card.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {card.currentTotal >= 0 ? '+' : ''}${card.currentTotal}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-300">
          <div>Target: <span className="font-bold text-white">${card.target}</span></div>
          <div>Bets: <span className="font-bold text-white">{card.betsUsed}/{card.maxBets}</span></div>
          <div className={`px-3 py-1 rounded-lg font-bold ${
            card.status === 'active' ? 'bg-yellow-600' :
            card.status === 'completed' ? 'bg-green-600' :
            card.status === 'failed' ? 'bg-red-600' :
            'bg-gray-600'
          }`}>
            {card.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Content: Left (60%) + Right (40%) Split */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* LEFT SIDE: Betting Interface (60%) */}
        <div className="w-[60%] flex flex-col border-r border-gray-700">
          {/* Game Control Bar */}
          <div className="flex-shrink-0">
            <GameControlBar
              currentDealer={1}
              onDealerChange={() => {}}
              spinHistory={spinHistory}
              sessionStats={{
                totalSpins: card.bets?.length || 0,
                totalWagered: 0,
                totalReturned: 0,
                currentBankroll: sessionState.currentBankroll || 0,
                roi: 0
              }}
              currentView={currentView}
              onViewChange={setCurrentView}
              hasSelectedGroups={true}
              useCards={true}
            />
          </div>

          {/* Wheel History */}
          <div className="flex-shrink-0 bg-gray-900 p-4 border-b border-gray-700">
            <WheelHistory history={spinNumbers} />
          </div>

          {/* Betting Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {currentView === 'my-groups' && sessionState.config?.selectedGroups && sessionState.config.selectedGroups.length > 0 ? (
              <MyGroupsBettingCards
                selectedGroups={sessionState.config.selectedGroups}
                manualBets={manualBets}
                setManualBets={setManualBets}
                playerUnit={sessionState.config.bettingSystem?.baseBet || 10}
                betResults={betResults}
              />
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-lg mb-2 text-yellow-400">⚠️ Betting Layout Not Configured</p>
                  <p className="text-sm text-gray-300 mb-4">
                    You need to select betting groups in the session setup to use this interface.
                  </p>
                  <p className="text-xs text-gray-400">
                    Current view: <span className="font-bold">{currentView}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    For now, you can view stats on the right sidebar →
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Place Bet Button */}
          <div className="flex-shrink-0 bg-gray-900 p-4 border-t border-gray-700">
            <button
              onClick={() => {
                // TODO: Implement bet placement logic
                alert('Bet placement coming soon!')
              }}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-white text-lg transition-all shadow-lg"
            >
              🎲 Place Bet
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Stats & Analysis (40%) */}
        <div className="w-[40%] bg-gray-900 overflow-hidden">
          <RightSideLayout
            session={sessionState}
            spinHistory={spinNumbers}
          />
        </div>
      </div>
    </div>
  )
}
