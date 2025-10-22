// components/StrategyCard.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useBettingData } from './BettingDataContext'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, RotateCcw, Play } from 'lucide-react'

// 1:1 Bet Groups
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]
const ODD_NUMBERS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35]
const EVEN_NUMBERS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36]
const LOW_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const HIGH_NUMBERS = [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]

interface BetStep {
  position: number
  units: number
  group: string
  result?: 'win' | 'loss'
  wagered: number
  returned: number
  netProfit: number
  runningProfit: number
}

const PROGRESSION = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]

export default function StrategyCard() {
  const { spinHistory } = useBettingData()
  const [unitSize, setUnitSize] = useState(10)
  const [isActive, setIsActive] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [consecutiveWins, setConsecutiveWins] = useState(0)
  const [history, setHistory] = useState<BetStep[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('RED')

  // Identify hot group from recent spins
  const hotGroup = useMemo(() => {
    if (spinHistory.length < 10) return null

    const recent = spinHistory.slice(0, 18).map(s => s.number)

    const groups = [
      { name: 'RED', numbers: RED_NUMBERS, color: '#EF4444' },
      { name: 'BLACK', numbers: BLACK_NUMBERS, color: '#6B7280' },
      { name: 'ODD', numbers: ODD_NUMBERS, color: '#F97316' },
      { name: 'EVEN', numbers: EVEN_NUMBERS, color: '#8B5CF6' },
      { name: 'LOW', numbers: LOW_NUMBERS, color: '#3B82F6' },
      { name: 'HIGH', numbers: HIGH_NUMBERS, color: '#14B8A6' },
    ]

    const scores = groups.map(g => ({
      ...g,
      hits: recent.filter(n => g.numbers.includes(n)).length,
      hitRate: recent.filter(n => g.numbers.includes(n)).length / recent.length
    }))

    scores.sort((a, b) => b.hits - a.hits)

    return scores[0]
  }, [spinHistory])

  // Calculate session totals
  const sessionStats = useMemo(() => {
    const totalWagered = history.reduce((sum, step) => sum + step.wagered, 0)
    const totalReturned = history.reduce((sum, step) => sum + step.returned, 0)
    const netProfit = totalReturned - totalWagered
    const wins = history.filter(s => s.result === 'win').length
    const losses = history.filter(s => s.result === 'loss').length

    return {
      totalWagered,
      totalReturned,
      netProfit,
      wins,
      losses,
      totalBets: wins + losses
    }
  }, [history])

  const startStrategy = () => {
    setIsActive(true)
    setCurrentPosition(0)
    setConsecutiveWins(0)
    setHistory([])
    if (hotGroup) {
      setSelectedGroup(hotGroup.name)
    }
  }

  const resetStrategy = () => {
    setIsActive(false)
    setCurrentPosition(0)
    setConsecutiveWins(0)
    setHistory([])
  }

  const recordBet = (result: 'win' | 'loss') => {
    if (!isActive || currentPosition >= PROGRESSION.length) return

    const units = PROGRESSION[currentPosition]
    const wagered = units * unitSize
    const returned = result === 'win' ? wagered * 2 : 0
    const netProfit = returned - wagered
    const runningProfit = sessionStats.netProfit + netProfit

    const step: BetStep = {
      position: currentPosition + 1,
      units,
      group: selectedGroup,
      result,
      wagered,
      returned,
      netProfit,
      runningProfit
    }

    setHistory(prev => [...prev, step])

    if (result === 'win') {
      const newConsecutiveWins = consecutiveWins + 1
      setConsecutiveWins(newConsecutiveWins)

      // Check if card is complete (2 consecutive wins)
      if (newConsecutiveWins >= 2) {
        setIsActive(false)
        return
      }
    } else {
      setConsecutiveWins(0)
    }

    // Move to next position
    setCurrentPosition(prev => prev + 1)

    // If reached end of progression without 2 consecutive wins
    if (currentPosition >= PROGRESSION.length - 1) {
      setIsActive(false)
    }
  }

  const currentUnits = PROGRESSION[currentPosition] || 0
  const currentWager = currentUnits * unitSize
  const isComplete = consecutiveWins >= 2
  const isFailed = !isActive && history.length > 0 && !isComplete

  const groups = [
    { name: 'RED', numbers: RED_NUMBERS, color: '#EF4444' },
    { name: 'BLACK', numbers: BLACK_NUMBERS, color: '#6B7280' },
    { name: 'ODD', numbers: ODD_NUMBERS, color: '#F97316' },
    { name: 'EVEN', numbers: EVEN_NUMBERS, color: '#8B5CF6' },
    { name: 'LOW', numbers: LOW_NUMBERS, color: '#3B82F6' },
    { name: 'HIGH', numbers: HIGH_NUMBERS, color: '#14B8A6' },
  ]

  const currentGroupColor = groups.find(g => g.name === selectedGroup)?.color || '#888'

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/50 rounded-xl p-4">
        <h2 className="text-2xl font-bold text-white mb-2">🎯 Strategy Card: Progressive Double Win</h2>
        <p className="text-sm text-gray-300">Follow the hot group with progressive betting until 2 consecutive wins</p>
      </div>

      {/* Settings */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">
              Unit Size: ${unitSize}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={unitSize}
              onChange={(e) => setUnitSize(parseInt(e.target.value))}
              disabled={isActive}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">
              Select Group to Follow
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={isActive}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hot Group Recommendation */}
        {hotGroup && !isActive && (
          <div className="mt-4 bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <div>
                <div className="text-sm font-bold text-orange-300">Hot Group Detected</div>
                <div className="text-xs text-orange-200">
                  {hotGroup.name} has {hotGroup.hits}/{spinHistory.slice(0, 18).length} hits ({(hotGroup.hitRate * 100).toFixed(1)}%) in last 18 spins
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Status */}
      {isActive && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-cyan-500/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Bet */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">NEXT BET</div>
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: currentGroupColor }}
              >
                {selectedGroup}
              </div>
              <div className="text-2xl font-bold text-white">${currentWager}</div>
              <div className="text-sm text-gray-400">{currentUnits} units</div>
            </div>

            {/* Progress */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">PROGRESSION</div>
              <div className="text-4xl font-bold text-cyan-400">{currentPosition + 1}/10</div>
              <div className="text-sm text-gray-300 mt-2">
                Pattern: {PROGRESSION.join(', ')}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentPosition) / PROGRESSION.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Consecutive Wins */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">CONSECUTIVE WINS</div>
              <div className="text-4xl font-bold text-yellow-400">{consecutiveWins}/2</div>
              <div className="text-sm text-gray-300 mt-2">
                {consecutiveWins === 0 && 'Need 2 consecutive wins'}
                {consecutiveWins === 1 && '🔥 One more to complete!'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => recordBet('win')}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              WIN
            </button>
            <button
              onClick={() => recordBet('loss')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all"
            >
              <XCircle className="w-5 h-5" />
              LOSS
            </button>
          </div>
        </div>
      )}

      {/* Start/Reset Buttons */}
      {!isActive && (
        <div className="flex gap-4">
          <button
            onClick={startStrategy}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-5 h-5" />
            {history.length === 0 ? 'START STRATEGY' : 'RESTART STRATEGY'}
          </button>
          {history.length > 0 && (
            <button
              onClick={resetStrategy}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              RESET
            </button>
          )}
        </div>
      )}

      {/* Completion Status */}
      {isComplete && (
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-500 rounded-xl p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-2xl font-bold text-green-400 mb-2">STRATEGY COMPLETE!</div>
            <div className="text-lg text-green-300">2 consecutive wins achieved</div>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border-2 border-red-500 rounded-xl p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <div className="text-2xl font-bold text-red-400 mb-2">STRATEGY ENDED</div>
            <div className="text-lg text-red-300">Reached end of progression without 2 consecutive wins</div>
          </div>
        </div>
      )}

      {/* Session Stats */}
      {history.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-lg font-bold text-white mb-4">Session Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Total Bets</div>
              <div className="text-xl font-bold text-white">{sessionStats.totalBets}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Wins / Losses</div>
              <div className="text-xl font-bold text-white">{sessionStats.wins} / {sessionStats.losses}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Total Wagered</div>
              <div className="text-xl font-bold text-red-400">${sessionStats.totalWagered}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Total Returned</div>
              <div className="text-xl font-bold text-green-400">${sessionStats.totalReturned}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Net Profit</div>
              <div className={`text-xl font-bold ${sessionStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {sessionStats.netProfit >= 0 ? '+' : ''}${sessionStats.netProfit}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bet History */}
      {history.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-lg font-bold text-white mb-4">Bet History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-300 font-semibold">#</th>
                  <th className="text-left py-2 px-2 text-gray-300 font-semibold">Group</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-semibold">Units</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-semibold">Wagered</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-semibold">Result</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-semibold">Returned</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-semibold">Net P/L</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-semibold">Running P/L</th>
                </tr>
              </thead>
              <tbody>
                {history.map((step, idx) => (
                  <tr key={idx} className="border-b border-gray-800">
                    <td className="py-2 px-2 text-gray-300">{step.position}</td>
                    <td className="py-2 px-2">
                      <span
                        className="font-bold"
                        style={{ color: groups.find(g => g.name === step.group)?.color }}
                      >
                        {step.group}
                      </span>
                    </td>
                    <td className="text-center py-2 px-2 text-gray-300">{step.units}</td>
                    <td className="text-center py-2 px-2 text-red-400">${step.wagered}</td>
                    <td className="text-center py-2 px-2">
                      {step.result === 'win' ? (
                        <span className="inline-flex items-center gap-1 text-green-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> WIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                          <XCircle className="w-4 h-4" /> LOSS
                        </span>
                      )}
                    </td>
                    <td className="text-center py-2 px-2 text-green-400">${step.returned}</td>
                    <td className={`text-center py-2 px-2 font-bold ${step.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {step.netProfit >= 0 ? '+' : ''}${step.netProfit}
                    </td>
                    <td className={`text-center py-2 px-2 font-bold ${step.runningProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="flex items-center justify-center gap-1">
                        {step.runningProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {step.runningProfit >= 0 ? '+' : ''}${step.runningProfit}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-900/20 rounded-xl border border-blue-500/30 p-4">
        <div className="text-sm font-bold text-blue-400 mb-2">ℹ️ How It Works:</div>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Follow a hot 1:1 group (Red/Black, Odd/Even, Low/High)</li>
          <li>• Betting progression: {PROGRESSION.join(', ')} units</li>
          <li>• Goal: Get 2 consecutive wins to complete the strategy</li>
          <li>• On win: Advance in progression + add 1 to consecutive wins counter</li>
          <li>• On loss: Advance in progression + reset consecutive wins to 0</li>
          <li>• Strategy ends when: (1) 2 consecutive wins achieved, or (2) reached end of progression</li>
        </ul>
      </div>
    </div>
  )
}
