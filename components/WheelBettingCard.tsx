'use client'

import React, { useState } from 'react'
import type { BetCard, BettingSystemConfig, SessionConfig } from '../types/bettingAssistant'
import { WHEEL_BETS } from '@/lib/roulette-logic'

interface WheelBettingCardProps {
  card: BetCard
  bettingSystem: BettingSystemConfig
  sessionConfig: SessionConfig
  onPlaceBet: (
    betType: string,
    betAmount: number,
    outcome: 'win' | 'loss',
    winAmount: number,
    numberHit: number,
    bettingMatrix: Record<string, number>,
    groupResults: Record<string, number>
  ) => void
  onCardComplete: (pnl: number) => void
  onNumberAdded: (number: number) => void
  onBack: () => void
}

export default function WheelBettingCard({
  card,
  bettingSystem,
  sessionConfig,
  onPlaceBet,
  onCardComplete,
  onNumberAdded,
  onBack
}: WheelBettingCardProps) {
  const [pendingBets, setPendingBets] = useState<Record<string, number>>({})
  const [spinNumber, setSpinNumber] = useState('')

  // Calculate total stake and active bets
  const totalStake = Object.values(pendingBets).reduce((sum, val) => sum + val, 0)
  const activeBets = Object.keys(pendingBets).filter(key => pendingBets[key] > 0).length

  // Handle bet toggle (click to add unit size)
  const handleBetToggle = (betKey: string) => {
    const currentValue = pendingBets[betKey] || 0
    if (currentValue === 0) {
      setPendingBets({ ...pendingBets, [betKey]: bettingSystem.currentBet })
    } else {
      const newBets = { ...pendingBets }
      delete newBets[betKey]
      setPendingBets(newBets)
    }
  }

  // Handle manual bet amount input
  const handleBetAmountChange = (betKey: string, value: string) => {
    const amount = parseFloat(value) || 0
    if (amount === 0) {
      const newBets = { ...pendingBets }
      delete newBets[betKey]
      setPendingBets(newBets)
    } else {
      setPendingBets({ ...pendingBets, [betKey]: amount })
    }
  }

  // Check if a number belongs to a group
  const checkWheelGroupWin = (num: number, groupNumbers: readonly number[]) => {
    return groupNumbers.includes(num)
  }

  // Submit bet when spin number is entered
  const handleSpinSubmit = () => {
    const num = parseInt(spinNumber)
    if (isNaN(num) || num < 0 || num > 36) {
      alert('Please enter a valid spin number (0-36)')
      return
    }

    if (Object.keys(pendingBets).length === 0) {
      alert('Please place at least one bet')
      return
    }

    // Calculate results for each bet
    const groupResults: Record<string, number> = {}
    let totalWinAmount = 0

    // Check special bets (5 groups)
    WHEEL_BETS.special.forEach((group) => {
      const betKey = group.key
      const betAmount = pendingBets[betKey] || 0
      if (betAmount > 0) {
        const isWin = checkWheelGroupWin(num, group.numbers)
        const payout = isWin ? betAmount * 2 : 0 // Simplified payout, adjust as needed
        groupResults[betKey] = isWin ? payout - betAmount : -betAmount
        if (isWin) totalWinAmount += payout
      }
    })

    // Check 18's groups (6 groups × 2 = 12 bets)
    WHEEL_BETS.wheel18s.forEach((group) => {
      const betKeyA = group.key + '_a'
      const betKeyB = group.key + '_b'

      const betAmountA = pendingBets[betKeyA] || 0
      if (betAmountA > 0) {
        const isWin = checkWheelGroupWin(num, group.groupA)
        const payout = isWin ? betAmountA * 2 : 0 // 1:1 payout for 18's
        groupResults[betKeyA] = isWin ? payout - betAmountA : -betAmountA
        if (isWin) totalWinAmount += payout
      }

      const betAmountB = pendingBets[betKeyB] || 0
      if (betAmountB > 0) {
        const isWin = checkWheelGroupWin(num, group.groupB)
        const payout = isWin ? betAmountB * 2 : 0
        groupResults[betKeyB] = isWin ? payout - betAmountB : -betAmountB
        if (isWin) totalWinAmount += payout
      }
    })

    // Check 9's sectors (4 groups)
    WHEEL_BETS.sectors9s.forEach((group) => {
      const betKey = group.key
      const betAmount = pendingBets[betKey] || 0
      if (betAmount > 0) {
        const isWin = checkWheelGroupWin(num, group.numbers)
        const payout = isWin ? betAmount * 4 : 0 // 3:1 payout for 9's sectors
        groupResults[betKey] = isWin ? payout - betAmount : -betAmount
        if (isWin) totalWinAmount += payout
      }
    })

    const outcome = totalWinAmount > 0 ? 'win' : 'loss'
    const betType = `Wheel: ${Object.keys(pendingBets).join(', ')}`

    // Place the bet
    onPlaceBet(betType, totalStake, outcome, totalWinAmount, num, pendingBets, groupResults)

    // Check if card completed
    const newTotal = card.currentTotal + (totalWinAmount - totalStake)
    if (newTotal >= card.target) {
      onCardComplete(newTotal)
    }

    // Reset for next bet
    setPendingBets({})
    setSpinNumber('')
  }

  return (
    <div className="bg-gray-900 p-4 space-y-4 border-l border-gray-700 h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-700">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold text-purple-400">Card #{card.cardNumber}</h2>
            <p className="text-sm text-gray-400">Target: ${card.target}</p>
          </div>
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-semibold transition"
          >
            ← Back
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress:</span>
            <span className={`font-bold ${card.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${card.currentTotal.toFixed(2)} / ${card.target}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                card.currentTotal >= card.target ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, (card.currentTotal / card.target) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Bets: {card.betsUsed}/{card.maxBets}</span>
            <span>{Math.round((card.currentTotal / card.target) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Betting System Info */}
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">System: <span className="text-white font-bold">{bettingSystem.name}</span></span>
          <span className="text-gray-400">Next Bet: <span className="text-yellow-400 font-bold">${bettingSystem.currentBet.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Wheel Betting Groups - 3 Cards */}
      <div className="space-y-3 overflow-y-auto max-h-[400px]">
        {/* Special Bets Card */}
        <div className="bg-gray-800 rounded-lg border border-purple-700 p-3">
          <h4 className="text-center font-bold mb-2 text-purple-400">Special Bets</h4>
          <div className="space-y-1.5">
            {WHEEL_BETS.special.map(bet => (
              <div key={bet.key} className="flex items-center gap-1">
                <button
                  onClick={() => handleBetToggle(bet.key)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${bet.color} hover:opacity-80 transition-all text-white ${
                    pendingBets[bet.key] ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {bet.label}
                </button>
                <input
                  type="number"
                  value={pendingBets[bet.key] || ''}
                  onChange={(e) => handleBetAmountChange(bet.key, e.target.value)}
                  placeholder={bettingSystem.currentBet.toString()}
                  className="w-16 px-1 py-1.5 bg-black/50 border border-gray-600 rounded text-center text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 18's Groups Card */}
        <div className="bg-gray-800 rounded-lg border border-green-700 p-3">
          <h4 className="text-center font-bold mb-2 text-green-400">18&apos;s Groups (1:1)</h4>
          <div className="space-y-1.5">
            {WHEEL_BETS.wheel18s.map(bet => (
              <div key={bet.key} className="space-y-1">
                <div className="text-xs font-medium text-gray-300 text-center">{bet.label}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleBetToggle(bet.key + '_a')}
                    className={`flex-1 px-1 py-1 rounded text-xs font-bold ${bet.colorA} hover:opacity-80 transition-all text-white ${
                      pendingBets[bet.key + '_a'] ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    {bet.label.split('/')[0]}
                  </button>
                  <input
                    type="number"
                    value={pendingBets[bet.key + '_a'] || ''}
                    onChange={(e) => handleBetAmountChange(bet.key + '_a', e.target.value)}
                    placeholder={bettingSystem.currentBet.toString()}
                    className="w-12 px-1 py-1 bg-black/50 border border-gray-600 rounded text-center text-xs"
                  />
                  <button
                    onClick={() => handleBetToggle(bet.key + '_b')}
                    className={`flex-1 px-1 py-1 rounded text-xs font-bold ${bet.colorB} hover:opacity-80 transition-all text-white ${
                      pendingBets[bet.key + '_b'] ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    {bet.label.split('/')[1]}
                  </button>
                  <input
                    type="number"
                    value={pendingBets[bet.key + '_b'] || ''}
                    onChange={(e) => handleBetAmountChange(bet.key + '_b', e.target.value)}
                    placeholder={bettingSystem.currentBet.toString()}
                    className="w-12 px-1 py-1 bg-black/50 border border-gray-600 rounded text-center text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9's Sectors Card */}
        <div className="bg-gray-800 rounded-lg border border-cyan-700 p-3">
          <h4 className="text-center font-bold mb-2 text-cyan-400">9&apos;s Sectors (3:1)</h4>
          <div className="space-y-1.5">
            {WHEEL_BETS.sectors9s.map(bet => (
              <div key={bet.key} className="flex items-center gap-1">
                <button
                  onClick={() => handleBetToggle(bet.key)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${bet.color} hover:opacity-80 transition-all text-white ${
                    pendingBets[bet.key] ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {bet.label}
                </button>
                <input
                  type="number"
                  value={pendingBets[bet.key] || ''}
                  onChange={(e) => handleBetAmountChange(bet.key, e.target.value)}
                  placeholder={bettingSystem.currentBet.toString()}
                  className="w-16 px-1 py-1.5 bg-black/50 border border-gray-600 rounded text-center text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Bets & Stake */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
        <h4 className="font-bold mb-2 text-white text-sm">Current Bets</h4>
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs">
            Active: <span className="text-white font-bold">{activeBets}</span>
          </div>
          <div className="text-gray-400 text-xs">
            Total: <span className="text-yellow-400 font-bold text-sm">${totalStake.toFixed(2)}</span>
          </div>
        </div>

        {/* Display active bets */}
        {activeBets > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex flex-wrap gap-1">
              {Object.entries(pendingBets).filter(([_, value]) => value > 0).map(([key, value]) => (
                <div key={key} className="px-2 py-1 bg-black/40 rounded text-xs">
                  <span className="text-gray-400">{key.toUpperCase()}:</span>
                  <span className="text-green-400 font-bold ml-1">${value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spin Number Input */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
        <h4 className="font-bold mb-2 text-white text-sm">Enter Spin Result</h4>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            max="36"
            value={spinNumber}
            onChange={(e) => setSpinNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpinSubmit()}
            placeholder="0-36"
            className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleSpinSubmit}
            disabled={!spinNumber || Object.keys(pendingBets).length === 0}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded font-bold transition-all"
          >
            SPIN
          </button>
        </div>
      </div>

      {/* Bet History Summary */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
        <h4 className="font-bold mb-2 text-white text-sm">Recent Bets</h4>
        {card.bets.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-2">No bets placed yet</p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {card.bets.slice().reverse().slice(0, 5).map((bet) => (
              <div key={bet.id} className="flex justify-between items-center text-xs border-b border-gray-700 pb-1">
                <span className="text-gray-400">#{bet.betNumber}</span>
                <span className={`font-bold ${bet.outcome === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                  {bet.outcome === 'win' ? '+' : ''}{bet.totalPnL.toFixed(2)}
                </span>
                <span className="text-gray-500">${bet.runningCardTotal.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
