// components/BettingAssistant.tsx
'use client'

import React, { useState } from 'react'
import SessionSetup from './SessionSetup'
import BetCardDashboard from './BetCardDashboard'
import CompactBettingCard from './CompactBettingCard'
import BetAdvisor from './BetAdvisor'
import { CardSuccessCelebration, CardFailureModal, BreakTimerModal } from './CardCelebration'
import type { SessionState, SessionConfig, BetCard, BetRecord, BettingSystemConfig } from '../types/bettingAssistant'
import BettingAssistantPerformance from './BettingAssistantPerformance'
import { useBettingData } from './BettingDataContext'

function updateBettingSystem(config: BettingSystemConfig, outcome: 'win' | 'loss'): BettingSystemConfig {
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
  const [viewMode, setViewMode] = useState<'setup' | 'dashboard' | 'activeCard' | 'advisor' | 'performance'>('setup')
  const [session, setSession] = useState<SessionState | null>(null)
  
  // ✅ NEW: Celebration states
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false)
  const [showFailureCelebration, setShowFailureCelebration] = useState(false)
  const [showBreakTimer, setShowBreakTimer] = useState(false)
  const [completedCard, setCompletedCard] = useState<BetCard | null>(null)
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)

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

  // ✅ NEW: Handle card completion
  const handleCardComplete = (pnl: number) => {
    if (!session) return
    
    const currentCard = session.cards[session.currentCardIndex]
    const completedCardData = {
      ...currentCard,
      currentTotal: pnl,
      status: 'completed' as const
    }
    
    setCompletedCard(completedCardData)
    setConsecutiveFailures(0) // Reset on success
    
    // Wait for the inline celebration to finish, then show modal
    setTimeout(() => {
      setShowSuccessCelebration(true)
    }, 200)
  }

  // ✅ NEW: Handle card failure
  const handleCardFailure = () => {
    if (!session) return
    
    const currentCard = session.cards[session.currentCardIndex]
    const failedCardData = {
      ...currentCard,
      status: 'failed' as const
    }
    
    setCompletedCard(failedCardData)
    setConsecutiveFailures(prev => prev + 1)
    
    // Show failure modal immediately
    setShowFailureCelebration(true)
  }

  // ✅ NEW: Continue to next card
  const handleContinue = () => {
    setShowSuccessCelebration(false)
    setShowFailureCelebration(false)
    setCompletedCard(null)
    
    if (!session) return
    
    // Unlock next card
    const nextCardIndex = session.currentCardIndex + 1
    if (nextCardIndex < session.cards.length) {
      const updatedCards = [...session.cards]
      updatedCards[nextCardIndex].status = 'active'
      updatedCards[nextCardIndex].startTime = new Date()
      
      setSession({
        ...session,
        cards: updatedCards,
        currentCardIndex: nextCardIndex
      })
    }
    
    // Return to dashboard
    setViewMode('dashboard')
  }

  // ✅ NEW: Take a break
  const handleTakeBreak = () => {
    setShowSuccessCelebration(false)
    setShowBreakTimer(true)
  }

  // ✅ NEW: Break complete
  const handleBreakComplete = () => {
    setShowBreakTimer(false)
    handleContinue()
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

    // ✅ UPDATED: Check for completion or failure
    if (updatedCard.currentTotal >= updatedCard.target) {
      updatedCard.status = 'completed'
      // Don't unlock next card yet - wait for user to continue
    } else if (updatedCard.betsUsed >= updatedCard.maxBets) {
      updatedCard.status = 'failed'
      // Trigger failure modal
      setTimeout(() => handleCardFailure(), 500)
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
  <BetCardDashboard
    session={session}
    onSelectCard={selectCard}
    onEndSession={endSession}
    onOpenAdvisor={() => setViewMode('advisor')}
    onOpenPerformance={() => setViewMode('performance')}
  />
)}
      {viewMode === 'activeCard' && session && (
  <>
    <div className="opacity-50 pointer-events-none">
      <BetCardDashboard 
        session={session} 
        onSelectCard={() => {}} 
        onEndSession={() => {}}
        onOpenAdvisor={() => {}}      // ✅ ADD THIS
        onOpenPerformance={() => {}}  // ✅ ADD THIS
      />
    </div>
          
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <CompactBettingCard 
              card={session.cards[session.currentCardIndex]}
              bettingSystem={session.config.bettingSystem}
              onPlaceBet={placeBet}
              onCardComplete={handleCardComplete} // ✅ ADDED THIS
              onBack={backToDashboard}
            />
          </div>
        </>
      )}

      {viewMode === 'advisor' && session && (
        <>
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

          <BetAdvisor />
        </>
      )}
      
      {viewMode === 'performance' && session && (
        <>
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

          <BettingAssistantPerformance session={session} />
        </>
      )}

      {/* ✅ NEW: Success Celebration Modal */}
      {showSuccessCelebration && completedCard && (
        <CardSuccessCelebration
          card={completedCard}
          onContinue={handleContinue}
          onTakeBreak={handleTakeBreak}
        />
      )}

      {/* ✅ NEW: Failure Modal */}
      {showFailureCelebration && completedCard && (
        <CardFailureModal
          card={completedCard}
          onContinue={handleContinue}
          consecutiveFailures={consecutiveFailures}
        />
      )}

      {/* ✅ NEW: Break Timer */}
      {showBreakTimer && (
        <BreakTimerModal
          duration={300}
          onComplete={handleBreakComplete}
        />
      )}
    </div>
  )
}