// components/BettingAssistant.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Navigation from './Navigation'
import SessionSetup from './SessionSetup'
import BetCardDashboard from './BetCardDashboard'
import CompactBettingCard from './CompactBettingCard'
import WheelBettingCard from './WheelBettingCard'
import BetAdvisor from './BetAdvisor'
import RightSideLayout from './RightSideLayout'
import { CardSuccessCelebration, CardFailureModal, BreakTimerModal } from './CardCelebration'
import type { SessionState, SessionConfig, BetCard, BetRecord, BettingSystemConfig, Dealer } from '../types/bettingAssistant'
import BettingAssistantPerformance from './BettingAssistantPerformance'
import { useBettingData } from './BettingDataContext'
import CommonGroupsTable from './CommonGroupsTable'
import SpecialBetsTable from './SpecialBetsTable'
import WheelBetStats from './WheelBetStats'
import WheelLayout from './roulette/WheelLayout'
import WheelBetGroups from './roulette/WheelBetGroups'
import HistoryTable from './roulette/HistoryTable'
import WheelHistory from './WheelHistory'
import MyGroupsLayout from './MyGroupsLayout'
import GameControlBar from './GameControlBar'
import { getNumberProperties, RED_NUMBERS } from '@/lib/roulette-logic'
import { supabase } from '@/lib/supabase'
import {
  createBettingSession,
  updateBettingSession,
  createBettingCards,
  updateBettingCard,
  saveBettingCardStep,
  loadBettingSession,
} from '@/lib/bettingAssistantStorage'

function updateBettingSystem(config: BettingSystemConfig, outcome: 'win' | 'loss'): BettingSystemConfig {
  const consecutiveWins = outcome === 'win' ? config.consecutiveWins + 1 : 0
  const consecutiveLosses = outcome === 'loss' ? config.consecutiveLosses + 1 : 0

  // Handle sequential progression system
  if (config.sequentialRules) {
    const rules = config.sequentialRules
    let newPosition = rules.currentPosition

    // Apply movement based on outcome
    if (outcome === 'win') {
      if (rules.onWin === 'reset') {
        newPosition = 0
      } else if (rules.onWin === 'moveBack1') {
        newPosition = Math.max(0, newPosition - 1)
      } else if (rules.onWin === 'moveBack2') {
        newPosition = Math.max(0, newPosition - 2)
      }
      // 'stay' doesn't change position

      // Check auto-reset after consecutive wins
      if (rules.resetAfterConsecutiveWins && consecutiveWins >= rules.resetAfterConsecutiveWins) {
        newPosition = 0
      }
    } else {
      // Loss
      if (rules.onLoss === 'moveForward1') {
        newPosition = Math.min(rules.sequence.length - 1, newPosition + 1)
      } else if (rules.onLoss === 'moveForward2') {
        newPosition = Math.min(rules.sequence.length - 1, newPosition + 2)
      }
      // 'stay' doesn't change position

      // Check if at end of sequence
      if (newPosition >= rules.sequence.length - 1) {
        if (rules.atSequenceEnd === 'reset') {
          newPosition = 0
        } else if (rules.atSequenceEnd === 'pause') {
          // Position stays at end
        }
      }
    }

    const multiplier = rules.sequence[newPosition]
    const newBet = config.baseBet * multiplier

    return {
      ...config,
      currentBet: newBet,
      consecutiveWins,
      consecutiveLosses,
      sequentialRules: {
        ...rules,
        currentPosition: newPosition
      }
    }
  }

  // Handle custom outcome-based system
  if (config.customRules) {
    const rules = config.customRules
    let newBet = config.currentBet

    if (outcome === 'win') {
      newBet = applyBetAction(rules.onWin, config.currentBet, config.baseBet)
      if (rules.resetAfterWin) {
        newBet = config.baseBet
      }
    } else {
      // Apply loss actions based on consecutive losses
      if (consecutiveLosses === 1) {
        newBet = applyBetAction(rules.onFirstLoss, config.currentBet, config.baseBet)
      } else if (consecutiveLosses === 2) {
        newBet = applyBetAction(rules.onSecondLoss, config.currentBet, config.baseBet)
      } else if (consecutiveLosses >= 3) {
        newBet = applyBetAction(rules.onThirdLoss, config.currentBet, config.baseBet)
      }

      // Check auto-pause
      if (rules.pauseAfterLosses && consecutiveLosses >= rules.pauseAfterLosses) {
        // Could set a flag here, for now just cap the bet
        newBet = config.currentBet
      }
    }

    // Apply max multiplier cap
    const maxBet = config.baseBet * rules.maxMultiplier
    newBet = Math.min(newBet, maxBet)

    return {
      ...config,
      currentBet: newBet,
      consecutiveWins,
      consecutiveLosses
    }
  }

  // Handle preset systems
  let newBet = config.currentBet

  switch (config.id) {
    case 'flat':
      newBet = config.baseBet
      break

    case 'paroli':
      if (outcome === 'win') {
        newBet = config.currentBet * 2
      } else {
        newBet = config.baseBet
      }
      break

    case 'martingale':
      if (outcome === 'loss') {
        newBet = config.currentBet * 2
      } else {
        newBet = config.baseBet
      }
      break

    case 'dalembert':
      if (outcome === 'loss') {
        newBet = config.currentBet + config.baseBet
      } else {
        newBet = Math.max(config.baseBet, config.currentBet - config.baseBet)
      }
      break

    case 'reverse-dalembert':
      if (outcome === 'win') {
        newBet = config.currentBet + config.baseBet
      } else {
        newBet = Math.max(config.baseBet, config.currentBet - config.baseBet)
      }
      break

    case 'fibonacci':
      const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
      let fibIndex = config.sequenceIndex || 0

      if (outcome === 'loss') {
        fibIndex = Math.min(fibSequence.length - 1, fibIndex + 1)
      } else {
        fibIndex = Math.max(0, fibIndex - 2)
      }

      newBet = config.baseBet * fibSequence[fibIndex]

      return {
        ...config,
        currentBet: newBet,
        consecutiveWins,
        consecutiveLosses,
        sequenceIndex: fibIndex
      }
  }

  return {
    ...config,
    currentBet: newBet,
    consecutiveWins,
    consecutiveLosses
  }
}

