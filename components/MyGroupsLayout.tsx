// components/MyGroupsLayout.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { Spin } from '@/lib/types'
import type { SelectedGroup } from '@/types/bettingAssistant'
import { RED_NUMBERS, WHEEL_ORDER } from '@/lib/roulette-logic'

interface HistoricalMyGroupsBetData {
  bets: Record<string, number>
  results: Record<string, { won: boolean, amount: number }>
}

interface MyGroupsLayoutProps {
  spins: Spin[]
  selectedGroups: SelectedGroup[]
  manualBets?: Record<string, string>
  setManualBets?: (b: Record<string, string>) => void
  playerUnit?: number
  betResults?: Record<string, { status: 'win' | 'loss', amount: string } | null>
  historicalBets?: Record<string, HistoricalMyGroupsBetData>
  onHistoricalBetsUpdate?: (newBets: Record<string, HistoricalMyGroupsBetData>) => void
  onBetPlaced?: (
    totalWagered: number,
    totalReturned: number,
    pnl: number,
    bettingMatrix?: Record<string, number>,
    groupResults?: Record<string, number>,
    spinNumber?: number,
    spinTimestamp?: number
  ) => void
  onClearBets?: () => void
}

// Helper function to check if a number belongs to a group
function checkGroupWin(num: number, group: SelectedGroup): boolean {
  const { type, id, customGroup } = group

  // Custom groups
  if (type === 'custom' && customGroup) {
    return customGroup.numbers.includes(num)
  }

  // Table groups
  if (type === 'table') {
    switch (id) {
      case 'color':
        return num !== 0 && RED_NUMBERS.includes(num) // Red side
      case 'even-odd':
        return num !== 0 && num % 2 === 0 // Even side
      case 'low-high':
        return num >= 1 && num <= 18 // Low side
      case 'column':
        return num !== 0 && num % 3 === 1 // 1st column
      case 'dozen':
        return num >= 1 && num <= 12 // 1st dozen
      case 'alt1':
        return [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) // A side
      case 'alt2':
        return [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) // AA side
      case 'alt3':
        return [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) // AAA side
      case 'ec':
        return [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) // Edge side
      case 'six':
        return num >= 1 && num <= 6 // 1st six
      default:
        return false
    }
  }

  // Wheel groups
  if (type === 'wheel') {
    switch (id) {
      case 'voisins':
        return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25].includes(num)
      case 'orphelins':
        return [17,34,6,1,20,14,31,9].includes(num)
      case 'tiers':
        return [27,13,36,11,30,8,23,10,5,24,16,33].includes(num)
      case 'voisins-nonvoisins':
        return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25].includes(num) // Voisins side
      case 'wheel-quarters':
        return [32,15,19,4,21,2,25,17,34].includes(num) // 1st 9
      case 'ab-split':
        return [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3].includes(num) // A side
      case 'aabb-split':
        return [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35].includes(num) // AA side
      case 'aaabbb-split':
        return [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12].includes(num) // AAA side
      case 'a6b6-split':
        return [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29].includes(num) // A6 side
      case 'a9b9-split':
        return [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9].includes(num) // A9 side
      case 'right-left':
        return [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10].includes(num) // Right side
      default:
        return false
    }
  }

  return false
}

// Get payout multiplier for a group
function getGroupPayout(group: SelectedGroup): number {
  const { type, id, customGroup } = group

  if (type === 'custom' && customGroup) {
    const count = customGroup.numbers.length
    if (count >= 18) return 2 // 1:1
    if (count >= 12) return 3 // 2:1
    if (count >= 9) return 4 // 3:1
    if (count >= 6) return 6 // 5:1
    return 2 // Default 1:1
  }

  // Standard payouts
  if (type === 'table' || type === 'wheel') {
    if (['color', 'even-odd', 'low-high', 'alt1', 'alt2', 'alt3', 'ec',
         'voisins-nonvoisins', 'ab-split', 'aabb-split', 'aaabbb-split',
         'a6b6-split', 'a9b9-split', 'right-left'].includes(id)) {
      return 2 // 1:1 payout
    }
    if (['dozen', 'column'].includes(id)) {
      return 3 // 2:1 payout
    }
    if (['wheel-quarters'].includes(id)) {
      return 4 // 3:1 payout
    }
    if (['six'].includes(id)) {
      return 6 // 5:1 payout
    }
  }

  return 2 // Default
}

