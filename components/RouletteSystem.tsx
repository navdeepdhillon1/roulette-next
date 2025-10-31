'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getNumberProperties, NUMBERS, checkIfGroupWon, getGroupPayout, type GroupKey } from '@/lib/roulette-logic'
import type { Session, Spin } from '@/lib/types'
import { useRouletteSession } from '@/hooks/useRouletteSession'
import { useGameState } from '@/stores/gameState'
import ActiveRedBlackCard from '@/components/gamified/ActiveRedBlackCard'
import HeaderBar from '@/components/roulette/HeaderBar'
import EntryPanel from '@/components/roulette/EntryPanel'
import { Card } from '@/components/ui/card';
import CurrentBetsSummary from '@/components/roulette/CurrentBetsSummary'
import HeatmapGrid from '@/components/roulette/HeatmapGrid'
import BettingCards18 from '@/components/roulette/BettingCards18'
import BettingCards12 from '@/components/roulette/BettingCards12'
import BettingCards6 from '@/components/roulette/BettingCards6'
import HistoryTable from '@/components/roulette/HistoryTable'
import StatsMatrix from '@/components/roulette/StatsMatrix'
import WheelView from '@/components/WheelView'
import WheelDisplay from '@/components/WheelDisplay'
import WheelLayout from '@/components/roulette/WheelLayout'
import WheelHistory from '@/components/WheelHistory'
import WheelStats from '@/components/WheelStats'
import PatternDetectionEngine from '@/components/PatternDetectionEngine';
import TimeCorrelationTable from '@/components/TimeCorrelationTable';
import StreakAnalysisTable from '@/components/StreakAnalysisTable';
import { calculateAbsence, calculateConsecutive, expectedPercentageFor, statusFrom } from '@/lib/roulette-analytics'
import CommonGroupsTable from '@/components/CommonGroupsTable';
import SpecialBetsTable from '@/components/SpecialBetsTable';
import WheelBetStats from '@/components/WheelBetStats';
import NumbersStatsTab from './NumbersStatsTab';
import PredictionOracle from './PredictionOracle';
import SequenceTracker from './SequenceTracker';
import GroupPredictions from './GroupPredictions';
// Type definitions
type MainTab = 'table-view'
type AssistantSubTab = 'setup' | 'action' | 'analysis' | 'performance'
type StorageMode = 'local' | 'cloud'

// Typed bet keys used across performance matrix
const BET_KEYS = [
  'red','black','even','odd','low','high',
  'dozen1','dozen2','dozen3',
  'col1','col2','col3',
  'six1','six2','six3','six4','six5','six6',
  'alt1_1','alt1_2','alt2_1','alt2_2','alt3_1','alt3_2',
  'edge','center'
] as const
type BetKey = typeof BET_KEYS[number]

interface PlayerSetup {
  bankroll: number
  targetProfit: number
  stopLoss: number
  timeAvailable: number
  betUnit: number
  progressionStyle: 'flat' | 'martingale' | 'reverse-martingale' | 'fibonacci' | 'dalembert' | 'custom'
  playerLevel: 'beginner' | 'intermediate' | 'professional'
}

interface UserProfile {
  id?: string
  email?: string
  isPremium: boolean
  displayName?: string
}

export default function RouletteSystem() {
  // Core session management - hybrid approach
  const [storageMode, setStorageMode] = useState<StorageMode>('local')
  const [userProfile, setUserProfile] = useState<UserProfile>({ isPremium: false })
  const [localSession, setLocalSession] = useState<Session | null>(null)
  const [localSpins, setLocalSpins] = useState<Spin[]>([])
  const gameState = useGameState()
  const [analysisSection, setAnalysisSection] = useState<'patterns' | 'time' | 'streaks'>('patterns')
  const [analysisView, setAnalysisView] = useState<'common' | 'special' | 'wheel' | 'numbers'>('common');

  // Beta Access Control
  const [hasAccess, setHasAccess] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const BETA_CODE = 'ROULETTE2024' // Change this to your secret code

  useEffect(() => {
    // Check if user has beta access in localStorage
    const storedAccess = localStorage.getItem('beta_access')
    if (storedAccess === BETA_CODE) {
      setHasAccess(true)
    }
  }, [])

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (accessCode === BETA_CODE) {
      localStorage.setItem('beta_access', BETA_CODE)
      setHasAccess(true)
    } else {
      alert('Invalid access code. Please check your email for the correct code.')
      setAccessCode('')
    }
  }

  // Help panel state
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({
    setup: false,
    action: false,
    analysis: false,
    performance: false
  })

  const toggleHelp = (tab: string) => {
    setShowHelp(prev => ({ ...prev, [tab]: !prev[tab] }))
  }
  // Call hook unconditionally to follow Rules of Hooks
  const { 
    session: cloudSession, 
    spins: cloudSpins, 
    loading: sessionLoading, 
    addSpin: addCloudSpin, 
    resetSession: resetCloudSession 
  } = useRouletteSession()
  
  // Unified getters
  const session = storageMode === 'cloud' ? cloudSession : localSession
  const spins = storageMode === 'cloud' ? cloudSpins : localSpins
  
  const [inputNumber, setInputNumber] = useState('')
  const [actionView, setActionView] = useState('table-view')
  const [betMode, setBetMode] = useState<'table' | 'wheel' | 'custom'>('table')
  const [showHeatMap, setShowHeatMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('table-view')
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantSubTab, setAssistantSubTab] = useState<AssistantSubTab>('setup')
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  
  // Financial tracking
  const [startingBankroll, setStartingBankroll] = useState(100)
  const [currentBankroll, setCurrentBankroll] = useState(100)
  const [sessionPnL, setSessionPnL] = useState(0)
  
  const [playerSetup, setPlayerSetup] = useState<PlayerSetup>({
    bankroll: 100,
    targetProfit: 50,
    stopLoss: 50,
    timeAvailable: 60,
    betUnit: 5,  
    progressionStyle: 'flat',
    playerLevel: 'intermediate'
  })

  const playerContext = React.useMemo(() => ({ unitSize: playerSetup.betUnit }), [playerSetup.betUnit])

  const [manualBets, setManualBets] = useState<Record<string, string>>({
    red: '', black: '',
    even: '', odd: '',
    low: '', high: '',
    alt1_1: '', alt1_2: '',
    alt2_1: '', alt2_2: '',
    alt3_1: '', alt3_2: '',
    edge: '', center: '',
    dozen1: '', dozen2: '', dozen3: '',
    col1: '', col2: '', col3: '',
    six1: '', six2: '', six3: '',
    six4: '', six5: '', six6: ''
  })
  
  const [betHistory, setBetHistory] = useState<Array<{
    spin: number | null
    bets: any
    results: { [key: string]: number }
    totalPnL: number
    timestamp: Date
  }>>([])

  // Historical bets for HistoryTable - keyed by spin timestamp
  const [historicalBets, setHistoricalBets] = useState<Record<string, any>>({})

  // Pending bets state - tracks which bets are waiting for a number
  const [pendingBets, setPendingBets] = useState<Record<string, boolean>>({})

  // Bet results state - tracks win/loss AND amount temporarily for visual feedback
  const [betResults, setBetResults] = useState<Record<string, { status: 'win' | 'loss', amount: string } | null>>({})

  // Session management modals
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)
  const [showRestartSessionModal, setShowRestartSessionModal] = useState(false)
  const [showSaveSessionModal, setShowSaveSessionModal] = useState(false)
  const [showViewSessionsModal, setShowViewSessionsModal] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessionDescription, setSessionDescription] = useState('')
  const [savedSessions, setSavedSessions] = useState<any[]>([])
  const [savingSession, setSavingSession] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Check user authentication on mount
  useEffect(() => {
    checkUserAuth()
  }, [])

  const checkUserAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserProfile({
        id: user.id,
        email: user.email,
        isPremium: false, // Would check subscription status in real app
        displayName: user.email?.split('@')[0]
      })
      setStorageMode('cloud')
    } else {
      setStorageMode('local')
    }
  }

  // Function to open Assistant for session setup
