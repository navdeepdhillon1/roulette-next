'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getNumberProperties, NUMBERS, checkIfGroupWon, getGroupPayout, type GroupKey } from '@/lib/roulette-logic'
import type { Session, Spin } from '@/lib/types'
import { useRouletteSession } from '@/hooks/useRouletteSession'
import HeaderBar from '@/components/roulette/HeaderBar'
import EntryPanel from '@/components/roulette/EntryPanel'
import CurrentBetsSummary from '@/components/roulette/CurrentBetsSummary'
import HeatmapGrid from '@/components/roulette/HeatmapGrid'
import BettingCards18 from '@/components/roulette/BettingCards18'
import BettingCards12 from '@/components/roulette/BettingCards12'
import BettingCards6 from '@/components/roulette/BettingCards6'
import HistoryTable from '@/components/roulette/HistoryTable'
import StatsMatrix from '@/components/roulette/StatsMatrix'
import WheelView from '@/components/WheelView'
import { calculateHitCounts, calculateAbsence, calculateConsecutive, expectedPercentageFor, statusFrom } from '@/lib/roulette-analytics'

// Type definitions
type MainTab = 'table-view' | 'table-bets' | 'table-stats'
type AssistantSubTab = 'setup' | 'action' | 'performance' | 'analysis'
type StorageMode = 'local' | 'cloud'

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
  
  // Use Supabase hook only when in cloud mode
  const { 
    session: cloudSession, 
    spins: cloudSpins, 
    loading: sessionLoading, 
    addSpin: addCloudSpin, 
    resetSession: resetCloudSession 
  } = storageMode === 'cloud' ? useRouletteSession() : { 
    session: null, 
    spins: [], 
    loading: false, 
    addSpin: async () => null, 
    resetSession: async () => {} 
  }
  
  // Unified getters
  const session = storageMode === 'cloud' ? cloudSession : localSession
  const spins = storageMode === 'cloud' ? cloudSpins : localSpins
  
  const [inputNumber, setInputNumber] = useState('')
  const [actionView, setActionView] = useState('table-bets')
  const [showHeatMap, setShowHeatMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('table-view')
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantSubTab, setAssistantSubTab] = useState<AssistantSubTab>('setup')
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  
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
      localStorage.setItem('currentSession', JSON.stringify(newSession))
    }
    
    // Set financial tracking with user's configured values
    setStartingBankroll(playerSetup.bankroll)
    setCurrentBankroll(playerSetup.bankroll)
    setSessionPnL(0)
    setSessionStartTime(new Date())
    
    // Move to action tab after session creation
    setAssistantSubTab('action')
  }

  const addNumber = async () => {
    const num = parseInt(inputNumber)
    if (isNaN(num) || num < 0 || num > 36) return
    setLoading(true)
    
    // Add to appropriate storage
    if (storageMode === 'cloud' && session) {
      await addCloudSpin(num)
    } else {
      // Local storage
      const properties = getNumberProperties(num)
      const newSpin: Spin = {
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
    
    // Process bets if any
    if (betHistory.length > 0 && betHistory[0].spin === null) {
      const updatedHistory = [...betHistory]
      updatedHistory[0].spin = num
      
      const results: { [key: string]: number } = {}
      let totalPnL = 0
      
      Object.entries(updatedHistory[0].bets).forEach(([key, value]) => {
        if (value) {
          const betAmount = parseFloat(value as string)
          const won = checkIfGroupWon(num, key as GroupKey)
          if (won) {
            const payout = getGroupPayout(key as GroupKey)
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
      setCurrentBankroll(prev => prev + totalPnL)
      
      // Clear bets for next round
      setManualBets({
        red: '', black: '', even: '', odd: '', low: '', high: '',
        alt1_1: '', alt1_2: '', alt2_1: '', alt2_2: '', alt3_1: '', alt3_2: '',
        edge: '', center: '', dozen1: '', dozen2: '', dozen3: '',
        col1: '', col2: '', col3: '', six1: '', six2: '', six3: '',
        six4: '', six5: '', six6: ''
      })
    }
    
    setInputNumber('')
    setLoading(false)
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
      { id: '3rd_column', name: '3rd Col', color: 'text-lime-400' }
    ]
    
    return groups.map(group => {
      const hits = spins.filter(spin => matchesGroup(spin, group.id)).length
      const percentage = (hits / spins.length) * 100
      const expected = expectedPercentageFor(group.id)
      
      return {
        ...group,
        l9: hits,
        l18: hits,
        l27: hits,
        l36: hits,
        absenceNow: 0,
        absenceMax: 0,
        consecutiveNow: 0,
        consecutiveMax: 0,
        lastSpin: 0,
        percentage,
        expected,
        deviation: percentage - expected,
        status: 'NORM' as const
      }
    })
  }

  const groupStats = calculateGroupStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] text-white">
      <div className="max-w-7xl mx-auto p-4">
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

        {/* Main Header - Only show when session exists */}
{session && (
  <HeaderBar
    session={session}
    spinsCount={session.total_spins}
    onStartSession={openSessionSetup}
    onAssistantClick={() => setShowAssistant(!showAssistant)}
    isAssistantActive={showAssistant}
    userProfile={userProfile}
    storageMode={storageMode}
  />
)}

        {/* Financial Bar - Only shows when Assistant is active AND session exists */}
        {showAssistant && session && (
          <div className="bg-black/60 backdrop-blur border-y border-yellow-400/30 px-6 py-3 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Bankroll</span>
                  <p className="text-2xl font-bold text-white">${currentBankroll.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-yellow-400/60 text-xs uppercase tracking-wider">P/L</span>
                  <p className={`text-xl font-bold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sessionPnL >= 0 ? '+' : ''}${sessionPnL.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-yellow-400/60 text-xs uppercase tracking-wider">ROI</span>
                  <p className={`text-lg ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {startingBankroll > 0 ? ((sessionPnL / startingBankroll) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Target</span>
                  <p className="text-lg text-green-400">${playerSetup.targetProfit}</p>
                </div>
                <div className="text-right">
                  <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Stop Loss</span>
                  <p className="text-lg text-red-400">-${playerSetup.stopLoss}</p>
                </div>
                {sessionStartTime && (
                  <div className="text-right">
                    <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Time</span>
                    <p className="text-lg text-white">
                      {Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000)}m
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
{/* Main Content Area */}
{!session && !showAssistant ? (
          // Landing Page - No Active Session, No Setup showing
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎰</div>
              <h2 className="text-3xl font-bold text-yellow-400">Ready to Track?</h2>
              <p className="text-gray-400">
                {storageMode === 'local' 
                  ? 'Start a practice session (data saved locally)'
                  : 'Start a professional session (data saved to cloud)'}
              </p>
              <button
                onClick={() => {
                  console.log('Center button clicked - opening session setup')
                  setShowAssistant(true)
                  setAssistantSubTab('setup')
                }}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg text-xl shadow-2xl hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
              >
                ✨ Start New Session
              </button>
              {storageMode === 'local' && (
                <p className="text-sm text-yellow-400/60">
                  <a href="#" className="underline">Sign in</a> to save sessions permanently
                </p>
              )}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Starting Bankroll</label>
                    <input
                      type="number"
                      value={playerSetup.bankroll}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setPlayerSetup({...playerSetup, bankroll: value})
                        setStartingBankroll(value)
                        setCurrentBankroll(value)
                      }}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Target Profit</label>
                    <input
                      type="number"
                      value={playerSetup.targetProfit}
                      onChange={(e) => setPlayerSetup({...playerSetup, targetProfit: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Stop Loss</label>
                    <input
                      type="number"
                      value={playerSetup.stopLoss}
                      onChange={(e) => setPlayerSetup({...playerSetup, stopLoss: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-yellow-400/80 text-sm mb-2">Unit Size</label>
                    <input
                      type="number"
                      value={playerSetup.betUnit}
                      onChange={(e) => setPlayerSetup({...playerSetup, betUnit: Number(e.target.value)})}
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
        
              <>
            {/* Main Tabs - Only show when session is active */}
            {!showAssistant && (
              <>
                <div className="flex gap-2 mb-6 overflow-x-auto bg-black/40 p-2 rounded-lg backdrop-blur">
                  <button
                    onClick={() => setActiveTab('table-view')}
                    className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === 'table-view'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setActiveTab('table-bets')}
                    className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === 'table-bets'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    Table Bets
                  </button>
                  <button
                    onClick={() => setActiveTab('table-stats')}
                    className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === 'table-stats'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    Table Stats
                  </button>
                </div>

                <div className="bg-black/40 backdrop-blur rounded-xl p-6 border border-yellow-400/20">
                  {activeTab === 'table-view' && (
                    <div className="space-y-8">
                      <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-yellow-400">Number Entry</h2>
                        <EntryPanel
                          inputNumber={inputNumber}
                          setInputNumber={setInputNumber}
                          addNumber={addNumber}
                          loading={loading}
                        />
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
                      <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-yellow-400">History</h2>
                        <HistoryTable spins={spins} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'table-bets' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-yellow-400">Table Betting</h2>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <BettingCards18
                          manualBets={manualBets}
                          setManualBets={setManualBets}
                          playerUnit={playerSetup.betUnit}
                          betHistory={betHistory}
                          setBetHistory={setBetHistory}
                        />
                        <BettingCards12
                          manualBets={manualBets}
                          setManualBets={setManualBets}
                          playerUnit={playerSetup.betUnit}
                          betHistory={betHistory}
                          setBetHistory={setBetHistory}
                        />
                        <BettingCards6
                          manualBets={manualBets}
                          setManualBets={setManualBets}
                          playerUnit={playerSetup.betUnit}
                          betHistory={betHistory}
                          setBetHistory={setBetHistory}
                        />
                      </div>
                      
                      <CurrentBetsSummary manualBets={manualBets} />
                      
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            if (Object.values(manualBets).some(v => v)) {
                              setBetHistory([{
                                spin: null,
                                bets: {...manualBets},
                                results: {},
                                totalPnL: 0,
                                timestamp: new Date()
                              }, ...betHistory])
                            }
                          }}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all"
                          disabled={!Object.values(manualBets).some(v => v)}
                        >
                          Place Bets
                        </button>
                        
                        <button
                          onClick={() => {
                            setManualBets({
                              red: '', black: '', even: '', odd: '', low: '', high: '',
                              alt1_1: '', alt1_2: '', alt2_1: '', alt2_2: '', alt3_1: '', alt3_2: '',
                              edge: '', center: '', dozen1: '', dozen2: '', dozen3: '',
                              col1: '', col2: '', col3: '', six1: '', six2: '', six3: '',
                              six4: '', six5: '', six6: ''
                            })
                          }}
                          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-all"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
{/* Hot/Cold Visual Reference */}
<div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
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
    <HeatmapGrid spins={spins} setInputNumber={setInputNumber} />
  )}
</div>
{/* Recent Numbers and Add Number Row */}
<div className="bg-gray-800 rounded-lg border border-gray-700 p-3 mt-4">
  <div className="flex items-center gap-4">
    {/* Recent Numbers - Left Side */}
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-blue-400 whitespace-nowrap">Last 10:</span>
      <div className="flex gap-1">
        {spins.slice(0, 10).map((spin, idx) => (
          <div 
            key={idx} 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
              ${spin.number === 0 ? 'bg-green-600' : 
                NUMBERS.RED.includes(spin.number) ? 'bg-red-600' : 'bg-black border border-gray-600'}`}
          >
            {spin.number}
          </div>
        ))}
        {spins.length === 0 && (
          <span className="text-gray-500 text-xs">No numbers yet</span>
        )}
      </div>
    </div>
    
    {/* Divider */}
    <div className="h-8 w-px bg-gray-600"></div>
    
    {/* Add Number - Right Side */}
    <div className="flex items-center gap-4">
      <span className="text-sm font-bold text-green-400">Add Number:</span>
      <input
        type="number"
        min="0"
        max="36"
        value={inputNumber}
        onChange={(e) => setInputNumber(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addNumber()}
        placeholder="0-36"
        className="w-20 px-2 py-1.5 bg-black/50 border border-gray-600 rounded text-center text-sm font-bold"
      />
      <button
        onClick={addNumber}
        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold text-white"
      >
        ADD
      </button>
    </div>
  </div>
</div>

<div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
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
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">S1</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">S2</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">S3</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">S4</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">S5</th>
            <th className="px-2 py-1 text-center border border-gray-700 bg-gray-800 text-xs">S6</th>
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
          {/* Current pending bet row (if exists) */}
          {Object.values(manualBets).some(v => v) && !betHistory.some(h => h.spin === null) && (
            <tr className="bg-amber-900/20">
              <td className="px-2 py-1 text-center border border-gray-700 text-xs font-bold">...</td>
              {['red', 'black', 'even', 'odd', 'low', 'high', 'dozen1', 'dozen2', 'dozen3',
                'col1', 'col2', 'col3', 'six1', 'six2', 'six3', 'six4', 'six5', 'six6',
                'alt1_1', 'alt1_2', 'alt2_1', 'alt2_2', 'alt3_1', 'alt3_2', 'edge', 'center'].map(betKey => (
                <td key={betKey} className="px-2 py-1 text-center border border-gray-700 text-xs">
                  {manualBets[betKey] && <span className="text-yellow-400">${manualBets[betKey]}</span>}
                </td>
              ))}
            </tr>
          )}
          
          {/* Completed bet rows */}
          {betHistory.filter(h => h.spin !== null).map((row, index) => (
            <tr key={index} className="hover:bg-gray-800/50">
              <td className="px-2 py-1 text-center border border-gray-700 text-xs font-bold">
                {row.spin}
              </td>
              {['red', 'black', 'even', 'odd', 'low', 'high', 'dozen1', 'dozen2', 'dozen3',
                'col1', 'col2', 'col3', 'six1', 'six2', 'six3', 'six4', 'six5', 'six6',
                'alt1_1', 'alt1_2', 'alt2_1', 'alt2_2', 'alt3_1', 'alt3_2', 'edge', 'center'].map(betKey => (
                <td key={betKey} className="px-2 py-1 text-center border border-gray-700 text-xs">
                  {row.bets[betKey] && (
                    <span className={row.results[betKey] > 0 ? 'text-green-400 font-bold' : 'text-red-400'}>
                      {row.results[betKey] > 0 ? '+' : ''}{row.results[betKey] || `-${row.bets[betKey]}`}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>


                  {activeTab === 'table-stats' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-yellow-400">Table Statistics</h2>
                      <StatsMatrix groupStats={groupStats || []} spinsCount={spins.length} />
                    </div>
                  )}
                </div>
              </>
            )}
            {/* Assistant Section - Now opens from "Start New Session" when no session exists */}
            {showAssistant && (
              <>
                <div className="flex gap-2 mb-6 overflow-x-auto bg-black/40 p-2 rounded-lg backdrop-blur">
                  <button
                    onClick={() => setActiveTab('table-view')}
                    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === 'table-view'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setActiveTab('table-bets')}
                    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === 'table-bets'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    Table Bets
                  </button>
                  <button
                    onClick={() => setActiveTab('table-stats')}
                    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === 'table-stats'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    Table Stats
                  </button>
                </div>

                <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/20">
                  <div className="flex gap-0 border-b border-yellow-400/20">
                    <button
                      onClick={() => setAssistantSubTab('setup')}
                      className={`px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 ${
                        assistantSubTab === 'setup'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Setup
                    </button>
                    <button
                      onClick={() => setAssistantSubTab('action')}
                      className={`px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 ${
                        assistantSubTab === 'action'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!session}
                    >
                      Game Action
                    </button>
                    <button
                      onClick={() => setAssistantSubTab('performance')}
                      className={`px-6 py-3 font-semibold transition-all border-r border-yellow-400/20 ${
                        assistantSubTab === 'performance'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!session}
                    >
                      Performance
                    </button>
                    <button
                      onClick={() => setAssistantSubTab('analysis')}
                      className={`px-6 py-3 font-semibold transition-all ${
                        assistantSubTab === 'analysis'
                          ? 'bg-gradient-to-b from-yellow-400/20 to-transparent text-yellow-400'
                          : 'text-gray-400 hover:text-white'
                      } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!session}
                    >
                      Analysis
                    </button>
                  </div>

                  <div className="p-6">
                    {assistantSubTab === 'setup' && (
                      <div className="max-w-2xl mx-auto space-y-6">
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
                                const value = Number(e.target.value)
                                setPlayerSetup({...playerSetup, bankroll: value})
                                if (!session) {
                                  setStartingBankroll(value)
                                  setCurrentBankroll(value)
                                }
                              }}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="100"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Target Profit</label>
                            <input
                              type="number"
                              value={playerSetup.targetProfit}
                              onChange={(e) => setPlayerSetup({...playerSetup, targetProfit: Number(e.target.value)})}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Stop Loss</label>
                            <input
                              type="number"
                              value={playerSetup.stopLoss}
                              onChange={(e) => setPlayerSetup({...playerSetup, stopLoss: Number(e.target.value)})}
                              className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white text-xl focus:border-yellow-400 focus:outline-none"
                              placeholder="50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-yellow-400/80 text-sm mb-2">Unit Size</label>
                            <input
                              type="number"
                              value={playerSetup.betUnit}
                              onChange={(e) => setPlayerSetup({...playerSetup, betUnit: Number(e.target.value)})}
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

                    {assistantSubTab === 'action' && session && (
                      <div className="space-y-6">
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setActionView('table-bets')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              actionView === 'table-bets' 
                                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' 
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                            }`}
                          >
                            📊 Table Bets
                          </button>
                          <button
                            onClick={() => setActionView('wheel-bets')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              actionView === 'wheel-bets' 
                                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' 
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                            }`}
                          >
                            🎯 Wheel Bets
                          </button>
                        </div>
                        
                        {/* Content based on actionView */}
                        {actionView === 'table-bets' && (
                          <div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <BettingCards18
                                manualBets={manualBets}
                                setManualBets={setManualBets}
                                playerUnit={playerSetup.betUnit}
                                betHistory={betHistory}
                                setBetHistory={setBetHistory}
                              />
                              <BettingCards12
                                manualBets={manualBets}
                                setManualBets={setManualBets}
                                playerUnit={playerSetup.betUnit}
                                betHistory={betHistory}
                                setBetHistory={setBetHistory}
                              />
                              <BettingCards6
                                manualBets={manualBets}
                                setManualBets={setManualBets}
                                playerUnit={playerSetup.betUnit}
                                betHistory={betHistory}
                                setBetHistory={setBetHistory}
                              />
                            </div>
                            
                            <CurrentBetsSummary manualBets={manualBets} />
                            
                            <div className="mt-4 bg-gray-800 rounded-lg border border-gray-700 p-3">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-green-400">Add Number:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="36"
                                  value={inputNumber}
                                  onChange={(e) => setInputNumber(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && addNumber()}
                                  placeholder="0-36"
                                  className="w-20 px-2 py-1.5 bg-black/50 border border-gray-600 rounded text-center text-sm font-bold"
                                />
                                <button
                                  onClick={addNumber}
                                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold text-white"
                                >
                                  ADD
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {actionView === 'wheel-bets' && (
                          <WheelView
                            manualBets={manualBets}
                            setManualBets={setManualBets}
                            betHistory={betHistory}
                            setBetHistory={setBetHistory}
                            spins={spins.map(s => s.number)}
                            inputNumber={inputNumber}
                            setInputNumber={setInputNumber}
                            addNumber={addNumber}
                            playerContext={{ unitSize: playerSetup.betUnit }}
                            sessionPnL={sessionPnL}
                            showHeatMap={showHeatMap}
                            setShowHeatMap={setShowHeatMap}
                          />
                        )}
                      </div>
                    )}

                    {assistantSubTab === 'performance' && session && (
                      <div className="space-y-6">
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

                    {assistantSubTab === 'analysis' && session && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-yellow-400">AI Analysis</h2>
                        <p className="text-gray-400">Pattern analysis coming soon...</p>
                        {storageMode === 'local' && (
                          <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                            <p className="text-yellow-400">
                              ⚠️ Sign in to enable AI predictions and permanent session storage
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}