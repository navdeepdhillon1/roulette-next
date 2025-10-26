// components/MyGroupsLayout.tsx
'use client'

import React, { useState } from 'react'
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

// Helper function to get group value for a number
function getGroupValue(num: number, group: SelectedGroup): string {
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
      case 'alt1': {
        const a1a = [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33]
        return num === 0 ? '-' : a1a.includes(num) ? 'A' : 'B'
      }
      case 'alt2': {
        const a2a = [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30]
        return num === 0 ? '-' : a2a.includes(num) ? 'AA' : 'BB'
      }
      case 'alt3': {
        const a3a = [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27]
        return num === 0 ? '-' : a3a.includes(num) ? 'AAA' : 'BBB'
      }
      case 'ec': {
        const edge = [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36]
        return num === 0 ? '-' : edge.includes(num) ? 'E' : 'C'
      }
      case 'six': {
        if (num === 0) return '-'
        if (num <= 6) return '1st'
        if (num <= 12) return '2nd'
        if (num <= 18) return '3rd'
        if (num <= 24) return '4th'
        if (num <= 30) return '5th'
        return '6th'
      }
      default:
        return '-'
    }
  }

  // Wheel groups (WHEEL-BASED, not table-based!)
  if (type === 'wheel') {
    switch (id) {
      case 'voisins': {
        const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]
        return voisins.includes(num) ? '✓' : '-'
      }
      case 'orphelins': {
        const orphelins = [17,34,6,1,20,14,31,9]
        return orphelins.includes(num) ? '✓' : '-'
      }
      case 'tiers': {
        const tiers = [27,13,36,11,30,8,23,10,5,24,16,33]
        return tiers.includes(num) ? '✓' : '-'
      }
      case 'voisins-nonvoisins': {
        const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]
        const nonVoisins = [17,34,6,1,20,14,31,9,27,13,36,11,30,8,23,10,5,24,16,33]
        if (voisins.includes(num)) return 'V'
        if (nonVoisins.includes(num)) return 'NV'
        return '-'
      }
      case 'wheel-quarters': {
        // Wheel quadrants (9's) - WHEEL-BASED
        const first_9 = [32,15,19,4,21,2,25,17,34]
        const second_9 = [6,27,13,36,11,30,8,23,10]
        const third_9 = [5,24,16,33,1,20,14,31,9]
        const fourth_9 = [22,18,29,7,28,12,35,3,26]
        if (first_9.includes(num)) return '1st'
        if (second_9.includes(num)) return '2nd'
        if (third_9.includes(num)) return '3rd'
        if (fourth_9.includes(num)) return '4th'
        if (num === 0) return '0'
        return '-'
      }
      case 'ab-split': {
        // A/B Pattern - Alternating single numbers on WHEEL
        const a = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3]
        return num === 0 ? '0' : a.includes(num) ? 'A' : 'B'
      }
      case 'aabb-split': {
        // AA/BB Pattern - Alternating pairs on WHEEL
        const aa = [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35]
        return num === 0 ? '0' : aa.includes(num) ? 'AA' : 'BB'
      }
      case 'aaabbb-split': {
        // AAA/BBB Pattern - Alternating triplets on WHEEL
        const aaa = [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12]
        return num === 0 ? '0' : aaa.includes(num) ? 'AAA' : 'BBB'
      }
      case 'a6b6-split': {
        // A6/B6 Pattern - Six-based split on WHEEL
        const a6 = [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29]
        return num === 0 ? '0' : a6.includes(num) ? 'A6' : 'B6'
      }
      case 'a9b9-split': {
        // A9/B9 Pattern - Nine-based split on WHEEL
        const a9 = [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9]
        return num === 0 ? '0' : a9.includes(num) ? 'A9' : 'B9'
      }
      case 'right-left': {
        // Right/Left - 18 vs 18 split on WHEEL
        const right = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10]
        return num === 0 ? '0' : right.includes(num) ? 'R' : 'L'
      }
      case 'wheel-position': {
        const index = WHEEL_ORDER.indexOf(num)
        return index >= 0 ? String(index) : '-'
      }
      default:
        return '-'
    }
  }

  return '-'
}

