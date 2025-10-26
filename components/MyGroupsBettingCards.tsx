import React from 'react'
import type { SelectedGroup } from '@/types/bettingAssistant'
import { RED_NUMBERS } from '@/lib/roulette-logic'

interface MyGroupsBettingCardsProps {
  selectedGroups: SelectedGroup[]
  manualBets: Record<string, string>
  setManualBets: (b: Record<string, string>) => void
  playerUnit: number
  betResults: Record<string, { status: 'win' | 'loss', amount: string } | null>
}

// Helper to get numbers in a group
function getGroupNumbers(group: SelectedGroup): number[] {
  const { type, id, customGroup } = group

  if (type === 'custom' && customGroup) {
    return customGroup.numbers
  }

  if (type === 'table') {
    switch (id) {
      case 'color':
        return RED_NUMBERS // Just red side, black is complement
      case 'even-odd':
        return [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36] // Even
      case 'low-high':
        return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] // Low
      case 'column':
        return [1,4,7,10,13,16,19,22,25,28,31,34] // First column
      case 'dozen':
        return [1,2,3,4,5,6,7,8,9,10,11,12] // First dozen
      case 'alt1':
        return [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33] // A
      case 'alt2':
        return [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30] // AA
      case 'alt3':
        return [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27] // AAA
      case 'ec':
        return [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36] // Edge
      case 'six':
        return [1,2,3,4,5,6] // First six
      default:
        return []
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'voisins':
        return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]
      case 'orphelins':
        return [17,34,6,1,20,14,31,9]
      case 'tiers':
        return [27,13,36,11,30,8,23,10,5,24,16,33]
      case 'voisins-nonvoisins':
        return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25] // Voisins side
      case 'wheel-quarters':
        return [32,15,19,4,21,2,25,17,34] // 1st 9
      case 'ab-split':
        return [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3] // A
      case 'aabb-split':
        return [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35] // AA
      case 'aaabbb-split':
        return [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12] // AAA
      case 'a6b6-split':
        return [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29] // A6
      case 'a9b9-split':
        return [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9] // A9
      case 'right-left':
        return [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10] // Right
      case 'wheel-position':
        return [] // Not bettable
      default:
        return []
    }
  }

  return []
}