// Helper function to apply bet actions
function applyBetAction(action: 'same' | 'double' | 'reset' | 'pause' | {type: string, amount?: number, factor?: number}, currentBet: number, baseBet: number): number {
  if (action === 'same') return currentBet
  if (action === 'double') return currentBet * 2
  if (action === 'reset') return baseBet
  if (action === 'pause') return currentBet

  if (typeof action === 'object') {
    if (action.type === 'increase' && action.amount) {
      return currentBet + action.amount
    }
    if (action.type === 'multiply' && action.factor) {
      return currentBet * action.factor
    }
  }

  return currentBet
}

export default function BettingAssistant() {
  const { addSpin, addDealerChange, addCardStart, addCardEnd, undoLastSpin, updateSessionStats, spinHistory, sessionStats } = useBettingData()
  const [viewMode, setViewMode] = useState<'intro' | 'setup' | 'dashboard' | 'activeCard' | 'advisor' | 'performance'>('intro')
  const [session, setSession] = useState<SessionState | null>(null)
  const [tableView, setTableView] = useState<'layout' | 'wheelLayout' | 'my-groups'>('layout')
  const [currentDealer, setCurrentDealer] = useState(1)
  const [previousDealer, setPreviousDealer] = useState(1)

  // ✅ Supabase integration states
  const [userId, setUserId] = useState<string | null>(null)
  const [supabaseSessionId, setSupabaseSessionId] = useState<string | null>(null)
  const [stepCounter, setStepCounter] = useState(0) // Track sequential steps

  // ✅ NEW: Celebration states
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false)
  const [showFailureCelebration, setShowFailureCelebration] = useState(false)
  const [showBreakTimer, setShowBreakTimer] = useState(false)
  const [completedCard, setCompletedCard] = useState<BetCard | null>(null)
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)

  // Historical bets state - persists across view changes
  const [historicalBets, setHistoricalBets] = useState<Record<string, any>>({})

  // My Groups betting state - persists across layout switches
  const [myGroupsManualBets, setMyGroupsManualBets] = useState<Record<string, string>>({})
  const [myGroupsBetResults, setMyGroupsBetResults] = useState<Record<string, { status: 'win' | 'loss', amount: string } | null>>({})

  // Help modal state
  const [showBettingHelpModal, setShowBettingHelpModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ✅ Get authenticated user on mount
  useEffect(() => {
    setMounted(true)

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        console.log('[Betting Assistant] User authenticated:', user.id)
      } else {
        console.log('[Betting Assistant] No user logged in - running in local mode')
      }
    }

    getUser()
  }, [])

  const handleHistoricalBetsUpdate = (newBets: Record<string, any>) => {
    setHistoricalBets(newBets)
  }

  // Track dealer changes
  useEffect(() => {
    if (currentDealer !== previousDealer && session) {
      // Look up the actual dealer name from availableDealers
      const dealerIndex = currentDealer - 1
      const dealerName = session.config.availableDealers?.[dealerIndex]?.name || `Dealer ${currentDealer}`
      addDealerChange(currentDealer, dealerName)
      setPreviousDealer(currentDealer)
    }
  }, [currentDealer, previousDealer, session, addDealerChange])

  const startSession = (
    config: SessionConfig,
    locationData?: {
      casinoId: string | null
      casinoName?: string | null
      dealerId: string | null
      dealerName?: string | null
      tableNumber: string | null
      availableDealers?: Dealer[]
    }
  ) => {
    // Merge location data into config if provided
    const configWithLocation: SessionConfig = locationData
      ? {
          ...config,
          casinoId: locationData.casinoId,
          casinoName: locationData.casinoName || null,
          dealerId: locationData.dealerId,
          dealerName: locationData.dealerName || null,
          tableNumber: locationData.tableNumber,
          availableDealers: locationData.availableDealers || [],
        }
      : config

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
      config: configWithLocation,
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
    // Skip dashboard if cards are disabled
    setViewMode(config.useCards ? 'dashboard' : 'activeCard')
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

    // Add card end event to spin history
    addCardEnd(
      currentCard.cardNumber,
      pnl,
      true, // success
      currentCard.target,
      currentCard.betsUsed,
      currentCard.maxBets
    )

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

    // Add card end event to spin history
    addCardEnd(
      currentCard.cardNumber,
      currentCard.currentTotal,
      false, // failure
      currentCard.target,
      currentCard.betsUsed,
      currentCard.maxBets
    )

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

  // Helper: Check if a number wins for a selected group
  const checkSelectedGroupWin = (number: number, groupKey: string): boolean => {
    if (!session?.config.selectedGroups) return false

    // Parse the group key: format is "type-id-side" or "type-id" (no side for non-split)
    const parts = groupKey.split('-')
    const type = parts[0] as 'table' | 'wheel' | 'custom'

    // Check if last part is 'a' or 'b' or a number (indicates split/multi-option group)
    const lastPart = parts[parts.length - 1]
    const isSplit = lastPart === 'a' || lastPart === 'b'
    const isMultiOption = !isNaN(parseInt(lastPart)) && lastPart.length <= 2
    const side = isSplit ? lastPart : null
    const optionNum = isMultiOption ? lastPart : null

    // Get the id (everything between type and side/option, if any)
    const id = (isSplit || isMultiOption)
      ? parts.slice(1, -1).join('-')
      : parts.slice(1).join('-')

    // Find the matching group
    const group = session.config.selectedGroups.find(g => g.type === type && g.id === id)
    if (!group) return false

    // Handle custom groups
    if (type === 'custom' && group.customGroup) {
      return group.customGroup.numbers.includes(number)
    }

    // For multi-option groups, we need to determine which option the number belongs to
    // This is simplified - in reality MyGroupsLayout has getGroupValue logic
    // For now, just check if number is in the group's numbers
    // The actual win/loss logic should match what's in MyGroupsLayout

    return false // Placeholder - actual logic in MyGroupsLayout
  }

  // Calculate payout multiplier based on number count
  const getPayoutMultiplier = (numberCount: number): number => {
    if (numberCount >= 18) return 2 // 1:1 payout
    if (numberCount >= 12) return 3 // 2:1 payout
    if (numberCount >= 9) return 4 // 3:1 payout
    if (numberCount >= 6) return 6 // 5:1 payout
    if (numberCount >= 4) return 9 // 8:1 payout
    if (numberCount >= 3) return 12 // 11:1 payout
    if (numberCount === 2) return 18 // 17:1 payout
    if (numberCount === 1) return 36 // 35:1 payout
    return 2 // Default 1:1
  }

  // ✅ NEW: Handle number input for trend analysis (before betting)
  const handleNumberAdded = (number: number) => {
    if (!session) return

    const currentCard = session.cards[session.currentCardIndex]
    addSpin({
      number,
      timestamp: Date.now(),
      sessionId: session.id,
      cardId: currentCard.id
    })

    // Process my-groups bets if in my-groups view and there are pending bets
    if (tableView === 'my-groups' && Object.values(myGroupsManualBets).some(val => val !== '')) {
      const results: Record<string, number> = {}
      const resultStates: Record<string, { status: 'win' | 'loss', amount: string } | null> = {}
      let totalPnL = 0
      let totalWagered = 0

      Object.entries(myGroupsManualBets).forEach(([key, value]) => {
        if (value) {
          const betAmount = parseFloat(value)
          totalWagered += betAmount
          const won = checkSelectedGroupWin(number, key)

          // Auto-calculate payout based on group size
          // For now, default to 2x (1:1) - will enhance later
          const payoutMultiplier = 2
          const winAmount = won ? betAmount * payoutMultiplier : 0
          const pnl = won ? winAmount - betAmount : -betAmount

          results[key] = pnl
          totalPnL += pnl

          resultStates[key] = {
            status: won ? 'win' : 'loss',
            amount: Math.abs(pnl).toFixed(0)
          }
        }
      })

      // Show results on buttons
      setMyGroupsBetResults(resultStates)

      // Update financial tracking
      updateSessionStats(totalWagered, totalWagered + totalPnL)

      // Clear bets after 1.5 seconds
      setTimeout(() => {
        setMyGroupsManualBets({})
        setMyGroupsBetResults({})
      }, 1500)
    }
  }

  // Handle bets placed in HistoryTable - NOW CONNECTED TO CARD SYSTEM
  const handleHistoryTableBet = (
    totalWagered: number,
    totalReturned: number,
    pnl: number,
    bettingMatrix?: Record<string, number>,
    groupResults?: Record<string, number>,
    spinNumber?: number,
    spinTimestamp?: number
  ) => {
    if (!session) return

    const currentCard = session.cards[session.currentCardIndex]
    const outcome: 'win' | 'loss' = pnl > 0 ? 'win' : 'loss'

    // Create BetRecord for the card
    const newBet: BetRecord = {
      id: `bet-${Date.now()}`,
      timestamp: Date.now(),
      betType: `History Table: ${Object.keys(bettingMatrix || {}).join(', ')}`,
      betAmount: totalWagered,
      outcome,
      winAmount: totalReturned,
      numberHit: spinNumber || 0,
      cardId: currentCard.id,
      betNumber: currentCard.betsUsed + 1,
      runningCardTotal: currentCard.currentTotal + pnl,
      runningBankroll: session.currentBankroll + pnl,
      bets: bettingMatrix as any,
      spinNumber: spinNumber || 0,
      results: groupResults as any,
      totalPnL: pnl,
    }

    // Update card
    const updatedCard = {
      ...currentCard,
      bets: [...currentCard.bets, newBet],
      currentTotal: newBet.runningCardTotal,
      betsUsed: currentCard.betsUsed + 1,
    }

    // Check for completion or failure
    if (updatedCard.currentTotal >= updatedCard.target) {
      updatedCard.status = 'completed'
      setTimeout(() => handleCardComplete(updatedCard.currentTotal), 500)
    } else if (updatedCard.betsUsed >= updatedCard.maxBets) {
      updatedCard.status = 'failed'
      setTimeout(() => handleCardFailure(), 500)
    }

    const updatedCards = [...session.cards]
    updatedCards[session.currentCardIndex] = updatedCard

    // Update betting system
    const updatedSystem = updateBettingSystem(session.config.bettingSystem, outcome)

    const newSession = {
      ...session,
      cards: updatedCards,
      currentBankroll: newBet.runningBankroll,
      totalWagered: session.totalWagered + totalWagered,
      totalReturned: session.totalReturned + totalReturned,
      config: {
        ...session.config,
        bettingSystem: updatedSystem
      }
    }

    setSession(newSession)

    // Update session stats
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

  // ❌ REMOVED: Dead placeBet() function - was never called
  // ✅ Using handleHistoryTableBet() instead (see above)

  const endSession = () => {
    setSession(null)
    setViewMode('intro')
    
    updateSessionStats({
      totalSpins: 0,
      totalWagered: 0,
      totalReturned: 0,
      currentBankroll: 0,
      roi: 0
    })
  }

  return (
    <>
      <Navigation />
      {/* Intro/Welcome Page */}
      {viewMode === 'intro' && (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                🎯 Betting Assistant
              </h1>
              <p className="text-xl text-gray-300">
                Your intelligent companion for structured roulette betting
              </p>
            </div>

            <div className="grid gap-6 mb-8">
              {/* What is it? */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/30">
                <h2 className="text-2xl font-bold text-cyan-400 mb-3">What is the Betting Assistant?</h2>
                <p className="text-gray-300 leading-relaxed">
                  A powerful tool that helps you manage your roulette sessions with a structured, card-based approach.
                  Track your performance, manage your bankroll, and make informed decisions with real-time analytics.
                </p>
              </div>

              {/* Key Features */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-blue-500/30">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">Key Features</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">🎴</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Card-Based System</h3>
                      <p className="text-sm text-gray-400">Set targets for each betting card and track progress</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Real-Time Analytics</h3>
                      <p className="text-sm text-gray-400">View hit rates, patterns, and statistics live</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Bankroll Management</h3>
                      <p className="text-sm text-gray-400">Track your balance, P/L, and ROI automatically</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">🎲</span>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Multiple Betting Groups</h3>
                      <p className="text-sm text-gray-400">Colors, dozens, columns, and special bets</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Use */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">How to Use</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">1</span>
                    <p className="text-gray-300 pt-1"><strong className="text-white">Setup Session:</strong> Configure your bankroll, target profit, and betting preferences</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">2</span>
                    <p className="text-gray-300 pt-1"><strong className="text-white">View Dashboard:</strong> See all your betting cards and select one to start</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">3</span>
                    <p className="text-gray-300 pt-1"><strong className="text-white">Place Bets & Track:</strong> Enter numbers, place bets, and watch the analytics update in real-time</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">4</span>
                    <p className="text-gray-300 pt-1"><strong className="text-white">Complete Cards:</strong> Hit your target or move to the next card strategically</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-green-500/30">
                <h2 className="text-2xl font-bold text-green-400 mb-3">Benefits</h2>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Structured approach prevents emotional betting</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Clear profit targets keep you focused</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Historical data helps identify patterns</li>
                  <li className="flex gap-2"><span className="text-green-400">✓</span> Performance tracking shows what works</li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={() => setViewMode('setup')}
                className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xl font-bold rounded-xl shadow-2xl transform hover:scale-105 transition-all"
              >
                🚀 Start Your Session
              </button>
              <p className="text-gray-400 text-sm mt-4">Ready to begin? Let's configure your first session!</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'setup' && <SessionSetup onStartSession={startSession} userId={null} hasEliteAccess={true} />}
      
      {viewMode === 'dashboard' && session && (
  <BetCardDashboard
    session={session}
    onSelectCard={selectCard}
    onEndSession={endSession}
    onOpenPerformance={() => setViewMode('performance')}
  />
)}
      {viewMode === 'activeCard' && session && (
        <div className="space-y-2">
          {/* Full-Width Card Info Bar at Top - Only show when using card system */}
          {session.config.useCards && (
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg border border-cyan-500/30 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  🎴 Card #{session.cards[session.currentCardIndex].cardNumber}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-600/40">
                    <span className="text-gray-400">Target:</span>{' '}
                    <span className="font-bold text-cyan-400">${session.cards[session.currentCardIndex].target}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-600/40">
                    <span className="text-gray-400">Progress:</span>{' '}
                    <span className={`font-bold ${session.cards[session.currentCardIndex].currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${session.cards[session.currentCardIndex].currentTotal >= 0 ? '+' : ''}{session.cards[session.currentCardIndex].currentTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-600/40">
                    <span className="text-gray-400">Bets:</span>{' '}
                    <span className="font-bold text-white">{session.cards[session.currentCardIndex].betsUsed}/{session.cards[session.currentCardIndex].maxBets}</span>
                  </div>
                </div>
              </div>
              {session.config.useCards && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={backToDashboard}
                    className="px-4 py-2 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 hover:from-gray-600 hover:via-gray-500 hover:to-gray-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-gray-600/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => setViewMode('performance')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-blue-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Session Stats
                  </button>
                  <button
                    onClick={endSession}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-red-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    End Session
                  </button>
                  <button
                    onClick={() => {
                      endSession()
                      setViewMode('setup')
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-purple-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restart with New Settings
                  </button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Session Controls Bar - Only show when NOT using card system */}
          {!session.config.useCards && (
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg border border-gray-500/30 p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                  🎯 Cards Free Betting Session
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode('performance')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-blue-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Session Stats
                  </button>
                  <button
                    onClick={endSession}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-red-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    End Session
                  </button>
                  <button
                    onClick={() => {
                      endSession()
                      setViewMode('setup')
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg border border-purple-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restart with New Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex gap-2 min-h-screen">
            {/* Left Side: Table View with Spin History - Takes up left half */}
            <div className="w-1/2 pb-2 overflow-y-auto sticky top-0 self-start max-h-screen">

            {/* Table View showing all betting groups with spin history */}
            <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700">
              {tableView === 'layout' && (
                <div className="space-y-2">
                  {/* Game Control Bar - Table View */}
                  <GameControlBar
                    currentDealer={currentDealer}
                    onDealerChange={setCurrentDealer}
                    availableDealers={session.config.availableDealers && session.config.availableDealers.length > 0
                      ? session.config.availableDealers
                      : undefined}
                    spinHistory={spinHistory}
                    sessionStats={sessionStats}
                    sessionId={session.id}
                    currentCardNumber={session.cards[session.currentCardIndex].cardNumber}
                    currentCardTarget={session.cards[session.currentCardIndex].target}
                    currentCardProfit={session.cards[session.currentCardIndex].currentTotal}
                    currentCardBetsUsed={session.cards[session.currentCardIndex].betsUsed}
                    currentCardMaxBets={session.cards[session.currentCardIndex].maxBets}
                    onCardStart={addCardStart}
                    onCardEnd={addCardEnd}
                    currentView={tableView}
                    onViewChange={setTableView}
                    hasSelectedGroups={session.config.selectedGroups !== undefined && session.config.selectedGroups.length > 0}
                    useCards={session.config.useCards}
                  />

                  {/* Roulette Table Layout */}
                  <div className="space-y-0.5">
                    {/* Zero */}
                    <div className="relative">
                      <button
                        onClick={() => handleNumberAdded(0)}
                        className="w-full py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold text-white transition"
                      >
                        0
                        {spinHistory.filter(s => s.number === 0).length > 0 && (
                          <span className="absolute top-0 right-0 bg-yellow-400 text-black text-xs rounded-full px-1.5">
                            {spinHistory.filter(s => s.number === 0).length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Main number grid */}
                    <div className="grid grid-cols-12 gap-0.5">
                      {/* Top row */}
                      {[3,6,9,12,15,18,21,24,27,30,33,36].map(num => {
                        const hitCount = spinHistory.slice(0, 36).filter(s => s.number === num).length;
                        const isHot = hitCount >= 3;
                        const isCold = hitCount === 0;

                        return (
                          <button
                            key={num}
                            onClick={() => handleNumberAdded(num)}
                            className={`relative py-1.5 rounded text-sm font-bold text-white transition ${
                              isHot ? 'ring-1 ring-yellow-400 animate-pulse' : ''
                            } ${
                              [3,9,12,18,21,27,30,36].includes(num)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-gray-800 border border-gray-600'
                            } ${isCold ? 'opacity-50' : ''}`}
                          >
                            {num}
                            {hitCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-xs rounded-full px-1 bg-yellow-400 text-black font-bold">
                                {hitCount}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Middle row */}
                      {[2,5,8,11,14,17,20,23,26,29,32,35].map(num => {
                        const hitCount = spinHistory.slice(0, 36).filter(s => s.number === num).length;
                        const isHot = hitCount >= 3;
                        const isCold = hitCount === 0;

                        return (
                          <button
                            key={num}
                            onClick={() => handleNumberAdded(num)}
                            className={`relative py-1.5 rounded text-sm font-bold text-white transition ${
                              isHot ? 'ring-1 ring-yellow-400 animate-pulse' : ''
                            } ${
                              [5,14,23,32].includes(num)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-gray-800 border border-gray-600'
                            } ${isCold ? 'opacity-50' : ''}`}
                          >
                            {num}
                            {hitCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-xs rounded-full px-1 bg-yellow-400 text-black font-bold">
                                {hitCount}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Bottom row */}
                      {[1,4,7,10,13,16,19,22,25,28,31,34].map(num => {
                        const hitCount = spinHistory.slice(0, 36).filter(s => s.number === num).length;
                        const isHot = hitCount >= 3;
                        const isCold = hitCount === 0;

                        return (
                          <button
                            key={num}
                            onClick={() => handleNumberAdded(num)}
                            className={`relative py-1.5 rounded text-sm font-bold text-white transition ${
                              isHot ? 'ring-1 ring-yellow-400 animate-pulse' : ''
                            } ${
                              [1,7,16,19,25,34].includes(num)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-gray-800 border border-gray-600'
                            } ${isCold ? 'opacity-50' : ''}`}
                          >
                            {num}
                            {hitCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-xs rounded-full px-1 bg-yellow-400 text-black font-bold">
                                {hitCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Numbers & History */}
                  <div className="space-y-2">
                    {/* Recent 15 Numbers with Number Entry */}
                    <div className="bg-gray-800 rounded border border-gray-700 px-1 py-0.5">
                      <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            max="36"
                            placeholder="0-36"
                            className="w-14 px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-white text-[10px] text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseInt(e.currentTarget.value)
                                if (value >= 0 && value <= 36) {
                                  handleNumberAdded(value)
                                  e.currentTarget.value = ''
                                }
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement
                                const value = parseInt(input.value)
                                if (value >= 0 && value <= 36) {
                                  handleNumberAdded(value)
                                  input.value = ''
                                }
                              }}
                              className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] font-bold rounded"
                            >
                              Add
                            </button>
                            <button
                              onClick={undoLastSpin}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                            >
                              Undo
                            </button>
                          </div>
                      </div>
                      <div className="flex gap-0.5">
                        {spinHistory.filter(s => !(s as any).isDealerChange && !(s as any).isCardStart && !(s as any).isCardEnd).slice(0, 25).map((spin, idx) => (
                          <div
                            key={idx}
                            className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                              ${idx === 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                              ${spin.number === 0 ? 'bg-green-600' :
                                [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(spin.number)
                                  ? 'bg-red-600' : 'bg-black border border-gray-600'}
                            `}
                          >
                            {spin.number}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-slate-700 rounded border-2 border-slate-500/50 p-2 shadow-lg">
                      <div className="flex items-center justify-between gap-3 mb-2 text-[10px] font-bold">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Bank:</span>
                          <span className="text-white">${sessionStats.currentBankroll.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Wager:</span>
                          <span className="text-cyan-400">${sessionStats.totalWagered.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">P/L:</span>
                          <span className={`${(sessionStats.totalReturned - sessionStats.totalWagered) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${(sessionStats.totalReturned - sessionStats.totalWagered) >= 0 ? '+' : ''}{(sessionStats.totalReturned - sessionStats.totalWagered).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">ROI:</span>
                          <span className={`${sessionStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {sessionStats.roi >= 0 ? '+' : ''}{sessionStats.roi.toFixed(1)}%
                          </span>
                        </div>
                        <button
                          onClick={() => setShowBettingHelpModal(true)}
                          className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded transition-colors"
                          title="View betting help"
                        >
                          Help
                        </button>
                      </div>
                      <HistoryTable
                        spins={spinHistory.slice(0, 50).map(s => {
                          // If it's a dealer change, preserve those properties
                          if ((s as any).isDealerChange) {
                            return {
                              ...s,
                              number: -1,
                              created_at: new Date(s.timestamp).toISOString()
                            } as any
                          }
                          // If it's a card start or end, preserve those properties
                          if ((s as any).isCardStart || (s as any).isCardEnd) {
                            return {
                              ...s,
                              number: -1,
                              created_at: new Date(s.timestamp).toISOString()
                            } as any
                          }
                          // Otherwise, process normally
                          return {
                            ...getNumberProperties(s.number),
                            session_id: s.sessionId || '',
                            spin_number: 0,
                            created_at: new Date(s.timestamp).toISOString()
                          }
                        })}
                        baseUnit={session.config.bettingSystem.baseBet}
                        sessionStats={sessionStats}
                        onBetPlaced={handleHistoryTableBet}
                        historicalBets={historicalBets}
                        onHistoricalBetsUpdate={handleHistoricalBetsUpdate}
                      />
                    </div>
                  </div>
                </div>
              )}
              {tableView === 'wheelLayout' && (
                <div className="space-y-2">
                  {/* Game Control Bar */}
                  <GameControlBar
                    currentDealer={currentDealer}
                    onDealerChange={setCurrentDealer}
                    availableDealers={session.config.availableDealers && session.config.availableDealers.length > 0
                      ? session.config.availableDealers
                      : undefined}
                    spinHistory={spinHistory}
                    sessionStats={sessionStats}
                    sessionId={session.id}
                    currentCardNumber={session.cards[session.currentCardIndex].cardNumber}
                    currentCardTarget={session.cards[session.currentCardIndex].target}
                    currentCardProfit={session.cards[session.currentCardIndex].currentTotal}
                    currentCardBetsUsed={session.cards[session.currentCardIndex].betsUsed}
                    currentCardMaxBets={session.cards[session.currentCardIndex].maxBets}
                    onCardStart={addCardStart}
                    onCardEnd={addCardEnd}
                    currentView={tableView}
                    onViewChange={setTableView}
                    hasSelectedGroups={session.config.selectedGroups !== undefined && session.config.selectedGroups.length > 0}
                    useCards={session.config.useCards}
                  />

                  <WheelLayout
                    spinHistory={spinHistory}
                    onNumberAdded={handleNumberAdded}
                  />

                  {/* Recent Numbers & History */}
                  <div className="space-y-2">
                    {/* Recent 15 Numbers with Number Entry */}
                    <div className="bg-gray-800 rounded border border-gray-700 px-1 py-0.5">
                      <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            max="36"
                            placeholder="0-36"
                            className="w-14 px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-white text-[10px] text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseInt(e.currentTarget.value)
                                if (value >= 0 && value <= 36) {
                                  handleNumberAdded(value)
                                  e.currentTarget.value = ''
                                }
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement
                                const value = parseInt(input.value)
                                if (value >= 0 && value <= 36) {
                                  handleNumberAdded(value)
                                  input.value = ''
                                }
                              }}
                              className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] font-bold rounded"
                            >
                              Add
                            </button>
                            <button
                              onClick={undoLastSpin}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                            >
                              Undo
                            </button>
                          </div>
                      </div>
                      <div className="flex gap-0.5">
                        {spinHistory.filter(s => !(s as any).isDealerChange && !(s as any).isCardStart && !(s as any).isCardEnd).slice(0, 25).map((spin, idx) => (
                          <div
                            key={idx}
                            className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                              ${idx === 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                              ${spin.number === 0 ? 'bg-green-600' :
                                [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(spin.number)
                                  ? 'bg-red-600' : 'bg-black border border-gray-600'}
                            `}
                          >
                            {spin.number}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-slate-700 rounded border-2 border-slate-500/50 p-2 shadow-lg">
                      <div className="flex items-center justify-between gap-3 mb-2 text-[10px] font-bold">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Bank:</span>
                          <span className="text-white">${sessionStats.currentBankroll.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Wager:</span>
                          <span className="text-cyan-400">${sessionStats.totalWagered.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">P/L:</span>
                          <span className={`${(sessionStats.totalReturned - sessionStats.totalWagered) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${(sessionStats.totalReturned - sessionStats.totalWagered) >= 0 ? '+' : ''}{(sessionStats.totalReturned - sessionStats.totalWagered).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">ROI:</span>
                          <span className={`${sessionStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {sessionStats.roi >= 0 ? '+' : ''}{sessionStats.roi.toFixed(1)}%
                          </span>
                        </div>
                        <button
                          onClick={() => setShowBettingHelpModal(true)}
                          className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded transition-colors"
                          title="View betting help"
                        >
                          Help
                        </button>
                      </div>
                      <WheelHistory
                        spins={spinHistory.slice(0, 50).map(s => {
                          // If it's a dealer change, preserve those properties
                          if ((s as any).isDealerChange) {
                            return {
                              ...s,
                              number: -1,
                              created_at: new Date(s.timestamp).toISOString()
                            } as any
                          }
                          // If it's a card start or end, preserve those properties
                          if ((s as any).isCardStart || (s as any).isCardEnd) {
                            return {
                              ...s,
                              number: -1,
                              created_at: new Date(s.timestamp).toISOString()
                            } as any
                          }
                          // Otherwise, process normally
                          return {
                            ...getNumberProperties(s.number),
                            session_id: s.sessionId || '',
                            spin_number: 0,
                            created_at: new Date(s.timestamp).toISOString()
                          }
                        })}
                        selectedNumber={spinHistory.length > 0 ? spinHistory[0].number : null}
                        baseUnit={session.config.bettingSystem.baseBet}
                        onBetPlaced={handleHistoryTableBet}
                        historicalBets={historicalBets}
                        onHistoricalBetsUpdate={handleHistoricalBetsUpdate}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* My Groups Layout */}
              {tableView === 'my-groups' && (
                <div className="space-y-2">
                  <GameControlBar
                    currentDealer={currentDealer}
                    onDealerChange={setCurrentDealer}
                    availableDealers={session.config.availableDealers && session.config.availableDealers.length > 0
                      ? session.config.availableDealers
                      : undefined}
                    spinHistory={spinHistory}
                    sessionStats={sessionStats}
                    sessionId={session.id}
                    currentCardNumber={session.cards[session.currentCardIndex].cardNumber}
                    currentCardTarget={session.cards[session.currentCardIndex].target}
                    currentCardProfit={session.cards[session.currentCardIndex].currentTotal}
                    currentCardBetsUsed={session.cards[session.currentCardIndex].betsUsed}
                    currentCardMaxBets={session.cards[session.currentCardIndex].maxBets}
                    onCardStart={addCardStart}
                    onCardEnd={addCardEnd}
                    currentView={tableView}
                    onViewChange={setTableView}
                    hasSelectedGroups={session.config.selectedGroups !== undefined && session.config.selectedGroups.length > 0}
                    useCards={session.config.useCards}
                  />

                  {/* Roulette Table Layout */}
                  <div className="space-y-0.5">
                    {/* Zero */}
                    <div className="relative">
                      <button
                        onClick={() => handleNumberAdded(0)}
                        className="w-full py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold text-white transition"
                      >
                        0
                        {spinHistory.filter(s => s.number === 0).length > 0 && (
                          <span className="absolute top-0 right-0 bg-yellow-400 text-black text-xs rounded-full px-1.5">
                            {spinHistory.filter(s => s.number === 0).length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Main number grid */}
                    <div className="grid grid-cols-12 gap-0.5">
                      {/* Top row */}
                      {[3,6,9,12,15,18,21,24,27,30,33,36].map(num => {
                        const hitCount = spinHistory.slice(0, 36).filter(s => s.number === num).length;
                        const isHot = hitCount >= 3;
                        const isCold = hitCount === 0;

                        return (
                          <button
                            key={num}
                            onClick={() => handleNumberAdded(num)}
                            className={`relative py-1.5 rounded text-sm font-bold text-white transition ${
                              isHot ? 'ring-1 ring-yellow-400 animate-pulse' : ''
                            } ${
                              [3,9,12,18,21,27,30,36].includes(num)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-gray-800 border border-gray-600'
                            } ${isCold ? 'opacity-50' : ''}`}
                          >
                            {num}
                            {hitCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-xs rounded-full px-1 bg-yellow-400 text-black font-bold">
                                {hitCount}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Middle row */}
                      {[2,5,8,11,14,17,20,23,26,29,32,35].map(num => {
                        const hitCount = spinHistory.slice(0, 36).filter(s => s.number === num).length;
                        const isHot = hitCount >= 3;
                        const isCold = hitCount === 0;

                        return (
                          <button
                            key={num}
                            onClick={() => handleNumberAdded(num)}
                            className={`relative py-1.5 rounded text-sm font-bold text-white transition ${
                              isHot ? 'ring-1 ring-yellow-400 animate-pulse' : ''
                            } ${
                              [5,14,23,32].includes(num)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-gray-800 border border-gray-600'
                            } ${isCold ? 'opacity-50' : ''}`}
                          >
                            {num}
                            {hitCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-xs rounded-full px-1 bg-yellow-400 text-black font-bold">
                                {hitCount}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Bottom row */}
                      {[1,4,7,10,13,16,19,22,25,28,31,34].map(num => {
                        const hitCount = spinHistory.slice(0, 36).filter(s => s.number === num).length;
                        const isHot = hitCount >= 3;
                        const isCold = hitCount === 0;

                        return (
                          <button
                            key={num}
                            onClick={() => handleNumberAdded(num)}
                            className={`relative py-1.5 rounded text-sm font-bold text-white transition ${
                              isHot ? 'ring-1 ring-yellow-400 animate-pulse' : ''
                            } ${
                              [1,7,16,19,25,34].includes(num)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-gray-800 border border-gray-600'
                            } ${isCold ? 'opacity-50' : ''}`}
                          >
                            {num}
                            {hitCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-xs rounded-full px-1 bg-yellow-400 text-black font-bold">
                                {hitCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Numbers & History */}
                  <div className="space-y-2">
                    {/* Recent 25 Numbers with Number Entry */}
                    <div className="bg-gray-800 rounded border border-gray-700 px-1 py-0.5">
                      <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            max="36"
                            placeholder="0-36"
                            className="w-14 px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-white text-[10px] text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseInt(e.currentTarget.value)
                                if (value >= 0 && value <= 36) {
                                  handleNumberAdded(value)
                                  e.currentTarget.value = ''
                                }
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement
                                const value = parseInt(input.value)
                                if (value >= 0 && value <= 36) {
                                  handleNumberAdded(value)
                                  input.value = ''
                                }
                              }}
                              className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] font-bold rounded"
                            >
                              Add
                            </button>
                            <button
                              onClick={undoLastSpin}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                            >
                              Undo
                            </button>
                          </div>
                      </div>
                      <div className="flex gap-0.5">
                        {spinHistory.filter(s => !(s as any).isDealerChange && !(s as any).isCardStart && !(s as any).isCardEnd).slice(0, 25).map((spin, idx) => (
                          <div
                            key={idx}
                            className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                              ${idx === 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                              ${spin.number === 0 ? 'bg-green-600' :
                                [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(spin.number)
                                  ? 'bg-red-600' : 'bg-black border border-gray-600'}
                            `}
                          >
                            {spin.number}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* History Table with Bankroll Stats */}
                    <div className="bg-gray-800 rounded border border-gray-700 p-2">
                      <div className="flex items-center justify-between gap-3 mb-2 text-[10px] font-bold">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Bank:</span>
                          <span className="text-white">${sessionStats.currentBankroll.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Wager:</span>
                          <span className="text-cyan-400">${sessionStats.totalWagered.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">P/L:</span>
                          <span className={`${(sessionStats.totalReturned - sessionStats.totalWagered) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${(sessionStats.totalReturned - sessionStats.totalWagered) >= 0 ? '+' : ''}{(sessionStats.totalReturned - sessionStats.totalWagered).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-gray-400">ROI:</span>
                          <span className={`${sessionStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {sessionStats.roi >= 0 ? '+' : ''}{sessionStats.roi.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <MyGroupsLayout
                        spins={spinHistory.map((s) => {
                          // Handle dealer change events
                          if ((s as any).isDealerChange) {
                            return {
                              ...s,
                              number: -1,
                              created_at: new Date(s.timestamp).toISOString()
                            } as any
                          }
                          // If it's a card start or end, preserve those properties
                          if ((s as any).isCardStart || (s as any).isCardEnd) {
                            return {
                              ...s,
                              number: -1,
                              created_at: new Date(s.timestamp).toISOString()
                            } as any
                          }
                          // Otherwise, process normally
                          return {
                            ...getNumberProperties(s.number),
                            session_id: s.sessionId || '',
                            spin_number: 0,
                            created_at: new Date(s.timestamp).toISOString()
                          }
                        })}
                        selectedGroups={session.config.selectedGroups || []}
                        manualBets={myGroupsManualBets}
                        setManualBets={setMyGroupsManualBets}
                        playerUnit={session.config.baseUnit}
                        betResults={myGroupsBetResults}
                        historicalBets={historicalBets}
                        onHistoricalBetsUpdate={handleHistoricalBetsUpdate}
                        onBetPlaced={handleHistoryTableBet}
                        onClearBets={() => setMyGroupsManualBets({})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Dashboard + Stats - Takes up right half */}
          <div className="w-1/2 overflow-y-auto">
            <RightSideLayout
              session={session}
              spinHistory={spinHistory
                .filter(s => {
                  // Filter out notification spins (dealer change, card start/end)
                  if ((s as any).isDealerChange || (s as any).isCardStart || (s as any).isCardEnd) return false
                  // Filter out invalid numbers (only keep 0-36)
                  return s.number >= 0 && s.number <= 36
                })
                .map(s => s.number)
              }
            />
          </div>
        </div>
        </div>
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

      {/* Betting Help Modal */}
      {mounted && showBettingHelpModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={() => setShowBettingHelpModal(false)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            style={{ zIndex: 100000 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">Betting Interface Help</h2>
              <button
                onClick={() => setShowBettingHelpModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Understanding the Headers */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Understanding the Headers
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>The stats bar at the top shows your session performance at a glance:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong className="text-white">Bank:</strong> Your current bankroll (starting amount + all profits/losses)</li>
                    <li><strong className="text-cyan-400">Wager:</strong> Total amount you've bet across all spins</li>
                    <li><strong className="text-green-400/text-red-400">P/L:</strong> Profit/Loss (total returned - total wagered)</li>
                    <li><strong className="text-green-400/text-red-400">ROI:</strong> Return on Investment percentage</li>
                  </ul>
                </div>
              </div>

              {/* Understanding Bet Cards */}
              <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🃏</span>
                  Understanding Bet Cards (Betting Groups)
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>The grey buttons in the "NEXT BET" row represent different betting groups. They turn colored when you place bets on them:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-semibold text-white mb-1">Standard Groups:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
                        <li><span className="text-red-400">R</span> / <span className="text-gray-400">B</span> = Red / Black</li>
                        <li><span className="text-purple-400">E</span> / <span className="text-cyan-400">O</span> = Even / Odd</li>
                        <li><span className="text-amber-400">L</span> / <span className="text-gray-400">H</span> = Low (1-18) / High (19-36)</li>
                        <li>Column: 1st, 2nd, 3rd</li>
                        <li>Dozen: 1st (1-12), 2nd (13-24), 3rd (25-36)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Alternative Groups:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
                        <li><span className="text-indigo-400">Alt1:</span> A / B sections</li>
                        <li><span className="text-lime-400">Alt2:</span> AA / BB sections</li>
                        <li><span className="text-blue-400">Alt3:</span> AAA / BBB sections</li>
                        <li><span className="text-purple-400">E/C:</span> Edge / Center</li>
                        <li><span className="text-red-400">Six:</span> 1st-6th (groups of 6 numbers)</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-yellow-300 text-xs mt-2">💡 Click the 🔍 icon on any column header to view the table layout for that betting group</p>
                </div>
              </div>

              {/* How to Place Bets */}
              <div className="bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  How to Place Bets
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="bg-gray-800/50 rounded p-3 space-y-2">
                    <p className="font-semibold text-white">📍 Step 1: Click a bet card (grey button in NEXT BET row)</p>
                    <p className="ml-4">Single click adds your base bet amount to that group. The button turns colored and a yellow badge shows your bet amount.</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 space-y-2">
                    <p className="font-semibold text-white">📍 Step 2: View your total stake</p>
                    <p className="ml-4">The "Total:" under the "Clear" button shows your combined bet across all groups.</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3 space-y-2">
                    <p className="font-semibold text-white">📍 Step 3: Spin lands</p>
                    <p className="ml-4">After recording a number, cards flash <span className="text-green-400">green (win)</span> or <span className="text-red-400">red (loss)</span> showing P/L amounts.</p>
                  </div>
                  <p className="text-cyan-300 text-xs mt-2">⚡ You can bet on multiple groups simultaneously for complex strategies!</p>
                </div>
              </div>

              {/* How to Increase Bets */}
              <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-orange-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  How to Increase Bets
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="font-semibold text-white mb-1">🖱️ Single Click:</p>
                    <p className="ml-4">Adds your base bet unit to the group (e.g., $10 → $20 → $30)</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="font-semibold text-white mb-1">🖱️🖱️ Double Click:</p>
                    <p className="ml-4">Doubles your current bet on that group (e.g., $10 → $20 → $40 → $80)</p>
                  </div>
                  <p className="text-yellow-300 text-xs mt-2">💡 Use double-click for aggressive progressions like Martingale</p>
                </div>
              </div>

              {/* How to Clear Bets */}
              <div className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🗑️</span>
                  How to Clear Bets
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="font-semibold text-white mb-1">Click the "Clear" button</p>
                    <p className="ml-4">Appears in the "NEXT BET" row when you have active bets. Removes all pending bets before the spin.</p>
                  </div>
                  <p className="text-red-300 text-xs mt-2">⚠️ You cannot place or clear bets while results are displaying (3 second flash)</p>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 border border-indigo-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  Pro Tips
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
                  <li>Click column headers with 🔍 to see table layouts</li>
                  <li>Bet on multiple groups to hedge or cover more numbers</li>
                  <li>Watch the "Wheel Pos" column to track wheel sector patterns</li>
                  <li>Your bets persist until results show, then auto-clear after 3 seconds</li>
                  <li>Use the base bet selector to quickly change your betting unit</li>
                  <li className="text-yellow-300"><strong>⚡ Playing online?</strong> Save time by using your casino site's "Favorite" feature to save your preferred betting groups for instant one-click betting during those quick time-constrained spins!</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => setShowBettingHelpModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}