// Helper to get cell color based on group type
function getCellColor(value: string, groupId: string): string {
  // Colors
  if (value === 'R') return 'bg-red-600/80 text-white'
  if (value === 'B') return 'bg-gray-900 text-white border border-gray-600'

  // Even/Odd
  if (value === 'E') return 'bg-purple-600/80 text-white'
  if (value === 'O') return 'bg-cyan-600/80 text-white'

  // Low/High
  if (value === 'L') return 'bg-amber-700/80 text-white'
  if (value === 'H') return 'bg-gray-600/80 text-white'

  // Columns
  if (groupId === 'column') {
    if (value === '1st') return 'bg-orange-600/80 text-white'
    if (value === '2nd') return 'bg-teal-600/80 text-white'
    if (value === '3rd') return 'bg-lime-600/80 text-white'
  }

  // Dozens
  if (groupId === 'dozen') {
    if (value === '1st') return 'bg-red-700/80 text-white'
    if (value === '2nd') return 'bg-cyan-700/80 text-white'
    if (value === '3rd') return 'bg-green-700/80 text-white'
  }

  // Alt groups
  if (value === 'A') return 'bg-indigo-600/80 text-white'
  if (value === 'B' && groupId !== 'color') return 'bg-pink-600/80 text-white'
  if (value === 'AA') return 'bg-lime-700/80 text-white'
  if (value === 'BB') return 'bg-purple-700/80 text-white'
  if (value === 'AAA') return 'bg-blue-600/80 text-white'
  if (value === 'BBB') return 'bg-yellow-700/80 text-white'
  if (value === 'A6') return 'bg-emerald-600/80 text-white'
  if (value === 'B6') return 'bg-rose-600/80 text-white'
  if (value === 'A9') return 'bg-sky-600/80 text-white'
  if (value === 'B9') return 'bg-amber-600/80 text-white'

  // Voisins/Non-Voisins
  if (value === 'V') return 'bg-purple-600/80 text-white'
  if (value === 'NV') return 'bg-orange-600/80 text-white'

  // Right/Left
  if (value === 'R' && groupId === 'right-left') return 'bg-teal-600/80 text-white'
  if (value === 'L' && groupId === 'right-left') return 'bg-indigo-600/80 text-white'

  // Low/High (already handled above, but this is for right-left conflict)
  if (value === 'L' && groupId === 'low-high') return 'bg-amber-700/80 text-white'

  // Edge/Center
  if (value === 'E' && groupId === 'ec') return 'bg-purple-600/80 text-white'
  if (value === 'C') return 'bg-orange-600/80 text-white'

  // Six groups
  if (groupId === 'six') {
    if (value === '1st') return 'bg-red-700/80 text-white'
    if (value === '2nd') return 'bg-blue-700/80 text-white'
    if (value === '3rd') return 'bg-green-700/80 text-white'
    if (value === '4th') return 'bg-green-700/80 text-white'
    if (value === '5th') return 'bg-blue-700/80 text-white'
    if (value === '6th') return 'bg-red-700/80 text-white'
  }

  // Checkmarks for wheel groups and custom
  if (value === '✓') return 'bg-green-600/80 text-white'

  // Wheel quarters (9's)
  if (groupId === 'wheel-quarters') {
    if (value === '1st') return 'bg-emerald-700/80 text-white'
    if (value === '2nd') return 'bg-blue-700/80 text-white'
    if (value === '3rd') return 'bg-violet-700/80 text-white'
    if (value === '4th') return 'bg-rose-700/80 text-white'
  }

  // Wheel position
  if (groupId === 'wheel-position' && value !== '-') return 'bg-slate-600/80 text-white'

  // Default
  return 'bg-gray-700/50 text-gray-400'
}

