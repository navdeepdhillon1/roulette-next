'use client'
import React, { useState, useMemo } from 'react'
import { RED_NUMBERS, WHEEL_ORDER, WHEEL_BETS, checkIfGroupWon, getGroupPayout, type GroupKey } from '@/lib/roulette-logic'
import { hitCountsByNumberForWindow } from '@/lib/roulette-analytics'

interface WheelViewProps {
  spins: number[]
  inputNumber: string
  setInputNumber: (value: string) => void
  addNumber: () => void
  manualBets: Record<string, string>
  setManualBets: (bets: Record<string, string>) => void
  betHistory: Array<{ spin: number | null; bets: Record<string, string>; results: Record<string, number>; totalPnL: number; timestamp: Date }>
  setBetHistory: (history: WheelViewProps['betHistory']) => void
  sessionPnL: number
  playerContext: { unitSize: number }
  showHeatMap: boolean
  setShowHeatMap: (show: boolean) => void
}

export default function WheelView({
  spins,
  inputNumber,
  setInputNumber,
  addNumber,
  manualBets,
  setManualBets,
  betHistory,
  setBetHistory,
  sessionPnL,
  playerContext,
  showHeatMap: _showHeatMap,
  setShowHeatMap: _setShowHeatMap
}: WheelViewProps) {
  
  const [showHotCold, setShowHotCold] = useState(false)
  
  // Use centralized wheel order and red numbers
  const wheelOrder = WHEEL_ORDER
  
  // Centralized wheel betting groups with colors
  const wheelBets = WHEEL_BETS

  const includesNum = (arr: readonly number[], n: number) => (arr as readonly number[]).includes(n)

  // Calculate hit counts for last 36 spins (centralized)
  const hitCounts = useMemo(() => hitCountsByNumberForWindow(spins, 36), [spins])

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600'
    return RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-gray-900'
  }

  const handleBetClick = (betKey: string) => {
    const currentValue = manualBets[betKey]
    const newValue = currentValue ? '' : playerContext.unitSize.toString()
    const updatedBets = {
      ...manualBets,
      [betKey]: newValue
    }
    setManualBets(updatedBets)
    
    // Update or create pending bet row in history
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
  }

  const totalStake = Object.values(manualBets).reduce((sum: number, val) => sum + (parseFloat(val) || 0), 0)
  const activeBets = Object.keys(manualBets).filter(key => manualBets[key] && parseFloat(manualBets[key]) > 0).length

  return (
    <div className="space-y-4">
      {/* Betting Cards - Wheel Specific Groups */}
      <div className="grid grid-cols-3 gap-4">
        
        {/* Special Bets Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h4 className="text-center font-bold mb-3 text-purple-400">Special Bets</h4>
          <div className="space-y-2">
            {wheelBets.special.map(bet => (
              <div key={bet.key} className="flex items-center gap-1">
                <button
                  onClick={() => handleBetClick(bet.key)}
                  className={`flex-1 px-2 py-1 rounded text-sm font-medium ${bet.color} hover:opacity-80 transition-all text-white ${
                    manualBets[bet.key] ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {bet.label}
                </button>
                <input
                  type="number"
                  value={manualBets[bet.key] || ''}
                  onChange={(e) => {
                    const updatedBets = {
                      ...manualBets,
                      [bet.key]: e.target.value
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
                  className="w-14 px-1 py-1 bg-black/50 border border-gray-600 rounded text-center text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 18's Groups Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h4 className="text-center font-bold mb-3 text-green-400">18&apos;s (1:1)</h4>
          <div className="space-y-2">
            {wheelBets.wheel18s.map(bet => (
              <div key={bet.key} className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-300 w-16">{bet.label}</span>
                <button
                  onClick={() => handleBetClick(bet.key + '_a')}
                  className={`flex-1 px-1 py-1 rounded text-xs font-bold ${bet.colorA} hover:opacity-80 transition-all text-white ${
                    manualBets[bet.key + '_a'] ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {bet.label.split('/')[0]}
                </button>
                <input
                  type="number"
                  value={manualBets[bet.key + '_a'] || ''}
                  onChange={(e) => {
                    const updatedBets = {
                      ...manualBets,
                      [bet.key + '_a']: e.target.value
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
                  className="w-12 px-1 py-1 bg-black/50 border border-gray-600 rounded text-center text-xs"
                />
                <button
                  onClick={() => handleBetClick(bet.key + '_b')}
                  className={`flex-1 px-1 py-1 rounded text-xs font-bold ${bet.colorB} hover:opacity-80 transition-all text-white ${
                    manualBets[bet.key + '_b'] ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {bet.label.split('/')[1]}
                </button>
                <input
                  type="number"
                  value={manualBets[bet.key + '_b'] || ''}
                  onChange={(e) => {
                    const updatedBets = {
                      ...manualBets,
                      [bet.key + '_b']: e.target.value
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
                  className="w-12 px-1 py-1 bg-black/50 border border-gray-600 rounded text-center text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 9's Sectors Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h4 className="text-center font-bold mb-3 text-cyan-400">9&apos;s Sectors</h4>
          <div className="space-y-2">
            {wheelBets.sectors9s.map(bet => (
              <div key={bet.key} className="flex items-center gap-1">
                <button
                  onClick={() => handleBetClick(bet.key)}
                  className={`flex-1 px-2 py-1 rounded text-sm font-medium ${bet.color} hover:opacity-80 transition-all text-white ${
                    manualBets[bet.key] ? 'ring-2 ring-white' : ''
                  }`}
                >
                  {bet.label}
                </button>
                <input
                  type="number"
                  value={manualBets[bet.key] || ''}
                  onChange={(e) => {
                    const updatedBets = {
                      ...manualBets,
                      [bet.key]: e.target.value
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
                  className="w-14 px-1 py-1 bg-black/50 border border-gray-600 rounded text-center text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Bets & Stake */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h4 className="font-bold mb-3 text-white">Current Bets & Stake</h4>
        <div className="flex justify-between items-center">
          <div className="text-gray-400">
            Active: <span className="text-white font-bold">{activeBets}</span>
          </div>
          <div className="text-gray-400">
            Total: <span className="text-yellow-400 font-bold text-lg">${totalStake.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Display active bets if any */}
        {activeBets > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex flex-wrap gap-2">
              {Object.entries(manualBets).filter(([_, value]) => value && parseFloat(value as string) > 0).map(([key, value]) => (
                <div key={key} className="px-2 py-1 bg-black/40 rounded text-xs">
                  <span className="text-gray-400">{
                    key.replace(/_/g, ' ').toUpperCase()
                  }:</span>
                  <span className="text-green-400 font-bold ml-1">${value as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hot/Cold Analysis with Racetrack */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-white flex items-center gap-2">
            🔥 Hot/Cold Analysis - Last 36 Spins
          </h4>
          <button
            onClick={() => setShowHotCold(!showHotCold)}
            className="text-sm text-gray-400 hover:text-white"
          >
            {showHotCold ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showHotCold && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-center text-xs text-gray-400 mb-3">THE RACETRACK - Wheel Order</div>
              {/* Racetrack layout code (keeping existing) */}
              <div className="space-y-1">
                {/* Top row - first 18 numbers */}
                <div className="grid grid-cols-18 gap-1">
                  {wheelOrder.slice(0, 18).map((num) => {
                    const heat = hitCounts[num] || 0
                    const opacity = heat === 0 ? 'opacity-60' : ''
                    return (
                      <button
                        key={num}
                        onClick={() => setInputNumber(num.toString())}
                        className={`h-10 w-full ${
                          num === 0 ? 'bg-green-600 hover:bg-green-500' :
                          RED_NUMBERS.includes(num) ? 'bg-red-600 hover:bg-red-500' : 
                          'bg-gray-900 hover:bg-gray-800'
                        } text-white rounded text-[10px] font-bold relative ${opacity} ${
                          heat >= 3 ? 'ring-2 ring-yellow-400' : ''
                        }`}
                      >
                        {num}
                        {heat > 0 && (
                          <span className={`absolute -top-1 -right-1 text-[8px] ${
                            heat >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
                          } text-black px-1 rounded-full font-bold`}>
                            {heat}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                
                {/* Middle row - just 2 numbers at the ends */}
                <div className="grid grid-cols-18 gap-1">
                  <button
                    onClick={() => setInputNumber(wheelOrder[36].toString())}
                    className={`h-10 ${
                      RED_NUMBERS.includes(wheelOrder[36]) ? 'bg-red-600 hover:bg-red-500' : 
                      'bg-gray-900 hover:bg-gray-800'
                    } text-white rounded text-[10px] font-bold`}
                  >
                    {wheelOrder[36]}
                  </button>
                  <div className="col-span-16"></div>
                  <button
                    onClick={() => setInputNumber(wheelOrder[18].toString())}
                    className={`h-10 ${
                      RED_NUMBERS.includes(wheelOrder[18]) ? 'bg-red-600 hover:bg-red-500' : 
                      'bg-gray-900 hover:bg-gray-800'
                    } text-white rounded text-[10px] font-bold`}
                  >
                    {wheelOrder[18]}
                  </button>
                </div>
                
                {/* Bottom row - remaining numbers (reversed) */}
                <div className="grid grid-cols-17 gap-1">
                  {wheelOrder.slice(19, 36).reverse().map((num) => {
                    const heat = hitCounts[num] || 0
                    const opacity = heat === 0 ? 'opacity-60' : ''
                    return (
                      <button
                        key={num}
                        onClick={() => setInputNumber(num.toString())}
                        className={`h-10 w-full ${
                          RED_NUMBERS.includes(num) ? 'bg-red-600 hover:bg-red-500' : 
                          'bg-gray-900 hover:bg-gray-800'
                        } text-white rounded text-[10px] font-bold relative ${opacity} ${
                          heat >= 3 ? 'ring-2 ring-yellow-400' : ''
                        }`}
                      >
                        {num}
                        {heat > 0 && (
                          <span className={`absolute -top-1 -right-1 text-[8px] ${
                            heat >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
                          } text-black px-1 rounded-full font-bold`}>
                            {heat}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Heat Legend */}
              <div className="flex justify-center gap-6 text-xs mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600 rounded-full ring-4 ring-yellow-400"></div>
                  <span className="text-gray-300">Hot (3+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-900 rounded-full ring-2 ring-orange-400"></div>
                  <span className="text-gray-300">Warm (2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600 rounded-full ring-1 ring-yellow-300"></div>
                  <span className="text-gray-300">Hit (1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-900 rounded-full opacity-50"></div>
                  <span className="text-gray-300">Cold (0)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Numbers and Add Input */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center gap-4">
          {/* Recent Numbers */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-400">Recent:</span>
            <div className="flex gap-1">
              {spins.slice(0, 8).map((num, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-full ${getNumberColor(num)} flex items-center justify-center font-bold text-sm text-white`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-8 w-px bg-gray-600"></div>
          
          {/* Add Input */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-bold text-green-400">Add:</span>
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
            <button
              onClick={() => {
                setManualBets({})
                setBetHistory([])
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-bold text-white"
            >
              CLR
            </button>
          </div>
        </div>
      </div>

      {/* FIXED: Betting Performance Matrix with Active Bets Display */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h4 className="font-bold mb-3 text-white">Betting Performance Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="px-2 py-1 text-left">Num</th>
                <th className="px-2 py-1">Vois</th>
                <th className="px-2 py-1">Orph</th>
                <th className="px-2 py-1">Tiers</th>
                <th className="px-2 py-1">Zero</th>
                <th className="px-2 py-1">N-Vois</th>
                <th className="px-2 py-1">A</th>
                <th className="px-2 py-1">B</th>
                <th className="px-2 py-1">AA</th>
                <th className="px-2 py-1">BB</th>
                <th className="px-2 py-1">AAA</th>
                <th className="px-2 py-1">BBB</th>
                <th className="px-2 py-1">1st9</th>
                <th className="px-2 py-1">2nd9</th>
                <th className="px-2 py-1">3rd9</th>
                <th className="px-2 py-1">4th9</th>
              </tr>
            </thead>
            <tbody>
              {/* ACTIVE BETS ROW - Show pending bets from betHistory */}
              {betHistory.length > 0 && betHistory[0].spin === null && (
                <tr className="bg-amber-900/20 border-b border-yellow-600/50">
                  <td className="px-2 py-1 font-bold text-yellow-400">...</td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['voisins'] ? `$${betHistory[0].bets['voisins']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['orphelins'] ? `$${betHistory[0].bets['orphelins']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['tiers'] ? `$${betHistory[0].bets['tiers']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['jeu_zero'] ? `$${betHistory[0].bets['jeu_zero']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['non_voisin'] ? `$${betHistory[0].bets['non_voisin']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['a_b_a'] ? `$${betHistory[0].bets['a_b_a']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['a_b_b'] ? `$${betHistory[0].bets['a_b_b']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['aa_bb_a'] ? `$${betHistory[0].bets['aa_bb_a']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['aa_bb_b'] ? `$${betHistory[0].bets['aa_bb_b']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['aaa_bbb_a'] ? `$${betHistory[0].bets['aaa_bbb_a']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['aaa_bbb_b'] ? `$${betHistory[0].bets['aaa_bbb_b']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['1st_9'] ? `$${betHistory[0].bets['1st_9']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['2nd_9'] ? `$${betHistory[0].bets['2nd_9']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['3rd_9'] ? `$${betHistory[0].bets['3rd_9']}` : ''}
                  </td>
                  <td className="px-2 py-1 text-center text-yellow-400">
                    {betHistory[0].bets['4th_9'] ? `$${betHistory[0].bets['4th_9']}` : ''}
                  </td>
                </tr>
              )}
              
              {/* COMPLETED BETS/RESULTS ROWS */}
              {betHistory
                .filter(entry => entry.spin !== null)
                .slice(0, 10)
                .map((entry, idx) => {
                  const num = entry.spin!
                  
                  // Check which groups the winning number belongs to
                  const isVoisins = includesNum(wheelBets.special[0].numbers, num)
                  const isOrphelins = includesNum(wheelBets.special[1].numbers, num)
                  const isTiers = includesNum(wheelBets.special[2].numbers, num)
                  const isZero = includesNum(wheelBets.special[3].numbers, num)
                  const isNonVoisin = includesNum(wheelBets.special[4].numbers, num)
                  const isA = includesNum(wheelBets.wheel18s[0].groupA, num)
                  const isB = includesNum(wheelBets.wheel18s[0].groupB, num)
                  const isAA = includesNum(wheelBets.wheel18s[1].groupA, num)
                  const isBB = includesNum(wheelBets.wheel18s[1].groupB, num)
                  const isAAA = includesNum(wheelBets.wheel18s[2].groupA, num)
                  const isBBB = includesNum(wheelBets.wheel18s[2].groupB, num)
                  const is1st9 = includesNum(wheelBets.sectors9s[0].numbers, num)
                  const is2nd9 = includesNum(wheelBets.sectors9s[1].numbers, num)
                  const is3rd9 = includesNum(wheelBets.sectors9s[2].numbers, num)
                  const is4th9 = includesNum(wheelBets.sectors9s[3].numbers, num)
                  
                  // Helper to display bet result
                  const getBetResult = (betKey: string, isWinner: boolean) => {
                    const betAmount = entry.bets[betKey]
                    if (!betAmount) return ''
                    
                    const amount = parseFloat(betAmount)
                    if (isWinner) {
                      // These are special bets with different payouts - simplified for now
                      const payout = amount * 2 // You can adjust payout calculations
                      return <span className="text-green-400 font-bold">+${payout}</span>
                    } else {
                      return <span className="text-red-400">-${amount}</span>
                    }
                  }
                  
                  return (
                    <tr key={idx} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-2 py-1 font-bold text-white">{num}</td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['voisins'] ? getBetResult('voisins', isVoisins) : (isVoisins ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['orphelins'] ? getBetResult('orphelins', isOrphelins) : (isOrphelins ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['tiers'] ? getBetResult('tiers', isTiers) : (isTiers ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['jeu_zero'] ? getBetResult('jeu_zero', isZero) : (isZero ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['non_voisin'] ? getBetResult('non_voisin', isNonVoisin) : (isNonVoisin ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['a_b_a'] ? getBetResult('a_b_a', isA) : (isA ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['a_b_b'] ? getBetResult('a_b_b', isB) : (isB ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['aa_bb_a'] ? getBetResult('aa_bb_a', isAA) : (isAA ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['aa_bb_b'] ? getBetResult('aa_bb_b', isBB) : (isBB ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['aaa_bbb_a'] ? getBetResult('aaa_bbb_a', isAAA) : (isAAA ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['aaa_bbb_b'] ? getBetResult('aaa_bbb_b', isBBB) : (isBBB ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['1st_9'] ? getBetResult('1st_9', is1st9) : (is1st9 ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['2nd_9'] ? getBetResult('2nd_9', is2nd9) : (is2nd9 ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['3rd_9'] ? getBetResult('3rd_9', is3rd9) : (is3rd9 ? '✓' : '')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.bets['4th_9'] ? getBetResult('4th_9', is4th9) : (is4th9 ? '✓' : '')}
                      </td>
                    </tr>
                  )
              })}
              
              {/* Show message if no data */}
              {betHistory.filter(e => e.spin !== null).length === 0 && (!betHistory[0] || betHistory[0].spin !== null) && (
                <tr className="border-t border-gray-700">
                  <td className="px-2 py-1 text-center text-gray-500" colSpan={16}>
                    Place bets and add spins to see performance data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Stats */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="text-gray-400">
            Session P/L: <span className={sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
              ${Math.abs(sessionPnL).toFixed(2)}
            </span>
          </div>
          <div className="text-gray-400">
            Total Spins: <span className="text-white font-bold">{spins.length}</span>
          </div>
          <div className="text-gray-400">
            Win Rate: <span className="text-white font-bold">
              {betHistory.filter(b => b.spin !== null && b.totalPnL > 0).length > 0 
                ? Math.round((betHistory.filter(b => b.spin !== null && b.totalPnL > 0).length / 
                   betHistory.filter(b => b.spin !== null).length) * 100) 
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}