// Calculate payout multiplier based on number count
function getPayoutMultiplier(numberCount: number): number {
  if (numberCount >= 18) return 2 // 1:1 payout (bet back + win)
  if (numberCount >= 12) return 3 // 2:1 payout
  if (numberCount >= 9) return 4 // 3:1 payout
  if (numberCount >= 6) return 6 // 5:1 payout
  if (numberCount >= 4) return 9 // 8:1 payout
  if (numberCount >= 3) return 12 // 11:1 payout
  if (numberCount === 2) return 18 // 17:1 payout
  if (numberCount === 1) return 36 // 35:1 payout
  return 2 // Default 1:1
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

// Check if group is splittable (A/B style)
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

export default function MyGroupsBettingCards({
  selectedGroups,
  manualBets,
  setManualBets,
  playerUnit,
  betResults
}: MyGroupsBettingCardsProps) {
  // Filter out wheel-position (not bettable)
  const bettableGroups = selectedGroups.filter(g => g.id !== 'wheel-position')

  if (bettableGroups.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <p className="text-gray-400 text-sm text-center">No bettable groups selected</p>
      </div>
    )
  }

  // Render betting cards for each group
  const renderGroupBettingCard = (group: SelectedGroup, idx: number) => {
    const numbers = getGroupNumbers(group)
    const isSplit = isSplitGroup(group)

    if (isSplit) {
      const labels = getSplitLabels(group)
      const keyA = `${group.type}-${group.id}-a`
      const keyB = `${group.type}-${group.id}-b`

      const hasBetA = manualBets[keyA] && manualBets[keyA] !== ''
      const hasBetB = manualBets[keyB] && manualBets[keyB] !== ''
      const resultA = betResults[keyA]
      const resultB = betResults[keyB]

      // Determine button states A
      let buttonClassA = 'bg-gray-700 hover:bg-gray-600'
      let displayTextA = labels.a
      if (resultA?.status === 'win') {
        buttonClassA = 'bg-green-600 animate-pulse'
        displayTextA = `+$${resultA.amount}`
      } else if (resultA?.status === 'loss') {
        buttonClassA = 'bg-red-900 animate-pulse'
        displayTextA = `-$${resultA.amount}`
      } else if (hasBetA) {
        buttonClassA = 'bg-yellow-500 text-black'
        displayTextA = `${labels.a}`
      }

      // Determine button states B
      let buttonClassB = 'bg-gray-700 hover:bg-gray-600'
      let displayTextB = labels.b
      if (resultB?.status === 'win') {
        buttonClassB = 'bg-green-600 animate-pulse'
        displayTextB = `+$${resultB.amount}`
      } else if (resultB?.status === 'loss') {
        buttonClassB = 'bg-red-900 animate-pulse'
        displayTextB = `-$${resultB.amount}`
      } else if (hasBetB) {
        buttonClassB = 'bg-yellow-500 text-black'
        displayTextB = `${labels.b}`
      }

      return (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => {
              // Cumulative click - each click adds playerUnit up to max 1000
              const currentValue = parseInt(manualBets[keyA] || '0')
              const newValue = Math.min(currentValue + playerUnit, 1000)
              const updatedBets = { ...manualBets, [keyA]: newValue.toString() }
              setManualBets(updatedBets)
            }}
            className={`px-2 py-1 ${buttonClassA} rounded text-xs font-bold transition-all relative`}
          >
            {displayTextA}
            {hasBetA && !resultA && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded">
                ${manualBets[keyA]}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              // Cumulative click - each click adds playerUnit up to max 1000
              const currentValue = parseInt(manualBets[keyB] || '0')
              const newValue = Math.min(currentValue + playerUnit, 1000)
              const updatedBets = { ...manualBets, [keyB]: newValue.toString() }
              setManualBets(updatedBets)
            }}
            className={`px-2 py-1 ${buttonClassB} rounded text-xs font-bold transition-all relative`}
          >
            {displayTextB}
            {hasBetB && !resultB && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded">
                ${manualBets[keyB]}
              </span>
            )}
          </button>
        </div>
      )
    } else {
      const key = `${group.type}-${group.id}`
      const hasBet = manualBets[key] && manualBets[key] !== ''
      const result = betResults[key]

      let buttonClass = 'bg-gray-700 hover:bg-gray-600'
      let displayText = group.name
      if (result?.status === 'win') {
        buttonClass = 'bg-green-600 animate-pulse'
        displayText = `+$${result.amount}`
      } else if (result?.status === 'loss') {
        buttonClass = 'bg-red-900 animate-pulse'
        displayText = `-$${result.amount}`
      } else if (hasBet) {
        buttonClass = 'bg-yellow-500 text-black'
        displayText = group.name
      }

      return (
        <button
          onClick={() => {
            // Cumulative click - each click adds playerUnit up to max 1000
            const currentValue = parseInt(manualBets[key] || '0')
            const newValue = Math.min(currentValue + playerUnit, 1000)
            const updatedBets = { ...manualBets, [key]: newValue.toString() }
            setManualBets(updatedBets)
          }}
          className={`px-2 py-1 ${buttonClass} rounded text-xs font-bold transition-all relative`}
        >
          {displayText}
          {hasBet && !result && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded">
              ${manualBets[key]}
            </span>
          )}
        </button>
      )
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-1">
      {bettableGroups.map((group, idx) => (
        <div key={`${group.type}-${group.id}-${idx}`}>
          {renderGroupBettingCard(group, idx)}
        </div>
      ))}
    </div>
  )
}