// Get group color
function getGroupColor(group: SelectedGroup): string {
  const { type, id } = group

  if (type === 'custom') {
    return 'bg-purple-600'
  }

  if (type === 'table') {
    switch (id) {
      case 'color': return 'bg-red-600'
      case 'even-odd': return 'bg-blue-600'
      case 'low-high': return 'bg-amber-600'
      case 'column': return 'bg-orange-600'
      case 'dozen': return 'bg-cyan-600'
      case 'alt1': return 'bg-indigo-600'
      case 'alt2': return 'bg-lime-600'
      case 'alt3': return 'bg-sky-600'
      case 'ec': return 'bg-violet-600'
      case 'six': return 'bg-rose-600'
      default: return 'bg-gray-600'
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'voisins': return 'bg-purple-700'
      case 'orphelins': return 'bg-orange-700'
      case 'tiers': return 'bg-green-700'
      case 'voisins-nonvoisins': return 'bg-purple-700'
      case 'wheel-quarters': return 'bg-emerald-700'
      case 'ab-split': return 'bg-indigo-700'
      case 'aabb-split': return 'bg-lime-700'
      case 'aaabbb-split': return 'bg-blue-700'
      case 'a6b6-split': return 'bg-emerald-700'
      case 'a9b9-split': return 'bg-sky-700'
      case 'right-left': return 'bg-teal-700'
      default: return 'bg-gray-700'
    }
  }

  return 'bg-gray-600'
}

// Check if group has multiple options (3+)
function isMultiOptionGroup(group: SelectedGroup): boolean {
  const { type, id } = group
  if (type === 'custom') return false

  const multiOptionIds = ['column', 'dozen', 'six', 'wheel-quarters']
  return multiOptionIds.includes(id)
}

// Check if group is splittable (A/B style - exactly 2 options)
function isSplitGroup(group: SelectedGroup): boolean {
  const { type, id } = group
  if (type === 'custom') return false

  const splitIds = [
    'color', 'even-odd', 'low-high', 'alt1', 'alt2', 'alt3', 'ec',
    'voisins-nonvoisins', 'ab-split', 'aabb-split', 'aaabbb-split',
    'a6b6-split', 'a9b9-split', 'right-left'
  ]

  return splitIds.includes(id)
}

// Get all options for multi-option groups
function getMultiOptions(group: SelectedGroup): { key: string, label: string, value: string }[] {
  const { type, id } = group

  if (type === 'table') {
    switch (id) {
      case 'column':
        return [
          { key: '1', label: '1st', value: '1st' },
          { key: '2', label: '2nd', value: '2nd' },
          { key: '3', label: '3rd', value: '3rd' }
        ]
      case 'dozen':
        return [
          { key: '1', label: '1st', value: '1st' },
          { key: '2', label: '2nd', value: '2nd' },
          { key: '3', label: '3rd', value: '3rd' }
        ]
      case 'six':
        return [
          { key: '1', label: '1st', value: '1st' },
          { key: '2', label: '2nd', value: '2nd' },
          { key: '3', label: '3rd', value: '3rd' },
          { key: '4', label: '4th', value: '4th' },
          { key: '5', label: '5th', value: '5th' },
          { key: '6', label: '6th', value: '6th' }
        ]
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'wheel-quarters':
        return [
          { key: '1', label: '1st', value: '1st' },
          { key: '2', label: '2nd', value: '2nd' },
          { key: '3', label: '3rd', value: '3rd' },
          { key: '4', label: '4th', value: '4th' }
        ]
    }
  }

  return []
}