const openSessionSetup = () => {
  console.log('Opening session setup...') // Debug log
  setShowAssistant(true)
  setAssistantSubTab('setup')
}

  // Function to actually create and start a new session
  const createNewSession = async () => {
    if (storageMode === 'cloud' && userProfile.id) {
      // Cloud mode - create in Supabase
      await resetCloudSession()
    } else {
      // Local mode - create local session
      const newSession: Session = {
        id: `local-${Date.now()}`,
        is_active: true,
        balance: playerSetup.bankroll,
        starting_balance: playerSetup.bankroll,
        total_profit_loss: 0,
        total_spins: 0,
        total_bets: 0,
        winning_bets: 0,
        losing_bets: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setLocalSession(newSession)
      setLocalSpins([])
      setBetHistory([])
      setHistoricalBets({})

      // Clear and reset localStorage
      localStorage.setItem('currentSession', JSON.stringify(newSession))
      localStorage.setItem('currentSpins', JSON.stringify([]))
    }
    
    // Set financial tracking with user's configured values
    setStartingBankroll(playerSetup.bankroll)
    setCurrentBankroll(playerSetup.bankroll)
    setSessionPnL(0)
    setSessionStartTime(new Date())
    
    // Move to action tab after session creation
    setAssistantSubTab('action')
  }
  const calculateHitCounts = (spins: Spin[], window: number) => {
    const counts: Record<number, number> = {}
    spins.slice(0, window).forEach(spin => {
      counts[spin.number] = (counts[spin.number] || 0) + 1
    })
    return counts
  }
  
  const addNumber = async (directNumber?: number) => {
    const num = directNumber !== undefined ? directNumber : parseInt(inputNumber)
    if (isNaN(num) || num < 0 || num > 36) return

    console.log('=== ADD NUMBER CALLED ===')
    console.log('Number:', num)
    console.log('Current manualBets:', manualBets)
    console.log('Has pending bets:', Object.values(manualBets).some(val => val !== ''))

    setLoading(true)

    // Add to appropriate storage
    if (storageMode === 'cloud' && session) {
      await addCloudSpin(num)
    } else {
      // Local storage
      const properties = getNumberProperties(num)
      const spinId = `local-spin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newSpin: Spin = {
        id: spinId,
        ...properties,
        session_id: localSession?.id || '',
        spin_number: localSpins.length + 1,
        created_at: new Date().toISOString()
      }
      const updatedSpins = [newSpin, ...localSpins]
      setLocalSpins(updatedSpins)
      
      // Update local session
      if (localSession) {
        const updatedSession = {
          ...localSession,
          total_spins: localSession.total_spins + 1,
          updated_at: new Date().toISOString()
        }
        setLocalSession(updatedSession)
        localStorage.setItem('currentSession', JSON.stringify(updatedSession))
        localStorage.setItem('currentSpins', JSON.stringify(updatedSpins))
      }
    }
    if (gameState.cardsModeOn) {
    gameState.addSpin(num)  // <-- Add this line
  }

    // Check if there are any pending bets
    const hasPendingBets = Object.values(manualBets).some(val => val !== '')

    if (hasPendingBets) {
      // Calculate results for each bet
      const results: { [key: string]: number } = {}
      const resultStates: { [key: string]: { status: 'win' | 'loss', amount: string } | null } = {}
      let totalPnL = 0
      let totalWagered = 0

      Object.entries(manualBets).forEach(([key, value]) => {
        if (value) {
          const betAmount = parseFloat(value as string)
          totalWagered += betAmount
          const won = checkIfGroupWon(num, key as GroupKey)
          if (won) {
            const payout = getGroupPayout(key as GroupKey)
            results[key] = betAmount * payout
            resultStates[key] = { status: 'win', amount: value }
            totalPnL += betAmount * payout
          } else {
            results[key] = -betAmount
            resultStates[key] = { status: 'loss', amount: value }
            totalPnL -= betAmount
          }
        }
      })

      // Show results on buttons (green/red) - now includes amount
      setBetResults(resultStates)

      // Update financial tracking IMMEDIATELY
      setSessionPnL(prev => {
        const newPnL = prev + totalPnL
        console.log('Updated session P/L:', prev, '+', totalPnL, '=', newPnL)
        return newPnL
      })
      setCurrentBankroll(prev => {
        const newBankroll = prev + totalPnL
        console.log('Updated bankroll:', prev, '+', totalPnL, '=', newBankroll)
        return newBankroll
      })

      // Add to bet history IMMEDIATELY so it shows in the matrix
      setBetHistory(prev => [{
        spin: num,
        bets: { ...manualBets },
        results,
        totalPnL,
        timestamp: new Date()
      }, ...prev])

      console.log('Added to bet history:', { spin: num, totalPnL, totalWagered, results })

      // Wait 1.5 seconds before clearing the bets
      setTimeout(() => {
        // Clear bets, pending state, and results
        setManualBets({
          red: '', black: '', even: '', odd: '', low: '', high: '',
          alt1_1: '', alt1_2: '', alt2_1: '', alt2_2: '', alt3_1: '', alt3_2: '',
          edge: '', center: '', dozen1: '', dozen2: '', dozen3: '',
          col1: '', col2: '', col3: '', six1: '', six2: '', six3: '',
          six4: '', six5: '', six6: ''
        })
        setPendingBets({})
        setBetResults({})
      }, 1500)
    }

    setInputNumber('')
    setSelectedNumber(null)
    setLoading(false)
  }

  // Undo last spin
  const undoLastSpin = () => {
    if (spins.length === 0) return

    const lastSpin = spins[0]
    console.log('Undoing last spin:', lastSpin.number)

    if (storageMode === 'cloud' && session) {
      // For cloud mode, would need API endpoint to delete
      alert('Undo not available for cloud sessions yet')
    } else {
      // Local mode - remove last spin
      const updatedSpins = localSpins.slice(1)
      setLocalSpins(updatedSpins)

      // Update local session
      if (localSession) {
        const updatedSession = {
          ...localSession,
          total_spins: Math.max(0, localSession.total_spins - 1),
          updated_at: new Date().toISOString()
        }
        setLocalSession(updatedSession)
        localStorage.setItem('currentSession', JSON.stringify(updatedSession))
        localStorage.setItem('currentSpins', JSON.stringify(updatedSpins))
      }
    }

    // Also remove from gameState if cards mode is on
    if (gameState.cardsModeOn && gameState.spinHistory.length > 0) {
      // Remove last spin from gameState
      const updatedGameSpins = gameState.spinHistory.slice(1)
      // Note: There's no removeLastSpin in gameState, so this is a limitation
      // We'd need to add that method to the gameState store
    }
  }

  const calculateGroupStats = () => {
    if (spins.length === 0) return null
    
    const matchesGroup = (spin: Spin, group: string): boolean => {
      const num = spin.number

      switch(group) {
        case 'red': return spin.color === 'red'
        case 'black': return spin.color === 'black'
        case 'green': return spin.color === 'green'
        case 'even': return spin.even_odd === 'even'
        case 'odd': return spin.even_odd === 'odd'
        case 'low': return spin.low_high === 'low'
        case 'high': return spin.low_high === 'high'
        case '1st_dozen': return spin.dozen === 'first'
        case '2nd_dozen': return spin.dozen === 'second'
        case '3rd_dozen': return spin.dozen === 'third'
        case '1st_column': return spin.column_num === 1
        case '2nd_column': return spin.column_num === 2
        case '3rd_column': return spin.column_num === 3
        case 'alt1_1': return num > 0 && [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num)
        case 'alt1_2': return num > 0 && [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num)
        case 'alt2_1': return num > 0 && [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num)
        case 'alt2_2': return num > 0 && [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num)
        case 'alt3_1': return num > 0 && [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num)
        case 'alt3_2': return num > 0 && [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num)
        case 'edge': return num > 0 && [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num)
        case 'center': return num > 0 && [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num)
        default: return false
      }
    }
    
    const groups = [
      { id: 'red', name: 'Red', color: 'text-red-400' },
      { id: 'black', name: 'Black', color: 'text-gray-300' },
      { id: 'green', name: 'Green', color: 'text-green-400' },
      { id: 'even', name: 'Even', color: 'text-purple-400' },
      { id: 'odd', name: 'Odd', color: 'text-cyan-400' },
      { id: 'low', name: '1-18', color: 'text-amber-400' },
      { id: 'high', name: '19-36', color: 'text-gray-300' },
      { id: '1st_dozen', name: '1st Doz', color: 'text-red-500' },
      { id: '2nd_dozen', name: '2nd Doz', color: 'text-cyan-500' },
      { id: '3rd_dozen', name: '3rd Doz', color: 'text-green-500' },
      { id: '1st_column', name: '1st Col', color: 'text-orange-400' },
      { id: '2nd_column', name: '2nd Col', color: 'text-teal-400' },
      { id: '3rd_column', name: '3rd Col', color: 'text-lime-400' },
      { id: 'alt1_1', name: 'A', color: 'text-pink-400' },
      { id: 'alt1_2', name: 'B', color: 'text-indigo-400' },
      { id: 'alt2_1', name: 'AA', color: 'text-violet-400' },
      { id: 'alt2_2', name: 'BB', color: 'text-fuchsia-400' },
      { id: 'alt3_1', name: 'AAA', color: 'text-rose-400' },
      { id: 'alt3_2', name: 'BBB', color: 'text-sky-400' },
      { id: 'edge', name: 'Edge', color: 'text-emerald-400' },
      { id: 'center', name: 'Center', color: 'text-blue-400' }
    ]
    
    return groups.map(group => {
      // Calculate hits for different windows
      const l9 = spins.slice(0, Math.min(9, spins.length)).filter(spin => matchesGroup(spin, group.id)).length
      const l18 = spins.slice(0, Math.min(18, spins.length)).filter(spin => matchesGroup(spin, group.id)).length
      const l27 = spins.slice(0, Math.min(27, spins.length)).filter(spin => matchesGroup(spin, group.id)).length
      const l36 = spins.slice(0, Math.min(36, spins.length)).filter(spin => matchesGroup(spin, group.id)).length

      const hits = spins.filter(spin => matchesGroup(spin, group.id)).length
      const percentage = (hits / spins.length) * 100
      const expected = expectedPercentageFor(group.id)

      // Calculate absence (spins since last hit)
      let absenceNow = 0
      let absenceMax = 0
      let currentAbsence = 0

      for (let i = 0; i < spins.length; i++) {
        if (matchesGroup(spins[i], group.id)) {
          if (i === 0) absenceNow = 0 // Just hit
          currentAbsence = 0
        } else {
          currentAbsence++
          if (i === 0) absenceNow = currentAbsence
          absenceMax = Math.max(absenceMax, currentAbsence)
        }
      }
      if (absenceNow === 0 && spins.length > 0 && !matchesGroup(spins[0], group.id)) {
        // Find how many spins since last hit
        for (let i = 0; i < spins.length; i++) {
          if (matchesGroup(spins[i], group.id)) break
          absenceNow++
        }
      }

      // Calculate consecutive hits
      let consecutiveNow = 0
      let consecutiveMax = 0
      let currentConsecutive = 0

      for (let i = spins.length - 1; i >= 0; i--) {
        if (matchesGroup(spins[i], group.id)) {
          currentConsecutive++
          consecutiveMax = Math.max(consecutiveMax, currentConsecutive)
          if (i === 0) consecutiveNow = currentConsecutive
        } else {
          if (i === 0 && currentConsecutive > 0) consecutiveNow = currentConsecutive
          currentConsecutive = 0
        }
      }

      // Find last spin where this group hit
      let lastSpin = 0
      for (let i = 0; i < spins.length; i++) {
        if (matchesGroup(spins[i], group.id)) {
          lastSpin = i
          break
        }
      }

      // Calculate status
      const deviation = percentage - expected
      let status: 'HOT' | 'COLD' | 'ALERT' | 'NORM' = 'NORM'
      if (absenceNow > 10) status = 'ALERT'
      else if (deviation > 10) status = 'HOT'
      else if (deviation < -10) status = 'COLD'

      return {
        ...group,
        l9,
        l18,
        l27,
        l36,
        absenceNow,
        absenceMax,
        consecutiveNow,
        consecutiveMax,
        lastSpin,
        percentage,
        expected,
        deviation,
        status
      }
    })
  }

  const groupStats = calculateGroupStats()

  // Handle bet results from HistoryTable
  const handleBetPlaced = (
    totalWagered: number,
    totalReturned: number,
    pnl: number,
    bettingMatrix?: Record<string, number>,
    groupResults?: Record<string, number>,
    spinNumber?: number,
    spinTimestamp?: number
  ) => {
    console.log('Bet placed callback:', { totalWagered, totalReturned, pnl, spinNumber })

    // Update financial tracking
    setSessionPnL(prev => prev + pnl)
    setCurrentBankroll(prev => prev + pnl)

    // Update bet history for the old system (if still needed)
    if (spinNumber !== null && spinNumber !== undefined) {
      setBetHistory(prev => [{
        spin: spinNumber,
        bets: bettingMatrix || {},
        results: groupResults || {},
        totalPnL: pnl,
        timestamp: spinTimestamp ? new Date(spinTimestamp) : new Date()
      }, ...prev])
    }
  }

  // CSV Download function
  const downloadSessionCSV = () => {
    if (!session) return;

    // Prepare CSV data with comprehensive session info
    const csvRows = [];

    // Session metadata header
    csvRows.push('SESSION INFORMATION');
    csvRows.push(`Session ID,${session.id}`);
    csvRows.push(`Created,${new Date(session.created_at).toLocaleString()}`);
    csvRows.push(`Total Spins,${session.total_spins}`);
    csvRows.push(`Starting Bankroll,${playerSetup.bankroll}`);
    csvRows.push(`Current Bankroll,${currentBankroll.toFixed(2)}`);
    csvRows.push(`P/L,${sessionPnL.toFixed(2)}`);
    csvRows.push(`ROI,${startingBankroll > 0 ? ((sessionPnL / startingBankroll) * 100).toFixed(1) : 0}%`);
    csvRows.push('');

    // Spins data
    csvRows.push('SPIN HISTORY');
    csvRows.push('Spin #,Number,Color,Even/Odd,Low/High,Dozen,Column,Timestamp');

    spins.forEach((spin, index) => {
      const row = [
        spins.length - index,
        spin.number,
        spin.color,
        spin.even_odd || 'N/A',
        spin.low_high || 'N/A',
        spin.dozen || 'N/A',
        spin.column_num || 'N/A',
        new Date(spin.created_at).toLocaleString()
      ];
      csvRows.push(row.join(','));
    });

    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roulette-session-${session.id.slice(0,12)}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // End Session - Archive and reset to setup
  const handleEndSession = async () => {
    if (!session) return;

    // Archive session data to localStorage
    const archivedSessions = JSON.parse(localStorage.getItem('archivedSessions') || '[]');
    const sessionArchive = {
      session,
      spins: storageMode === 'local' ? localSpins : cloudSpins,
      betHistory,
      finalBankroll: currentBankroll,
      finalPnL: sessionPnL,
      startingBankroll,
      playerSetup,
      archivedAt: new Date().toISOString()
    };
    archivedSessions.push(sessionArchive);
    localStorage.setItem('archivedSessions', JSON.stringify(archivedSessions));

    // If in cloud mode, reset cloud session first
    if (storageMode === 'cloud') {
      await resetCloudSession();
    }

    // Clear local session data
    setLocalSession(null);
    setLocalSpins([]);
    setBetHistory([]);
    setHistoricalBets({});
    setCurrentBankroll(playerSetup.bankroll);
    setSessionPnL(0);
    setSessionStartTime(null);
    setManualBets({
      red: '', black: '', even: '', odd: '', low: '', high: '',
      alt1_1: '', alt1_2: '', alt2_1: '', alt2_2: '', alt3_1: '', alt3_2: '',
      edge: '', center: '', dozen1: '', dozen2: '', dozen3: '',
      col1: '', col2: '', col3: '', six1: '', six2: '', six3: '',
      six4: '', six5: '', six6: ''
    });

    // Clear from localStorage
    localStorage.removeItem('currentSession');
    localStorage.removeItem('currentSpins');

    // Close modal
    setShowEndSessionModal(false);

    // Force page reload to ensure clean state
    window.location.reload();
  };

  // Restart Session - Fresh start without archiving
  const handleRestartSession = async () => {
    if (!session) return;

    // If in cloud mode, reset cloud session first
    if (storageMode === 'cloud') {
      await resetCloudSession();
    }

    // Clear all session data without archiving
    setLocalSession(null);
    setLocalSpins([]);
    setBetHistory([]);
    setHistoricalBets({});
    setCurrentBankroll(playerSetup.bankroll);
    setSessionPnL(0);
    setSessionStartTime(null);
    setManualBets({
      red: '', black: '', even: '', odd: '', low: '', high: '',
      alt1_1: '', alt1_2: '', alt2_1: '', alt2_2: '', alt3_1: '', alt3_2: '',
      edge: '', center: '', dozen1: '', dozen2: '', dozen3: '',
      col1: '', col2: '', col3: '', six1: '', six2: '', six3: '',
      six4: '', six5: '', six6: ''
    });

    // Clear from localStorage
    localStorage.removeItem('currentSession');
    localStorage.removeItem('currentSpins');

    // Close modal
    setShowRestartSessionModal(false);

    // Force page reload to ensure clean state
    window.location.reload();
  };

  // Save Session - Save current session to Supabase
  const handleSaveSession = async () => {
    if (!session || !userProfile.id) return;

    setSavingSession(true);
    setSaveError('');

    try {
      // Auto-generate session name if empty
      const finalSessionName = sessionName.trim() || `Session - ${new Date().toLocaleDateString()}`;

      // Calculate session duration
      const durationMinutes = sessionStartTime
        ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)
        : 0;

      // Prepare session data
      const sessionData = {
        user_id: userProfile.id,
        session_name: finalSessionName,
        session_description: sessionDescription.trim() || null,
        original_session_id: session.id,
        session_data: {
          balance: currentBankroll,
          starting_balance: startingBankroll,
          total_profit_loss: sessionPnL,
          total_spins: session.total_spins,
          total_bets: session.total_bets,
          winning_bets: session.winning_bets,
          losing_bets: session.losing_bets,
          created_at: session.created_at,
          updated_at: session.updated_at
        },
        spins_data: storageMode === 'local' ? localSpins : cloudSpins,
        player_setup: playerSetup,
        bet_history: betHistory,
        final_bankroll: currentBankroll,
        final_pnl: sessionPnL,
        total_spins_count: session.total_spins,
        session_duration_minutes: durationMinutes
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('saved_tracker_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        // Check if it's the session limit error
        if (error.message.includes('Session limit reached')) {
          setSaveError('You\'ve reached the maximum of 10 saved sessions. Delete an old session or upgrade to Premium for 50 sessions.');
        } else {
          setSaveError(error.message);
        }
        setSavingSession(false);
        return;
      }

      // Success!
      setSessionName('');
      setSessionDescription('');
      setShowSaveSessionModal(false);
      setSavingSession(false);

      // Show success message (you could add a toast notification here)
      alert(`Session "${finalSessionName}" saved successfully!`);

    } catch (error: any) {
      setSaveError(error.message || 'Failed to save session');
      setSavingSession(false);
    }
  };

  // Load Saved Sessions - Fetch from Supabase
  const loadSavedSessions = async () => {
    if (!userProfile.id) return;

    try {
      const { data, error } = await supabase
        .from('saved_tracker_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      setSavedSessions(data || []);
    } catch (error: any) {
      console.error('Failed to load saved sessions:', error);
    }
  };

  // Load Session - Restore a saved session
  const handleLoadSession = async (savedSession: any) => {
    if (!confirm(`Load session "${savedSession.session_name}"? This will replace your current session.`)) {
      return;
    }

    try {
      // Restore session data
      const sessionData = savedSession.session_data;
      const newSession: Session = {
        id: `local-${Date.now()}`,
        is_active: true,
        balance: sessionData.balance,
        starting_balance: sessionData.starting_balance,
        total_profit_loss: sessionData.total_profit_loss,
        total_spins: sessionData.total_spins,
        total_bets: sessionData.total_bets,
        winning_bets: sessionData.winning_bets,
        losing_bets: sessionData.losing_bets,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Restore all state
      setLocalSession(newSession);
      setLocalSpins(savedSession.spins_data || []);
      setBetHistory(savedSession.bet_history || []);
      setPlayerSetup(savedSession.player_setup || playerSetup);
      setStartingBankroll(savedSession.session_data.starting_balance);
      setCurrentBankroll(savedSession.session_data.balance);
      setSessionPnL(savedSession.session_data.total_profit_loss);

      // Update last_loaded_at timestamp
      await supabase
        .from('saved_tracker_sessions')
        .update({ last_loaded_at: new Date().toISOString() })
        .eq('id', savedSession.id);

      // Close modal
      setShowViewSessionsModal(false);

      alert(`Session "${savedSession.session_name}" loaded successfully!`);
    } catch (error: any) {
      console.error('Failed to load session:', error);
      alert('Failed to load session: ' + error.message);
    }
  };

  // Delete Session
  const handleDeleteSession = async (savedSession: any) => {
    if (!confirm(`Delete session "${savedSession.session_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_tracker_sessions')
        .delete()
        .eq('id', savedSession.id)
        .eq('user_id', userProfile.id);

      if (error) throw error;

      // Refresh the list
      await loadSavedSessions();

      alert(`Session "${savedSession.session_name}" deleted successfully!`);
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session: ' + error.message);
    }
  };

  // Load saved sessions when View Saved Sessions modal opens
  useEffect(() => {
    if (showViewSessionsModal) {
      loadSavedSessions();
    }
  }, [showViewSessionsModal]);

  // Show access gate if no access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent blur-3xl"></div>
              <h1 className="relative text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                  ROULETTE TRACKER
                </span>
              </h1>
            </div>
            <p className="text-yellow-400/60 text-sm tracking-widest">PROFESSIONAL EDITION</p>
          </div>

          {/* Access Card */}
          <div className="bg-gray-800 border-2 border-yellow-400/30 rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-400/50 rounded-full mb-4">
                <span className="text-2xl">🔒</span>
                <span className="text-orange-300 font-bold text-sm">BETA ACCESS REQUIRED</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome, Beta Tester!</h2>
              <p className="text-gray-400 text-sm">
                Enter your access code to unlock the app
              </p>
            </div>

            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter code from email"
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none text-center font-mono text-lg tracking-wider"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Unlock Beta Access
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Don't have a code?{' '}
                <a
                  href="mailto:youremail@example.com?subject=Beta Access Request"
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Request access
                </a>
              </p>
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Early Access Program • Limited Spots Available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white">
      <div className="max-w-[1920px] mx-auto p-4">
        {/* Casino-style Title */}
        <div className="text-center mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent blur-3xl"></div>
          <h1 className="relative text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              ROULETTE TRACKER
            </span>
          </h1>
          <p className="text-yellow-400/60 mt-2 text-sm tracking-widest">PROFESSIONAL EDITION</p>
        </div>

        {/* EARLY ACCESS BANNER */}
        <div className="bg-gradient-to-r from-orange-900/40 via-orange-800/40 to-orange-900/40 border-2 border-orange-400/50 rounded-lg p-4 mb-4 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-bold text-orange-300">EARLY ACCESS PROGRAM</h3>
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">FREE BETA</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                You're testing an early version of Roulette Tracker Pro. Your feedback shapes the future of this tool!
              </p>

              {/* Mobile Warning */}
              <div className="md:hidden bg-yellow-900/30 border border-yellow-400/40 rounded p-2 mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 text-lg">📱</span>
                  <div>
                    <p className="text-xs font-semibold text-yellow-300 mb-1">Mobile Notice</p>
                    <p className="text-xs text-gray-300">
                      Best experience on desktop/tablet. Assistant & Analysis features not yet optimized for mobile.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">✓ All features unlocked</span>
                <span>•</span>
                <span className="flex items-center gap-1">✓ Free during beta</span>
                <span>•</span>
                <span className="flex items-center gap-1">⚠️ Occasional bugs expected</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open('https://forms.gle/tb2ZhKLSABER4UAd6', '_blank')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
              >
                💬 Share Feedback
              </button>
              <button
                onClick={() => window.open('https://forms.gle/mZPFtZWAfEcGSs2J9', '_blank')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
              >
                🐛 Report Bug
              </button>
            </div>
          </div>
        </div>

        {/* OPTIMIZED: Combined Session + Financial Bar - Only show when session exists */}
{session && (
  <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-yellow-400/30 rounded-lg p-3 mb-4">
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
      {/* LEFT: Session Info */}
      <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto w-full lg:w-auto">
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">Session</span>
          <p className="text-sm font-bold text-yellow-400">{session.id.slice(0, 12)}...</p>
        </div>
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">Spins</span>
          <p className="text-lg font-bold text-white">{session.total_spins}</p>
        </div>
        <div className="h-8 w-px bg-yellow-400/30"></div>
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">Bankroll</span>
          <p className="text-lg font-bold text-white">${currentBankroll.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">P/L</span>
          <p className={`text-lg font-bold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">ROI</span>
          <p className={`text-sm font-semibold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {startingBankroll > 0 ? ((sessionPnL / startingBankroll) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="h-8 w-px bg-yellow-400/30"></div>
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">Target</span>
          <p className="text-sm text-green-400">${playerSetup.targetProfit}</p>
        </div>
        <div>
          <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">Stop Loss</span>
          <p className="text-sm text-red-400">-${playerSetup.stopLoss}</p>
        </div>
        {sessionStartTime && (
          <div>
            <span className="text-yellow-400/60 text-[10px] uppercase tracking-wider">Time</span>
            <p className="text-sm text-white">
              {Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000)}m
            </p>
          </div>
        )}
      </div>

      {/* RIGHT: Session Management Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
        <button
          onClick={() => setShowViewSessionsModal(true)}
          className="px-2 sm:px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="View saved sessions"
        >
          📁 Saved
        </button>
        <button
          onClick={() => setShowSaveSessionModal(true)}
          className="px-2 sm:px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="Save current session to cloud"
        >
          💾 Save
        </button>
        <button
          onClick={() => setShowRestartSessionModal(true)}
          className="px-2 sm:px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="Start fresh - clears all data"
        >
          🔄 Restart
        </button>
        <button
          onClick={() => setShowEndSessionModal(true)}
          className="px-2 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
          title="Archive session and return to setup"
        >
          🏁 End
        </button>
        <button
          onClick={downloadSessionCSV}
          className="px-2 sm:px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
          title="Download session data as CSV"
        >
          📊 Export CSV
        </button>
      </div>
    </div>
  </div>
)}

        {/* Last 20 Spins Bar - Only show when session exists */}
{session && assistantSubTab === 'action' && (
  <Card className="mb-4 p-3 bg-gray-900 border-gray-700">
    <div className="flex items-center gap-2">
      <span className="text-yellow-400 font-bold text-sm">Last 20:</span>
      <div className="flex gap-1">
        {spins.slice(0, 20).map((spin, idx) => (
          <div
            key={idx}
            className={`
              w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${idx === 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
              ${spin.number === 0 ? 'bg-green-600' :
                [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(spin.number)
                  ? 'bg-red-600' : 'bg-black border border-gray-600'}
              text-white cursor-pointer hover:scale-110 transition-all
            `}
            onClick={() => addNumber(spin.number)}
          >
            {spin.number}
          </div>
        ))}
      </div>
    </div>
  </Card>
)}
{/* Main Content Area */}
{!session && !showAssistant ? (
          // Landing Page - Professional Edition Showcase
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Section with Wheel Background */}
            <div className="text-center mb-12 relative">
              {/* Decorative wheel/chips background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="text-9xl">🎰🎲🎯💰🃏</div>
              </div>

              <div className="relative z-10">
                <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4">
                  PROFESSIONAL TRACKER
                </h1>
                <p className="text-xl text-gray-300 mb-6">
                  Track all 47 betting groups with real-time analytics
                </p>
                <button
                  onClick={() => {
                    console.log('Center button clicked - opening session setup')
                    setShowAssistant(true)
                    setAssistantSubTab('setup')
                  }}
                  className="px-12 py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-xl text-2xl shadow-2xl hover:shadow-yellow-400/50 transition-all transform hover:scale-105 mb-4"
                >
                  ✨ Start New Session
                </button>
                {storageMode === 'local' && (
                  <p className="text-sm text-yellow-400/60">
                    <a href="#" className="underline">Sign in</a> to save and download sessions
                  </p>
                )}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-black/40 backdrop-blur border-blue-400/30 p-6 hover:border-blue-400/60 transition-all">
                <div className="text-5xl text-center mb-4">📊</div>
                <h3 className="text-xl font-bold text-blue-400 text-center mb-3">47 Betting Groups</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>✓ Track numbers & bets</li>
                  <li>✓ Common bets</li>
                  <li>✓ Special bets</li>
                  <li>✓ Wheel sectors (voisins, orphelins, tiers)</li>
                  <li>✓ Alternative groupings</li>
                  <li>✓ All 37 individual numbers</li>
                </ul>
              </Card>

              <Card className="bg-black/40 backdrop-blur border-yellow-400/30 p-6 hover:border-yellow-400/60 transition-all">
                <div className="text-5xl text-center mb-4">🎯</div>
                <h3 className="text-xl font-bold text-yellow-400 text-center mb-3">Advanced Analytics</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>✓ 6 time windows (9-288 spins)</li>
                  <li>✓ Hot/Cold/Norm status</li>
                  <li>✓ Streak & absence tracking</li>
                  <li>✓ Anomaly detection</li>
                  <li>✓ Pattern recognition</li>
                </ul>
              </Card>

              <Card className="bg-black/40 backdrop-blur border-teal-400/30 p-6 hover:border-teal-400/60 transition-all">
                <div className="text-5xl text-center mb-4">💾</div>
                <h3 className="text-xl font-bold text-teal-400 text-center mb-3">Session Management</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>✓ Unlimited spins tracking</li>
                  <li>✓ Export to CSV/JSON</li>
                  <li>✓ Cloud sync (with login)</li>
                  <li>✓ Session history</li>
                  <li>✓ Real-time updates</li>
                </ul>
              </Card>
            </div>

            {/* Tier Comparison - Focused on Pro */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-center text-yellow-400 mb-8">Compare Editions</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* BASIC TIER */}
                <div className="bg-black/40 backdrop-blur rounded-xl border border-gray-700 p-6 opacity-75">
                  <div className="text-4xl mb-3 text-center">🎲</div>
                  <h3 className="text-2xl font-bold text-white text-center mb-2">Basic</h3>
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-gray-400">FREE</span>
                    <p className="text-xs text-gray-400 mt-1">20 spins/session</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-400">12 common betting groups</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-600 mt-0.5">✗</span>
                      <span className="text-gray-500">No wheel sectors</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-600 mt-0.5">✗</span>
                      <span className="text-gray-500">No data export</span>
                    </div>
                  </div>
                </div>

                {/* PRO TIER - HIGHLIGHTED */}
                <div className="bg-black/40 backdrop-blur rounded-xl border-2 border-blue-500/70 p-6 hover:border-blue-400 transition-all relative overflow-hidden scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-700/10"></div>

                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    YOU ARE HERE
                  </div>

                  <div className="relative z-10">
                    <div className="text-4xl mb-3 text-center">📊</div>
                    <h3 className="text-2xl font-bold text-blue-400 text-center mb-2">Pro</h3>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-blue-400">$9.99</span>
                      <span className="text-gray-400">/month</span>
                      <p className="text-xs text-gray-400 mt-1">Full analytics</p>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-gray-200 font-semibold">Everything in Basic, plus:</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-gray-400">47 betting groups</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-gray-400">Wheel sector analysis</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-gray-400">Data export (CSV/JSON)</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-gray-400">Unlimited spins</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ELITE TIER */}
                <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 hover:border-yellow-400/60 transition-all relative overflow-hidden">
                  <div className="text-4xl mb-3 text-center">🎯</div>
                  <h3 className="text-2xl font-bold text-yellow-400 text-center mb-2">Elite</h3>
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-yellow-400">$19.99</span>
                    <span className="text-gray-400">/month</span>
                    <p className="text-xs text-gray-400 mt-1">Betting assistant</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-yellow-300 font-semibold">Everything in Pro, plus:</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-400">Betting card system</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-400">6 betting systems</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-400">Matrix betting</span>
                    </div>
                  </div>

                  <a
                    href="/assistant"
                    className="block w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg text-center transition-all hover:shadow-lg hover:shadow-yellow-400/50"
                  >
                    Upgrade to Elite →
                  </a>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <button
                onClick={() => {
                  setShowAssistant(true)
                  setAssistantSubTab('setup')
                }}
                className="px-12 py-5 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-xl text-xl shadow-2xl hover:shadow-blue-400/50 transition-all transform hover:scale-105"
              >
                🚀 Start Tracking Now
              </button>
              <p className="text-gray-400 text-sm mt-4">
                Professional Edition • Unlimited Spins • Full Analytics
              </p>
            </div>
          </div>
        ) : !session && showAssistant ? (
          // Setup Flow - Assistant is showing but no session yet
          <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/20">
            <div className="flex gap-0 border-b border-yellow-400/20">
              <button
                className="px-6 py-3 font-semibold transition-all bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400"
              >
                Session Setup
              </button>
            </div>

            <div className="p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
                  Configure Your Session
                </h2>

                {/* Setup Help Panel */}
                <div className="border border-yellow-400/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleHelp('setup')}
                    className="w-full px-4 py-3 bg-yellow-900/20 hover:bg-yellow-900/30 transition-colors flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      Setup Help - Understanding Configuration
                    </span>
                    <span className="text-yellow-400 text-xl">{showHelp.setup ? '−' : '+'}</span>
                  </button>
                  {showHelp.setup && (
                    <div className="bg-yellow-950/30 border-t border-yellow-400/30 p-4 text-sm text-gray-300 space-y-4">
                      <p className="font-semibold text-yellow-300 text-base">Understanding Session Configuration</p>

                      <div className="space-y-3">
                        <div className="bg-black/30 rounded-lg p-3 border-l-2 border-blue-400">
                          <p className="mb-2"><span className="text-yellow-400 font-semibold">💰 Starting Bankroll</span></p>
                          <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> The total amount you're starting with for this session.</p>
                          <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> This number is tracked in real-time throughout your session. Your current bankroll will update with every spin result, showing you exactly how much you have available to bet. The tracker will alert you when you're approaching your stop loss limit.</p>
                        </div>

                        <div className="bg-black/30 rounded-lg p-3 border-l-2 border-green-400">
                          <p className="mb-2"><span className="text-yellow-400 font-semibold">🎯 Target Profit</span></p>
                          <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> Your profit goal for this session.</p>
                          <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> The tracker displays your progress toward this target with a visual progress bar. When you reach your target profit, you'll get a celebration notification suggesting you lock in your gains and end the session. Discipline is key - many players give back winnings by continuing past their target.</p>
                        </div>

                        <div className="bg-black/30 rounded-lg p-3 border-l-2 border-red-400">
                          <p className="mb-2"><span className="text-yellow-400 font-semibold">🛑 Stop Loss</span></p>
                          <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> Maximum loss you're willing to accept before ending the session.</p>
                          <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> This is your safety net. If your bankroll drops to this level (Bankroll - Stop Loss), the tracker will show strong warning indicators. This protects you from chasing losses. Stick to this limit - it's the foundation of responsible bankroll management.</p>
                        </div>

                        <div className="bg-black/30 rounded-lg p-3 border-l-2 border-purple-400">
                          <p className="mb-2"><span className="text-yellow-400 font-semibold">🎲 Unit Size</span></p>
                          <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> Your base bet amount - the building block for all bets.</p>
                          <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> All bet recommendations are calculated as multiples of this unit (1x, 2x, 3x, etc.). The tracker uses this to size your bets proportionally to your bankroll. During gameplay, you'll see suggestions like "Bet 2 units on Red" which means 2 × your unit size. Recommended: 1-2% of bankroll for conservative play.</p>
                        </div>
                      </div>

                      <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-400/30">
                        <p className="text-xs text-yellow-300 mb-2"><span className="font-bold">💡 Recommended Settings (Conservative):</span></p>
                        <ul className="text-xs text-gray-300 space-y-1 ml-4">
                          <li>• Target Profit: 20% of bankroll (e.g., $20 profit on $100 bankroll)</li>
                          <li>• Stop Loss: 40% of bankroll (e.g., stop at $60 remaining)</li>
                          <li>• Unit Size: 2% of bankroll (e.g., $2 units on $100 bankroll)</li>
                        </ul>
                      </div>

                      <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-400/30">
                        <p className="text-xs text-teal-300"><span className="font-bold">📊 During Gameplay:</span> The tracker monitors all 47 betting groups in real-time, showing hot/cold trends, streaks, and statistical anomalies. Your session stats update after every spin, helping you make informed decisions based on actual data, not gut feelings.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Starting Bankroll</label>
                    <input
                      type="number"
                      value={playerSetup.bankroll}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value)
                        setPlayerSetup({...playerSetup, bankroll: value})
                        setStartingBankroll(value)
                        setCurrentBankroll(value)
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Target Profit</label>
                    <input
                      type="number"
                      value={playerSetup.targetProfit}
                      onChange={(e) => setPlayerSetup({...playerSetup, targetProfit: e.target.value === '' ? 0 : Number(e.target.value)})}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Stop Loss</label>
                    <input
                      type="number"
                      value={playerSetup.stopLoss}
                      onChange={(e) => setPlayerSetup({...playerSetup, stopLoss: e.target.value === '' ? 0 : Number(e.target.value)})}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Unit Size</label>
                    <input
                      type="number"
                      value={playerSetup.betUnit}
                      onChange={(e) => setPlayerSetup({...playerSetup, betUnit: e.target.value === '' ? 0 : Number(e.target.value)})}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="5"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    console.log('Starting tracking session')
                    createNewSession()
                  }}
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg shadow-lg hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
                >
                  🎲 Start Tracking
                </button>
                
                <button
                  onClick={() => {
                    setShowAssistant(false)
                  }}
                  className="w-full py-2 text-gray-400 hover:text-white transition-all"
                >
                  ← Back to Landing
                </button>
              </div>
            </div>
          </div>
        ) : (
              <div>

                <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/20">
                  <div className="flex gap-0 border-b border-yellow-400/20 overflow-x-auto">
                    <button
                      onClick={() => setAssistantSubTab('setup')}
                      className={`px-4 sm:px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 whitespace-nowrap ${
                        assistantSubTab === 'setup'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        Setup
                        <span
                          onClick={(e) => { e.stopPropagation(); toggleHelp('setup'); }}
                          className="text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                          title="Show setup help"
                        >
                          ℹ️
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => setAssistantSubTab('action')}
                      className={`px-4 sm:px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 whitespace-nowrap ${
                        assistantSubTab === 'action'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!session}
                    >
                      <span className="flex items-center gap-2">
                        Game Action
                        <span
                          onClick={(e) => { if (session) { e.stopPropagation(); toggleHelp('action'); } }}
                          className={`text-xs opacity-60 hover:opacity-100 transition-opacity ${session ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          title="Show game action help"
                        >
                          ℹ️
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => setAssistantSubTab('analysis')}
                      className={`px-4 sm:px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 whitespace-nowrap ${
                        assistantSubTab === 'analysis'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!session}
                    >
                      <span className="flex items-center gap-2">
                        Analysis
                        <span
                          onClick={(e) => { if (session) { e.stopPropagation(); toggleHelp('analysis'); } }}
                          className={`text-xs opacity-60 hover:opacity-100 transition-opacity ${session ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          title="Show analysis help"
                        >
                          ℹ️
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => setAssistantSubTab('performance')}
                      className={`px-4 sm:px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 whitespace-nowrap ${
                        assistantSubTab === 'performance'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!session}
                    >
                      <span className="flex items-center gap-2">
                        Performance
                        <span
                          onClick={(e) => { if (session) { e.stopPropagation(); toggleHelp('performance'); } }}
                          className={`text-xs opacity-60 hover:opacity-100 transition-opacity ${session ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          title="Show performance help"
                        >
                          ℹ️
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        // Toggle all help sections when Help tab is clicked
                        const currentTab = assistantSubTab;
                        toggleHelp(currentTab);
                      }}
                      className="px-4 sm:px-6 py-3 font-semibold transition-all text-cyan-400 hover:text-cyan-300 flex items-center gap-2 whitespace-nowrap"
                      title="Show help for current tab"
                    >
                      <span className="text-lg">💡</span>
                      Help
                    </button>



                  </div>

                  <div className="p-6">
                    {assistantSubTab === 'setup' && (
                      <div className="max-w-2xl mx-auto space-y-6">
                        {/* Setup Help Panel */}
                        <div className="border border-yellow-400/30 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleHelp('setup')}
                            className="w-full px-4 py-3 bg-yellow-900/20 hover:bg-yellow-900/30 transition-colors flex items-center justify-between text-left"
                          >
                            <span className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                              <span className="text-lg">💡</span>
                              Setup Help
                            </span>
                            <span className="text-yellow-400 text-xl">{showHelp.setup ? '−' : '+'}</span>
                          </button>
                          {showHelp.setup && (
                            <div className="bg-yellow-950/30 border-t border-yellow-400/30 p-4 text-sm text-gray-300 space-y-4">
                              <p className="font-semibold text-yellow-300 text-base">Understanding Session Configuration</p>

                              <div className="space-y-3">
                                <div className="bg-black/30 rounded-lg p-3 border-l-2 border-blue-400">
                                  <p className="mb-2"><span className="text-yellow-400 font-semibold">💰 Starting Bankroll</span></p>
                                  <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> The total amount you're starting with for this session.</p>
                                  <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> This number is tracked in real-time throughout your session. Your current bankroll will update with every spin result, showing you exactly how much you have available to bet. The tracker will alert you when you're approaching your stop loss limit.</p>
                                </div>

                                <div className="bg-black/30 rounded-lg p-3 border-l-2 border-green-400">
                                  <p className="mb-2"><span className="text-yellow-400 font-semibold">🎯 Target Profit</span></p>
                                  <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> Your profit goal for this session.</p>
                                  <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> The tracker displays your progress toward this target with a visual progress bar. When you reach your target profit, you'll get a celebration notification suggesting you lock in your gains and end the session. Discipline is key - many players give back winnings by continuing past their target.</p>
                                </div>

                                <div className="bg-black/30 rounded-lg p-3 border-l-2 border-red-400">
                                  <p className="mb-2"><span className="text-yellow-400 font-semibold">🛑 Stop Loss</span></p>
                                  <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> Maximum loss you're willing to accept before ending the session.</p>
                                  <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> This is your safety net. If your bankroll drops to this level (Bankroll - Stop Loss), the tracker will show strong warning indicators. This protects you from chasing losses. Stick to this limit - it's the foundation of responsible bankroll management.</p>
                                </div>

                                <div className="bg-black/30 rounded-lg p-3 border-l-2 border-purple-400">
                                  <p className="mb-2"><span className="text-yellow-400 font-semibold">🎲 Unit Size</span></p>
                                  <p className="text-xs mb-1"><span className="font-semibold">What it is:</span> Your base bet amount - the building block for all bets.</p>
                                  <p className="text-xs text-gray-400"><span className="font-semibold">What to expect:</span> All bet recommendations are calculated as multiples of this unit (1x, 2x, 3x, etc.). The tracker uses this to size your bets proportionally to your bankroll. During gameplay, you'll see suggestions like "Bet 2 units on Red" which means 2 × your unit size. Recommended: 1-2% of bankroll for conservative play.</p>
                                </div>
                              </div>

                              <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-400/30">
                                <p className="text-xs text-yellow-300 mb-2"><span className="font-bold">💡 Recommended Settings (Conservative):</span></p>
                                <ul className="text-xs text-gray-300 space-y-1 ml-4">
                                  <li>• Target Profit: 20% of bankroll (e.g., $20 profit on $100 bankroll)</li>
                                  <li>• Stop Loss: 40% of bankroll (e.g., stop at $60 remaining)</li>
                                  <li>• Unit Size: 2% of bankroll (e.g., $2 units on $100 bankroll)</li>
                                </ul>
                              </div>

                              <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-400/30">
                                <p className="text-xs text-teal-300"><span className="font-bold">📊 During Gameplay:</span> The tracker monitors all 47 betting groups in real-time, showing hot/cold trends, streaks, and statistical anomalies. Your session stats update after every spin, helping you make informed decisions based on actual data, not gut feelings.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
                          {!session ? 'Configure Your Session' : 'Update Settings'}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Starting Bankroll</label>
                            <input
                              type="number"
                              value={playerSetup.bankroll}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Number(e.target.value)
                                setPlayerSetup({...playerSetup, bankroll: value})
                                if (!session) {
                                  setStartingBankroll(value)
                                  setCurrentBankroll(value)
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="100"
                            />
                          </div>

                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Target Profit</label>
                            <input
                              type="number"
                              value={playerSetup.targetProfit}
                              onChange={(e) => setPlayerSetup({...playerSetup, targetProfit: e.target.value === '' ? 0 : Number(e.target.value)})}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="50"
                            />
                          </div>

                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Stop Loss</label>
                            <input
                              type="number"
                              value={playerSetup.stopLoss}
                              onChange={(e) => setPlayerSetup({...playerSetup, stopLoss: e.target.value === '' ? 0 : Number(e.target.value)})}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="50"
                            />
                          </div>

                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Unit Size</label>
                            <input
                              type="number"
                              value={playerSetup.betUnit}
                              onChange={(e) => setPlayerSetup({...playerSetup, betUnit: e.target.value === '' ? 0 : Number(e.target.value)})}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="5"
                            />
                          </div>
                        </div>
                        
                        {!session ? (
                          // Show "Start Tracking" button when no session exists
                          <button
                            onClick={createNewSession}  // Actually creates the session
                            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg shadow-lg hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
                          >
                            🎲 Start Tracking
                          </button>
                        ) : (
                          // Show "Apply Settings" when session exists
                          <button
                            onClick={() => setAssistantSubTab('action')}
                            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg shadow-lg hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
                          >
                            Apply Settings
                          </button>
                        )}
                      </div>
                    )}

                    {/* EDGE-TO-EDGE LAYOUT FOR TABLE VIEW */}
                    {assistantSubTab === 'action' && session && actionView === 'table-view' && (
                      <div className="flex flex-col lg:flex-row gap-2 min-h-screen w-full">
                        {/* LEFT SIDE: Table View - Takes up left half */}
                        <div className="w-full lg:w-1/2 p-2 pb-2 overflow-y-auto lg:sticky lg:top-0 lg:self-start lg:max-h-screen">
                          <div className="space-y-1">
                              {/* Conditional Visual: Table Grid or Wheel Train */}
                              {betMode === 'wheel' ? (
                                /* WHEEL TRAIN VIEW */
                                <div className="mb-4">
                                  <WheelLayout
                                    spinHistory={spins}
                                    onNumberAdded={addNumber}
                                  />
                                </div>
                              ) : (
                                /* TABLE GRID VIEW (for 'table' and 'custom' modes) */
                                <>
                              {/* Zero with hit count */}
                              <div className="relative">
                                <button
                                  onClick={() => addNumber(0)}
                                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-white transition"
                                >
                                  0
                                  {/* Hit count badge */}
                                  {spins.filter(s => s.number === 0).length > 0 && (
                                    <span className="absolute top-0 right-0 bg-yellow-400 text-black text-xs rounded-full px-1">
                                      {spins.filter(s => s.number === 0).length}
                                    </span>
                                  )}
                                </button>
                              </div>

                              {/* Main number grid with heat map */}
                              <div className="overflow-x-auto">
                              <div className="grid grid-cols-12 gap-1 min-w-[600px]">
                                {/* Top row */}
                                {[3,6,9,12,15,18,21,24,27,30,33,36].map(num => {
                                  const hitCount = spins.slice(0, 36).filter(s => s.number === num).length;
                                  const isHot = hitCount >= 3;
                                  const isCold = hitCount === 0;

                                  return (
                                    <button
                                      key={num}
                                      onClick={() => addNumber(num)}
                                      className={`relative py-3 rounded font-bold text-white transition ${
                                        isHot ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                                      } ${
                                        [3,9,12,18,21,27,30,36].includes(num)
                                          ? 'bg-red-600 hover:bg-red-700'
                                          : 'bg-black hover:bg-gray-800 border border-gray-600'
                                      } ${isCold ? 'opacity-50' : ''}`}
                                    >
                                      {num}
                                      {hitCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 text-xs rounded-full px-1 ${
                                          isHot ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-600 text-white'
                                        }`}>
                                          {hitCount}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}

                                {/* Middle row */}
                                {[2,5,8,11,14,17,20,23,26,29,32,35].map(num => {
                                  const hitCount = spins.slice(0, 36).filter(s => s.number === num).length;
                                  const isHot = hitCount >= 3;
                                  const isCold = hitCount === 0;

                                  return (
                                    <button
                                      key={num}
                                      onClick={() => addNumber(num)}
                                      className={`relative py-3 rounded font-bold text-white transition ${
                                        isHot ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                                      } ${
                                        [5,14,23,32].includes(num)
                                          ? 'bg-red-600 hover:bg-red-700'
                                          : 'bg-black hover:bg-gray-800 border border-gray-600'
                                      } ${isCold ? 'opacity-50' : ''}`}
                                    >
                                      {num}
                                      {hitCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 text-xs rounded-full px-1 ${
                                          isHot ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-600 text-white'
                                        }`}>
                                          {hitCount}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}

                                {/* Bottom row */}
                                {[1,4,7,10,13,16,19,22,25,28,31,34].map(num => {
                                  const hitCount = spins.slice(0, 36).filter(s => s.number === num).length;
                                  const isHot = hitCount >= 3;
                                  const isCold = hitCount === 0;

                                  return (
                                    <button
                                      key={num}
                                      onClick={() => addNumber(num)}
                                      className={`relative py-3 rounded font-bold text-white transition ${
                                        isHot ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                                      } ${
                                        [1,7,16,19,25,34].includes(num)
                                          ? 'bg-red-600 hover:bg-red-700'
                                          : 'bg-black hover:bg-gray-800 border border-gray-600'
                                      } ${isCold ? 'opacity-50' : ''}`}
                                    >
                                      {num}
                                      {hitCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 text-xs rounded-full px-1 ${
                                          isHot ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-600 text-white'
                                        }`}>
                                          {hitCount}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              </div>
                              </>
                              )}
                              {/* End Conditional Visual */}

                              {/* ADD/UNDO CONTROLS */}
                              <div className="flex items-center justify-end gap-2 my-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                <input
                                  type="number"
                                  min="0"
                                  max="36"
                                  value={inputNumber}
                                  onChange={(e) => setInputNumber(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && addNumber()}
                                  className="w-20 px-2 py-1.5 bg-black border border-gray-600 rounded text-center text-sm font-bold text-white"
                                  placeholder="0-36"
                                />
                                <button
                                  onClick={() => addNumber()}
                                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold transition-all"
                                >
                                  ADD
                                </button>
                                <button
                                  onClick={undoLastSpin}
                                  disabled={spins.length === 0}
                                  className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${
                                    spins.length === 0
                                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                                  }`}
                                  title="Undo last spin"
                                >
                                  ↩ UNDO
                                </button>
                              </div>

                              {/* HISTORY SECTION */}
                              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                                <h3 className="text-xl font-bold text-yellow-400 mb-4">History</h3>
                                <HistoryTable
                                  spins={spins}
                                  baseUnit={playerSetup.betUnit}
                                  historicalBets={historicalBets}
                                  onHistoricalBetsUpdate={setHistoricalBets}
                                  onBetPlaced={handleBetPlaced}
                                  onViewChange={setActionView}
                                  onBetModeChange={setBetMode}
                                />
                              </div>
                            </div>
                          </div>

                        {/* RIGHT SIDE: Analysis Tables - Takes up right half */}
                        <div className="w-full lg:w-1/2 p-2 overflow-y-auto">
                          {/* Quick Scan Title */}
                          <h3 className="text-lg font-bold text-cyan-400 mb-3">⚡ Quick Scan</h3>

                          {/* Analysis View Tabs */}
                          <div className="flex gap-1 mb-3 bg-gray-900/50 p-1 rounded-lg overflow-x-auto">
                            <button
                              onClick={() => setAnalysisView('common')}
                              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                analysisView === 'common'
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Table Common Groups
                            </button>
                            <button
                              onClick={() => setAnalysisView('special')}
                              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                analysisView === 'special'
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Table Special Groups
                            </button>
                            <button
                              onClick={() => setAnalysisView('wheel')}
                              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                analysisView === 'wheel'
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Wheel Groups
                            </button>
                            <button
                              onClick={() => setAnalysisView('numbers')}
                              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                analysisView === 'numbers'
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Individual Numbers
                            </button>
                          </div>

                          {/* Analysis Table Content - No Scrolling */}
                          <div className="overflow-visible">
                            {analysisView === 'common' && (
                              <CommonGroupsTable spinHistory={spins.map(s => s.number)} />
                            )}
                            {analysisView === 'special' && (
                              <SpecialBetsTable spinHistory={spins.map(s => s.number)} />
                            )}
                            {analysisView === 'wheel' && (
                              <WheelBetStats spinHistory={spins.map(s => s.number)} />
                            )}
                            {analysisView === 'numbers' && (
                              <NumbersStatsTab history={spins.map(s => s.number)} />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WHEEL VIEWS */}
                    {assistantSubTab === 'action' && session && actionView.startsWith('wheel') && (
  <div className="flex flex-col lg:flex-row gap-2 min-h-screen -m-6">
    {/* Left Side: Wheel Train + History */}
    <div className="w-full lg:w-1/2 p-2 overflow-y-auto lg:sticky lg:top-0 lg:self-start lg:max-h-screen space-y-2">
      <WheelLayout
        spinHistory={spins}
        onNumberAdded={(num) => addNumber(num)}
      />
      <WheelHistory
        spins={spins}
        selectedNumber={selectedNumber}
        historicalBets={historicalBets}
        onHistoricalBetsUpdate={setHistoricalBets}
        onBetPlaced={handleBetPlaced}
      />
    </div>
    {/* Right Side: Analysis Tables */}
    <div className="w-full lg:w-1/2 p-2 overflow-y-auto">
      {/* Quick Scan Title */}
      <h3 className="text-lg font-bold text-cyan-400 mb-3">⚡ Quick Scan</h3>

      {/* Analysis View Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-900/50 p-1 rounded-lg overflow-x-auto">
        <button
          onClick={() => setAnalysisView('common')}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            analysisView === 'common'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Table Common Groups
        </button>
        <button
          onClick={() => setAnalysisView('special')}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            analysisView === 'special'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Table Special Groups
        </button>
        <button
          onClick={() => setAnalysisView('wheel')}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            analysisView === 'wheel'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Wheel Groups
        </button>
        <button
          onClick={() => setAnalysisView('numbers')}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            analysisView === 'numbers'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Individual Numbers
        </button>
      </div>

      {/* Analysis Table Content - No Scrolling */}
      <div className="overflow-visible">
        {analysisView === 'common' && (
          <CommonGroupsTable spinHistory={spins.map(s => s.number)} />
        )}
        {analysisView === 'special' && (
          <SpecialBetsTable spinHistory={spins.map(s => s.number)} />
        )}
        {analysisView === 'wheel' && (
          <WheelBetStats spinHistory={spins.map(s => s.number)} />
        )}
        {analysisView === 'numbers' && (
          <NumbersStatsTab history={spins.map(s => s.number)} />
        )}
      </div>
    </div>
  </div>
                    )}
                    {assistantSubTab === 'performance' && session && (
                      <div className="space-y-6">
                        {/* Performance Help Panel */}
                        <div className="mb-6 border border-green-400/30 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleHelp('performance')}
                            className="w-full px-4 py-3 bg-green-900/20 hover:bg-green-900/30 transition-colors flex items-center justify-between text-left"
                          >
                            <span className="text-sm font-semibold text-green-300 flex items-center gap-2">
                              <span className="text-lg">💡</span>
                              Performance Help
                            </span>
                            <span className="text-green-400 text-xl">{showHelp.performance ? '−' : '+'}</span>
                          </button>
                          {showHelp.performance && (
                            <div className="bg-green-950/30 border-t border-green-400/30 p-4 text-sm text-gray-300 space-y-3">
                              <p className="font-semibold text-green-300">Understanding Performance Metrics</p>

                              <div className="space-y-2">
                                <p><span className="text-green-400 font-semibold">🎲 Total Spins:</span> Number of spins recorded in this session. More spins = more statistical reliability for patterns.</p>

                                <p><span className="text-green-400 font-semibold">💰 Current P/L:</span> Your profit or loss for the session. Green (positive) means you're ahead, red (negative) means you're down.</p>

                                <p><span className="text-green-400 font-semibold">📊 Win Rate:</span> Percentage of bets that resulted in a profit. Calculated as: (winning bets / total bets) × 100%.</p>

                                <p><span className="text-green-400 font-semibold">📈 ROI:</span> Return on Investment - shows your profitability relative to bankroll. Calculated as: (P/L / starting bankroll) × 100%.</p>
                              </div>

                              <div className="bg-green-900/20 rounded p-3 border-l-2 border-green-400">
                                <p className="text-xs text-green-300/80"><span className="font-bold">💡 Pro Tip:</span> A successful session isn't just about P/L - track your discipline. Did you follow your stop loss? Did you quit at your target? Consistency wins long-term.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <h2 className="text-2xl font-bold text-yellow-400">Session Performance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-1">Total Spins</h3>
                            <p className="text-2xl font-bold text-white">{session.total_spins}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-1">Current P/L</h3>
                            <p className={`text-2xl font-bold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-1">Win Rate</h3>
                            <p className="text-2xl font-bold text-white">
                              {betHistory.filter(b => b.spin !== null).length > 0 
                                ? Math.round((betHistory.filter(b => b.totalPnL > 0).length / betHistory.filter(b => b.spin !== null).length) * 100) 
                                : 0}%
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-400">Detailed performance tracking coming soon...</p>
                      </div>
                    )}
{assistantSubTab === 'analysis' && (
  <div className="space-y-6">
  {/* Analysis Help Panel */}
  <div className="mb-6 border border-blue-400/30 rounded-lg overflow-hidden">
    <button
      onClick={() => toggleHelp('analysis')}
      className="w-full px-4 py-3 bg-blue-900/20 hover:bg-blue-900/30 transition-colors flex items-center justify-between text-left"
    >
      <span className="text-sm font-semibold text-blue-300 flex items-center gap-2">
        <span className="text-lg">💡</span>
        Analysis Help
      </span>
      <span className="text-blue-400 text-xl">{showHelp.analysis ? '−' : '+'}</span>
    </button>
    {showHelp.analysis && (
      <div className="bg-blue-950/30 border-t border-blue-400/30 p-4 text-sm text-gray-300 space-y-3">
        <p className="font-semibold text-blue-300">Understanding Advanced Analysis</p>

        <div className="space-y-2">
          <p><span className="text-blue-400 font-semibold">📊 Stats Tables:</span> View performance metrics across Common (red/black, dozens), Special (A/B groupings), Wheel (Voisins/Tiers/Orphelins), and Numbers (individual hit rates).</p>

          <p><span className="text-blue-400 font-semibold">🎯 Pattern Detection:</span> Identifies current betting patterns - STREAK (consecutive same outcomes), ALTERNATING (back-and-forth), CHAOS (random), or DOMINANT (one side winning).</p>

          <p><span className="text-blue-400 font-semibold">⏰ Time Correlation:</span> Analyzes which groups perform best at different spin counts, helping identify rhythm-based advantages.</p>

          <p><span className="text-blue-400 font-semibold">📈 Streak Analysis:</span> Tracks consecutive wins/losses for betting groups, showing current streaks and historical maximums.</p>
        </div>

        <div className="bg-blue-900/20 rounded p-3 border-l-2 border-blue-400">
          <p className="text-xs text-blue-300/80"><span className="font-bold">💡 Pro Tip:</span> Use Pattern Detection to identify when the table is "trending" vs "choppy" - adjust your strategy accordingly. Look for 3+ consecutive patterns before acting.</p>
        </div>
      </div>
    )}
  </div>

  {/* Quick Scan Title */}
  <h3 className="text-lg font-bold text-yellow-400 mb-3">⚡ Quick Scan</h3>

  {/* Stats type selector */}
  <div className="flex justify-between items-center mb-4">
  <div className="flex gap-2 overflow-x-auto">
    <button
      onClick={() => setAnalysisView('common')}
      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
        analysisView === 'common'
          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      Table Common Groups
    </button>
    <button
      onClick={() => setAnalysisView('special')}
      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
        analysisView === 'special'
          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      Table Special Groups
    </button>
    <button
      onClick={() => setAnalysisView('wheel')}
      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
        analysisView === 'wheel'
          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      Wheel Groups
    </button>
    <button
      onClick={() => setAnalysisView('numbers')}
      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
        analysisView === 'numbers'
          ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      Individual Numbers
    </button>
  </div>
  </div>

  {/* Conditional rendering based on selection - No Scrolling */}
  <div className="overflow-visible">
    {analysisView === 'common' ? (
      <CommonGroupsTable
        spinHistory={spins.map(s => s.number)}
      />
    ) : analysisView === 'special' ? (
      <SpecialBetsTable
        spinHistory={spins.map(s => s.number)}
      />
    ) : analysisView === 'wheel' ? (
      <WheelBetStats
        spinHistory={spins.map(s => s.number)}
      />
    ) : analysisView === 'numbers' ? (
      <NumbersStatsTab
        history={spins.map(s => s.number)}
      />
    ) : null}
  </div>
    
    {/* 2. Section Selector Tabs */}
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setAnalysisSection('patterns')}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          analysisSection === 'patterns'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🎯 Pattern Detection
      </button>
      <button
        onClick={() => setAnalysisSection('time')}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          analysisSection === 'time'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        ⏰ Time Correlation
      </button>
      <button
        onClick={() => setAnalysisSection('streaks')}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          analysisSection === 'streaks'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        📈 Streak Analysis
      </button>
    </div>

    {/* 3. Pattern Detection and other components BELOW */}
    {analysisSection === 'patterns' && (
      <PatternDetectionEngine spinHistory={spins.map(s => s.number)} />
    )}
    
    {analysisSection === 'time' && (
      <TimeCorrelationTable spinHistory={spins.map(s => s.number)} />
    )}
    
    {analysisSection === 'streaks' && (
      <StreakAnalysisTable spinHistory={spins.map(s => s.number)} />
    )}
  </div>
)}
                      
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* Save Session Modal */}
      {showSaveSessionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-green-500 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">💾</div>
              <h3 className="text-xl font-bold text-white mb-2">Save Session</h3>
              <p className="text-gray-300 text-sm">
                Save your current session to cloud storage
              </p>
            </div>

            {/* Session Preview */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Total Spins</div>
                  <div className="text-white font-bold">{session?.total_spins || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">P/L</div>
                  <div className={`font-bold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Session Name (optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder={`Session - ${new Date().toLocaleDateString()}`}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={100}
              />
            </div>

            {/* Session Description Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Add notes about this session..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {saveError}
              </div>
            )}

            {/* Saved Sessions Count */}
            <div className="mb-4 text-center text-xs text-gray-400">
              {storageMode === 'cloud' ? `${savedSessions.length}/10 sessions saved` : 'Sign in to save sessions'}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveSessionModal(false);
                  setSessionName('');
                  setSessionDescription('');
                  setSaveError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
                disabled={savingSession}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={savingSession || storageMode !== 'cloud'}
              >
                {savingSession ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Saved Sessions Modal */}
      {showViewSessionsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">📁</div>
              <h3 className="text-xl font-bold text-white mb-2">Saved Sessions</h3>
              <p className="text-gray-300 text-sm">
                Load or delete your saved tracker sessions
              </p>
            </div>

            {/* Sessions List */}
            {savedSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-5xl mb-3">📂</div>
                <p>No saved sessions yet</p>
                <p className="text-sm mt-2">Save your current session to access it later</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSessions.map((savedSession) => (
                  <div
                    key={savedSession.id}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-1">
                          {savedSession.session_name}
                        </h4>
                        {savedSession.session_description && (
                          <p className="text-sm text-gray-400 mb-2">
                            {savedSession.session_description}
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <div className="text-gray-500">Spins</div>
                            <div className="text-white font-semibold">
                              {savedSession.total_spins_count}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">P/L</div>
                            <div className={`font-semibold ${savedSession.final_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {savedSession.final_pnl >= 0 ? '+' : ''}${savedSession.final_pnl?.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Duration</div>
                            <div className="text-white font-semibold">
                              {savedSession.session_duration_minutes || 0}m
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Saved</div>
                            <div className="text-white font-semibold">
                              {new Date(savedSession.saved_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleLoadSession(savedSession)}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSession(savedSession)}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {savedSessions.length}/10 sessions saved (Basic tier)
              </div>
              <button
                onClick={() => setShowViewSessionsModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">💾</div>
              <h3 className="text-xl font-bold text-white mb-2">End Session?</h3>
              <p className="text-gray-300 text-sm">
                This will archive your current session data and return you to the setup screen.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Spins Recorded</div>
                  <div className="text-white font-bold">{session?.total_spins || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">Final P/L</div>
                  <div className={`font-bold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndSessionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                End & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Session Confirmation Modal */}
      {showRestartSessionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-orange-500 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2">Restart Session?</h3>
              <p className="text-gray-300 text-sm">
                This will clear all current data and start fresh. This action cannot be undone.
              </p>
            </div>

            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <span>⚠️</span>
                <span className="font-semibold">Warning: Current session data will be permanently lost</span>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Spins to Clear</div>
                  <div className="text-white font-bold">{session?.total_spins || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">Current P/L</div>
                  <div className={`font-bold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartSessionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRestartSession}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all"
              >
                Restart Fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
