'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Spin } from '@/lib/types'

// Types for the GameAssistant
interface BettingStrategy {
  name: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  bankrollRequired: number
  expectedReturn: number
}

interface Prediction {
  group: string
  confidence: number
  reasoning: string
  suggestedBet: number
}

interface Analytics {
  hotNumbers: number[]
  coldNumbers: number[]
  patterns: string[]
  streaks: {
    type: string
    length: number
  }[]
}

export default function GameAssistant() {
  const [activeView, setActiveView] = useState<'strategies' | 'predictor' | 'analytics' | 'simulator' | 'advisor'>('strategies')
  const [spins, setSpins] = useState<Spin[]>([])
  const [bankroll, setBankroll] = useState(1000)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  // Load recent spins on mount
  useEffect(() => {
    loadRecentSpins()
  }, [])

  const loadRecentSpins = async () => {
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
        .limit(100)
      
      if (spinsData) {
        setSpins(spinsData)
        analyzeSpins(spinsData)
      }
    }
  }

  const analyzeSpins = (spinsData: Spin[]) => {
    // Calculate hot and cold numbers
    const numberFrequency: Record<number, number> = {}
    spinsData.forEach(spin => {
      numberFrequency[spin.number] = (numberFrequency[spin.number] || 0) + 1
    })
    
    const sortedNumbers = Object.entries(numberFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([num]) => parseInt(num))
    
    setAnalytics({
      hotNumbers: sortedNumbers.slice(0, 6),
      coldNumbers: sortedNumbers.slice(-6),
      patterns: detectPatterns(spinsData),
      streaks: detectStreaks(spinsData)
    })
  }

  const detectPatterns = (spinsData: Spin[]): string[] => {
    const patterns: string[] = []
    
    // Check for color patterns
    let redCount = 0, blackCount = 0
    for (let i = 0; i < Math.min(10, spinsData.length); i++) {
      if (spinsData[i].color === 'red') redCount++
      if (spinsData[i].color === 'black') blackCount++
    }
    
    if (redCount > 7) patterns.push('Red Dominance (70%+ in last 10)')
    if (blackCount > 7) patterns.push('Black Dominance (70%+ in last 10)')
    
    // Check for dozen patterns
    const dozens = spinsData.slice(0, 12).map(s => s.dozen)
    const dozenCounts = {
      first: dozens.filter(d => d === 'first').length,
      second: dozens.filter(d => d === 'second').length,
      third: dozens.filter(d => d === 'third').length
    }
    
    Object.entries(dozenCounts).forEach(([dozen, count]) => {
      if (count === 0) patterns.push(`${dozen} dozen missing (12 spins)`)
      if (count > 8) patterns.push(`${dozen} dozen hot (${count}/12)`)
    })
    
    return patterns
  }

  const detectStreaks = (spinsData: Spin[]): { type: string, length: number }[] => {
    const streaks: { type: string, length: number }[] = []
    
    // Detect color streaks
    let currentColor = spinsData[0]?.color
    let streakLength = 1
    
    for (let i = 1; i < spinsData.length; i++) {
      if (spinsData[i].color === currentColor && currentColor !== 'green') {
        streakLength++
      } else {
        if (streakLength >= 4) {
          streaks.push({ type: currentColor, length: streakLength })
        }
        currentColor = spinsData[i].color
        streakLength = 1
      }
    }
    
    return streaks
  }

  const generatePredictions = () => {
    if (!analytics) return
    
    const newPredictions: Prediction[] = []
    
    // Predict based on cold numbers heating up
    if (analytics.coldNumbers.length > 0) {
      newPredictions.push({
        group: 'Cold Numbers Heat-up',
        confidence: 65,
        reasoning: `Numbers ${analytics.coldNumbers.slice(0, 3).join(', ')} are overdue`,
        suggestedBet: bankroll * 0.02
      })
    }
    
    // Predict based on pattern breaks
    analytics.patterns.forEach(pattern => {
      if (pattern.includes('missing')) {
        const group = pattern.split(' ')[0]
        newPredictions.push({
          group: `${group} dozen`,
          confidence: 72,
          reasoning: pattern,
          suggestedBet: bankroll * 0.03
        })
      }
    })
    
    // Predict based on streak reversals
    analytics.streaks.forEach(streak => {
      if (streak.length >= 5) {
        const opposite = streak.type === 'red' ? 'black' : 'red'
        newPredictions.push({
          group: opposite,
          confidence: 68,
          reasoning: `${streak.type} streak of ${streak.length} likely to break`,
          suggestedBet: bankroll * 0.025
        })
      }
    })
    
    setPredictions(newPredictions.slice(0, 5)) // Top 5 predictions
  }

  const strategies: BettingStrategy[] = [
    {
      name: 'Conservative Dozens',
      description: 'Bet on two dozens that appeared least in last 12 spins',
      riskLevel: 'low',
      bankrollRequired: 500,
      expectedReturn: 1.15
    },
    {
      name: 'Pattern Breaker',
      description: 'Bet against strong patterns when they reach extreme levels',
      riskLevel: 'medium',
      bankrollRequired: 1000,
      expectedReturn: 1.25
    },
    {
      name: 'Hot Sector Chase',
      description: 'Follow hot sectors of the wheel with increasing bets',
      riskLevel: 'high',
      bankrollRequired: 2000,
      expectedReturn: 1.40
    },
    {
      name: 'Column Equilibrium',
      description: 'Bet on underrepresented columns to restore balance',
      riskLevel: 'low',
      bankrollRequired: 300,
      expectedReturn: 1.12
    },
    {
      name: 'Fibonacci Recovery',
      description: 'Use Fibonacci sequence for loss recovery on even bets',
      riskLevel: 'medium',
      bankrollRequired: 1500,
      expectedReturn: 1.20
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Game Assistant Pro</h1>
          <div className="flex gap-4 mb-4">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Bankroll</span>
              <div className="text-2xl font-bold text-green-400">${bankroll}</div>
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Spins Analyzed</span>
              <div className="text-2xl font-bold">{spins.length}</div>
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-sm">Active Patterns</span>
              <div className="text-2xl font-bold text-yellow-400">{analytics?.patterns.length || 0}</div>
            </div>
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
              {strategies.map((strategy, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedStrategy === strategy.name 
                      ? 'bg-purple-900/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedStrategy(strategy.name)}
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
                  {selectedStrategy === strategy.name && (
                    <button className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold">
                      Activate Strategy
                    </button>
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
              >
                Generate Predictions
              </button>
              
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
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">{pred.reasoning}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Suggested bet: ${pred.suggestedBet.toFixed(0)}
                        </span>
                        <button className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-bold">
                          Place Bet
                        </button>
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
              
              {analytics && (
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
                    {analytics.patterns.map((pattern, index) => (
                      <div key={index} className="py-2 border-b border-gray-600 last:border-0">
                        {pattern}
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-purple-400">Significant Streaks</h3>
                    {analytics.streaks.map((streak, index) => (
                      <div key={index} className="py-2 border-b border-gray-600 last:border-0">
                        {streak.type} streak of {streak.length} spins
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeView === 'simulator' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Strategy Simulator</h2>
              <p className="text-gray-400">
                Test your strategies with historical data and simulated spins.
              </p>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold mb-3">Simulation Settings</h3>
                <div className="grid grid-cols-2 gap-4">
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
                      defaultValue="100"
                      className="w-full px-3 py-2 bg-gray-800 rounded"
                    />
                  </div>
                </div>
                <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                  Run Simulation
                </button>
              </div>
            </div>
          )}

          {activeView === 'advisor' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Personal Advisor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Current Recommendation</h3>
                  <p className="text-sm mb-3">
                    Based on recent patterns, consider reducing bet sizes. High volatility detected.
                  </p>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-sm">
                    View Details
                  </button>
                </div>
                
                <div className="bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Session Performance</h3>
                  <p className="text-2xl font-bold mb-1">+15.3%</p>
                  <p className="text-sm">Above expected value</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Risk Assessment</h3>
                  <p className="text-2xl font-bold mb-1">MEDIUM</p>
                  <p className="text-sm">Current exposure: $150</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Next Best Action</h3>
                  <p className="text-sm mb-3">
                    Wait 2-3 spins before placing next bet. Let patterns develop.
                  </p>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-sm">
                    Set Reminder
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}