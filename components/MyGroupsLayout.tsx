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

// Get all subgroups for a group (for betting cards)
function getSubgroups(group: SelectedGroup): string[] {
  const { type, id } = group

  if (type === 'custom') return [group.name]

  if (type === 'table') {
    switch (id) {
      case 'color': return ['R', 'B']
      case 'even-odd': return ['E', 'O']
      case 'low-high': return ['L', 'H']
      case 'column': return ['1st', '2nd', '3rd']
      case 'dozen': return ['1st', '2nd', '3rd']
      case 'alt1': return ['A', 'B']
      case 'alt2': return ['AA', 'BB']
      case 'alt3': return ['AAA', 'BBB']
      case 'ec': return ['E', 'C']
      case 'six': return ['1st', '2nd', '3rd', '4th', '5th', '6th']
      default: return [group.name]
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'voisins': return ['V']
      case 'orphelins': return ['O']
      case 'tiers': return ['T']
      case 'voisins-nonvoisins': return ['V', 'NV']
      case 'wheel-quarters': return ['1st', '2nd', '3rd', '4th']
      case 'ab-split': return ['A', 'B']
      case 'aabb-split': return ['AA', 'BB']
      case 'aaabbb-split': return ['AAA', 'BBB']
      case 'a6b6-split': return ['A6', 'B6']
      case 'a9b9-split': return ['A9', 'B9']
      case 'right-left': return ['R', 'L']
      default: return [group.name]
    }
  }

  return [group.name]
}

