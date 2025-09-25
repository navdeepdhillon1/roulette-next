'use client'
import React, { useState, useMemo } from 'react'

interface WheelViewProps {
  spins: any[]
  inputNumber: string
  setInputNumber: (value: string) => void
  addNumber: () => void
  manualBets: any
  setManualBets: (bets: any) => void
  betHistory: any[]
  setBetHistory: (history: any) => void
  sessionPnL: number
  playerContext: any
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
  showHeatMap,
  setShowHeatMap
}: WheelViewProps) {
  
  const [showHotCold, setShowHotCold] = useState(false)
  
  // Wheel order for European roulette (clockwise from 0)
  const wheelOrder = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ]
  
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
  
  // Wheel betting groups with colors
  const wheelBets = {
    special: [
      { key: 'voisins', label: 'Voisins', color: 'bg-purple-600', numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25] },
      { key: 'orphelins', label: 'Orphelins', color: 'bg-indigo-600', numbers: [17,34,6,1,20,14,31,9] },
      { key: 'tiers', label: 'Tiers', color: 'bg-blue-600', numbers: [27,13,36,11,30,8,23,10,5,24,16,33] },
      { key: 'jeu_zero', label: 'Jeu Zero', color: 'bg-teal-600', numbers: [12,35,3,26,0,32,15] },
      { key: 'non_voisin', label: 'Non-Voisin', color: 'bg-pink-600', numbers: [17,34,6,1,20,14,31,9,27,13,36,11,30,8,23,10,5,24,16,33] }
    ],
    wheel18s: [
      { key: 'a_b', label: 'A/B', colorA: 'bg-red-600', colorB: 'bg-blue-600', groupA: [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3], groupB: [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26] },
      { key: 'aa_bb', label: 'AA/BB', colorA: 'bg-green-600', colorB: 'bg-yellow-600', groupA: [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35], groupB: [19,4,25,17,27,13,30,8,5,24,1,20,9,22,7,28,3,26] },
      { key: 'aaa_bbb', label: 'AAA/BBB', colorA: 'bg-cyan-600', colorB: 'bg-rose-600', groupA: [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12], groupB: [4,21,2,6,27,13,8,23,10,33,1,20,22,18,29,35,3,26] },
      { key: 'a6_b6', label: 'A6/B6', colorA: 'bg-orange-600', colorB: 'bg-lime-600', groupA: [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29], groupB: [25,17,34,6,27,13,5,24,16,33,1,20,7,28,12,35,3,26] },
      { key: 'a9_b9', label: 'A9/B9', colorA: 'bg-amber-600', colorB: 'bg-emerald-600', groupA: [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9], groupB: [6,27,13,36,11,30,8,23,10,22,18,29,7,28,12,35,3,26] },
      { key: 'right_left', label: 'Right/Left', colorA: 'bg-fuchsia-600', colorB: 'bg-sky-600', groupA: [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10], groupB: [5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26] }
    ],
    sectors9s: [
      { key: '1st_9', label: '1st 9', color: 'bg-red-700', numbers: [32,15,19,4,21,2,25,17,34] },
      { key: '2nd_9', label: '2nd 9', color: 'bg-blue-700', numbers: [6,27,13,36,11,30,8,23,10] },
      { key: '3rd_9', label: '3rd 9', color: 'bg-green-700', numbers: [5,24,16,33,1,20,14,31,9] },
      { key: '4th_9', label: '4th 9', color: 'bg-yellow-700', numbers: [22,18,29,7,28,12,35,3,26] }
    ]
  }

  // Calculate hit counts for last 36 spins
  const hitCounts = useMemo(() => {
    const counts: { [key: number]: number } = {}
    const last36 = spins.slice(0, 36)
    
    for (let i = 0; i <= 36; i++) {
      counts[i] = last36.filter(spin => spin === i).length
    }
    
    return counts
  }, [spins])

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600'
    return redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900'
  }
  
  const getTextColor = (num: number) => {
    if (num === 0) return 'text-green-400'
    return redNumbers.includes(num) ? 'text-red-400' : 'text-white'
  }

  const handleBetClick = (betKey: string) => {
    const currentValue = manualBets[betKey]
    const newValue = currentValue ? '' : playerContext.unitSize.toString()
    const updatedBets = {
      ...manualBets,
      [betKey]: newValue
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
  }

  const totalStake = Object.values(manualBets).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
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
          <h4 className="text-center font-bold mb-3 text-green-400">18's (1:1)</h4>
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
          <h4 className="text-center font-bold mb-3 text-cyan-400">9's Sectors</h4>
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
   <div className="bg-gray-800 rounded-lg p-6 border border-gray-700"> {/* Matches your app's theme */}
   <div className="text-center text-xs text-gray-400 mb-3">THE RACETRACK - Wheel Order</div>
      {/* Simple 3-row track layout */}
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
                  redNumbers.includes(num) ? 'bg-red-600 hover:bg-red-500' : 
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
              redNumbers.includes(wheelOrder[36]) ? 'bg-red-600 hover:bg-red-500' : 
              'bg-gray-900 hover:bg-gray-800'
            } text-white rounded text-[10px] font-bold`}
          >
            {wheelOrder[36]}
          </button>
          <div className="col-span-16"></div>
          <button
            onClick={() => setInputNumber(wheelOrder[18].toString())}
            className={`h-10 ${
              redNumbers.includes(wheelOrder[18]) ? 'bg-red-600 hover:bg-red-500' : 
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
                  redNumbers.includes(num) ? 'bg-red-600 hover:bg-red-500' : 
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
              
              {/* Heat Legend - this part stays */}
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

      {/* Betting Performance Matrix */}
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
            </thead><tbody>
  {spins.slice(0, 10).map((num, idx) => {
    // Check which groups each number belongs to
    const isVoisins = wheelBets.special[0].numbers.includes(num)
    const isOrphelins = wheelBets.special[1].numbers.includes(num)
    const isTiers = wheelBets.special[2].numbers.includes(num)
    const isZero = wheelBets.special[3].numbers.includes(num)
    const isNonVoisin = wheelBets.special[4].numbers.includes(num)  
    const isA = wheelBets.wheel18s[0].groupA.includes(num)
    const isB = wheelBets.wheel18s[0].groupB.includes(num)
    const isAA = wheelBets.wheel18s[1].groupA.includes(num)
    const isBB = wheelBets.wheel18s[1].groupB.includes(num)
    const isAAA = wheelBets.wheel18s[2].groupA.includes(num)
    const isBBB = wheelBets.wheel18s[2].groupB.includes(num)
    const is1st9 = wheelBets.sectors9s[0].numbers.includes(num)
    const is2nd9 = wheelBets.sectors9s[1].numbers.includes(num)
    const is3rd9 = wheelBets.sectors9s[2].numbers.includes(num)
    const is4th9 = wheelBets.sectors9s[3].numbers.includes(num)
    
    return (
      <tr key={idx} className="border-t border-gray-700 hover:bg-gray-700/50">
        <td className="px-2 py-1 font-bold text-white">{num}</td>
        <td className={`px-2 py-1 text-center ${isVoisins ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isVoisins ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isOrphelins ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isOrphelins ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isTiers ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isTiers ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isZero ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isZero ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isNonVoisin ? 'bg-green-600/30 text-green-400' : ''}`}>  {/* Add this cell */}
        {isNonVoisin ? '✓' : ''}
       </td>
        <td className={`px-2 py-1 text-center ${isA ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isA ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isB ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isB ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isAA ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isAA ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isBB ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isBB ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isAAA ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isAAA ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${isBBB ? 'bg-green-600/30 text-green-400' : ''}`}>
          {isBBB ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${is1st9 ? 'bg-green-600/30 text-green-400' : ''}`}>
          {is1st9 ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${is2nd9 ? 'bg-green-600/30 text-green-400' : ''}`}>
          {is2nd9 ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${is3rd9 ? 'bg-green-600/30 text-green-400' : ''}`}>
          {is3rd9 ? '✓' : ''}
        </td>
        <td className={`px-2 py-1 text-center ${is4th9 ? 'bg-green-600/30 text-green-400' : ''}`}>
          {is4th9 ? '✓' : ''}
        </td>
      </tr>
    )
  })}
  {spins.length === 0 && (
    <tr className="border-t border-gray-700">
      <td className="px-2 py-1 text-center text-gray-500" colSpan={15}>
        Add spins to see performance data
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
            Win Rate: <span className="text-white font-bold">0%</span>
          </div>
        </div>
      </div>
    </div>
  )
}