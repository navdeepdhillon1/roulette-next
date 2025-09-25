'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
// Updated
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getNumberProperties, NUMBERS } from '@/lib/roulette-logic'
import type { Session, Spin } from '@/lib/types'
import WheelView from '@/components/WheelView'
// Type definitions
type AssistantSubTab = 'setup' | 'action' | 'performance' | 'analysis';

interface PlayerSetup {
  bankroll: number;
  targetProfit: number;
  stopLoss: number;
  timeAvailable: number;
  betUnit: number;
  progressionStyle: 'flat' | 'martingale' | 'reverse-martingale' | 'fibonacci' | 'dalembert' | 'custom';
  playerLevel: 'beginner' | 'intermediate' | 'professional';
}

interface CurrentBet {
  group: string;
  amount: number;
  odds: string;
  potentialWin: number;
}

export default function RouletteSystem() {
  const [session, setSession] = useState<Session | null>(null)
  const [spins, setSpins] = useState<Spin[]>([])
  const [inputNumber, setInputNumber] = useState('')
  const [actionView, setActionView] = useState('table')
  const [showHeatMap, setShowHeatMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'stats' | 'assistant'>('entry')
  const [assistantSubTab, setAssistantSubTab] = useState<AssistantSubTab>('setup')
  const [playerSetup, setPlayerSetup] = useState<PlayerSetup>({
    bankroll: 1000,
    targetProfit: 200,
    stopLoss: 300,
    timeAvailable: 120,
    betUnit: 10,  
    progressionStyle: 'flat',
    playerLevel: 'intermediate'
  })
  const [currentBets, setCurrentBets] = useState<CurrentBet[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)

  useEffect(() => {
    initializeSession()
  }, [])
// Add these state variables (around line 50-60 after your existing states)
const [playerContext, setPlayerContext] = useState({
  bankroll: 1000,
  target: 1500,
  timeAvailable: 60,
  progression: 'flat',
  unitSize: 10
})

const [sessionPnL, setSessionPnL] = useState(0)

const [manualBets, setManualBets] = useState({
  // 18-number groups
  red: '', black: '',
  even: '', odd: '',
  low: '', high: '',
  alt1_1: '', alt1_2: '',
  alt2_1: '', alt2_2: '',
  alt3_1: '', alt3_2: '',
  edge: '', center: '',
  
  // 12-number groups
  dozen1: '', dozen2: '', dozen3: '',
  col1: '', col2: '', col3: '',
  
  // 6-number groups
  six1: '', six2: '', six3: '',
  six4: '', six5: '', six6: ''
})
const [betHistory, setBetHistory] = useState<Array<{
  spin: number | null  // Changed to allow null for pending rows
  bets: any
  results: { [key: string]: number }
  totalPnL: number
  timestamp: Date
}>>([])
  useEffect(() => {
    if (session) {
      loadSpins()
    }
  }, [session])

  const initializeSession = async () => {
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .single()

    if (existingSession) {
      setSession(existingSession)
    } else {
      const { data: newSession } = await supabase
        .from('sessions')
        .insert({ is_active: true })
        .select()
        .single()
      
      if (newSession) {
        setSession(newSession)
        await supabase.rpc('set_active_session', { session_uuid: newSession.id })
      }
    }
  }

  const loadSpins = async () => {
    if (!session) return
    
    const { data } = await supabase
      .from('spins')
      .select('*')
      .eq('session_id', session.id)
      .order('spin_number', { ascending: false })
      .limit(100)
    
    if (data) {
      setSpins(data)
    }
  }
  const checkIfGroupWon = (num: number, group: string): boolean => {
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
    
    switch(group) {
      case 'red': return redNumbers.includes(num)
      case 'black': return !redNumbers.includes(num) && num !== 0
      case 'even': return num !== 0 && num % 2 === 0
      case 'odd': return num % 2 === 1
      case 'low': return num >= 1 && num <= 18
      case 'high': return num >= 19 && num <= 36
      case 'dozen1': return num >= 1 && num <= 12
      case 'dozen2': return num >= 13 && num <= 24
      case 'dozen3': return num >= 25 && num <= 36
      case 'col1': return num % 3 === 1
      case 'col2': return num % 3 === 2
      case 'col3': return num % 3 === 0 && num !== 0
      case 'six1': return num >= 1 && num <= 6
      case 'six2': return num >= 7 && num <= 12
      case 'six3': return num >= 13 && num <= 18
      case 'six4': return num >= 19 && num <= 24
      case 'six5': return num >= 25 && num <= 30
      case 'six6': return num >= 31 && num <= 36
      // Add alt groups and edge/center logic here
      // Alt groups
    case 'alt1_1': // A
    return num > 0 && [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num)
  case 'alt1_2': // B
    return num > 0 && [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num)
  case 'alt2_1': // AA
    return num > 0 && [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num)
  case 'alt2_2': // BB
    return num > 0 && [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num)
  case 'alt3_1': // AAA
    return num > 0 && [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num)
  case 'alt3_2': // BBB
    return num > 0 && [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num)
  case 'edge':
    return num > 0 && [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num)
  case 'center':
    return num > 0 && [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num)
      default: return false
    }
  }
  
  const getGroupPayout = (group: string): number => {
    if (['red','black','even','odd','low','high','alt1_1','alt1_2','alt2_1','alt2_2','alt3_1','alt3_2','edge','center'].includes(group)) {
      return 1 // 1:1 payout
    } else if (['dozen1','dozen2','dozen3','col1','col2','col3'].includes(group)) {
      return 2 // 2:1 payout
    } else if (['six1','six2','six3','six4','six5','six6'].includes(group)) {
      return 5 // 5:1 payout
    }
    return 0
  }
  const addNumber = async () => {
    const num = parseInt(inputNumber)
    if (isNaN(num) || num < 0 || num > 36 || !session) return
    
    setLoading(true)
    const properties = getNumberProperties(num)
    const nextSpinNumber = spins.length > 0 ? spins[0].spin_number + 1 : 1
    
    const spinData: Omit<Spin, 'id' | 'created_at'> = {
      ...properties,
      session_id: session.id,
      spin_number: nextSpinNumber
    }
    
    const { data } = await supabase
      .from('spins')
      .insert(spinData)
      .select()
      .single()
    
    if (data) {
      const newSpins = [data, ...spins]
      setSpins(newSpins)
      

if (betHistory.length > 0 && betHistory[0].spin === null) {
  const updatedHistory = [...betHistory]
  updatedHistory[0].spin = num
  
  // Calculate results based on which groups won
  const results: { [key: string]: number } = {}
  let totalPnL = 0
  
  // Check each bet and calculate win/loss
Object.entries(updatedHistory[0].bets).forEach(([key, value]) => {
  if (value) {
    const betAmount = parseFloat(value as string)  // Add 'as string' here
    const won = checkIfGroupWon(num, key as string)
    if (won) {
      const payout = getGroupPayout(key as string)
      results[key] = betAmount * payout
      totalPnL += betAmount * payout
    } else {
      results[key] = -betAmount
      totalPnL -= betAmount
    }
  }
})
  
  updatedHistory[0].results = results
  updatedHistory[0].totalPnL = totalPnL
  setBetHistory(updatedHistory)
  setSessionPnL(prev => prev + totalPnL)
  
  // Clear manual bets for next round
  setManualBets({
    red: '', black: '', even: '', odd: '', low: '', high: '',
    alt1_1: '', alt1_2: '', alt2_1: '', alt2_2: '', alt3_1: '', alt3_2: '',
    edge: '', center: '', dozen1: '', dozen2: '', dozen3: '',
    col1: '', col2: '', col3: '', six1: '', six2: '', six3: '',
    six4: '', six5: '', six6: ''
  })
}

// Line 158: setSession(prev => prev ? { ...

      setSession(prev => prev ? {
        ...prev,
        total_spins: prev.total_spins + 1
      } : null)
    }
    const handleAddNumberFromAction = () => {
      addNumber()
    }
    setInputNumber('')
    setLoading(false)
  }

  const resetSession = async () => {
    const { data: newSession } = await supabase
      .from('sessions')
      .insert({ is_active: true })
      .select()
      .single()
    
    if (newSession) {
      await supabase.rpc('set_active_session', { session_uuid: newSession.id })
      setSession(newSession)
      setSpins([])
    }
  }

  const getStatistics = () => {
    if (spins.length === 0) return null
    
    const stats = {
      reds: spins.filter(s => s.color === 'red').length,
      blacks: spins.filter(s => s.color === 'black').length,
      greens: spins.filter(s => s.color === 'green').length,
      evens: spins.filter(s => s.even_odd === 'even').length,
      odds: spins.filter(s => s.even_odd === 'odd').length,
      lows: spins.filter(s => s.low_high === 'low').length,
      highs: spins.filter(s => s.low_high === 'high').length,
      firstDozen: spins.filter(s => s.dozen === 'first').length,
      secondDozen: spins.filter(s => s.dozen === 'second').length,
      thirdDozen: spins.filter(s => s.dozen === 'third').length,
      col1: spins.filter(s => s.column_num === 1).length,
      col2: spins.filter(s => s.column_num === 2).length,
      col3: spins.filter(s => s.column_num === 3).length,
    }
    
    return stats
  }

  const calculateGroupStats = () => {
    if (spins.length === 0) return null
    
    const getLastNSpins = (n: number) => spins.slice(0, Math.min(n, spins.length))
    
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
        case 'alt1_a': return num > 0 && [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num)
        case 'alt1_b': return num > 0 && [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num)
        case 'alt2_aa': return num > 0 && [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num)
        case 'alt2_bb': return num > 0 && [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num)
        case 'alt3_aaa': return num > 0 && [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num)
        case 'alt3_bbb': return num > 0 && [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num)
        case 'edge': return num > 0 && [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num)
        case 'center': return num > 0 && [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num)
        case '1st_six': return num >= 1 && num <= 6
        case '2nd_six': return num >= 7 && num <= 12
        case '3rd_six': return num >= 13 && num <= 18
        case '4th_six': return num >= 19 && num <= 24
        case '5th_six': return num >= 25 && num <= 30
        case '6th_six': return num >= 31 && num <= 36
        default: return false
      }
    }
    
    const calculateHitCounts = (group: string) => {
      const windows = [9, 18, 27, 36]
      const counts: number[] = []
      
      windows.forEach(window => {
        const lastNSpins = getLastNSpins(window)
        const hits = lastNSpins.filter(spin => matchesGroup(spin, group)).length
        counts.push(hits)
      })
      
      return counts
    }
    
    const calculateAbsence = (group: string): { now: number, max: number } => {
      let currentAbsence = 0
      let maxAbsence = 0
      let tempAbsence = 0
      
      for (let i = 0; i < spins.length; i++) {
        if (matchesGroup(spins[i], group)) {
          if (i === 0) {
            currentAbsence = 0
          }
          maxAbsence = Math.max(maxAbsence, tempAbsence)
          tempAbsence = 0
        } else {
          tempAbsence++
          if (i === 0) {
            currentAbsence = tempAbsence
          }
        }
      }
      maxAbsence = Math.max(maxAbsence, tempAbsence)
      
      const lastHitIndex = spins.findIndex(spin => matchesGroup(spin, group))
      if (lastHitIndex === -1) {
        currentAbsence = spins.length
      } else {
        currentAbsence = lastHitIndex
      }
      
      return { now: currentAbsence, max: maxAbsence }
    }
    
    const calculateConsecutive = (group: string): { now: number, max: number } => {
      let currentConsecutive = 0
      let maxConsecutive = 0
      let tempConsecutive = 0
      
      for (let i = 0; i < spins.length; i++) {
        if (matchesGroup(spins[i], group)) {
          tempConsecutive++
          if (i === 0 || (i === 1 && tempConsecutive === 2)) {
            currentConsecutive = tempConsecutive
          }
          maxConsecutive = Math.max(maxConsecutive, tempConsecutive)
        } else {
          tempConsecutive = 0
          if (i === 0) {
            currentConsecutive = 0
          }
        }
      }
      
      return { now: currentConsecutive, max: maxConsecutive }
    }
    
    const calculatePercentage = (group: string): number => {
      const hits = spins.filter(spin => matchesGroup(spin, group)).length
      return (hits / spins.length) * 100
    }
    
    const getExpectedPercentage = (group: string): number => {
      const expectedMap: { [key: string]: number } = {
        'red': 48.65, 'black': 48.65, 'green': 2.70,
        'even': 48.65, 'odd': 48.65,
        'low': 48.65, 'high': 48.65,
        '1st_dozen': 32.43, '2nd_dozen': 32.43, '3rd_dozen': 32.43,
        '1st_column': 32.43, '2nd_column': 32.43, '3rd_column': 32.43,
        'alt1_a': 48.65, 'alt1_b': 48.65,
        'alt2_aa': 48.65, 'alt2_bb': 48.65,
        'alt3_aaa': 48.65, 'alt3_bbb': 48.65,
        'edge': 48.65, 'center': 48.65,
        '1st_six': 16.22, '2nd_six': 16.22, '3rd_six': 16.22,
        '4th_six': 16.22, '5th_six': 16.22, '6th_six': 16.22
      }
      return expectedMap[group] || 0
    }
    
    const getStatus = (percentage: number, expected: number, absence: number): string => {
      const deviation = percentage - expected
      const absDeviation = Math.abs(deviation)
      
      if (absence > 15 && expected > 30) return 'ALERT'
      if (absence > 20 && expected > 15) return 'ALERT'
      if (absence > 30 && expected > 2) return 'ALERT'
      
      if (absDeviation < expected * 0.1) return 'NORM'
      if (deviation > expected * 0.15) return 'HOT'
      if (deviation < -expected * 0.15) return 'COLD'
      return 'NORM'
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
      { id: 'alt1_a', name: 'Alt1 A', color: 'text-indigo-400' },
      { id: 'alt1_b', name: 'Alt1 B', color: 'text-pink-400' },
      { id: 'alt2_aa', name: 'Alt2 AA', color: 'text-lime-500' },
      { id: 'alt2_bb', name: 'Alt2 BB', color: 'text-purple-500' },
      { id: 'alt3_aaa', name: 'Alt3 AAA', color: 'text-blue-400' },
      { id: 'alt3_bbb', name: 'Alt3 BBB', color: 'text-yellow-500' },
      { id: 'edge', name: 'Edge', color: 'text-purple-400' },
      { id: 'center', name: 'Center', color: 'text-orange-500' },
      { id: '1st_six', name: '1st Six', color: 'text-red-400' },
      { id: '2nd_six', name: '2nd Six', color: 'text-blue-500' },
      { id: '3rd_six', name: '3rd Six', color: 'text-green-500' },
      { id: '4th_six', name: '4th Six', color: 'text-green-500' },
      { id: '5th_six', name: '5th Six', color: 'text-blue-500' },
      { id: '6th_six', name: '6th Six', color: 'text-red-400' }
    ]
    
    const groupStats = groups.map(group => {
      const hitCounts = calculateHitCounts(group.id)
      const absence = calculateAbsence(group.id)
      const consecutive = calculateConsecutive(group.id)
      const percentage = calculatePercentage(group.id)
      const expected = getExpectedPercentage(group.id)
      const deviation = percentage - expected
      const status = getStatus(percentage, expected, absence.now)
      
      return {
        ...group,
        l9: hitCounts[0],
        l18: hitCounts[1],
        l27: hitCounts[2],
        l36: hitCounts[3],
        absenceNow: absence.now,
        absenceMax: absence.max,
        consecutiveNow: consecutive.now,
        consecutiveMax: consecutive.max,
        lastSpin: absence.now,
        percentage,
        expected,
        deviation,
        status
      }
    })
    
    return groupStats
  }

  const groupStats = calculateGroupStats()
  const stats = getStatistics()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            Advanced Roulette Analysis System
          </h1>
          <p className="text-gray-400 mt-2">Pattern Analysis • Statistical Tracking</p>
        </div>

        {session && (
          <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-6">
              <div>
                <span className="text-gray-400 text-sm">Session ID</span>
                <p className="font-mono text-sm">{session.id.slice(0, 8)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Total Spins</span>
                <p className="text-xl font-bold">{session.total_spins}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-right">
                <span className="text-gray-400 text-sm">Balance</span>
                <p className="text-2xl font-bold text-green-400">${session.balance.toFixed(2)}</p>
              </div>
              <button
                onClick={resetSession}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                New Session
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['entry', 'history', 'stats', 'assistant'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          {activeTab === 'entry' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Enter Winning Number</h2>
              
              <div className="flex gap-4">
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={inputNumber}
                  onChange={(e) => setInputNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNumber()}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter number (0-36)"
                  disabled={loading}
                />
                <button
                  onClick={addNumber}
                  disabled={loading || !inputNumber}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Adding...' : 'Add Number'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-gray-400">Quick Select:</h3>
                <div className="grid grid-cols-12 gap-2">
                  <button
                    onClick={() => setInputNumber('0')}
                    className="col-span-12 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition"
                  >
                    0
                  </button>
                  {[...Array(36)].map((_, i) => {
                    const num = i + 1
                    const color = NUMBERS.RED.includes(num) ? 'bg-red-600 hover:bg-red-700' : 
                                 'bg-gray-700 hover:bg-gray-600'
                    return (
                      <button
                        key={num}
                        onClick={() => setInputNumber(num.toString())}
                        className={`py-3 ${color} rounded-lg font-bold transition`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Winning Numbers History</h2>
              
              {spins.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No spins recorded yet</p>
              ) : (
                <>
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-600 rounded"></div>
                      <span className="text-sm">Red</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-900 border border-gray-600 rounded"></div>
                      <span className="text-sm">Black</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-600 rounded"></div>
                      <span className="text-sm">Green (0)</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 sticky top-0">
                        <tr>
                          <th className="p-2 text-center font-semibold">Number</th>
                          <th className="p-2 text-center font-semibold">Color</th>
                          <th className="p-2 text-center font-semibold">Even/Odd</th>
                          <th className="p-2 text-center font-semibold">Low/High</th>
                          <th className="p-2 text-center font-semibold">Column</th>
                          <th className="p-2 text-center font-semibold">Dozen</th>
                          <th className="p-2 text-center font-semibold">Alt1</th>
                          <th className="p-2 text-center font-semibold">Alt2</th>
                          <th className="p-2 text-center font-semibold">Alt3</th>
                          <th className="p-2 text-center font-semibold">E/C</th>
                          <th className="p-2 text-center font-semibold">Six</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spins.map((spin, index) => {
                          const num = spin.number
                          
                          const alt1 = num === 0 ? '-' : 
                            [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B'
                          
                          const alt2 = num === 0 ? '-' :
                            [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB'
                          
                          const alt3 = num === 0 ? '-' :
                            [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB'
                          
                          const edgeCenter = num === 0 ? '-' :
                            [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) ? 'E' : 'C'
                          
                          const sixGroup = num === 0 ? '-' :
                            num <= 6 ? '1st' :
                            num <= 12 ? '2nd' :
                            num <= 18 ? '3rd' :
                            num <= 24 ? '4th' :
                            num <= 30 ? '5th' : '6th'
                          
                          return (
                            <tr key={spin.id || index} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                              <td className="p-2 text-center">
                                <div className={`
                                  inline-flex items-center justify-center w-10 h-10 rounded-full font-bold
                                  ${spin.color === 'red' ? 'bg-red-600' : 
                                    spin.color === 'black' ? 'bg-gray-900 border border-gray-600' : 
                                    'bg-green-600'}
                                `}>
                                  {num}
                                </div>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.color === 'red' ? 'bg-red-600/30 text-red-400' :
                                    spin.color === 'black' ? 'bg-gray-600/30 text-gray-300' :
                                    'bg-green-600/30 text-green-400'}
                                `}>
                                  {spin.color === 'red' ? 'R' : spin.color === 'black' ? 'B' : 'G'}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.even_odd === 'even' ? 'bg-purple-600/30 text-purple-400' :
                                    spin.even_odd === 'odd' ? 'bg-cyan-600/30 text-cyan-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.even_odd === 'even' ? 'E' : spin.even_odd === 'odd' ? 'O' : '-'}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.low_high === 'low' ? 'bg-amber-700/30 text-amber-400' :
                                    spin.low_high === 'high' ? 'bg-gray-600/30 text-gray-300' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.low_high === 'low' ? 'L' : spin.low_high === 'high' ? 'H' : '-'}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.column_num === 1 ? 'bg-orange-600/30 text-orange-400' :
                                    spin.column_num === 2 ? 'bg-teal-600/30 text-teal-400' :
                                    spin.column_num === 3 ? 'bg-lime-600/30 text-lime-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.column_num > 0 ? `${spin.column_num}st` : '-'}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.dozen === 'first' ? 'bg-red-700/30 text-red-400' :
                                    spin.dozen === 'second' ? 'bg-cyan-700/30 text-cyan-400' :
                                    spin.dozen === 'third' ? 'bg-green-700/30 text-green-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.dozen === 'first' ? '1st' : 
                                   spin.dozen === 'second' ? '2nd' : 
                                   spin.dozen === 'third' ? '3rd' : '-'}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${alt1 === 'A' ? 'bg-indigo-600/30 text-indigo-400' :
                                    alt1 === 'B' ? 'bg-pink-600/30 text-pink-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {alt1}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${alt2 === 'AA' ? 'bg-lime-700/30 text-lime-400' :
                                    alt2 === 'BB' ? 'bg-purple-700/30 text-purple-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {alt2}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${alt3 === 'AAA' ? 'bg-blue-600/30 text-blue-400' :
                                    alt3 === 'BBB' ? 'bg-yellow-700/30 text-yellow-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {alt3}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${edgeCenter === 'E' ? 'bg-purple-600/30 text-purple-400' :
                                    edgeCenter === 'C' ? 'bg-orange-600/30 text-orange-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {edgeCenter}
                                </span>
                              </td>
                              
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${sixGroup === '1st' || sixGroup === '6th' ? 'bg-red-700/30 text-red-400' :
                                    sixGroup === '2nd' || sixGroup === '5th' ? 'bg-blue-700/30 text-blue-400' :
                                    sixGroup === '3rd' || sixGroup === '4th' ? 'bg-green-700/30 text-green-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {sixGroup}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Statistical Analysis</h2>
              
              {!stats ? (
                <p className="text-gray-400 text-center py-8">No data to analyze yet</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                        Hot Numbers
                      </h3>
                      <div className="grid grid-cols-6 gap-2">
                        {[21, 7, 14, 32, 9, 18].map((num) => (
                          <div
                            key={num}
                            className="aspect-square flex items-center justify-center rounded bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-sm"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                        Cold Numbers
                      </h3>
                      <div className="grid grid-cols-6 gap-2">
                        {[4, 11, 28, 35, 2, 16].map((num) => (
                          <div
                            key={num}
                            className="aspect-square flex items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                        Pattern Alerts
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                          <span>Red Streak</span>
                          <span className="text-yellow-400 font-bold">5 in row</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                          <span>No Dozen 3</span>
                          <span className="text-purple-400 font-bold">12 spins</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-4">
                      <h3 className="text-xl font-bold">Complete Statistical Analysis & Tracking</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-800">
                          <tr>
                            <th rowSpan={2} className="text-left py-1 px-2 font-semibold text-gray-300 border-r border-gray-600">
                              Group
                            </th>
                            <th colSpan={4} className="text-center py-1 px-1 font-semibold text-green-400 border-r border-gray-600">
                              Hit Count
                            </th>
                            <th colSpan={2} className="text-center py-1 px-1 font-semibold text-purple-400 border-r border-gray-600">
                              Absence
                            </th>
                            <th colSpan={2} className="text-center py-1 px-1 font-semibold text-green-400 border-r border-gray-600">
                              Consec
                            </th>
                            <th rowSpan={2} className="text-center py-1 px-1 font-semibold text-blue-400 border-r border-gray-600">
                              Last<br/>Spin
                            </th>
                            <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-yellow-400 border-r border-gray-600">
                              %
                            </th>
                            <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-gray-400 border-r border-gray-600">
                              Exp%
                            </th>
                            <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-cyan-400 border-r border-gray-600">
                              Dev
                            </th>
                            <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-gray-300">
                              Status
                            </th>
                          </tr>
                          <tr className="border-t border-gray-600">
                            <th className="text-center py-1 px-1 text-gray-400">L9</th>
                            <th className="text-center py-1 px-1 text-gray-400">L18</th>
                            <th className="text-center py-1 px-1 text-gray-400">L27</th>
                            <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">L36</th>
                            <th className="text-center py-1 px-1 text-gray-400">Now</th>
                            <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">Max</th>
                            <th className="text-center py-1 px-1 text-gray-400">Now</th>
                            <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">Max</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                          {groupStats && groupStats.map((group) => (
                            <tr key={group.id} className="hover:bg-gray-600/50 transition-colors">
                              <td className={`py-1 px-2 font-medium ${group.color} border-r border-gray-600`}>
                                {group.name}
                              </td>
                              <td className="text-center py-1 px-1">{group.l9}</td>
                              <td className="text-center py-1 px-1">{group.l18}</td>
                              <td className="text-center py-1 px-1">{group.l27}</td>
                              <td className="text-center py-1 px-1 border-r border-gray-600">{group.l36}</td>
                              <td className={`text-center py-1 px-1 ${group.absenceNow > 10 ? 'text-orange-400' : group.absenceNow > 5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                {group.absenceNow}
                              </td>
                              <td className="text-center py-1 px-1 border-r border-gray-600">{group.absenceMax}</td>
                              <td className={`text-center py-1 px-1 ${group.consecutiveNow > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                {group.consecutiveNow}
                              </td>
                              <td className="text-center py-1 px-1 border-r border-gray-600">{group.consecutiveMax}</td>
                              <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">
                                {group.lastSpin}
                              </td>
                              <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                                {group.percentage.toFixed(1)}
                              </td>
                              <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">
                                {group.expected.toFixed(1)}
                              </td>
                              <td className="text-center py-1 px-2 border-r border-gray-600">
                                <span className={group.deviation > 0 ? 'text-green-400' : 'text-red-400'}>
                                  {group.deviation > 0 ? '+' : ''}{group.deviation.toFixed(1)}
                                </span>
                              </td>
                              <td className="text-center py-1 px-2">
                                {group.status === 'HOT' ? (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">
                                    HOT
                                  </span>
                                ) : group.status === 'COLD' ? (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                                    COLD
                                  </span>
                                ) : group.status === 'ALERT' ? (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/50 text-red-400">
                                    ALERT
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                                    NORM
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <div className="text-xs text-gray-400">Total Spins</div>
                        <div className="text-xl font-bold text-white">{spins.length}</div>
                        <div className="text-xs text-gray-500">Current session</div>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <div className="text-xs text-gray-400">Max Absence</div>
                        <div className="text-xl font-bold text-red-400">18</div>
                        <div className="text-xs text-gray-500">Green (0)</div>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <div className="text-xs text-gray-400">Critical Alert</div>
                        <div className="text-xl font-bold text-orange-400">3rd Doz</div>
                        <div className="text-xs text-gray-500">12 spins missing</div>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <div className="text-xs text-gray-400">Hot Groups</div>
                        <div className="text-xl font-bold text-green-400">3</div>
                        <div className="text-xs text-gray-500">Above expected</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="space-y-6">
              <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg">
                <button
                  onClick={() => setAssistantSubTab('setup')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    assistantSubTab === 'setup'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Setup
                </button>
                <button
                  onClick={() => setAssistantSubTab('action')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    assistantSubTab === 'action'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Game Action
                </button>
                <button
                  onClick={() => setAssistantSubTab('performance')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    assistantSubTab === 'performance'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setAssistantSubTab('analysis')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    assistantSubTab === 'analysis'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Analysis
                </button>
              </div>

              {assistantSubTab === 'setup' && (
                <div className="bg-gray-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Session Configuration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 mb-2">Bankroll ($)</label>
                      <input
                        type="number"
                        value={playerSetup.bankroll}
                        onChange={(e) => setPlayerSetup({...playerSetup, bankroll: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Target Profit ($)</label>
                      <input
                        type="number"
                        value={playerSetup.targetProfit}
                        onChange={(e) => setPlayerSetup({...playerSetup, targetProfit: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-400 mt-1">
                        ({((playerSetup.targetProfit / playerSetup.bankroll) * 100).toFixed(1)}% of bankroll)
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Stop Loss ($)</label>
                      <input
                        type="number"
                        value={playerSetup.stopLoss}
                        onChange={(e) => setPlayerSetup({...playerSetup, stopLoss: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-400 mt-1">
                        ({((playerSetup.stopLoss / playerSetup.bankroll) * 100).toFixed(1)}% of bankroll)
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Time Available (minutes)</label>
                      <input
                        type="number"
                        value={playerSetup.timeAvailable}
                        onChange={(e) => setPlayerSetup({...playerSetup, timeAvailable: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Bet Unit Size ($)</label>
                      <input
                        type="number"
                        value={playerSetup.betUnit}
                        onChange={(e) => setPlayerSetup({...playerSetup, betUnit: Number(e.target.value)})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Progression Style</label>
                      <select
                        value={playerSetup.progressionStyle}
                        onChange={(e) => setPlayerSetup({...playerSetup, progressionStyle: e.target.value as PlayerSetup['progressionStyle']})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="flat">Flat Betting</option>
                        <option value="martingale">Martingale</option>
                        <option value="reverse-martingale">Reverse Martingale</option>
                        <option value="fibonacci">Fibonacci</option>
                        <option value="dalembert">DAlembert</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2">Player Level</label>
                      <select
                        value={playerSetup.playerLevel}
                        onChange={(e) => setPlayerSetup({...playerSetup, playerLevel: e.target.value as PlayerSetup['playerLevel']})}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-8">
                    <button
                      onClick={() => {
                        setSessionStartTime(new Date())
                        setAssistantSubTab('action')
                      }}
                      className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all"
                    >
                      Start Session
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
                    >
                      Load Previous Settings
                    </button>
                  </div>
                </div>
              )}



{assistantSubTab === 'action' && (
  <div className="space-y-6">
    {/* Sub-tab Navigation */}
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setActionView('table')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          actionView === 'table' 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        📊 Table View
      </button>
      <button
        onClick={() => setActionView('wheel')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          actionView === 'wheel' 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🎯 Wheel View
      </button>
    </div>

    {/* TABLE VIEW */}
    {actionView === 'table' && (
      <>
       

        {/* Manual Betting Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* 18's Card with 2-column layout */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h4 className="text-center font-bold mb-3 text-green-400">18's (1:1)</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'red', label: 'Red', color: 'bg-red-600' },
                { key: 'black', label: 'Black', color: 'bg-gray-900' },
                { key: 'even', label: 'Even', color: 'bg-blue-600' },
                { key: 'odd', label: 'Odd', color: 'bg-orange-600' },
                { key: 'low', label: 'Low (1-18)', color: 'bg-purple-600' },
                { key: 'high', label: 'High (19-36)', color: 'bg-pink-600' },
                { key: 'alt1_1', label: 'A', color: 'bg-indigo-600' },
                { key: 'alt1_2', label: 'B', color: 'bg-teal-600' },
                { key: 'alt2_1', label: 'AA', color: 'bg-green-600' },
                { key: 'alt2_2', label: 'BB', color: 'bg-yellow-600' },
                { key: 'alt3_1', label: 'AAA', color: 'bg-cyan-600' },
                { key: 'alt3_2', label: 'BBB', color: 'bg-rose-600' },
                { key: 'edge', label: 'Edge', color: 'bg-violet-600' },
                { key: 'center', label: 'Center', color: 'bg-amber-600' }
              ].map(group => (
                <div key={group.key} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const currentValue = manualBets[group.key as keyof typeof manualBets]
                      const newValue = currentValue ? '' : playerContext.unitSize.toString()
                      const updatedBets = {
                        ...manualBets,
                        [group.key]: newValue
                      }
                      setManualBets(updatedBets)
                      
                      if (betHistory.length === 0 || betHistory[0].spin !== null) {
                        setBetHistory([{
                          spin: null,
                          bets: updatedBets,
                          results: {},
                          totalPnL: 0,
                          timestamp: new Date()
                        }, ...betHistory])
                      } else {
                        const updatedHistory = [...betHistory]
                        updatedHistory[0].bets = updatedBets
                        setBetHistory(updatedHistory)
                      }
                    }}
                    className={`flex-1 px-1 py-1 rounded text-xs ${group.color} hover:opacity-80 transition-all ${
                      manualBets[group.key as keyof typeof manualBets] ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    {group.label}
                  </button>
                  <input
                    type="number"
                    value={manualBets[group.key as keyof typeof manualBets]}
                    onChange={(e) => {
                      const updatedBets = {
                        ...manualBets,
                        [group.key]: e.target.value
                      }
                      setManualBets(updatedBets)
                      
                      if (betHistory.length > 0 && betHistory[0].spin === null) {
                        const updatedHistory = [...betHistory]
                        updatedHistory[0].bets = updatedBets
                        setBetHistory(updatedHistory)
                      } else if (e.target.value) {
                        setBetHistory([{
                          spin: null,
                          bets: updatedBets,
                          results: {},
                          totalPnL: 0,
                          timestamp: new Date()
                        }, ...betHistory])
                      }
                    }}
                    placeholder="10"
                    className="w-12 px-1 py-1 bg-black/50 border border-gray-600 rounded text-xs text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 12's Card */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h4 className="text-center font-bold mb-3 text-yellow-400">12's (2:1)</h4>
            <div className="space-y-2">
              {[
                { key: 'dozen1', label: '1st Dozen' },
                { key: 'dozen2', label: '2nd Dozen' },
                { key: 'dozen3', label: '3rd Dozen' },
                { key: 'col1', label: 'Column 1' },
                { key: 'col2', label: 'Column 2' },
                { key: 'col3', label: 'Column 3' }
              ].map(group => (
                <div key={group.key} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const currentValue = manualBets[group.key as keyof typeof manualBets]
                      const newValue = currentValue ? '' : playerContext.unitSize.toString()
                      const updatedBets = {
                        ...manualBets,
                        [group.key]: newValue
                      }
                      setManualBets(updatedBets)
                      
                      if (betHistory.length === 0 || betHistory[0].spin !== null) {
                        setBetHistory([{
                          spin: null,
                          bets: updatedBets,
                          results: {},
                          totalPnL: 0,
                          timestamp: new Date()
                        }, ...betHistory])
                      } else {
                        const updatedHistory = [...betHistory]
                        updatedHistory[0].bets = updatedBets
                        setBetHistory(updatedHistory)
                      }
                    }}
                    className={`flex-1 px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-xs hover:bg-yellow-600/30 transition-all ${
                      manualBets[group.key as keyof typeof manualBets] ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    {group.label}
                  </button>
                  <input
                    type="number"
                    value={manualBets[group.key as keyof typeof manualBets]}
                    onChange={(e) => {
                      const updatedBets = {
                        ...manualBets,
                        [group.key]: e.target.value
                      }
                      setManualBets(updatedBets)
                      
                      if (betHistory.length > 0 && betHistory[0].spin === null) {
                        const updatedHistory = [...betHistory]
                        updatedHistory[0].bets = updatedBets
                        setBetHistory(updatedHistory)
                      } else if (e.target.value) {
                        setBetHistory([{
                          spin: null,
                          bets: updatedBets,
                          results: {},
                          totalPnL: 0,
                          timestamp: new Date()
                        }, ...betHistory])
                      }
                    }}
                    placeholder="10"
                    className="w-16 px-1 py-1 bg-black/50 border border-gray-600 rounded text-xs text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 6's Card */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h4 className="text-center font-bold mb-3 text-cyan-400">6's (5:1)</h4>
            <div className="space-y-2">
              {[
                { key: 'six1', label: '1st 6' },
                { key: 'six2', label: '2nd 6' },
                { key: 'six3', label: '3rd 6' },
                { key: 'six4', label: '4th 6' },
                { key: 'six5', label: '5th 6' },
                { key: 'six6', label: '6th 6' }
              ].map(group => (
                <div key={group.key} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const currentValue = manualBets[group.key as keyof typeof manualBets]
                      const newValue = currentValue ? '' : playerContext.unitSize.toString()
                      const updatedBets = {
                        ...manualBets,
                        [group.key]: newValue
                      }
                      setManualBets(updatedBets)
                      
                      if (betHistory.length === 0 || betHistory[0].spin !== null) {
                        setBetHistory([{
                          spin: null,
                          bets: updatedBets,
                          results: {},
                          totalPnL: 0,
                          timestamp: new Date()
                        }, ...betHistory])
                      } else {
                        const updatedHistory = [...betHistory]
                        updatedHistory[0].bets = updatedBets
                        setBetHistory(updatedHistory)
                      }
                    }}
                    className={`flex-1 px-2 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded text-xs hover:bg-cyan-600/30 transition-all ${
                      manualBets[group.key as keyof typeof manualBets] ? 'ring-2 ring-cyan-400' : ''
                    }`}
                  >
                    {group.label}
                  </button>
                  <input
                    type="number"
                    value={manualBets[group.key as keyof typeof manualBets]}
                    onChange={(e) => {
                      const updatedBets = {
                        ...manualBets,
                        [group.key]: e.target.value
                      }
                      setManualBets(updatedBets)
                      
                      if (betHistory.length > 0 && betHistory[0].spin === null) {
                        const updatedHistory = [...betHistory]
                        updatedHistory[0].bets = updatedBets
                        setBetHistory(updatedHistory)
                      } else if (e.target.value) {
                        setBetHistory([{
                          spin: null,
                          bets: updatedBets,
                          results: {},
                          totalPnL: 0,
                          timestamp: new Date()
                        }, ...betHistory])
                      }
                    }}
                    placeholder="10"
                    className="w-16 px-1 py-1 bg-black/50 border border-gray-600 rounded text-xs text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>{/* Keep your existing betting cards below - they're already in your code */}
        {/* Your existing Manual Betting Cards code stays here */}
        
        {/* Your existing betting matrix code stays here */}
        {/* Keep your existing betting cards - they should be right after Current Bets */}
{/* The betting cards code you already have in lines 1009-1157 stays here */}

{/* After the betting cards, before the closing of TABLE VIEW */}
{/* Current Bets & Stake - Improved with bet display */}
<div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-bold">Current Bets & Stake</h3>
    <div className="flex gap-6 items-center">
      <div className="text-sm">
        <span className="text-gray-400">Active: </span>
        <span className="text-white font-bold">{Object.values(manualBets).filter(v => v).length}</span>
      </div>
      <div className="text-sm">
        <span className="text-gray-400">Total: </span>
        <span className="text-yellow-400 font-bold text-lg">
          ${Object.values(manualBets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
        </span>
      </div>
    </div>
  </div>
  
  {/* Display active bets if any */}
  {Object.values(manualBets).some(v => v) && (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <div className="flex flex-wrap gap-2">
        {Object.entries(manualBets).filter(([_, value]) => value).map(([key, value]) => (
          <div key={key} className="px-2 py-1 bg-black/40 rounded text-xs">
            <span className="text-gray-400">{
              key === 'alt1_1' ? 'A' :
              key === 'alt1_2' ? 'B' :
              key === 'alt2_1' ? 'AA' :
              key === 'alt2_2' ? 'BB' :
              key === 'alt3_1' ? 'AAA' :
              key === 'alt3_2' ? 'BBB' :
              key === 'six1' ? '1st 6' :
              key === 'six2' ? '2nd 6' :
              key === 'six3' ? '3rd 6' :
              key === 'six4' ? '4th 6' :
              key === 'six5' ? '5th 6' :
              key === 'six6' ? '6th 6' :
              key === 'dozen1' ? '1st Doz' :
              key === 'dozen2' ? '2nd Doz' :
              key === 'dozen3' ? '3rd Doz' :
              key === 'col1' ? 'Col 1' :
              key === 'col2' ? 'Col 2' :
              key === 'col3' ? 'Col 3' :
              key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')
            }:</span>
            <span className="text-green-400 font-bold ml-1">${value}</span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
{/* Hot/Cold Visual Reference - Enhanced with click and count */}
<div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
  <div className="flex justify-between items-center mb-3">
    <h4 className="font-bold text-green-400">🔥 Hot/Cold Analysis - Last 36 Spins</h4>
    <button 
      onClick={() => setShowHeatMap(!showHeatMap)}
      className="text-xs text-gray-400 hover:text-white"
    >
      {showHeatMap ? 'Hide' : 'Show'}
    </button>
  </div>
  
  {showHeatMap && (
    <div className="p-3 bg-black/30 rounded">
      <div className="grid grid-cols-12 gap-1 mb-1">
        <div 
          onClick={() => setInputNumber('0')}
          className="col-span-12 bg-green-600 text-white text-center py-2 rounded text-lg font-bold cursor-pointer hover:opacity-80 relative"
        >
          0
          <span className="absolute top-0 right-1 text-xs bg-black/50 px-1 rounded">
            {spins.slice(0, 36).filter(s => s.number === 0).length}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {/* First row - 3rd column numbers */}
        {[3,6,9,12,15,18,21,24,27,30,33,36].map(n => {
          const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
          const hitCount = spins.slice(0, 36).filter(s => s.number === n).length
          const heatColor = hitCount === 0 ? 'opacity-50' : hitCount >= 3 ? 'ring-2 ring-yellow-400' : ''
          return (
            <div 
              key={n} 
              onClick={() => setInputNumber(n.toString())}
              className={`${redNumbers.includes(n) ? 'bg-red-600' : 'bg-black'} text-white text-center py-2 rounded text-sm font-bold cursor-pointer hover:opacity-80 relative ${heatColor}`}
            >
              {n}
              {hitCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded-full font-bold">
                  {hitCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-12 gap-1 mt-1">
        {/* Second row - 2nd column numbers */}
        {[2,5,8,11,14,17,20,23,26,29,32,35].map(n => {
          const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
          const hitCount = spins.slice(0, 36).filter(s => s.number === n).length
          const heatColor = hitCount === 0 ? 'opacity-50' : hitCount >= 3 ? 'ring-2 ring-yellow-400' : ''
          return (
            <div 
              key={n}
              onClick={() => setInputNumber(n.toString())}
              className={`${redNumbers.includes(n) ? 'bg-red-600' : 'bg-black'} text-white text-center py-2 rounded text-sm font-bold cursor-pointer hover:opacity-80 relative ${heatColor}`}
            >
              {n}
              {hitCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded-full font-bold">
                  {hitCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-12 gap-1 mt-1">
        {/* Third row - 1st column numbers */}
        {[1,4,7,10,13,16,19,22,25,28,31,34].map(n => {
          const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
          const hitCount = spins.slice(0, 36).filter(s => s.number === n).length
          const heatColor = hitCount === 0 ? 'opacity-50' : hitCount >= 3 ? 'ring-2 ring-yellow-400' : ''
          return (
            <div 
              key={n}
              onClick={() => setInputNumber(n.toString())}
              className={`${redNumbers.includes(n) ? 'bg-red-600' : 'bg-black'} text-white text-center py-2 rounded text-sm font-bold cursor-pointer hover:opacity-80 relative ${heatColor}`}
            >
              {n}
              {hitCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded-full font-bold">
                  {hitCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Heat Map Legend */}
      <div className="mt-3 pt-2 border-t border-gray-600 text-xs flex gap-4">
        <span className="text-gray-400">Cold (0 hits): Faded</span>
        <span className="text-yellow-400">Hot (3+ hits): Yellow ring</span>
        <span className="text-white">Hit count shown in corner</span>
      </div>
    </div>
  )}
</div>

{/* Combined Recent Numbers and Add Number - Single Row */}
<div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
  <div className="flex items-center gap-4">
    {/* Recent Numbers - Left Side */}
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-blue-400 whitespace-nowrap">Recent:</span>
      <div className="flex gap-1">
        {spins.slice(0, 8).map((spin, idx) => {
          const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
          return (
            <div 
              key={idx} 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                ${spin.number === 0 ? 'bg-green-600' : 
                  redNumbers.includes(spin.number) ? 'bg-red-600' : 'bg-black border border-gray-600'}`}
            >
              {spin.number}
            </div>
          )
        })}
        {spins.length === 0 && (
          <span className="text-gray-500 text-xs">No numbers yet</span>
        )}
      </div>
    </div>
    
    {/* Divider */}
    <div className="h-8 w-px bg-gray-600"></div>
    
    {/* Add Number - Right Side */}
    <div className="flex items-center gap-2 flex-1">
      <span className="text-sm font-bold text-green-400 whitespace-nowrap">Add:</span>
      <input
        type="number"
        min="0"
        max="36"
        value={inputNumber}
        onChange={(e) => setInputNumber(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            addNumber()
          }
        }}
        placeholder="0-36"
        className="w-20 px-2 py-1.5 bg-black/50 border border-gray-600 rounded text-center text-sm font-bold focus:border-green-500 focus:outline-none"
      />
      <button
        onClick={() => addNumber()}
        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold transition-colors"
      >
        ADD
      </button>
      <button
        onClick={() => setInputNumber('')}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-bold transition-colors"
      >
        CLR
      </button>
    </div>
  </div>
</div>
{/* Betting Performance Matrix */}
<div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mt-4">
  <h3 className="text-lg font-bold mb-3 text-blue-300">Betting Performance Matrix</h3>
  <div className="overflow-x-auto">
    <div className="max-h-96 overflow-y-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-800 z-10">
          <tr>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">Num</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">R</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">B</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">Ev</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">Od</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">L</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">H</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">D1</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">D2</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">D3</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">C1</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">C2</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">C3</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">1-6</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">7-12</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">13-18</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">19-24</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">25-30</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">31-36</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">A</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">B</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">AA</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">BB</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">AAA</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">BBB</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">Ed</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">Ce</th>
          </tr>
        </thead>
        <tbody>
          {betHistory.map((row, index) => (
            <tr key={index} className={row.spin === null ? 'bg-amber-900/20' : 'hover:bg-gray-800/50'}>
              <td className="px-2 py-1 text-center border border-gray-700 text-xs font-bold">
                {row.spin === null ? '...' : row.spin}
              </td>
              {['red', 'black', 'even', 'odd', 'low', 'high', 'dozen1', 'dozen2', 'dozen3',
                'col1', 'col2', 'col3', 'six1', 'six2', 'six3', 'six4', 'six5', 'six6',
                'alt1_1', 'alt1_2', 'alt2_1', 'alt2_2', 'alt3_1', 'alt3_2', 'edge', 'center'].map(betKey => (
                <td key={betKey} className="px-2 py-1 text-center border border-gray-700 text-xs">
                  {row.spin === null && row.bets[betKey] ? 
                    <span className="text-yellow-400">${row.bets[betKey]}</span> : 
                    row.results?.[betKey] ? 
                    <span className={row.results[betKey] > 0 ? 'text-green-400' : 'text-red-400'}>
                      {row.results[betKey] > 0 ? '+' : ''}{row.results[betKey]}
                    </span> : ''}
                </td>
              ))}
            </tr>
          ))}
          {/* Fill empty rows */}
          {Array.from({ length: Math.max(0, 10 - betHistory.length) }, (_, index) => (
            <tr key={`empty-${index}`} className="hover:bg-gray-800/50">
              <td className="px-2 py-1 text-center border border-gray-700 text-xs font-bold"></td>
              {Array.from({ length: 26 }, (_, colIndex) => (
                <td key={colIndex} className="px-2 py-1 text-center border border-gray-700 text-xs"></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {/* Session totals */}
    <div className="mt-2 p-2 bg-gray-800 rounded">
      <div className="flex justify-between text-sm">
        <span>Session P/L: <span className={sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
          ${Math.abs(sessionPnL).toFixed(2)}
        </span></span>
        <span>Total Spins: {betHistory.filter(b => b.spin !== null).length}</span>
        <span>Win Rate: {betHistory.filter(b => b.spin !== null).length > 0 ? 
          Math.round((betHistory.filter(b => b.totalPnL > 0).length / betHistory.filter(b => b.spin !== null).length) * 100) : 0}%</span>
      </div>
    </div>
  </div>
</div>
{/* Keep your existing betting performance matrix - it should already be in your code */}
{/* The matrix code you have in lines 1158-1194 stays here */}
      </>
    )}
    {/* WHEEL VIEW */}
    {actionView === 'wheel' && (
      <WheelView
        manualBets={manualBets}
        setManualBets={setManualBets}
        betHistory={betHistory}
        setBetHistory={setBetHistory}
        spins={spins.map(s => s.number)}
        inputNumber={inputNumber}
        setInputNumber={setInputNumber}
        addNumber={addNumber}
        playerContext={playerContext}
        sessionPnL={sessionPnL}
        showHeatMap={showHeatMap}
        setShowHeatMap={setShowHeatMap}
      />
    )}
    </div>
  )}
              </div>
            )}

            {assistantSubTab === 'performance' && (
  <div className="bg-gray-800 rounded-xl p-6">
    <h2 className="text-2xl font-bold text-white mb-6">Performance Matrix</h2>
    <p className="text-gray-400">27-column betting matrix coming soon...</p>
  </div>
)}

{assistantSubTab === 'analysis' && (
  <div className="bg-gray-800 rounded-xl p-6">
    <h2 className="text-2xl font-bold text-white mb-6">AI Analysis</h2>
    {/* Analysis content */}
  </div>
)}
          </div>
        
      </div>
    </div>
  )
}