// Get split labels for a group
function getSplitLabels(group: SelectedGroup): { a: string, b: string } {
  const { type, id } = group

  if (type === 'table') {
    switch (id) {
      case 'color': return { a: 'Red', b: 'Black' }
      case 'even-odd': return { a: 'Even', b: 'Odd' }
      case 'low-high': return { a: 'Low', b: 'High' }
      case 'column': return { a: '1st Col', b: '2nd/3rd' }
      case 'dozen': return { a: '1st Dz', b: '2nd/3rd' }
      case 'alt1': return { a: 'A', b: 'B' }
      case 'alt2': return { a: 'AA', b: 'BB' }
      case 'alt3': return { a: 'AAA', b: 'BBB' }
      case 'ec': return { a: 'Edge', b: 'Center' }
      case 'six': return { a: '1st Six', b: 'Other' }
      default: return { a: 'A', b: 'B' }
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'voisins-nonvoisins': return { a: 'V', b: 'NV' }
      case 'wheel-quarters': return { a: '1st 9', b: 'Other' }
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
  manualBets = {},
  setManualBets,
  playerUnit = 10,
  betResults = {},
  historicalBets = {},
  onHistoricalBetsUpdate,
  onBetPlaced,
  onClearBets
}: MyGroupsLayoutProps) {
  const [bets, setBets] = useState<Record<string, number>>({})
  const [results, setResults] = useState<Record<string, { won: boolean, amount: number }>>({})
  const [showResults, setShowResults] = useState(false)

  // Track previous spin count to detect new spins
  const prevSpinCountRef = React.useRef(spins.length)
  const betsRef = React.useRef(bets)

  // Keep betsRef in sync with bets state
  React.useEffect(() => {
    betsRef.current = bets
  }, [bets])

  // Sync manualBets from parent to local bets state
  React.useEffect(() => {
    const numericBets: Record<string, number> = {}
    Object.entries(manualBets).forEach(([key, value]) => {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        numericBets[key] = numValue
      }
    })
    setBets(numericBets)
  }, [manualBets])

  // Helper to check if number wins for a group
  const checkGroupWin = (num: number, group: SelectedGroup): boolean => {
    const { type, id, customGroup } = group

    if (type === 'custom' && customGroup) {
      return customGroup.numbers.includes(num)
    }

    if (type === 'table') {
      switch (id) {
        case 'color': return num > 0 && RED_NUMBERS.includes(num)
        case 'even-odd': return num > 0 && num % 2 === 0
        case 'low-high': return num > 0 && num <= 18
        case 'column': return num > 0 && num % 3 === 1
        case 'dozen': return num > 0 && num <= 12
        case 'alt1': return num > 0 && [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num)
        case 'alt2': return num > 0 && [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num)
        case 'alt3': return num > 0 && [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num)
        case 'ec': return num > 0 && [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num)
        case 'six': return num > 0 && num <= 6
        default: return false
      }
    }

    if (type === 'wheel') {
      switch (id) {
        case 'voisins': return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25].includes(num)
        case 'orphelins': return [17,34,6,1,20,14,31,9].includes(num)
        case 'tiers': return [27,13,36,11,30,8,23,10,5,24,16,33].includes(num)
        case 'voisins-nonvoisins': return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25].includes(num)
        case 'wheel-quarters': return num > 0 && [32,15,19,4,21,2,25,17,34].includes(num)
        case 'ab-split': return num > 0 && [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3].includes(num)
        case 'aabb-split': return num > 0 && [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35].includes(num)
        case 'aaabbb-split': return num > 0 && [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12].includes(num)
        case 'a6b6-split': return num > 0 && [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29].includes(num)
        case 'a9b9-split': return num > 0 && [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9].includes(num)
        case 'right-left': return num > 0 && [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10].includes(num)
        default: return false
      }
    }

    return false
  }

  // Get number count for payout calculation
  const getNumberCount = (group: SelectedGroup): number => {
    const { type, id, customGroup } = group

    if (type === 'custom' && customGroup) {
      return customGroup.numbers.length
    }

    if (type === 'table') {
      switch (id) {
        case 'color': case 'even-odd': case 'low-high': case 'alt1': case 'alt2': case 'alt3': case 'ec':
          return 18
        case 'column': case 'dozen':
          return 12
        case 'six':
          return 6
        default: return 18
      }
    }

    if (type === 'wheel') {
      switch (id) {
        case 'voisins': case 'voisins-nonvoisins': return 17
        case 'orphelins': return 8
        case 'tiers': return 12
        case 'ab-split': case 'aabb-split': case 'aaabbb-split': case 'a6b6-split': case 'a9b9-split': case 'right-left':
          return 18
        case 'wheel-quarters':
          return 9
        default: return 18
      }
    }

    return 18
  }

  // Calculate payouts based on: (bet_amount / numbers_in_group) * 36
  const calculatePayouts = (betAmount: number, numberCount: number): number => {
    return (betAmount / numberCount) * 36
  }

  // Calculate results for all bets
  const calculateResults = (num: number): Record<string, { won: boolean, amount: number }> => {
    const wins: Record<string, { won: boolean, amount: number }> = {}

    Object.entries(bets).forEach(([key, betAmount]) => {
      // Parse the key to determine which group and option
      const parts = key.split('-')
      const groupType = parts[0] // 'table', 'wheel', or 'custom'
      const lastPart = parts[parts.length - 1]

      // Check if it's a split (a/b) or multi-option (1-6) or single
      const isSplit = lastPart === 'a' || lastPart === 'b'
      const isMultiOption = !isNaN(parseInt(lastPart)) && lastPart.length <= 2

      const side = isSplit ? lastPart : null
      const optionNum = isMultiOption ? lastPart : null
      const groupId = (isSplit || isMultiOption) ? parts.slice(1, -1).join('-') : parts.slice(1).join('-')

      // Find the matching group
      const group = selectedGroups.find(g => g.type === groupType && g.id === groupId)
      if (!group) {
        wins[key] = { won: false, amount: -betAmount }
        return
      }

      // Determine if bet won
      let won = false

      if (isMultiOption) {
        // Multi-option group (column, dozen, six, wheel-quarters)
        const value = getGroupValue(num, group)
        const options = getMultiOptions(group)
        const matchingOption = options.find(o => o.key === optionNum)

        if (matchingOption) {
          won = value === matchingOption.value
        }
      } else if (isSplit) {
        // Split group - check if actual value matches bet side
        const value = getGroupValue(num, group)
        const labels = getSplitLabels(group)

        if (side === 'a') {
          // Check if the value matches side A
          won = (value === labels.a ||
                 (group.id === 'color' && value === 'R') ||
                 (group.id === 'even-odd' && value === 'E') ||
                 (group.id === 'low-high' && value === 'L') ||
                 (group.id === 'column' && value === '1st') ||
                 (group.id === 'dozen' && value === '1st') ||
                 (group.id === 'alt1' && value === 'A') ||
                 (group.id === 'alt2' && value === 'AA') ||
                 (group.id === 'alt3' && value === 'AAA') ||
                 (group.id === 'ec' && value === 'E') ||
                 (group.id === 'six' && value === '1st') ||
                 (group.id === 'voisins-nonvoisins' && value === 'V') ||
                 (group.id === 'wheel-quarters' && value === '1st') ||
                 (group.id === 'ab-split' && value === 'A') ||
                 (group.id === 'aabb-split' && value === 'AA') ||
                 (group.id === 'aaabbb-split' && value === 'AAA') ||
                 (group.id === 'a6b6-split' && value === 'A6') ||
                 (group.id === 'a9b9-split' && value === 'A9') ||
                 (group.id === 'right-left' && value === 'R'))
        } else if (side === 'b') {
          // Check if the value matches side B
          won = (value === labels.b ||
                 (group.id === 'color' && value === 'B') ||
                 (group.id === 'even-odd' && value === 'O') ||
                 (group.id === 'low-high' && value === 'H') ||
                 (group.id === 'column' && (value === '2nd' || value === '3rd')) ||
                 (group.id === 'dozen' && (value === '2nd' || value === '3rd')) ||
                 (group.id === 'alt1' && value === 'B') ||
                 (group.id === 'alt2' && value === 'BB') ||
                 (group.id === 'alt3' && value === 'BBB') ||
                 (group.id === 'ec' && value === 'C') ||
                 (group.id === 'six' && (value === '2nd' || value === '3rd' || value === '4th' || value === '5th' || value === '6th')) ||
                 (group.id === 'voisins-nonvoisins' && value === 'NV') ||
                 (group.id === 'wheel-quarters' && (value === '2nd' || value === '3rd' || value === '4th')) ||
                 (group.id === 'ab-split' && value === 'B') ||
                 (group.id === 'aabb-split' && value === 'BB') ||
                 (group.id === 'aaabbb-split' && value === 'BBB') ||
                 (group.id === 'a6b6-split' && value === 'B6') ||
                 (group.id === 'a9b9-split' && value === 'B9') ||
                 (group.id === 'right-left' && value === 'L'))
        }
      } else {
        // Non-split group - simple win check
        won = checkGroupWin(num, group)
      }

      const numberCount = getNumberCount(group)
      const payout = won ? calculatePayouts(betAmount, numberCount) : 0
      const amount = won ? payout - betAmount : -betAmount

      wins[key] = { won, amount }
    })

    return wins
  }

  // Auto-calculate results when a new spin is added
  React.useEffect(() => {
    // Only process if a NEW spin was added (length increased)
    const hasNewSpin = spins.length > prevSpinCountRef.current
    prevSpinCountRef.current = spins.length

    if (hasNewSpin && Object.keys(betsRef.current).length > 0 && !showResults) {
      const latestSpin = spins[0]
      const currentBets = betsRef.current
      const calcResults = calculateResults(latestSpin.number)
      setResults(calcResults)
      setShowResults(true)

      // Store bet results using callback
      const spinKey = new Date(latestSpin.created_at).getTime().toString()
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

      // Convert results to P/L format
      const groupResults: Record<string, number> = {}
      Object.entries(calcResults).forEach(([key, result]) => {
        groupResults[key] = result.amount
      })

      // Get the timestamp from the spin
      const spinTimestamp = new Date(latestSpin.created_at).getTime()

      // Notify parent with betting matrix and results
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spins.length, showResults])

  // Show empty state if no groups selected
  if (selectedGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Interested in choosing your own numbers or groups?
          </h3>
          <p className="text-gray-400">
            Go to the session setup to configure your custom groups!
          </p>
        </div>
      </div>
    )
  }

  // Get last 50 spins (most recent first - spins array is already newest-first)
  const recentSpins = spins.slice(0, 50)

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-gray-800 border-b-2 border-gray-600">
            <tr>
              <th className="px-3 py-2 text-center border-r border-gray-700 font-bold text-yellow-400">
                Number
              </th>
              {selectedGroups.map((group, idx) => (
                <th
                  key={`${group.type}-${group.id}-${idx}`}
                  className="px-3 py-2 text-center border-r border-gray-700 font-bold text-gray-300 min-w-[80px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{group.name}</span>
                    <button
                      className="text-xs text-gray-500 hover:text-gray-300"
                      title="Search in this column (coming soon)"
                    >
                      🔍
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* NEXT BET row */}
            <tr className="bg-yellow-900/30 border-b-2 border-yellow-600 h-12">
              <td className="px-2 py-0.5 text-center border-r border-gray-700">
                <div className="flex flex-col items-center justify-center gap-0 leading-none">
                  <div className="font-bold text-yellow-400 text-[10px] mb-0.5">NEXT BET</div>
                  {onClearBets && (
                    <button
                      onClick={onClearBets}
                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded mb-0.5"
                    >
                      Clear
                    </button>
                  )}
                  <div className="text-[9px] text-gray-300 leading-none">
                    <div className="font-bold text-cyan-400">
                      ${Object.values(manualBets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(0)}
                    </div>
                  </div>
                </div>
              </td>
              {selectedGroups.map((group, idx) => {
                const isMulti = isMultiOptionGroup(group)
                const isSplit = isSplitGroup(group)
                const groupColor = getGroupColor(group)

                // Multi-option groups (3+ options)
                if (isMulti) {
                  const options = getMultiOptions(group)

                  return (
                    <td
                      key={`next-${group.type}-${group.id}-${idx}`}
                      className="px-1 py-0.5 text-center border-r border-gray-700"
                    >
                      <div className={`grid ${group.id === 'six' ? 'grid-cols-3' : group.id === 'wheel-quarters' ? 'grid-cols-2' : 'grid-cols-3'} gap-0.5`}>
                        {options.map((option) => {
                          const key = `${group.type}-${group.id}-${option.key}`
                          const hasBet = manualBets[key] && manualBets[key] !== ''
                          const result = betResults[key]

                          let buttonClass = 'bg-gray-700 hover:bg-gray-600 text-white'
                          let displayText = option.label
                          let showBadge = false

                          if (result?.status === 'win') {
                            buttonClass = 'bg-green-600 text-white animate-pulse'
                            displayText = `+$${result.amount}`
                          } else if (result?.status === 'loss') {
                            buttonClass = 'bg-red-900 text-white animate-pulse'
                            displayText = `-$${result.amount}`
                          } else if (hasBet) {
                            buttonClass = `${groupColor} text-white`
                            showBadge = true
                          }

                          return (
                            <button
                              key={key}
                              onClick={() => {
                                if (!setManualBets) return
                                const currentValue = parseFloat(manualBets[key] || '0')
                                const newValue = (currentValue + playerUnit).toString()
                                const updatedBets = { ...manualBets, [key]: newValue }
                                setManualBets(updatedBets)
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                if (!setManualBets) return
                                const updatedBets = { ...manualBets }
                                delete updatedBets[key]
                                setManualBets(updatedBets)
                              }}
                              className={`relative px-1 py-1 ${buttonClass} rounded text-xs font-bold transition-all`}
                            >
                              {displayText}
                              {showBadge && (
                                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold px-0.5 rounded">
                                  ${manualBets[key]}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  )
                } else if (isSplit) {
                  const labels = getSplitLabels(group)
                  const keyA = `${group.type}-${group.id}-a`
                  const keyB = `${group.type}-${group.id}-b`

                  const hasBetA = manualBets[keyA] && manualBets[keyA] !== ''
                  const hasBetB = manualBets[keyB] && manualBets[keyB] !== ''
                  const resultA = betResults[keyA]
                  const resultB = betResults[keyB]

                  // Button states A
                  let buttonClassA = 'bg-gray-700 hover:bg-gray-600 text-white'
                  let displayTextA = labels.a
                  let showBadgeA = false
                  if (resultA?.status === 'win') {
                    buttonClassA = 'bg-green-600 text-white animate-pulse'
                    displayTextA = `+$${resultA.amount}`
                  } else if (resultA?.status === 'loss') {
                    buttonClassA = 'bg-red-900 text-white animate-pulse'
                    displayTextA = `-$${resultA.amount}`
                  } else if (hasBetA) {
                    buttonClassA = `${groupColor} text-white`
                    showBadgeA = true
                  }

                  // Button states B
                  let buttonClassB = 'bg-gray-700 hover:bg-gray-600 text-white'
                  let displayTextB = labels.b
                  let showBadgeB = false
                  if (resultB?.status === 'win') {
                    buttonClassB = 'bg-green-600 text-white animate-pulse'
                    displayTextB = `+$${resultB.amount}`
                  } else if (resultB?.status === 'loss') {
                    buttonClassB = 'bg-red-900 text-white animate-pulse'
                    displayTextB = `-$${resultB.amount}`
                  } else if (hasBetB) {
                    buttonClassB = `${groupColor} text-white`
                    showBadgeB = true
                  }

                  return (
                    <td
                      key={`next-${group.type}-${group.id}-${idx}`}
                      className="px-1 py-0.5 text-center border-r border-gray-700"
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => {
                            if (!setManualBets) return
                            const currentValue = parseFloat(manualBets[keyA] || '0')
                            const newValue = (currentValue + playerUnit).toString()
                            const updatedBets = { ...manualBets, [keyA]: newValue }
                            setManualBets(updatedBets)
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            if (!setManualBets) return
                            const updatedBets = { ...manualBets }
                            delete updatedBets[keyA]
                            setManualBets(updatedBets)
                          }}
                          className={`relative px-2 py-1 ${buttonClassA} rounded text-xs font-bold transition-all`}
                        >
                          {displayTextA}
                          {showBadgeA && (
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
                              ${manualBets[keyA]}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (!setManualBets) return
                            const currentValue = parseFloat(manualBets[keyB] || '0')
                            const newValue = (currentValue + playerUnit).toString()
                            const updatedBets = { ...manualBets, [keyB]: newValue }
                            setManualBets(updatedBets)
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            if (!setManualBets) return
                            const updatedBets = { ...manualBets }
                            delete updatedBets[keyB]
                            setManualBets(updatedBets)
                          }}
                          className={`relative px-2 py-1 ${buttonClassB} rounded text-xs font-bold transition-all`}
                        >
                          {displayTextB}
                          {showBadgeB && (
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
                              ${manualBets[keyB]}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  )
                } else {
                  const key = `${group.type}-${group.id}`
                  const hasBet = manualBets[key] && manualBets[key] !== ''
                  const result = betResults[key]

                  let buttonClass = 'bg-gray-700 hover:bg-gray-600 text-white'
                  let displayText = group.name
                  let showBadge = false
                  if (result?.status === 'win') {
                    buttonClass = 'bg-green-600 text-white animate-pulse'
                    displayText = `+$${result.amount}`
                  } else if (result?.status === 'loss') {
                    buttonClass = 'bg-red-900 text-white animate-pulse'
                    displayText = `-$${result.amount}`
                  } else if (hasBet) {
                    buttonClass = `${groupColor} text-white`
                    showBadge = true
                  }

                  return (
                    <td
                      key={`next-${group.type}-${group.id}-${idx}`}
                      className="px-1 py-0.5 text-center border-r border-gray-700"
                    >
                      <button
                        onClick={() => {
                          if (!setManualBets) return
                          const currentValue = manualBets[key]
                          const newValue = currentValue ? '' : playerUnit.toString()
                          const updatedBets = { ...manualBets, [key]: newValue }
                          setManualBets(updatedBets)
                        }}
                        className={`relative px-2 py-1 ${buttonClass} rounded text-xs font-bold transition-all`}
                      >
                        {displayText}
                        {showBadge && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
                            ${manualBets[key]}
                          </span>
                        )}
                      </button>
                    </td>
                  )
                }
              })}
            </tr>

            {/* Spin rows */}
            {recentSpins.length === 0 ? (
              <tr>
                <td
                  colSpan={selectedGroups.length + 1}
                  className="px-3 py-8 text-center text-gray-400"
                >
                  No spins yet. Start adding numbers!
                </td>
              </tr>
            ) : (
              recentSpins.map((spin, rowIdx) => {
                const isRed = RED_NUMBERS.includes(spin.number)
                const numberColor = spin.number === 0
                  ? 'bg-green-600'
                  : isRed
                  ? 'bg-red-600'
                  : 'bg-gray-900 border border-gray-600'

                // Check if we have bet results for this spin
                const spinKey = new Date(spin.created_at).getTime().toString()
                const spinBetData = historicalBets[spinKey]

                // Helper to render cell with P/L badge
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
                          {betResult.won ? `+${betResult.amount.toFixed(0)}` : betResult.amount.toFixed(0)}
                        </span>
                      )}
                    </span>
                  )
                }

                return (
                  <tr
                    key={`${spin.timestamp}-${rowIdx}`}
                    className="border-b border-gray-700 hover:bg-gray-800/30 h-12"
                  >
                    {/* Number column */}
                    <td className="px-2 py-0.5 text-center border-r border-gray-700">
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white ${numberColor}`}
                      >
                        {spin.number}
                      </div>
                    </td>

                    {/* Group columns */}
                    {selectedGroups.map((group, idx) => {
                      const value = getGroupValue(spin.number, group)
                      const cellColor = getCellColor(value, group.id)

                      // Determine bet key(s) for this group
                      const isMulti = isMultiOptionGroup(group)
                      const isSplit = isSplitGroup(group)
                      const groupKey = `${group.type}-${group.id}`

                      let betKeys: string[] = []
                      if (isMulti) {
                        const options = getMultiOptions(group)
                        betKeys = options.map(opt => `${groupKey}-${opt.key}`)
                      } else if (isSplit) {
                        betKeys = [`${groupKey}-a`, `${groupKey}-b`]
                      } else {
                        betKeys = [groupKey]
                      }

                      return (
                        <td
                          key={`${spin.timestamp}-${group.type}-${group.id}-${idx}`}
                          className="px-2 py-0.5 text-center border-r border-gray-700"
                        >
                          {renderCellWithBadge(
                            <div className={`inline-block px-1.5 py-0 rounded text-xs ${cellColor}`}>
                              {value}
                            </div>,
                            '',
                            betKeys
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
