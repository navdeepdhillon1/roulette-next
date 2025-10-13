// components/BettingAssistant.tsx
'use client'

import React, { useState } from 'react'
import SessionSetup from './SessionSetup'
import BetCardDashboard from './BetCardDashboard'
import CompactBettingCard from './CompactBettingCard'
import BetAdvisor from './BetAdvisor'
import type { SessionState, SessionConfig, BetCard, BetRecord, BettingSystemConfig } from '../types/bettingAssistant'
import { useBettingData } from './BettingDataContext'
function updateBettingSystem(config: BettingSystemConfig, outcome: 'win' | 'loss'): BettingSystemConfig {
  // For flat betting, bet amount stays the same
  if (config.id === 'flat') {
    return {
      ...config,
      consecutiveWins: outcome === 'win' ? config.consecutiveWins + 1 : 0,
      consecutiveLosses: outcome === 'loss' ? config.consecutiveLosses + 1 : 0,
    }
  }
  
  return config
}

export default function BettingAssistant() {
  const { addSpin, updateSessionStats } = useBettingData()
  const [viewMode, setViewMode] = useState<'setup' | 'dashboard' | 'activeCard' | 'advisor'>('setup')
  const [session, setSession] = useState<SessionState | null>(null)

  const startSession = (config: SessionConfig) => {
    const cards: BetCard[] = Array.from({ length: config.totalCards }, (_, i) => ({
      id: `card-${i + 1}`,
      cardNumber: i + 1,
      target: config.cardTargetAmount,
      maxBets: config.maxBetsPerCard,
      bets: [],
      status: i === 0 ? 'active' : 'locked',
      currentTotal: 0,
      betsUsed: 0,
      startTime: i === 0 ? new Date() : null,
    }))

    setSession({
      id: `session-${Date.now()}`,
      config,
      cards,
      currentCardIndex: 0,
      currentBankroll: config.bankroll,
      totalWagered: 0,
      totalReturned: 0,
    })
    updateSessionStats({
      currentBankroll: config.bankroll,
      totalSpins: 0,
      totalWagered: 0,
      totalReturned: 0,
      roi: 0
    })
    setViewMode('dashboard')
  }

  const selectCard = (index: number) => {
    if (!session) return
    setSession({ ...session, currentCardIndex: index })
    setViewMode('activeCard')
  }

  const backToDashboard = () => {
    setViewMode('dashboard')
  }

  const placeBet = (betType: string, betAmount: number, outcome: 'win' | 'loss', winAmount: number, numberHit: number) => {
    if (!session) return

    const currentCard = session.cards[session.currentCardIndex]
    const newBet: BetRecord = {
      id: `bet-${Date.now()}`,
      timestamp: Date.now(),
      betType,
      betAmount,
      outcome,
      winAmount,
      numberHit,
      cardId: currentCard.id,
      betNumber: currentCard.betsUsed + 1,
      runningCardTotal: currentCard.currentTotal + (outcome === 'win' ? winAmount - betAmount : -betAmount),
      runningBankroll: session.currentBankroll + (outcome === 'win' ? winAmount - betAmount : -betAmount),
      bets: {} as any,
      spinNumber: numberHit,
      results: {} as any,
      totalPnL: outcome === 'win' ? winAmount - betAmount : -betAmount,
    }
    addSpin({
      number: numberHit,
      timestamp: Date.now(),
      sessionId: session.id,
      cardId: currentCard.id
    })
    const updatedCard = {
      ...currentCard,
      bets: [...currentCard.bets, newBet],
      currentTotal: newBet.runningCardTotal,
      betsUsed: currentCard.betsUsed + 1,
    }

    if (updatedCard.currentTotal >= updatedCard.target) {
      updatedCard.status = 'completed'
      const nextCardIndex = session.currentCardIndex + 1
      if (nextCardIndex < session.cards.length) {
        session.cards[nextCardIndex].status = 'active'
        session.cards[nextCardIndex].startTime = new Date()
      }
    } else if (updatedCard.betsUsed >= updatedCard.maxBets) {
      updatedCard.status = 'failed'
      const nextCardIndex = session.currentCardIndex + 1
      if (nextCardIndex < session.cards.length) {
        session.cards[nextCardIndex].status = 'active'
        session.cards[nextCardIndex].startTime = new Date()
      }
    }

    const updatedCards = [...session.cards]
    updatedCards[session.currentCardIndex] = updatedCard

    const updatedSystem = updateBettingSystem(session.config.bettingSystem, outcome)

    const newSession = {
      ...session,
      cards: updatedCards,
      currentBankroll: newBet.runningBankroll,
      totalWagered: session.totalWagered + betAmount,
      totalReturned: session.totalReturned + (outcome === 'win' ? winAmount : 0),
      config: {
        ...session.config,
        bettingSystem: updatedSystem
      }
    }
    
    setSession(newSession)
    
    updateSessionStats({
      currentBankroll: newBet.runningBankroll,
      totalSpins: newSession.cards.reduce((sum, card) => sum + card.bets.length, 0),
      totalWagered: newSession.totalWagered,
      totalReturned: newSession.totalReturned,
      roi: newSession.totalWagered > 0 
        ? ((newSession.totalReturned - newSession.totalWagered) / newSession.totalWagered) * 100 
        : 0
    })
  }
  const endSession = () => {
    setSession(null)
    setViewMode('setup')
    
    updateSessionStats({
      totalSpins: 0,
      totalWagered: 0,
      totalReturned: 0,
      currentBankroll: 0,
      roi: 0
    })
  }

  return (
    <div className="min-h-screen">
      {viewMode === 'setup' && <SessionSetup onStartSession={startSession} />}
      {viewMode === 'dashboard' && session && (
  <>
    {/* ✅ ADD THIS: Advisor Button */}
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={() => setViewMode('advisor')}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-2xl transition-all transform hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <span>🧠</span>
          <span>Open Bet Advisor</span>
        </div>
      </button>
    </div>

    <BetCardDashboard
      session={session}
      onSelectCard={selectCard}
      onEndSession={endSession}
    />
  </>

      )}
      
      {viewMode === 'activeCard' && session && (
        <>
          <div className="opacity-50 pointer-events-none">
            <BetCardDashboard 
              session={session} 
              onSelectCard={() => {}} 
              onEndSession={() => {}} 
            />
          </div>
          
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <CompactBettingCard 
              card={session.cards[session.currentCardIndex]}
              bettingSystem={session.config.bettingSystem}
              onPlaceBet={placeBet}
              onBack={backToDashboard}
            />
          </div>
        </>
      )}

{/* ✅ ADD THIS ENTIRE SECTION: Advisor View */}
{viewMode === 'advisor' && session && (
  <>
    {/* Back Button */}
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setViewMode('dashboard')}
        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-2xl transition-all transform hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <span>←</span>
          <span>Back to Dashboard</span>
        </div>
      </button>
    </div>

    {/* BetAdvisor Component */}
    <BetAdvisor />
  </>
)}
    </div>
  )
}