// Get display value for a group (for historical rows)
function getGroupDisplayValue(num: number, group: SelectedGroup): string {
  const { type, id, customGroup } = group

  // Custom groups
  if (type === 'custom' && customGroup) {
    return customGroup.numbers.includes(num) ? '✓' : '-'
  }

  // Table groups
  if (type === 'table') {
    switch (id) {
      case 'color':
        return num === 0 ? '-' : RED_NUMBERS.includes(num) ? 'R' : 'B'
      case 'even-odd':
        return num === 0 ? '-' : num % 2 === 0 ? 'E' : 'O'
      case 'low-high':
        return num === 0 ? '-' : num <= 18 ? 'L' : 'H'
      case 'column':
        if (num === 0) return '-'
        if (num % 3 === 1) return '1st'
        if (num % 3 === 2) return '2nd'
        return '3rd'
      case 'dozen':
        if (num === 0) return '-'
        if (num <= 12) return '1st'
        if (num <= 24) return '2nd'
        return '3rd'
      case 'alt1':
        return num === 0 ? '-' : [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B'
      case 'alt2':
        return num === 0 ? '-' : [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB'
      case 'alt3':
        return num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB'
      case 'ec':
        return num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) ? 'E' : 'C'
      case 'six':
        if (num === 0) return '-'
        if (num <= 6) return '1st'
        if (num <= 12) return '2nd'
        if (num <= 18) return '3rd'
        if (num <= 24) return '4th'
        if (num <= 30) return '5th'
        return '6th'
      default:
        return '-'
    }
  }

  // Wheel groups
  if (type === 'wheel') {
    const won = checkGroupWin(num, group)

    switch (id) {
      case 'voisins':
      case 'orphelins':
      case 'tiers':
        return won ? '✓' : '-'
      case 'voisins-nonvoisins':
        return won ? 'V' : 'NV'
      case 'wheel-quarters':
        if ([32,15,19,4,21,2,25,17,34].includes(num)) return '1st'
        if ([6,27,13,36,11,30,8,23,10].includes(num)) return '2nd'
        if ([5,24,16,33,1,20,14,31,9].includes(num)) return '3rd'
        if ([22,18,29,7,28,12,35,3,26].includes(num)) return '4th'
        return '-'
      case 'ab-split':
        return won ? 'A' : 'B'
      case 'aabb-split':
        return won ? 'AA' : 'BB'
      case 'aaabbb-split':
        return won ? 'AAA' : 'BBB'
      case 'a6b6-split':
        return won ? 'A6' : 'B6'
      case 'a9b9-split':
        return won ? 'A9' : 'B9'
      case 'right-left':
        return won ? 'R' : 'L'
      default:
        return '-'
    }
  }

  return '-'
}

// Check if group is splittable
function isSplitGroup(group: SelectedGroup): boolean {
  const { type, id } = group
  if (type === 'custom') return false

  const splitIds = [
    'color', 'even-odd', 'low-high', 'column', 'dozen', 'alt1', 'alt2', 'alt3', 'ec', 'six',
    'voisins-nonvoisins', 'wheel-quarters', 'ab-split', 'aabb-split', 'aaabbb-split',
    'a6b6-split', 'a9b9-split', 'right-left'
  ]

  return splitIds.includes(id)
}

// Get split labels
function getSplitLabels(group: SelectedGroup): { a: string, b: string } {
  const { type, id } = group

  if (type === 'table') {
    switch (id) {
      case 'color': return { a: 'R', b: 'B' }
      case 'even-odd': return { a: 'E', b: 'O' }
      case 'low-high': return { a: 'L', b: 'H' }
      case 'column': return { a: '1st', b: '2nd/3rd' }
      case 'dozen': return { a: '1st', b: '2nd/3rd' }
      case 'alt1': return { a: 'A', b: 'B' }
      case 'alt2': return { a: 'AA', b: 'BB' }
      case 'alt3': return { a: 'AAA', b: 'BBB' }
      case 'ec': return { a: 'E', b: 'C' }
      case 'six': return { a: '1-6', b: '7-36' }
      default: return { a: 'A', b: 'B' }
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'voisins-nonvoisins': return { a: 'V', b: 'NV' }
      case 'wheel-quarters': return { a: '1st', b: '2nd/3rd/4th' }
      case 'ab-split': return { a: 'A', b: 'B' }
      case 'aabb-split': return { a: 'AA', b: 'BB' }
      case 'aaabbb-split': return { a: 'AAA', b: 'BBB' }
      case 'a6b6-split': return { a: 'A6', b: 'B6' }
      case 'a9b9-split': return { a: 'A9', b: 'B9' }
      case 'right-left': return { a: 'R', b: 'L' }
      default: return { a: 'A', b: 'B' }
    }
  }

  return { a: 'A', b: 'B' }
}

export default function MyGroupsLayout({
  spins,
  selectedGroups,
  playerUnit = 10,
  historicalBets = {},
  onHistoricalBetsUpdate,
  onBetPlaced,
  onClearBets
}: MyGroupsLayoutProps) {
  const [bets, setBets] = useState<Record<string, number>>({})
  const [results, setResults] = useState<Record<string, { won: boolean, amount: number }>>({})
  const [showResults, setShowResults] = useState(false)

  // Limit to max 10 groups
  const displayGroups = selectedGroups.slice(0, 10)

  const handleBetClick = (groupKey: string, isDoubleClick: boolean) => {
    if (showResults) return // Prevent betting when results are showing

    setBets(prev => {
      const currentBet = prev[groupKey] || 0
      const newBet = isDoubleClick ? Math.min(currentBet * 2, 1000) : Math.min(currentBet + playerUnit, 1000)
      return { ...prev, [groupKey]: newBet }
    })
  }

  const handleRightClick = (groupKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    setBets(prev => {
      const newBets = { ...prev }
      delete newBets[groupKey]
      return newBets
    })
  }

  // Calculate payouts for each bet
  const calculatePayouts = (num: number): Record<string, { won: boolean, amount: number }> => {
    const wins: Record<string, { won: boolean, amount: number }> = {}

    Object.entries(bets).forEach(([groupKey, betAmount]) => {
      // Find the group
      const group = displayGroups.find(g => {
        const key = `${g.type}-${g.id}`
        // Check both the base key and split keys (a/b)
        return key === groupKey || `${key}-a` === groupKey || `${key}-b` === groupKey
      })

      if (!group) return

      let won = false

      // Check if it's a split bet (ends with -a or -b)
      if (groupKey.endsWith('-a')) {
        // Side A - use the normal checkGroupWin
        won = checkGroupWin(num, group)
      } else if (groupKey.endsWith('-b')) {
        // Side B - inverse of checkGroupWin (except for 0)
        won = num !== 0 && !checkGroupWin(num, group)
      } else {
        // Non-split group
        won = checkGroupWin(num, group)
      }

      const payout = getGroupPayout(group)
      const amount = won ? betAmount * payout - betAmount : -betAmount
      wins[groupKey] = { won, amount }
    })

    return wins
  }

  // Track the last processed spin
  const [lastProcessedSpinKey, setLastProcessedSpinKey] = useState<string | null>(null)
  const betsRef = useRef(bets)

  useEffect(() => {
    betsRef.current = bets
  }, [bets])

  // When a new spin is added, calculate results
  useEffect(() => {
    if (spins.length > 0 && !showResults) {
      const latestSpin = spins[0]
      const spinKey = new Date(latestSpin.created_at).getTime().toString()
      const currentBets = betsRef.current

      if (spinKey !== lastProcessedSpinKey && Object.keys(currentBets).length > 0) {
        const calcResults = calculatePayouts(latestSpin.number)
        setResults(calcResults)
        setShowResults(true)
        setLastProcessedSpinKey(spinKey)

        // Update historical bets
        if (onHistoricalBetsUpdate) {
          const updatedBets = {
            ...historicalBets,
            [spinKey]: { bets: { ...currentBets }, results: calcResults }
          }
          onHistoricalBetsUpdate(updatedBets)
        }

        // Calculate totals
        const totalWagered = Object.values(currentBets).reduce((sum, bet) => sum + bet, 0)
        const totalPnL = Object.values(calcResults).reduce((sum, result) => sum + result.amount, 0)
        const totalReturned = totalWagered + totalPnL

        const groupResults: Record<string, number> = {}
        Object.entries(calcResults).forEach(([key, result]) => {
          groupResults[key] = result.amount
        })

        const spinTimestamp = new Date(latestSpin.created_at).getTime()

        if (onBetPlaced) {
          onBetPlaced(totalWagered, totalReturned, totalPnL, currentBets, groupResults, latestSpin.number, spinTimestamp)
        }

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setShowResults(false)
          setBets({})
          setResults({})
        }, 3000)
      }
    }
  }, [spins.length, showResults, lastProcessedSpinKey, onBetPlaced, onHistoricalBetsUpdate, historicalBets])

  const clearBets = () => {
    setBets({})
    setResults({})
    setShowResults(false)
    if (onClearBets) onClearBets()
  }

  // Helper to render a bet button
  const renderBetButton = (groupKey: string, label: string, colorClass: string) => {
    const hasBet = !!bets[groupKey]
    const result = results[groupKey]
    const showResult = showResults && result

    return (
      <button
        onClick={(e) => handleBetClick(groupKey, e.detail === 2)}
        onContextMenu={(e) => handleRightClick(groupKey, e)}
        className={`relative w-full px-1 py-1 rounded text-xs font-bold text-white transition-all ${
          showResult
            ? result.won
              ? 'bg-green-600 animate-pulse'
              : 'bg-red-900'
            : hasBet
              ? colorClass
              : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {showResult ? (result.won ? `+$${result.amount}` : `-$${Math.abs(result.amount)}`) : label}
        {hasBet && !showResult && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
            ${bets[groupKey]}
          </span>
        )}
      </button>
    )
  }

  // Empty state
  if (displayGroups.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
        <p className="text-gray-400 text-center">
          No groups selected. Use the dropdown above to select groups for tracking.
        </p>
      </div>
    )
  }

  if (spins.length === 0) {
    return <p className="text-gray-400 text-center py-8">No spins recorded yet</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300 w-14">Number</th>
            {displayGroups.map((group, idx) => (
              <th
                key={`header-${group.type}-${group.id}-${idx}`}
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300"
              >
                {group.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* NEXT BET ROW */}
          <tr className="bg-gray-800/70 border-b-2 border-yellow-500">
            <td className="px-1 py-1 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="text-yellow-400 font-bold text-xs">NEXT BET</div>
                {Object.keys(bets).length > 0 && !showResults && (
                  <button
                    onClick={clearBets}
                    className="text-[10px] px-1.5 py-0.5 bg-red-600 hover:bg-red-700 rounded text-white font-bold"
                  >
                    Clear
                  </button>
                )}
                {Object.keys(bets).length > 0 && (
                  <div className="text-[10px] text-gray-300 font-bold">
                    ${Object.values(bets).reduce((sum, bet) => sum + bet, 0)}
                  </div>
                )}
              </div>
            </td>
            {displayGroups.map((group, idx) => {
              const groupKey = `${group.type}-${group.id}`
              const isSplit = isSplitGroup(group)

              if (isSplit) {
                const labels = getSplitLabels(group)
                const keyA = `${groupKey}-a`
                const keyB = `${groupKey}-b`

                return (
                  <td key={`bet-${groupKey}-${idx}`} className="px-1 py-1">
                    <div className="flex flex-col gap-0.5">
                      {renderBetButton(keyA, labels.a, 'bg-blue-600 hover:bg-blue-700')}
                      {renderBetButton(keyB, labels.b, 'bg-orange-600 hover:bg-orange-700')}
                    </div>
                  </td>
                )
              } else {
                return (
                  <td key={`bet-${groupKey}-${idx}`} className="px-1 py-1">
                    {renderBetButton(groupKey, group.name, 'bg-purple-600 hover:bg-purple-700')}
                  </td>
                )
              }
            })}
          </tr>

          {/* HISTORICAL ROWS */}
          {spins.map((spin, spinIdx) => {
            const num = spin.number
            const spinKey = new Date(spin.created_at).getTime().toString()
            const spinBetData = historicalBets[spinKey]

            // Helper to render cell with optional P/L badge
            const renderCellWithBadge = (content: React.ReactNode, className: string, betKeys: string | string[]) => {
              const keysArray = Array.isArray(betKeys) ? betKeys : [betKeys]

              let betResult = null
              for (const key of keysArray) {
                if (spinBetData?.results[key]) {
                  betResult = spinBetData.results[key]
                  break
                }
              }

              return (
                <span className={`relative inline-block ${className}`}>
                  {content}
                  {betResult && (
                    <span className={`absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded ${
                      betResult.won ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {betResult.won ? `+${betResult.amount}` : betResult.amount}
                    </span>
                  )}
                </span>
              )
            }

            return (
              <tr key={spin.id || spinIdx} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                <td className="px-1 py-1 text-center">
                  <div className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white
                    ${spin.color === 'red' ? 'bg-red-600' :
                      spin.color === 'black' ? 'bg-gray-900 border border-gray-600' :
                      'bg-green-600'}
                  `}>
                    {num}
                  </div>
                </td>
                {displayGroups.map((group, groupIdx) => {
                  const groupKey = `${group.type}-${group.id}`
                  const displayValue = getGroupDisplayValue(num, group)
                  const isSplit = isSplitGroup(group)

                  const won = checkGroupWin(num, group)
                  let bgColor = 'bg-gray-600/30 text-gray-300'

                  if (displayValue !== '-') {
                    if (group.type === 'custom') {
                      bgColor = won ? 'bg-purple-600/30 text-purple-400' : 'bg-gray-600/30 text-gray-400'
                    } else {
                      // Color code based on group type
                      bgColor = won ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                    }
                  }

                  const keys = isSplit ? [`${groupKey}-a`, `${groupKey}-b`] : [groupKey]

                  return (
                    <td key={`cell-${groupKey}-${groupIdx}`} className="px-1 py-1 text-center">
                      {renderCellWithBadge(
                        displayValue,
                        `px-1.5 py-0.5 rounded text-xs font-bold ${bgColor}`,
                        keys
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
