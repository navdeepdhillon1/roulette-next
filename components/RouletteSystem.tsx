'use client'
/* eslint-disable react-hooks/exhaustive-deps */


import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getNumberProperties, detectAnomalies, NUMBERS } from '@/lib/roulette-logic'
import type { Session, Spin, Anomaly } from '@/lib/types'
import BettingGroupVisuals from './BettingGroupVisuals';
// Add these type definitions after your imports
type AssistantSubTab = 'setup' | 'action' | 'performance' | 'analysis';

interface PlayerSetup {
  bankroll: number;
  targetProfit: number;
  stopLoss: number;
  timeAvailable: number; // in minutes
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
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [inputNumber, setInputNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'anomalies' | 'stats' | 'assistant'>('entry')
const [assistantSubTab, setAssistantSubTab] = useState<AssistantSubTab>('setup');
const [playerSetup, setPlayerSetup] = useState<PlayerSetup>({
  bankroll: 1000,
  targetProfit: 200,
  stopLoss: 300,
  timeAvailable: 120,
  betUnit: 10,
  progressionStyle: 'flat',
  playerLevel: 'intermediate'
});
const [currentBets, setCurrentBets] = useState<CurrentBet[]>([]);
const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  useEffect(() => {
    initializeSession()
  }, [])

  useEffect(() => {
    if (session) {
      loadSpins()
      loadAnomalies()
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
      const detected = detectAnomalies(data)
      if (detected.length > 0) {
        saveAnomalies(detected)
      }
    }
  }

  const loadAnomalies = async () => {
    if (!session) return
    
    const { data } = await supabase
      .from('anomalies')
      .select('*')
      .eq('session_id', session.id)
      .eq('resolved', false)
      .order('detected_at', { ascending: false })
    
    if (data) setAnomalies(data)
  }

  const saveAnomalies = async (detectedAnomalies: Anomaly[]) => {
    if (!session) return
    
    for (const anomaly of detectedAnomalies) {
      await supabase
        .from('anomalies')
        .insert({
          ...anomaly,
          session_id: session.id
        })
      
      setAnomalies(prev => [anomaly, ...prev])
    }
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
      
      const detected = detectAnomalies(newSpins)
      if (detected.length > 0) {
        saveAnomalies(detected)
      }
      
      setSession(prev => prev ? {
        ...prev,
        total_spins: prev.total_spins + 1
      } : null)
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
      setAnomalies([])
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
// Add these helper functions after your existing getStatistics function in RouletteSystem.tsx

const calculateGroupStats = () => {
  if (spins.length === 0) return null;
  
  // Helper function to get spins for different windows
  const getLastNSpins = (n: number) => spins.slice(0, Math.min(n, spins.length));
  
  // Helper function to check if a spin matches a group
  const matchesGroup = (spin: Spin, group: string): boolean => {
    const num = spin.number;
    
    switch(group) {
      case 'red': return spin.color === 'red';
      case 'black': return spin.color === 'black';
      case 'green': return spin.color === 'green';
      case 'even': return spin.even_odd === 'even';
      case 'odd': return spin.even_odd === 'odd';
      case 'low': return spin.low_high === 'low';
      case 'high': return spin.low_high === 'high';
      case '1st_dozen': return spin.dozen === 'first';
      case '2nd_dozen': return spin.dozen === 'second';
      case '3rd_dozen': return spin.dozen === 'third';
      case '1st_column': return spin.column_num === 1;
      case '2nd_column': return spin.column_num === 2;
      case '3rd_column': return spin.column_num === 3;
      
      // Alt1 groups (A/B pattern)
      case 'alt1_a': return num > 0 && [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num);
      case 'alt1_b': return num > 0 && [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num);
      
      // Alt2 groups (AA/BB pattern)
      case 'alt2_aa': return num > 0 && [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num);
      case 'alt2_bb': return num > 0 && [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num);
      
      // Alt3 groups (AAA/BBB pattern)
      case 'alt3_aaa': return num > 0 && [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num);
      case 'alt3_bbb': return num > 0 && [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num);
      
      // Edge/Center
      case 'edge': return num > 0 && [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num);
      case 'center': return num > 0 && [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num);
      
      // Sixes
      case '1st_six': return num >= 1 && num <= 6;
      case '2nd_six': return num >= 7 && num <= 12;
      case '3rd_six': return num >= 13 && num <= 18;
      case '4th_six': return num >= 19 && num <= 24;
      case '5th_six': return num >= 25 && num <= 30;
      case '6th_six': return num >= 31 && num <= 36;
      
      default: return false;
    }
  };
  
  // Calculate hit counts for different windows
  const calculateHitCounts = (group: string) => {
    const windows = [9, 18, 27, 36];
    const counts: number[] = [];
    
    windows.forEach(window => {
      const lastNSpins = getLastNSpins(window);
      const hits = lastNSpins.filter(spin => matchesGroup(spin, group)).length;
      counts.push(hits);
    });
    
    return counts;
  };
  
  // Calculate absence (spins since last hit)
  const calculateAbsence = (group: string): { now: number, max: number } => {
    let currentAbsence = 0;
    let maxAbsence = 0;
    let tempAbsence = 0;
    
    for (let i = 0; i < spins.length; i++) {
      if (matchesGroup(spins[i], group)) {
        if (i === 0) {
          currentAbsence = 0;
        }
        maxAbsence = Math.max(maxAbsence, tempAbsence);
        tempAbsence = 0;
      } else {
        tempAbsence++;
        if (i === 0) {
          currentAbsence = tempAbsence;
        }
      }
    }
    maxAbsence = Math.max(maxAbsence, tempAbsence);
    
    // If the group hasn't hit yet in recent spins, count from the start
    const lastHitIndex = spins.findIndex(spin => matchesGroup(spin, group));
    if (lastHitIndex === -1) {
      currentAbsence = spins.length;
    } else {
      currentAbsence = lastHitIndex;
    }
    
    return { now: currentAbsence, max: maxAbsence };
  };
  
  // Calculate consecutive hits
  const calculateConsecutive = (group: string): { now: number, max: number } => {
    let currentConsecutive = 0;
    let maxConsecutive = 0;
    let tempConsecutive = 0;
    
    for (let i = 0; i < spins.length; i++) {
      if (matchesGroup(spins[i], group)) {
        tempConsecutive++;
        if (i === 0 || (i === 1 && tempConsecutive === 2)) {
          currentConsecutive = tempConsecutive;
        }
        maxConsecutive = Math.max(maxConsecutive, tempConsecutive);
      } else {
        tempConsecutive = 0;
        if (i === 0) {
          currentConsecutive = 0;
        }
      }
    }
    
    return { now: currentConsecutive, max: maxConsecutive };
  };
  
  // Calculate percentage
  const calculatePercentage = (group: string): number => {
    const hits = spins.filter(spin => matchesGroup(spin, group)).length;
    return (hits / spins.length) * 100;
  };
  
  // Get expected percentage for each group
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
    };
    return expectedMap[group] || 0;
  };
  
  // Determine status based on deviation
  const getStatus = (percentage: number, expected: number, absence: number): string => {
    const deviation = percentage - expected;
    const absDeviation = Math.abs(deviation);
    
    // Check for critical absence
    if (absence > 15 && expected > 30) return 'ALERT';
    if (absence > 20 && expected > 15) return 'ALERT';
    if (absence > 30 && expected > 2) return 'ALERT';
    
    // Check deviation
    if (absDeviation < expected * 0.1) return 'NORM';
    if (deviation > expected * 0.15) return 'HOT';
    if (deviation < -expected * 0.15) return 'COLD';
    return 'NORM';
  };
  
  // Build stats for all groups
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
  ];
  
  const groupStats = groups.map(group => {
    const hitCounts = calculateHitCounts(group.id);
    const absence = calculateAbsence(group.id);
    const consecutive = calculateConsecutive(group.id);
    const percentage = calculatePercentage(group.id);
    const expected = getExpectedPercentage(group.id);
    const deviation = percentage - expected;
    const status = getStatus(percentage, expected, absence.now);
    
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
      lastSpin: absence.now, // Same as absence now
      percentage,
      expected,
      deviation,
      status
    };
  });
  