// Get subgroup key suffix based on label
function getSubgroupKey(subgroupLabel: string, group: SelectedGroup): string {
  const { type, id } = group
  const groupKey = `${type}-${id}`

  if (type === 'custom') return groupKey

  if (type === 'table') {
    switch (id) {
      case 'color': return subgroupLabel === 'R' ? `${groupKey}-a` : `${groupKey}-b`
      case 'even-odd': return subgroupLabel === 'E' ? `${groupKey}-a` : `${groupKey}-b`
      case 'low-high': return subgroupLabel === 'L' ? `${groupKey}-a` : `${groupKey}-b`
      case 'column':
        if (subgroupLabel === '1st') return `${groupKey}-1`
        if (subgroupLabel === '2nd') return `${groupKey}-2`
        return `${groupKey}-3`
      case 'dozen':
        if (subgroupLabel === '1st') return `${groupKey}-1`
        if (subgroupLabel === '2nd') return `${groupKey}-2`
        return `${groupKey}-3`
      case 'alt1': return subgroupLabel === 'A' ? `${groupKey}-a` : `${groupKey}-b`
      case 'alt2': return subgroupLabel === 'AA' ? `${groupKey}-a` : `${groupKey}-b`
      case 'alt3': return subgroupLabel === 'AAA' ? `${groupKey}-a` : `${groupKey}-b`
      case 'ec': return subgroupLabel === 'E' ? `${groupKey}-a` : `${groupKey}-b`
      case 'six':
        const sixMap: Record<string, string> = { '1st': '1', '2nd': '2', '3rd': '3', '4th': '4', '5th': '5', '6th': '6' }
        return `${groupKey}-${sixMap[subgroupLabel]}`
      default: return groupKey
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'voisins': return groupKey
      case 'orphelins': return groupKey
      case 'tiers': return groupKey
      case 'voisins-nonvoisins': return subgroupLabel === 'V' ? `${groupKey}-a` : `${groupKey}-b`
      case 'wheel-quarters':
        const quartersMap: Record<string, string> = { '1st': '1', '2nd': '2', '3rd': '3', '4th': '4' }
        return `${groupKey}-${quartersMap[subgroupLabel]}`
      case 'ab-split': return subgroupLabel === 'A' ? `${groupKey}-a` : `${groupKey}-b`
      case 'aabb-split': return subgroupLabel === 'AA' ? `${groupKey}-a` : `${groupKey}-b`
      case 'aaabbb-split': return subgroupLabel === 'AAA' ? `${groupKey}-a` : `${groupKey}-b`
      case 'a6b6-split': return subgroupLabel === 'A6' ? `${groupKey}-a` : `${groupKey}-b`
      case 'a9b9-split': return subgroupLabel === 'A9' ? `${groupKey}-a` : `${groupKey}-b`
      case 'right-left': return subgroupLabel === 'R' ? `${groupKey}-a` : `${groupKey}-b`
      default: return groupKey
    }
  }

  return groupKey
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

  // Check if a specific subgroup won
  const checkSubgroupWin = (num: number, group: SelectedGroup, subgroupLabel: string): boolean => {
    const { type, id } = group

    if (type === 'custom') return checkGroupWin(num, group)

    if (type === 'table') {
      switch (id) {
        case 'color':
          if (num === 0) return false
          return subgroupLabel === 'R' ? RED_NUMBERS.includes(num) : !RED_NUMBERS.includes(num)
        case 'even-odd':
          if (num === 0) return false
          return subgroupLabel === 'E' ? num % 2 === 0 : num % 2 === 1
        case 'low-high':
          if (num === 0) return false
          return subgroupLabel === 'L' ? num >= 1 && num <= 18 : num >= 19 && num <= 36
        case 'column':
          if (num === 0) return false
          if (subgroupLabel === '1st') return num % 3 === 1
          if (subgroupLabel === '2nd') return num % 3 === 2
          return num % 3 === 0
        case 'dozen':
          if (num === 0) return false
          if (subgroupLabel === '1st') return num >= 1 && num <= 12
          if (subgroupLabel === '2nd') return num >= 13 && num <= 24
          return num >= 25 && num <= 36
        case 'alt1':
          if (num === 0) return false
          const altA = [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33]
          return subgroupLabel === 'A' ? altA.includes(num) : !altA.includes(num)
        case 'alt2':
          if (num === 0) return false
          const altAA = [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30]
          return subgroupLabel === 'AA' ? altAA.includes(num) : !altAA.includes(num)
        case 'alt3':
          if (num === 0) return false
          const altAAA = [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27]
          return subgroupLabel === 'AAA' ? altAAA.includes(num) : !altAAA.includes(num)
        case 'ec':
          if (num === 0) return false
          const edge = [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36]
          return subgroupLabel === 'E' ? edge.includes(num) : !edge.includes(num)
        case 'six':
          if (num === 0) return false
          if (subgroupLabel === '1st') return num >= 1 && num <= 6
          if (subgroupLabel === '2nd') return num >= 7 && num <= 12
          if (subgroupLabel === '3rd') return num >= 13 && num <= 18
          if (subgroupLabel === '4th') return num >= 19 && num <= 24
          if (subgroupLabel === '5th') return num >= 25 && num <= 30
          return num >= 31 && num <= 36
        default:
          return checkGroupWin(num, group)
      }
    }

    if (type === 'wheel') {
      switch (id) {
        case 'voisins': return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25].includes(num)
        case 'orphelins': return [17,34,6,1,20,14,31,9].includes(num)
        case 'tiers': return [27,13,36,11,30,8,23,10,5,24,16,33].includes(num)
        case 'voisins-nonvoisins':
          const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]
          return subgroupLabel === 'V' ? voisins.includes(num) : !voisins.includes(num)
        case 'wheel-quarters':
          if (subgroupLabel === '1st') return [32,15,19,4,21,2,25,17,34].includes(num)
          if (subgroupLabel === '2nd') return [6,27,13,36,11,30,8,23,10].includes(num)
          if (subgroupLabel === '3rd') return [5,24,16,33,1,20,14,31,9].includes(num)
          return [22,18,29,7,28,12,35,3,26].includes(num)
        case 'ab-split':
          const abA = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3]
          return subgroupLabel === 'A' ? abA.includes(num) : !abA.includes(num)
        case 'aabb-split':
          const aabbAA = [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35]
          return subgroupLabel === 'AA' ? aabbAA.includes(num) : !aabbAA.includes(num)
        case 'aaabbb-split':
          const aaabbbAAA = [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12]
          return subgroupLabel === 'AAA' ? aaabbbAAA.includes(num) : !aaabbbAAA.includes(num)
        case 'a6b6-split':
          const a6A6 = [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29]
          return subgroupLabel === 'A6' ? a6A6.includes(num) : !a6A6.includes(num)
        case 'a9b9-split':
          const a9A9 = [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9]
          return subgroupLabel === 'A9' ? a9A9.includes(num) : !a9A9.includes(num)
        case 'right-left':
          const right = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10]
          return subgroupLabel === 'R' ? right.includes(num) : !right.includes(num)
        default:
          return checkGroupWin(num, group)
      }
    }

    return checkGroupWin(num, group)
  }

  // Calculate payouts for each bet
  const calculatePayouts = (num: number): Record<string, { won: boolean, amount: number }> => {
    const wins: Record<string, { won: boolean, amount: number }> = {}

    Object.entries(bets).forEach(([betKey, betAmount]) => {
      // Find the group for this bet
      const group = displayGroups.find(g => {
        const groupKey = `${g.type}-${g.id}`
        return betKey.startsWith(groupKey)
      })

      if (!group) return

      // Find which subgroup this bet is for
      const subgroups = getSubgroups(group)
      let won = false

      for (const subgroupLabel of subgroups) {
        const subgroupKey = getSubgroupKey(subgroupLabel, group)
        if (subgroupKey === betKey) {
          won = checkSubgroupWin(num, group, subgroupLabel)
          break
        }
      }

      const payout = getGroupPayout(group)
      const amount = won ? betAmount * payout - betAmount : -betAmount
      wins[betKey] = { won, amount }
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

  // Filter out invalid spins (number -1 or outside 0-36), but keep notification spins
  const validSpins = spins.filter(spin => {
    // Keep spins with dealer change, card start, or card end flags (even if number is -1)
    if ((spin as any).isDealerChange || (spin as any).isCardStart || (spin as any).isCardEnd) return true
    // Otherwise, only keep valid roulette numbers (0-36)
    return spin.number >= 0 && spin.number <= 36
  })

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
              const subgroups = getSubgroups(group)
              const useGrid = subgroups.length > 2

              return (
                <td key={`bet-${group.type}-${group.id}-${idx}`} className="px-1 py-1 align-top">
                  <div className={useGrid ? "grid grid-cols-2 gap-0.5" : "flex gap-0.5"}>
                    {subgroups.map((subgroupLabel, subIdx) => {
                      const betKey = getSubgroupKey(subgroupLabel, group)
                      return (
                        <div key={`${betKey}-${subIdx}`}>
                          {renderBetButton(
                            betKey,
                            subgroupLabel,
                            'bg-blue-600 hover:bg-blue-700'
                          )}
                        </div>
                      )
                    })}
                  </div>
                </td>
              )
            })}
          </tr>

          {/* HISTORICAL ROWS */}
          {validSpins.map((spin, spinIdx) => {
            const num = spin.number
            const spinKey = new Date(spin.created_at).getTime().toString()
            const spinBetData = historicalBets[spinKey]

            // Check if this spin has dealer change or bet card notification
            const hasDealerChange = (spin as any).isDealerChange
            const hasBetCardStart = (spin as any).isCardStart
            const hasCardEnd = (spin as any).isCardEnd

            // Skip rendering the spin row for notification-only spins (number -1)
            const isNotificationOnly = num === -1

            return (
              <React.Fragment key={spin.id || spinIdx}>
                {/* Card start row */}
                {hasBetCardStart && (
                  <tr className="border-t-2 border-cyan-500 bg-gradient-to-r from-cyan-900/30 via-cyan-800/10 to-cyan-900/30">
                    <td colSpan={displayGroups.length + 1} className="px-2 py-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-cyan-300 font-bold text-xs">
                          🎴 Card #{(spin as any).cardNumber} Started - Target: ${(spin as any).cardTarget}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Card end row */}
                {hasCardEnd && (() => {
                  const profit = (spin as any).cardProfit || 0
                  const success = (spin as any).cardSuccess || false
                  const target = (spin as any).cardTarget || 0
                  const betsUsed = (spin as any).cardBetsUsed || 0
                  const maxBets = (spin as any).cardMaxBets || 0

                  return (
                    <tr className={`border-t-2 ${success ? 'border-green-500 bg-gradient-to-r from-green-900/30 via-green-800/10 to-green-900/30' : 'border-red-500 bg-gradient-to-r from-red-900/30 via-red-800/10 to-red-900/30'}`}>
                      <td colSpan={displayGroups.length + 1} className="px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className={`font-bold ${success ? 'text-green-300' : 'text-red-300'}`}>
                            {success ? `✅ $${target} Target Achieved` : `❌ FAILED: Card #${(spin as any).cardNumber}`}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            Profit: ${profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-300">
                            Bets: {betsUsed}/{maxBets}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })()}

                {/* Dealer change row */}
                {hasDealerChange && (
                  <tr className="border-t-2 border-yellow-500 bg-yellow-900/20">
                    <td colSpan={displayGroups.length + 1} className="px-2 py-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-yellow-400 font-bold text-xs">
                          🎰 Changed to dealer {(spin as any).dealerNumber}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Spin row - skip for notification-only spins */}
                {!isNotificationOnly && (
                  <tr className="border-b border-gray-700/50 hover:bg-gray-800/50">
                  <td className="px-1 py-1 text-center align-top">
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
                  const displayValue = getGroupDisplayValue(num, group)
                  const subgroups = getSubgroups(group)

                  // Find which subgroup has a bet result
                  let betResult = null
                  for (const subgroupLabel of subgroups) {
                    const betKey = getSubgroupKey(subgroupLabel, group)
                    if (spinBetData?.results[betKey]) {
                      betResult = { ...spinBetData.results[betKey], key: betKey }
                      break
                    }
                  }

                  const won = checkGroupWin(num, group)
                  let bgColor = 'bg-gray-600/30 text-gray-300'

                  if (displayValue !== '-') {
                    if (group.type === 'custom') {
                      bgColor = won ? 'bg-purple-600/30 text-purple-400' : 'bg-gray-600/30 text-gray-400'
                    } else {
                      bgColor = won ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                    }
                  }

                  return (
                    <td key={`cell-${group.type}-${group.id}-${groupIdx}`} className="px-1 py-1 text-center align-top">
                      <span className={`relative inline-block px-1.5 py-0.5 rounded text-xs font-bold ${bgColor}`}>
                        {displayValue}
                        {betResult && (
                          <span className={`absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded ${
                            betResult.won ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {betResult.won ? `+${betResult.amount}` : betResult.amount}
                          </span>
                        )}
                      </span>
                    </td>
                  )
                })}
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
