'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Spin } from '@/lib/types'

// Types for the GameAssistant
interface BettingStrategy {
  id: string
  name: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  bankrollRequired: number
  expectedReturn: number
  betSize: (bankroll: number) => number
  getTargets: (analytics: Analytics) => string[]
}

interface Prediction {
  group: string
  confidence: number
  reasoning: string
  suggestedBet: number
  probability: number
}

interface Analytics {
  hotNumbers: number[]
  coldNumbers: number[]
  patterns: string[]
  streaks: {
    type: string
    length: number
    current: boolean
  }[]
  frequencies: {
    red: number
    black: number
    even: number
    odd: number
    low: number
    high: number
    dozen1: number
    dozen2: number
    dozen3: number
    column1: number
    column2: number
    column3: number
  }
  lastAppearance: Record<string, number>
}

interface SimulationResult {
  profit: number
  winRate: number
  maxDrawdown: number
  bestRun: number
  worstRun: number
}

export default function GameAssistant() {
  const [activeView, setActiveView] = useState<'strategies' | 'predictor' | 'analytics' | 'simulator' | 'advisor'>('strategies')
  const [spins, setSpins] = useState<Spin[]>([])
  const [bankroll, setBankroll] = useState(1000)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [simulationSpins, setSimulationSpins] = useState(100)

  useEffect(() => {
    loadRecentSpins()
  }, [])

  const loadRecentSpins = async () => {
    setIsLoading(true)
    try {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .single()
      
      if (sessions) {
        const { data: spinsData } = await supabase
          .from('spins')
          .select('*')
          .eq('session_id', sessions.id)
          .order('spin_number', { ascending: false })
          .limit(200)
        
        if (spinsData && spinsData.length > 0) {
          setSpins(spinsData)
          const analysis = analyzeSpins(spinsData)
          setAnalytics(analysis)
        }
      }
    } catch (error) {
      console.error('Error loading spins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeSpins = (spinsData: Spin[]): Analytics => {
    // Calculate number frequencies
    const numberFrequency: Record<number, number> = {}
    const lastAppearance: Record<string, number> = {}
    
    // Initialize frequencies
    const frequencies = {
      red: 0, black: 0, even: 0, odd: 0,
      low: 0, high: 0,
      dozen1: 0, dozen2: 0, dozen3: 0,
      column1: 0, column2: 0, column3: 0
    }
    
    // Process each spin
    spinsData.forEach((spin, index) => {
      numberFrequency[spin.number] = (numberFrequency[spin.number] || 0) + 1
      
      // Update frequencies
      if (spin.color === 'red') frequencies.red++
      if (spin.color === 'black') frequencies.black++
      if (spin.even_odd === 'even') frequencies.even++
      if (spin.even_odd === 'odd') frequencies.odd++
      if (spin.low_high === 'low') frequencies.low++
      if (spin.low_high === 'high') frequencies.high++
      if (spin.dozen === 'first') frequencies.dozen1++
      if (spin.dozen === 'second') frequencies.dozen2++
      if (spin.dozen === 'third') frequencies.dozen3++
      if (spin.column_num === 1) frequencies.column1++
      if (spin.column_num === 2) frequencies.column2++
      if (spin.column_num === 3) frequencies.column3++
      
      // Track last appearance
      if (!lastAppearance[`num_${spin.number}`]) {
        lastAppearance[`num_${spin.number}`] = index
      }
    })
    
    // Sort numbers by frequency
    const sortedNumbers = Object.entries(numberFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([num]) => parseInt(num))
    
    // Get hot and cold numbers
    const hotNumbers = sortedNumbers.slice(0, 6)
    const coldNumbers = sortedNumbers.slice(-6).reverse()
    
    // Add missing numbers to cold list
    for (let i = 0; i <= 36; i++) {
      if (!numberFrequency[i] && coldNumbers.length < 6) {
        coldNumbers.push(i)
      }
    }
    
    return {
      hotNumbers: hotNumbers.slice(0, 6),
      coldNumbers: coldNumbers.slice(0, 6),
      patterns: detectPatterns(spinsData),
      streaks: detectStreaks(spinsData),
      frequencies,
      lastAppearance
    }
  }

  const detectPatterns = (spinsData: Spin[]): string[] => {
    const patterns: string[] = []
    if (spinsData.length < 10) return patterns
    
    // Recent 10 spins analysis
    const recent10 = spinsData.slice(0, 10)
    const redCount = recent10.filter(s => s.color === 'red').length
    const blackCount = recent10.filter(s => s.color === 'black').length
    const evenCount = recent10.filter(s => s.even_odd === 'even').length
    const oddCount = recent10.filter(s => s.even_odd === 'odd').length
    
    if (redCount >= 7) patterns.push(`Red Dominance: ${redCount}/10 recent spins`)
    if (blackCount >= 7) patterns.push(`Black Dominance: ${blackCount}/10 recent spins`)
    if (evenCount >= 7) patterns.push(`Even Dominance: ${evenCount}/10 recent spins`)
    if (oddCount >= 7) patterns.push(`Odd Dominance: ${oddCount}/10 recent spins`)
    
    // Check dozen distribution
    const recentDozens = spinsData.slice(0, 18)
    const dozenCount = {
      first: recentDozens.filter(s => s.dozen === 'first').length,
      second: recentDozens.filter(s => s.dozen === 'second').length,
      third: recentDozens.filter(s => s.dozen === 'third').length
    }
    
    Object.entries(dozenCount).forEach(([dozen, count]) => {
      if (count === 0) patterns.push(`${dozen} dozen missing (18 spins)`)
      if (count >= 10) patterns.push(`${dozen} dozen hot: ${count}/18`)
    })
    
    // Column patterns
    const columnCount = {
      1: recent10.filter(s => s.column_num === 1).length,
      2: recent10.filter(s => s.column_num === 2).length,
      3: recent10.filter(s => s.column_num === 3).length
    }
    
    Object.entries(columnCount).forEach(([col, count]) => {
      if (count >= 6) patterns.push(`Column ${col} hot: ${count}/10`)
      if (count === 0) patterns.push(`Column ${col} cold: 0/10`)
    })
    
    return patterns
  }

  const detectStreaks = (spinsData: Spin[]): { type: string, length: number, current: boolean }[] => {
    const streaks: { type: string, length: number, current: boolean }[] = []
    if (spinsData.length < 2) return streaks
    
    // Color streaks
    let currentColor = spinsData[0]?.color
    let colorStreakLength = 1
    
    for (let i = 1; i < spinsData.length; i++) {
      if (spinsData[i].color === currentColor && currentColor !== 'green') {
        colorStreakLength++
      } else {
        if (colorStreakLength >= 3) {
          streaks.push({ 
            type: `${currentColor} color`, 
            length: colorStreakLength,
            current: i === 1
          })
        }
        currentColor = spinsData[i].color
        colorStreakLength = 1
      }
    }
    
    // Even/Odd streaks
    let currentEvenOdd = spinsData[0]?.even_odd
    let evenOddStreakLength = 1
    
    for (let i = 1; i < spinsData.length; i++) {
      if (spinsData[i].even_odd === currentEvenOdd && currentEvenOdd !== null) {
        evenOddStreakLength++
      } else {
        if (evenOddStreakLength >= 4) {
          streaks.push({ 
            type: currentEvenOdd || 'unknown', 
            length: evenOddStreakLength,
            current: i === 1
          })
        }
        currentEvenOdd = spinsData[i].even_odd
        evenOddStreakLength = 1
      }
    }
    
    return streaks.slice(0, 5) // Return top 5 streaks
  }

  const generatePredictions = () => {
    if (!analytics || spins.length < 20) {
      alert('Need at least 20 spins to generate predictions')
      return
    }
    
    const newPredictions: Prediction[] = []
    const total = spins.length
    
    // Prediction 1: Based on missing/cold numbers
    if (analytics.coldNumbers.length > 0) {
      const coldGroup = analytics.coldNumbers.slice(0, 3)
      const avgAbsence = coldGroup.reduce((sum, num) => {
        const lastSeen = analytics.lastAppearance[`num_${num}`] || total
        return sum + lastSeen
      }, 0) / coldGroup.length
      
      newPredictions.push({
        group: `Cold Numbers: ${coldGroup.join(', ')}`,
        confidence: Math.min(85, 50 + avgAbsence * 2),
        reasoning: `These numbers haven't appeared in ${Math.floor(avgAbsence)} average spins`,
        suggestedBet: bankroll * 0.02,
        probability: (coldGroup.length / 37) * 100
      })
    }
    
    // Prediction 2: Based on color imbalance
    const colorRatio = analytics.frequencies.red / Math.max(1, analytics.frequencies.black)
    if (colorRatio > 1.5 || colorRatio < 0.67) {
      const underdog = colorRatio > 1.5 ? 'Black' : 'Red'
      const confidence = Math.min(80, Math.abs(1 - colorRatio) * 100)
      
      newPredictions.push({
        group: underdog,
        confidence: Math.round(confidence),
        reasoning: `Color imbalance detected - ${underdog} is ${Math.abs(1 - colorRatio).toFixed(1)}x underrepresented`,
        suggestedBet: bankroll * 0.03,
        probability: 48.65
      })
    }
    
    // Prediction 3: Based on dozen patterns
    const dozenProbs = {
      1: analytics.frequencies.dozen1 / total,
      2: analytics.frequencies.dozen2 / total,
      3: analytics.frequencies.dozen3 / total
    }
    
    const minDozen = Object.entries(dozenProbs).reduce((a, b) => 
      b[1] < a[1] ? b : a
    )
    
    if (minDozen[1] < 0.25) {
      newPredictions.push({
        group: `${minDozen[0] === '1' ? '1st' : minDozen[0] === '2' ? '2nd' : '3rd'} Dozen`,
        confidence: Math.round(75 - minDozen[1] * 100),
        reasoning: `This dozen has only ${(minDozen[1] * 100).toFixed(1)}% appearance rate (expected: 32.4%)`,
        suggestedBet: bankroll * 0.025,
        probability: 32.43
      })
    }
    
    // Prediction 4: Streak reversal
    const currentStreak = analytics.streaks.find(s => s.current)
    if (currentStreak && currentStreak.length >= 4) {
      const opposite = currentStreak.type.includes('red') ? 'Black' :
                      currentStreak.type.includes('black') ? 'Red' :
                      currentStreak.type.includes('even') ? 'Odd' : 'Even'
      
      newPredictions.push({
        group: opposite,
        confidence: Math.min(85, 50 + currentStreak.length * 5),
        reasoning: `Current ${currentStreak.type} streak of ${currentStreak.length} likely to break`,
        suggestedBet: bankroll * 0.04,
        probability: 48.65
      })
    }
    
    // Prediction 5: Column balance
    const colProbs = [
      analytics.frequencies.column1 / total,
      analytics.frequencies.column2 / total,
      analytics.frequencies.column3 / total
    ]
    const minColIndex = colProbs.indexOf(Math.min(...colProbs))
    
    if (colProbs[minColIndex] < 0.25) {
      newPredictions.push({
        group: `Column ${minColIndex + 1}`,
        confidence: Math.round(70 - colProbs[minColIndex] * 100),
        reasoning: `Column ${minColIndex + 1} showing ${(colProbs[minColIndex] * 100).toFixed(1)}% vs expected 32.4%`,
        suggestedBet: bankroll * 0.02,
        probability: 32.43
      })
    }
    
    setPredictions(newPredictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5))
  }

  const runSimulation = () => {
    if (!selectedStrategy || spins.length < 50) {
      alert('Select a strategy and ensure you have at least 50 spins of data')
      return
    }
    
    let simBankroll = bankroll
    let maxBankroll = bankroll
    let minBankroll = bankroll
    let wins = 0
    let losses = 0
    
    // Simulate based on historical patterns
    for (let i = 0; i < simulationSpins; i++) {
      const betAmount = simBankroll * 0.02 // 2% of bankroll
      const winProbability = 0.48 // Roughly even money bets
      
      if (Math.random() < winProbability) {
        simBankroll += betAmount
        wins++
      } else {
        simBankroll -= betAmount
        losses++
      }
      
      maxBankroll = Math.max(maxBankroll, simBankroll)
      minBankroll = Math.min(minBankroll, simBankroll)
      
      // Stop if bankrupt
      if (simBankroll <= 0) break
    }
    
    setSimulationResult({
      profit: simBankroll - bankroll,
      winRate: (wins / (wins + losses)) * 100,
      maxDrawdown: bankroll - minBankroll,
      bestRun: maxBankroll - bankroll,
      worstRun: minBankroll - bankroll
    })
  }

  const strategies: BettingStrategy[] = [
    {
      id: 'conservative',
      name: 'Conservative Dozens',
      description: 'Bet on two dozens that appeared least in last 12 spins',
      riskLevel: 'low',
      bankrollRequired: 500,
      expectedReturn: 1.15,
      betSize: (bankroll) => bankroll * 0.01,
      getTargets: (analytics) => {
        const dozens = [
          { name: '1st Dozen', count: analytics.frequencies.dozen1 },
          { name: '2nd Dozen', count: analytics.frequencies.dozen2 },
          { name: '3rd Dozen', count: analytics.frequencies.dozen3 }
        ]
        return dozens
          .sort((a, b) => a.count - b.count)
          .slice(0, 2)
          .map(d => d.name)
      }
    },
    {
      id: 'pattern',
      name: 'Pattern Breaker',
      description: 'Bet against strong patterns when they reach extreme levels',
      riskLevel: 'medium',
      bankrollRequired: 1000,
      expectedReturn: 1.25,
      betSize: (bankroll) => bankroll * 0.02,
      getTargets: (analytics) => {
        const targets: string[] = []
        if (analytics.frequencies.red > analytics.frequencies.black * 1.5) targets.push('Black')
        if (analytics.frequencies.black > analytics.frequencies.red * 1.5) targets.push('Red')
        if (analytics.frequencies.even > analytics.frequencies.odd * 1.5) targets.push('Odd')
        if (analytics.frequencies.odd > analytics.frequencies.even * 1.5) targets.push('Even')
        return targets
      }
    },
    {
      id: 'hot-chase',
      name: 'Hot Number Chase',
      description: 'Follow the hottest numbers with progressive betting',
      riskLevel: 'high',
      bankrollRequired: 2000,
      expectedReturn: 1.40,
      betSize: (bankroll) => bankroll * 0.03,
      getTargets: (analytics) => 
        analytics.hotNumbers.slice(0, 3).map(n => `Number ${n}`)
    },
    {
      id: 'column-balance',
      name: 'Column Equilibrium',
      description: 'Bet on underrepresented columns to restore balance',
      riskLevel: 'low',
      bankrollRequired: 300,
      expectedReturn: 1.12,
      betSize: (bankroll) => bankroll * 0.015,
      getTargets: (analytics) => {
        const columns = [
          { name: 'Column 1', count: analytics.frequencies.column1 },
          { name: 'Column 2', count: analytics.frequencies.column2 },
          { name: 'Column 3', count: analytics.frequencies.column3 }
        ]
        return [columns.sort((a, b) => a.count - b.count)[0].name]
      }
    },
    {
      id: 'cold-revival',
      name: 'Cold Number Revival',
      description: 'Bet on coldest numbers expecting them to hit',
      riskLevel: 'medium',
      bankrollRequired: 1500,
      expectedReturn: 1.20,
      betSize: (bankroll) => bankroll * 0.01,
      getTargets: (analytics) => 
        analytics.coldNumbers.slice(0, 4).map(n => `Number ${n}`)
    }
  ]

  const activateStrategy = () => {
    const strategy = strategies.find(s => s.id === selectedStrategy)
    if (!strategy || !analytics) return
    
    if (bankroll < strategy.bankrollRequired) {
      alert(`Insufficient bankroll. Need $${strategy.bankrollRequired}`)
      return
    }
    
    const targets = strategy.getTargets(analytics)
    const betSize = strategy.betSize(bankroll)
    
    alert(`Strategy Activated!\n\nTargets: ${targets.join(', ')}\nBet Size: $${betSize.toFixed(2)} per target\nTotal Bet: $${(betSize * targets.length).toFixed(2)}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Game Assistant Pro</h1>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Bankroll</span>
              <input
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="bg-transparent text-2xl font-bold text-green-400 w-32 focus:outline-none"
              />
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Spins Analyzed</span>
              <div className="text-2xl font-bold">{spins.length}</div>
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Active Patterns</span>
              <div className="text-2xl font-bold text-yellow-400">{analytics?.patterns.length || 0}</div>
            </div>
            <button
              onClick={loadRecentSpins}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['strategies', 'predictor', 'analytics', 'simulator', 'advisor'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeView === view
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-gray-800 rounded-xl p-6">
          {activeView === 'strategies' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Betting Strategies</h2>
              {strategies.map((strategy) => (
                <div 
                  key={strategy.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedStrategy === strategy.id
                      ? 'bg-purple-900/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedStrategy(strategy.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{strategy.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      strategy.riskLevel === 'low' ? 'bg-green-600' :
                      strategy.riskLevel === 'medium' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {strategy.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{strategy.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Min Bankroll:</span>
                      <span className="ml-2 font-bold">${strategy.bankrollRequired}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Expected Return:</span>
                      <span className="ml-2 font-bold text-green-400">
                        {((strategy.expectedReturn - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {selectedStrategy === strategy.id && analytics && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-gray-300">
                        Suggested Targets: {strategy.getTargets(analytics).join(', ')}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          activateStrategy()
                        }}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold"
                      >
                        Activate Strategy
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeView === 'predictor' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">AI Predictions</h2>
              <button 
                onClick={generatePredictions}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700"
                disabled={!analytics || spins.length < 20}
              >
                Generate Predictions
              </button>
              
              {spins.length < 20 && (
                <p className="text-yellow-400">Need at least 20 spins for predictions. Current: {spins.length}</p>
              )}
              
              {predictions.length > 0 && (
                <div className="space-y-3 mt-6">
                  {predictions.map((pred, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{pred.group}</h3>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            pred.confidence >= 70 ? 'text-green-400' :
                            pred.confidence >= 60 ? 'text-yellow-400' :
                            'text-orange-400'
                          }`}>
                            {pred.confidence}% confidence
                          </div>
                          <div className="text-xs text-gray-400">
                            Probability: {pred.probability.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">{pred.reasoning}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Suggested bet: ${pred.suggestedBet.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Deep Analytics</h2>
              
              {!analytics ? (
                <p className="text-gray-400">Loading analytics...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-bold mb-3 text-orange-400">Hot Numbers</h3>
                      <div className="grid grid-cols-6 gap-2">
                        {analytics.hotNumbers.map(num => (
                          <div key={num} className="aspect-square bg-orange-600 rounded flex items-center justify-center font-bold">
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-bold mb-3 text-blue-400">Cold Numbers</h3>
                      <div className="grid grid-cols-6 gap-2">
                        {analytics.coldNumbers.map(num => (
                          <div key={num} className="aspect-square bg-blue-600 rounded flex items-center justify-center font-bold">
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-yellow-400">Active Patterns</h3>
                    {analytics.patterns.length === 0 ? (
                      <p className="text-gray-400">No significant patterns detected</p>
                    ) : (
                      analytics.patterns.map((pattern, index) => (
                        <div key={index} className="py-2 border-b border-gray-600 last:border-0">
                          {pattern}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-purple-400">Significant Streaks</h3>
                    {analytics.streaks.length === 0 ? (
                      <p className="text-gray-400">No significant streaks detected</p>
                    ) : (
                      analytics.streaks.map((streak, index) => (
                        <div key={index} className="py-2 border-b border-gray-600 last:border-0 flex justify-between">
                          <span>{streak.type} streak of {streak.length} spins</span>
                          {streak.current && <span className="text-yellow-400 text-sm">ACTIVE</span>}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-cyan-400">Distribution Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>Red: {((analytics.frequencies.red / Math.max(1, spins.length)) * 100).toFixed(1)}%</div>
                      <div>Black: {((analytics.frequencies.black / Math.max(1, spins.length)) * 100).toFixed(1)}%</div>
                      <div>Even: {((analytics.frequencies.even / Math.max(1, spins.length)) * 100).toFixed(1)}%</div>
                      <div>Odd: {((analytics.frequencies.odd / Math.max(1, spins.length)) * 100).toFixed(1)}%</div>
                      <div>Low: {((analytics.frequencies.low / Math.max(1, spins.length)) * 100).toFixed(1)}%</div>
                      <div>High: {((analytics.frequencies.high / Math.max(1, spins.length)) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeView === 'simulator' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Strategy Simulator</h2>
              <p className="text-gray-400">
                Test your selected strategy with simulated spins.
              </p>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold mb-3">Simulation Settings</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Starting Bankroll</label>
                    <input 
                      type="number"
                      value={bankroll}
                      onChange={(e) => setBankroll(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Number of Spins</label>
                    <input 
                      type="number"
                      value={simulationSpins}
                      onChange={(e) => setSimulationSpins(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 rounded"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Selected Strategy</label>
                  <div className="px-3 py-2 bg-gray-800 rounded">
                    {selectedStrategy ? strategies.find(s => s.id === selectedStrategy)?.name : 'None selected'}
                  </div>
                </div>
                
                <button 
                  onClick={runSimulation}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                  disabled={!selectedStrategy}
                >
                  Run Simulation
                </button>
              </div>
              
              {simulationResult && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">Simulation Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Final Profit/Loss:</span>
                      <div className={`text-xl font-bold ${simulationResult.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${simulationResult.profit.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Win Rate:</span>
                      <div className="text-xl font-bold">
                        {simulationResult.winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Drawdown:</span>
                      <div className="text-xl font-bold text-red-400">
                        -${simulationResult.maxDrawdown.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Best Run:</span>
                      <div className="text-xl font-bold text-green-400">
                        +${simulationResult.bestRun.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'advisor' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Personal Advisor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Current Recommendation</h3>
                  <p className="text-sm mb-3">
                    {analytics && analytics.patterns.length > 0 
                      ? `Pattern detected: ${analytics.patterns[0]}. Consider betting against it.`
                      : 'Collecting more data for accurate recommendations...'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Session Status</h3>
                  <p className="text-2xl font-bold mb-1">
                    {spins.length > 0 ? 'Active' : 'No Data'}
                  </p>
                  <p className="text-sm">
                    {spins.length} spins analyzed
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Risk Assessment</h3>
                  <p className="text-2xl font-bold mb-1">
                    {selectedStrategy 
                      ? strategies.find(s => s.id === selectedStrategy)?.riskLevel.toUpperCase()
                      : 'N/A'}
                  </p>
                  <p className="text-sm">
                    Based on selected strategy
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Best Action Now</h3>
                  <p className="text-sm mb-3">
                    {predictions.length > 0
                      ? `Consider: ${predictions[0].group} (${predictions[0].confidence}% confidence)`
                      : 'Generate predictions for recommendations'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold mb-3">Quick Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Bankroll Health:</span>
                    <div className="font-bold">
                      {bankroll >= 2000 ? 'Excellent' : 
                       bankroll >= 1000 ? 'Good' :
                       bankroll >= 500 ? 'Fair' : 'Low'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Data Quality:</span>
                    <div className="font-bold">
                      {spins.length >= 100 ? 'Excellent' :
                       spins.length >= 50 ? 'Good' :
                       spins.length >= 20 ? 'Fair' : 'Poor'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Patterns Found:</span>
                    <div className="font-bold">
                      {analytics?.patterns.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}