  return groupStats;
};

// Get the calculated stats
const groupStats = calculateGroupStats();
  const stats = getStatistics()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            Advanced Roulette Analysis System
          </h1>
          <p className="text-gray-400 mt-2">Anomaly Detection • Pattern Analysis • Statistical Tracking</p>
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

        {anomalies.filter(a => a.severity === 'critical').length > 0 && (
          <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-red-400 font-bold">CRITICAL ANOMALY DETECTED!</h3>
                <p className="text-red-200">
                  {anomalies.filter(a => a.severity === 'critical')[0].description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['entry', 'history', 'stats', 'anomalies', 'assistant'] as const).map(tab => (
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
        {/* Color Legend */}
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

        {/* Comprehensive History Table */}
        {/* Replace your existing History tab table with this complete version */}
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
        const num = spin.number;
        
        // Calculate all group memberships
        const alt1 = num === 0 ? '-' : 
          [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B';
        
        const alt2 = num === 0 ? '-' :
          [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB';
        
        const alt3 = num === 0 ? '-' :
          [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB';
        
        const edgeCenter = num === 0 ? '-' :
          [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) ? 'E' : 'C';
        
        const sixGroup = num === 0 ? '-' :
          num <= 6 ? '1st' :
          num <= 12 ? '2nd' :
          num <= 18 ? '3rd' :
          num <= 24 ? '4th' :
          num <= 30 ? '5th' : '6th';
        
        return (
          <tr key={spin.id || index} className="border-b border-gray-700/50 hover:bg-gray-800/50">
            {/* Number with color background */}
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
            
            {/* Color */}
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
            
            {/* Even/Odd */}
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
            
            {/* Low/High */}
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
            
            {/* Column */}
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
            
            {/* Dozen */}
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
            
            {/* Alt1 (A/B) */}
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
            
            {/* Alt2 (AA/BB) */}
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
            
            {/* Alt3 (AAA/BBB) */}
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
            
            {/* Edge/Center */}
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
            
            {/* Six Group */}
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
        );
      })}
    </tbody>
 
          </table>
        </div>
      </>
    )}
  </div>
)}
  <div className="space-y-6">
    <h2 className="text-2xl font-bold mb-4">Statistical Analysis</h2>
    
    {!stats ? (
      <p className="text-gray-400 text-center py-8">No data to analyze yet</p>
    ) : (
      <>
        {/* Hot & Cold Numbers Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hot Numbers */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
              🔥 Hot Numbers
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

          {/* Cold Numbers */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
              ❄️ Cold Numbers
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

          {/* Pattern Alerts */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
              📊 Pattern Alerts
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

        {/* Complete Statistical Tracking Table */}
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
  {groupStats && groupStats.map((group, index) => (
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

          {/* Summary Stats */}
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

          {activeTab === 'anomalies' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Anomaly Detection</h2>
              
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No anomalies detected</p>
                  <p className="text-sm text-gray-500 mt-2">System monitors for statistical impossibilities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly, index) => (
                    <div
                      key={anomaly.id || index}
                      className={`
                        p-4 rounded-lg border-2 
                        ${anomaly.severity === 'critical' ? 'border-red-500 bg-red-900/20' :
                          anomaly.severity === 'high' ? 'border-orange-500 bg-orange-900/20' :
                          anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-900/20' :
                          'border-blue-500 bg-blue-900/20'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">
                              {anomaly.anomaly_type.replace('_', ' ').toUpperCase()}
                            </h3>
                            <span className={`
                              px-3 py-1 rounded-full text-xs font-bold uppercase
                              ${anomaly.severity === 'critical' ? 'bg-red-600' :
                                anomaly.severity === 'high' ? 'bg-orange-600' :
                                anomaly.severity === 'medium' ? 'bg-yellow-600' :
                                'bg-blue-600'}
                            `}>
                              {anomaly.severity}
                            </span>
                          </div>
                          <p className="text-gray-300">{anomaly.description}</p>
                          {anomaly.pattern_data && (
                            <div className="mt-2 text-xs text-gray-400">
                              Pattern data: {JSON.stringify(anomaly.pattern_data)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assistant' && (
  <div className="space-y-6">
    {/* Sub-tab Navigation */}
    <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg">
      <button
        onClick={() => setAssistantSubTab('setup')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          assistantSubTab === 'setup'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        ⚙️ Setup
      </button>
      <button
        onClick={() => setAssistantSubTab('action')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          assistantSubTab === 'action'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🎮 Game Action
      </button>
      <button
        onClick={() => setAssistantSubTab('performance')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          assistantSubTab === 'performance'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        💰 Performance
      </button>
      <button
        onClick={() => setAssistantSubTab('analysis')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
          assistantSubTab === 'analysis'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🧠 Analysis
      </button>
    </div>

    {/* Sub-tab Content */}
    {assistantSubTab === 'setup' && (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Session Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bankroll */}
          <div>
            <label className="block text-gray-300 mb-2">💰 Bankroll ($)</label>
            <input
              type="number"
              value={playerSetup.bankroll}
              onChange={(e) => setPlayerSetup({...playerSetup, bankroll: Number(e.target.value)})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Target Profit */}
          <div>
            <label className="block text-gray-300 mb-2">🎯 Target Profit ($)</label>
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

          {/* Stop Loss */}
          <div>
            <label className="block text-gray-300 mb-2">🛑 Stop Loss ($)</label>
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

          {/* Time Available */}
          <div>
            <label className="block text-gray-300 mb-2">⏱️ Time Available (minutes)</label>
            <input
              type="number"
              value={playerSetup.timeAvailable}
              onChange={(e) => setPlayerSetup({...playerSetup, timeAvailable: Number(e.target.value)})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Bet Unit Size */}
          <div>
            <label className="block text-gray-300 mb-2">📊 Bet Unit Size ($)</label>
            <input
              type="number"
              value={playerSetup.betUnit}
              onChange={(e) => setPlayerSetup({...playerSetup, betUnit: Number(e.target.value)})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Progression Style */}
          <div>
            <label className="block text-gray-300 mb-2">📈 Progression Style</label>
            <select
              value={playerSetup.progressionStyle}
              onChange={(e) => setPlayerSetup({...playerSetup, progressionStyle: e.target.value as any})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="flat">Flat Betting</option>
              <option value="martingale">Martingale</option>
              <option value="reverse-martingale">Reverse Martingale</option>
              <option value="fibonacci">Fibonacci</option>
              <option value="dalembert">D'Alembert</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Player Level */}
          <div>
            <label className="block text-gray-300 mb-2">🎮 Player Level</label>
            <select
              value={playerSetup.playerLevel}
              onChange={(e) => setPlayerSetup({...playerSetup, playerLevel: e.target.value as any})}
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
              setSessionStartTime(new Date());
              setAssistantSubTab('action');
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
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Game Action</h2>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-300">Balance: <span className="text-green-400 font-bold">${playerSetup.bankroll}</span></span>
            <span className="text-gray-300">Target: <span className="text-yellow-400 font-bold">${playerSetup.bankroll + playerSetup.targetProfit}</span></span>
            <span className="text-gray-300">Current: <span className="text-white font-bold">+$0</span></span>
            {sessionStartTime && (
              <span className="text-gray-300">Time: <span className="text-blue-400 font-bold">
                {Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000)} min
              </span></span>
            )}
          </div>
        </div>

        {/* Quick Bet Selection */}
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">18's (Even Money - 1:1)</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {['RED', 'BLACK', 'EVEN', 'ODD', '1-18', '19-36', 'EDGE', 'CENTER'].map((bet) => (
                <button
                  key={bet}
                  onClick={() => {
                    const newBet: CurrentBet = {
                      group: bet,
                      amount: playerSetup.betUnit,
                      odds: '1:1',
                      potentialWin: playerSetup.betUnit * 2
                    };
                    setCurrentBets([...currentBets, newBet]);
                  }}
                  className="px-3 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition-all"
                >
                  {bet}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">12's (2:1 Pays)</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {['1st Dozen', '2nd Dozen', '3rd Dozen', 'Column 1', 'Column 2', 'Column 3'].map((bet) => (
                <button
                  key={bet}
                  onClick={() => {
                    const newBet: CurrentBet = {
                      group: bet,
                      amount: playerSetup.betUnit,
                      odds: '2:1',
                      potentialWin: playerSetup.betUnit * 3
                    };
                    setCurrentBets([...currentBets, newBet]);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-all"
                >
                  {bet}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">6's (5:1 Pays)</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {['1-6', '7-12', '13-18', '19-24', '25-30', '31-36'].map((bet) => (
                <button
                  key={bet}
                  onClick={() => {
                    const newBet: CurrentBet = {
                      group: bet,
                      amount: playerSetup.betUnit,
                      odds: '5:1',
                      potentialWin: playerSetup.betUnit * 6
                    };
                    setCurrentBets([...currentBets, newBet]);
                  }}
                  className="px-3 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-all"
                >
                  {bet}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Bets Table */}
        {currentBets.length > 0 && (
          <div className="mt-6 bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Current Bets for Next Spin</h3>
            <table className="w-full">
              <thead>
                <tr className="text-gray-300 text-sm">
                  <th className="text-left p-2">Group</th>
                  <th className="text-center p-2">Bet $</th>
                  <th className="text-center p-2">Odds</th>
                  <th className="text-center p-2">To Win</th>
                  <th className="text-center p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentBets.map((bet, index) => (
                  <tr key={index} className="text-white border-t border-gray-600">
                    <td className="p-2">{bet.group}</td>
                    <td className="text-center p-2">${bet.amount}</td>
                    <td className="text-center p-2">{bet.odds}</td>
                    <td className="text-center p-2">${bet.potentialWin}</td>
                    <td className="text-center p-2">
                      <button
                        onClick={() => {
                          setCurrentBets(currentBets.filter((_, i) => i !== index));
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-500 font-bold text-white">
                  <td className="p-2">Total</td>
                  <td className="text-center p-2">${currentBets.reduce((sum, bet) => sum + bet.amount, 0)}</td>
                  <td></td>
                  <td className="text-center p-2">${currentBets.reduce((sum, bet) => sum + bet.potentialWin, 0)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="flex space-x-4 mt-4">
              <button className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                Confirm Bets
              </button>
              <button 
                onClick={() => setCurrentBets([])}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700"
              >
                Clear All
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                Save as Template
              </button>
            </div>
          </div>
        )}
      </div>
    )}

    {assistantSubTab === 'performance' && (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Performance Matrix</h2>
        <p className="text-gray-400">27-column betting matrix coming soon...</p>
        {/* This is where the 27-column betting matrix will go */}
      </div>
    )}

    {assistantSubTab === 'analysis' && (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">AI Analysis</h2>
        
        {/* Personality Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-2">🧮 Mathematician</h3>
            <p className="text-white text-sm">Red: 78% ↑</p>
            <p className="text-white text-sm">Odd: 67% ↑</p>
            <p className="text-white text-sm">D3: Cold streak</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-2">🎯 Strategist</h3>
            <p className="text-white text-sm">Bet: Red + 1st</p>
            <p className="text-white text-sm">Units: 2 each</p>
            <p className="text-white text-sm">Confidence: High</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-2">🛡️ Guardian</h3>
            <p className="text-white text-sm">Risk: Acceptable</p>
            <p className="text-white text-sm">P/L: +15%</p>
            <p className="text-white text-sm">Status: Healthy</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-2">❤️ Friend</h3>
            <p className="text-white text-sm">Great streak!</p>
            <p className="text-white text-sm">Stay focused</p>
            <p className="text-white text-sm">You got this!</p>
          </div>
        </div>
      </div>
    )}
  </div>
)}
       </div>  {/* Line 838-840 closing divs */}
      </div>
    </div>
  )
}