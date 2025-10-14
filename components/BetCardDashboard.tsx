// components/BetCardDashboard.tsx
'use client'

import React, { useState } from 'react'
import { Play, Lock, Check, X } from 'lucide-react'
import type { SessionState, BetCard } from '../types/bettingAssistant'

// ✅ ADD THIS TOOLTIP COMPONENT
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string | React.ReactNode }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-yellow-400/30">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
)
interface BetCardDashboardProps {
  session: SessionState
  onSelectCard: (index: number) => void
  onEndSession: () => void
  onOpenAdvisor: () => void    // ✅ ADD THIS
  onOpenPerformance: () => void // ✅ ADD THIS
}

// ✅ EXPANDED CARD DETAIL VIEW
const ExpandedCardDetail = ({ card, onClose }: { card: BetCard; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'spins' | 'numbers' | 'analysis'>('matrix')
  const [matrixTab, setMatrixTab] = useState<'table-common' | 'table-special' | 'wheel-common' | 'wheel-special'>('table-common')
  
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
  const cardBets = card.bets || []
  
  // Get all numbers that were hit during this card
  const numbersHit = cardBets.map(bet => bet.numberHit).filter(n => n !== null && n !== undefined)
  const uniqueNumbers = Array.from(new Set(numbersHit))
  
  // Calculate hot numbers (most frequent)
  const numberFrequency = numbersHit.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const hotNumbers = Object.entries(numberFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  
  // Group detection helpers (reusing from CompactBettingCard)
  const checkGroupWon = (num: number, betKey: string): boolean => {
    // Simplified version - add full logic from CompactBettingCard if needed
    switch(betKey) {
      case 'red': return redNumbers.includes(num)
      case 'black': return !redNumbers.includes(num) && num !== 0
      case 'even': return num !== 0 && num % 2 === 0
      case 'odd': return num % 2 === 1
      case 'low': return num >= 1 && num <= 18
      case 'high': return num >= 19 && num <= 36
      case 'dozen1': return num >= 1 && num <= 12
      case 'dozen2': return num >= 13 && num <= 24
      case 'dozen3': return num >= 25 && num <= 36
      case 'col1': return num !== 0 && num % 3 === 1
      case 'col2': return num !== 0 && num % 3 === 2
      case 'col3': return num !== 0 && num % 3 === 0
      default: return false
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-yellow-400 p-6 mb-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-yellow-400">Card #{card.cardNumber} - Detailed Analysis</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
              card.status === 'completed' ? 'bg-green-600' :
              card.status === 'failed' ? 'bg-red-600' :
              'bg-blue-600'
            }`}>
              {card.status.toUpperCase()}
            </span>
            <span className={`text-2xl font-bold ${card.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {card.currentTotal >= 0 ? '+' : ''}${card.currentTotal}
            </span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
        >
          ✕ Close Detail View
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'matrix' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📊 Betting Matrix
        </button>
        <button
          onClick={() => setActiveTab('spins')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'spins' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🎲 Spin History
        </button>
        <button
          onClick={() => setActiveTab('numbers')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'numbers' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔢 Numbers Hit
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'analysis' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📈 Analysis
        </button>
      </div>

      {/* BETTING MATRIX TAB */}
      {activeTab === 'matrix' && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMatrixTab('table-common')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold ${
                matrixTab === 'table-common' ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              📊 Table Common
            </button>
            <button
              onClick={() => setMatrixTab('table-special')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold ${
                matrixTab === 'table-special' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              ⭐ Table Special
            </button>
            <button
              onClick={() => setMatrixTab('wheel-common')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold ${
                matrixTab === 'wheel-common' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🎡 Wheel Common
            </button>
            <button
              onClick={() => setMatrixTab('wheel-special')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold ${
                matrixTab === 'wheel-special' ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🎯 Wheel Special
            </button>
          </div>

          {/* Table Common Matrix */}
          {matrixTab === 'table-common' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-900">
                  <tr>
                    <th className="border border-gray-700 p-2 bg-gray-800">Spin</th>
                    <th className="border border-gray-700 p-2 bg-gray-800">Number</th>
                    <th colSpan={2} className="border border-gray-700 p-2 bg-red-800/60">Colors</th>
                    <th colSpan={2} className="border border-gray-700 p-2 bg-blue-800/60">Even/Odd</th>
                    <th colSpan={2} className="border border-gray-700 p-2 bg-purple-800/60">Low/High</th>
                    <th colSpan={3} className="border border-gray-700 p-2 bg-orange-800/60">Dozens</th>
                    <th colSpan={3} className="border border-gray-700 p-2 bg-emerald-800/60">Columns</th>
                    <th className="border border-gray-700 p-2 bg-gray-800">P/L</th>
                  </tr>
                  <tr className="text-[10px]">
                    <th className="border border-gray-700 p-1 bg-gray-800">#</th>
                    <th className="border border-gray-700 p-1 bg-gray-800">Num</th>
                    <th className="border border-gray-700 p-1 bg-red-900/40">R</th>
                    <th className="border border-gray-700 p-1 bg-gray-900/40">B</th>
                    <th className="border border-gray-700 p-1 bg-blue-900/40">E</th>
                    <th className="border border-gray-700 p-1 bg-orange-900/40">O</th>
                    <th className="border border-gray-700 p-1 bg-purple-900/40">L</th>
                    <th className="border border-gray-700 p-1 bg-pink-900/40">H</th>
                    <th className="border border-gray-700 p-1 bg-orange-900/40">1</th>
                    <th className="border border-gray-700 p-1 bg-orange-900/40">2</th>
                    <th className="border border-gray-700 p-1 bg-orange-900/40">3</th>
                    <th className="border border-gray-700 p-1 bg-emerald-900/40">1</th>
                    <th className="border border-gray-700 p-1 bg-emerald-900/40">2</th>
                    <th className="border border-gray-700 p-1 bg-emerald-900/40">3</th>
                    <th className="border border-gray-700 p-1 bg-gray-800">$</th>
                  </tr>
                </thead>
                <tbody>
                  {cardBets.map((bet, idx) => {
                    const num = bet.numberHit
                    const groups = ['red', 'black', 'even', 'odd', 'low', 'high', 'dozen1', 'dozen2', 'dozen3', 'col1', 'col2', 'col3']
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-700/30">
                        <td className="border border-gray-700 p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-gray-700 p-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded font-bold ${
                            num === 0 ? 'bg-green-600' :
                            redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900'
                          }`}>
                            {num}
                          </span>
                        </td>
                        {groups.map(group => {
                          const won = checkGroupWon(num, group)
                          return (
                            <td
                              key={group}
                              className={`border border-gray-700 p-2 text-center ${
                                won ? 'bg-green-900/30' : 'bg-gray-900/20'
                              }`}
                            >
                              {won ? <span className="text-green-400">✓</span> : ''}
                            </td>
                          )
                        })}
                        <td className="border border-gray-700 p-2 text-center font-bold">
                          <span className={bet.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {bet.totalPnL >= 0 ? '+' : ''}${bet.totalPnL}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Other matrix tabs - simplified for now */}
          {matrixTab !== 'table-common' && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">📊 {matrixTab} Matrix</p>
              <p className="text-sm">Detailed matrix view coming soon</p>
            </div>
          )}
        </div>
      )}

      {/* SPIN HISTORY TAB */}
      {activeTab === 'spins' && (
        <div className="bg-gray-800/50 rounded-xl p-4 max-h-96 overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Complete Spin History</h3>
          <div className="space-y-2">
            {cardBets.map((bet, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3 border ${
                  bet.totalPnL > 0 ? 'bg-green-900/20 border-green-600' :
                  bet.totalPnL < 0 ? 'bg-red-900/20 border-red-600' :
                  'bg-gray-900/20 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                    <span className={`inline-block px-3 py-1 rounded-lg font-bold text-lg ${
                      bet.numberHit === 0 ? 'bg-green-600' :
                      redNumbers.includes(bet.numberHit) ? 'bg-red-600' : 'bg-gray-900'
                    }`}>
                      {bet.numberHit}
                    </span>
                    <span className="text-sm text-gray-400">
                      Wagered: ${bet.betAmount}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${bet.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bet.totalPnL >= 0 ? '+' : ''}${bet.totalPnL}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NUMBERS HIT TAB */}
      {activeTab === 'numbers' && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-xl font-bold text-white mb-4">Numbers Hit During This Card</h3>
          
          <div className="grid grid-cols-12 gap-2 mb-6">
            {Array.from({ length: 37 }, (_, i) => i).map(num => {
              const hitCount = numberFrequency[num] || 0
              const wasHit = hitCount > 0
              
              return (
                <div
                  key={num}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center font-bold border-2 ${
                    !wasHit ? 'bg-gray-700/30 border-gray-600 opacity-30' :
                    num === 0 ? 'bg-green-600 border-green-400' :
                    redNumbers.includes(num) ? 'bg-red-600 border-red-400' :
                    'bg-gray-900 border-gray-600'
                  }`}
                >
                  <span className="text-lg">{num}</span>
                  {hitCount > 1 && <span className="text-[8px] text-yellow-400">×{hitCount}</span>}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="font-bold text-red-400 mb-3">🔥 Hot Numbers</h4>
              <div className="space-y-2">
                {hotNumbers.map(([num, count]) => (
                  <div key={num} className="flex items-center justify-between">
                    <span className={`inline-block px-3 py-1 rounded font-bold ${
                      Number(num) === 0 ? 'bg-green-600' :
                      redNumbers.includes(Number(num)) ? 'bg-red-600' : 'bg-gray-900'
                    }`}>
                      {num}
                    </span>
                    <span className="text-gray-400">Hit {count}× ({((count / numbersHit.length) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-3">❄️ Cold Numbers</h4>
              <div className="space-y-2">
                {Array.from({ length: 37 }, (_, i) => i)
                  .filter(num => !uniqueNumbers.includes(num))
                  .slice(0, 5)
                  .map(num => (
                    <div key={num} className="flex items-center justify-between">
                      <span className={`inline-block px-3 py-1 rounded font-bold opacity-50 ${
                        num === 0 ? 'bg-green-600' :
                        redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900'
                      }`}>
                        {num}
                      </span>
                      <span className="text-gray-400">Never hit</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS TAB */}
      {activeTab === 'analysis' && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-xl font-bold text-white mb-4">Card Performance Analysis</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-2">Efficiency Score</h4>
              <div className="text-3xl font-bold text-cyan-400">
                {card.status === 'completed' 
                  ? `${((card.target / card.currentTotal) * 100).toFixed(0)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {card.status === 'completed'
                  ? `Reached $${card.target} with $${card.currentTotal} (${card.betsUsed} bets)`
                  : 'Card not completed'}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-2">Average P/L per Spin</h4>
              <div className={`text-3xl font-bold ${
                card.currentTotal / cardBets.length >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${(card.currentTotal / (cardBets.length || 1)).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total: ${card.currentTotal} ÷ {cardBets.length} spins
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-2">Numbers Diversity</h4>
              <div className="text-3xl font-bold text-purple-400">
                {uniqueNumbers.length}/37
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {((uniqueNumbers.length / 37) * 100).toFixed(1)}% of wheel covered
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BetCardDashboard({ session, onSelectCard, onEndSession, onOpenAdvisor, onOpenPerformance }: BetCardDashboardProps) {
  const completedCards = session.cards.filter(c => c.status === 'completed').length
  const failedCards = session.cards.filter(c => c.status === 'failed').length
  const totalProfit = session.currentBankroll - session.config.bankroll
  const roi = ((totalProfit / session.config.bankroll) * 100).toFixed(1)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
        <div className="flex justify-between items-start mb-4">
  <div>
    <h1 className="text-3xl font-bold text-yellow-400 mb-2">🎯 Bet Card Dashboard</h1>
    <p className="text-sm text-gray-400">
      System: {session.config.bettingSystem.emoji || '🎲'} {session.config.bettingSystem.name} • 
      Base: ${session.config.bettingSystem.baseBet} → Current: ${session.config.bettingSystem.currentBet}
    </p>
  </div>
  
  {/* ✅ THREE BUTTONS IN A ROW */}
  <div className="flex gap-3">
    <button 
      onClick={onOpenAdvisor} 
      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-white transition-all"
    >
      🎯 Bet Advisor
    </button>
    
    <button 
      onClick={onOpenPerformance} 
      className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-bold text-white transition-all"
    >
      📊 Performance
    </button>
    
    <button 
      onClick={onEndSession} 
      className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-colors"
    >
      End Session
    </button>
  </div>
</div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-500/30 rounded-lg p-4">
              <p className="text-xs text-green-300 mb-1">Current Bankroll</p>
              <p className="text-2xl font-bold text-green-400">${session.currentBankroll}</p>
              <p className="text-xs text-green-300/70 mt-1">Start: ${session.config.bankroll}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-blue-300 mb-1">Total P/L</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}${totalProfit}
              </p>
              <p className="text-xs text-blue-300/70 mt-1">ROI: {roi}%</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-500/30 rounded-lg p-4">
              <p className="text-xs text-purple-300 mb-1">Cards Completed</p>
              <p className="text-2xl font-bold text-purple-400">{completedCards}</p>
              <p className="text-xs text-purple-300/70 mt-1">Failed: {failedCards}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 border border-orange-500/30 rounded-lg p-4">
              <p className="text-xs text-orange-300 mb-1">Total Wagered</p>
              <p className="text-2xl font-bold text-orange-400">${session.totalWagered}</p>
              <p className="text-xs text-orange-300/70 mt-1">Returned: ${session.totalReturned}</p>
            </div>
          </div>
        </div>

        {totalProfit <= -session.config.stopLoss && (
          <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-300 text-lg">Stop Loss Reached!</h3>
                <p className="text-sm text-red-200">
                  You've lost ${Math.abs(totalProfit)} (Limit: ${session.config.stopLoss}). Consider ending the session.
                </p>
              </div>
            </div>
          </div>
        )}

        {totalProfit >= session.config.stopProfit && (
          <div className="bg-green-900/30 border-2 border-green-500 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="font-bold text-green-300 text-lg">Profit Target Reached!</h3>
                <p className="text-sm text-green-200">
                  You've won ${totalProfit} (Target: ${session.config.stopProfit}). Great job! Consider ending on a high note.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">🗂️ Bet Cards</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-gray-500" />
                <span className="text-gray-400">Locked</span>
              </div>
              <div className="flex items-center gap-2">
                <Play size={16} className="text-yellow-400" />
                <span className="text-gray-400">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                <span className="text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <X size={16} className="text-red-400" />
                <span className="text-gray-400">Failed</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4">
  {session.cards.map((card: BetCard, index: number) => {
    const isClickable = card.status !== 'locked'
    const progressPercent = (card.currentTotal / card.target) * 100
    
    // ✅ NEW: Calculate enhanced metrics
    const cardBets = card.bets || []
    const totalWagered = cardBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0)
    const avgBet = cardBets.length > 0 ? totalWagered / cardBets.length : 0
    const biggestWin = cardBets.length > 0 ? Math.max(...cardBets.map(b => b.totalPnL || 0), 0) : 0
    const biggestLoss = cardBets.length > 0 ? Math.min(...cardBets.map(b => b.totalPnL || 0), 0) : 0
    const wins = cardBets.filter(b => (b.totalPnL || 0) > 0).length
    const losses = cardBets.filter(b => (b.totalPnL || 0) < 0).length
    const cardWinRate = cardBets.length > 0 ? (wins / cardBets.length * 100) : 0
    
    // Calculate duration if timestamps exist
    const duration = card.startTime && card.status !== 'active' 
      ? (() => {
          const endTime = cardBets.length > 0 
            ? new Date(cardBets[cardBets.length - 1].timestamp)
            : new Date()
          const diff = endTime.getTime() - new Date(card.startTime).getTime()
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          return `${minutes}m ${seconds}s`
        })()
      : null
    
    return (
      <button 
  key={card.id} 
  onClick={(e) => {
    e.stopPropagation()
    if (isClickable) {
      // If clicking on metrics, expand detail view instead
      if ((e.target as HTMLElement).closest('.enhanced-metrics')) {
        setExpandedCardId(expandedCardId === card.id ? null : card.id)
      } else {
        onSelectCard(index)
      }
    }
  }}
        disabled={card.status === 'locked'}
        className={`relative p-4 rounded-xl border-2 transition-all ${
          card.status === 'active' 
            ? 'bg-yellow-500/20 border-yellow-400 hover:bg-yellow-500/30 hover:scale-105' :
          card.status === 'locked' 
            ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed' :
          card.status === 'completed' 
            ? 'bg-green-500/20 border-green-400 hover:bg-green-500/30 hover:scale-105' :
          card.status === 'failed' 
            ? 'bg-red-500/20 border-red-400 hover:bg-red-500/30 hover:scale-105' 
            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:scale-105'
        }`}
      >
        {/* Status Icon */}
        <div className="absolute top-2 right-2">
          {card.status === 'locked' && <Lock size={16} className="text-gray-500" />}
          {card.status === 'completed' && <Check size={20} className="text-green-400" />}
          {card.status === 'failed' && <X size={20} className="text-red-400" />}
          {card.status === 'active' && <Play size={18} className="text-yellow-400 animate-pulse" />}
        </div>

        {/* Card Number & P/L */}
        <div className="text-3xl font-bold text-white mb-1">#{card.cardNumber}</div>
        <div className={`text-lg font-bold mb-2 ${card.currentTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {card.currentTotal >= 0 ? '+' : ''}${card.currentTotal}
        </div>
        
        {/* Basic Info */}
        <div className="text-xs text-gray-400 mb-3">
          Target: ${card.target}
        </div>
        
        {/* Progress Bar */}
        {card.status !== 'locked' && (
          <>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden mb-2">
              <div 
                className={`h-full transition-all ${
                  card.status === 'completed' ? 'bg-green-500' :
                  card.status === 'failed' ? 'bg-red-500' :
                  card.status === 'active' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            
            {/* Bets Used */}
            <div className="text-xs text-gray-400 mb-3">
              {card.betsUsed}/{card.maxBets} bets
            </div>

            {/* ✅ ENHANCED METRICS - Only show for non-locked cards with bets */}
            {cardBets.length > 0 && (
              <div 
              className="border-t border-gray-600/50 pt-3 space-y-1.5 enhanced-metrics cursor-pointer hover:border-yellow-400/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setExpandedCardId(card.id)
              }}
            >
               {/* Row 1: Avg Bet, Best Win, Duration */}
<div className="grid grid-cols-3 gap-1 text-[10px]">
  {/* Avg Bet with Tooltip */}
  <Tooltip content={`Total: $${totalWagered.toFixed(0)} ÷ ${cardBets.length} bets`}>
    <div className="bg-black/30 rounded px-1.5 py-1 cursor-help hover:bg-black/50 transition-colors">
      <div className="text-gray-500 text-[8px] mb-0.5">Avg</div>
      <div className="text-white font-bold">${avgBet.toFixed(0)}</div>
    </div>
  </Tooltip>

  {/* Best Win with Tooltip */}
  <Tooltip content={
    (() => {
      const bestBet = cardBets.find(b => b.totalPnL === biggestWin)
      return bestBet ? `Spin #${bestBet.betNumber}: Number ${bestBet.numberHit}` : 'No wins yet'
    })()
  }>
    <div className="bg-black/30 rounded px-1.5 py-1 cursor-help hover:bg-black/50 transition-colors">
      <div className="text-gray-500 text-[8px] mb-0.5">Best</div>
      <div className="text-green-400 font-bold">+${biggestWin}</div>
    </div>
  </Tooltip>

  {/* Duration with Tooltip */}
  <Tooltip content={
    card.startTime 
      ? `Started: ${new Date(card.startTime).toLocaleTimeString()}` 
      : 'Not started'
  }>
    <div className="bg-black/30 rounded px-1.5 py-1 cursor-help hover:bg-black/50 transition-colors">
      <div className="text-gray-500 text-[8px] mb-0.5">Time</div>
      <div className="text-cyan-400 font-bold text-[9px]">
        {duration || (card.status === 'active' ? 'Live' : 'N/A')}
      </div>
    </div>
  </Tooltip>
</div>

{/* Row 2: Win Rate, Worst Loss, Record */}
<div className="grid grid-cols-3 gap-1 text-[10px]">
  {/* Win Rate with Tooltip */}
  <Tooltip content={
    <div className="text-center">
      <div className="text-green-400">✓ {wins} Wins</div>
      <div className="text-red-400">✗ {losses} Losses</div>
      <div className="text-gray-400">− {cardBets.length - wins - losses} Break-even</div>
    </div>
  }>
    <div className="bg-black/30 rounded px-1.5 py-1 cursor-help hover:bg-black/50 transition-colors">
      <div className="text-gray-500 text-[8px] mb-0.5">Win%</div>
      <div className="text-purple-400 font-bold">{cardWinRate.toFixed(0)}%</div>
    </div>
  </Tooltip>

  {/* Worst Loss with Tooltip */}
  <Tooltip content={
    (() => {
      const worstBet = cardBets.find(b => b.totalPnL === biggestLoss)
      return worstBet ? `Spin #${worstBet.betNumber}: Number ${worstBet.numberHit}` : 'No losses yet'
    })()
  }>
    <div className="bg-black/30 rounded px-1.5 py-1 cursor-help hover:bg-black/50 transition-colors">
      <div className="text-gray-500 text-[8px] mb-0.5">Worst</div>
      <div className="text-red-400 font-bold">{biggestLoss}</div>
    </div>
  </Tooltip>

  {/* W-L Record with Tooltip */}
  <Tooltip content={`${wins} Wins, ${losses} Losses (${cardWinRate.toFixed(1)}% win rate)`}>
    <div className="bg-black/30 rounded px-1.5 py-1 cursor-help hover:bg-black/50 transition-colors">
      <div className="text-gray-500 text-[8px] mb-0.5">W-L</div>
      <div className="text-white font-bold text-[9px]">{wins}-{losses}</div>
    </div>
  </Tooltip>
</div>
              </div>
            )}
          </>
        )}
      </button>
    )
            })}
          </div>
        </div>
{/* ✅ EXPANDED CARD DETAIL VIEW */}
{expandedCardId && (
  <ExpandedCardDetail
    card={session.cards.find(c => c.id === expandedCardId)!}
    onClose={() => setExpandedCardId(null)}
  />
)}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-bold text-blue-300 mb-2">📋 How to Use</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Click any <span className="text-yellow-400 font-bold">Active</span> or <span className="text-green-400 font-bold">Completed</span> card to view/edit bets</li>
            <li>• <span className="text-gray-400">Locked</span> cards unlock automatically when previous card completes</li>
            <li>• Each card has a target of ${session.config.cardTargetAmount} and max {session.config.maxBetsPerCard} bets</li>
            <li>• Your betting system will adjust bet sizes automatically based on wins/losses</li>
          </ul>
        </div>
      </div>
    </div>
  )
}