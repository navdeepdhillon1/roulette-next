import React, { useState } from 'react'
import type { Spin } from '@/lib/types'
import type { BetKey, SelectedGroup, BettingSystemConfig } from '@/types/bettingAssistant'
import { WHEEL_ORDER, WHEEL_GROUPS } from '@/lib/roulette-logic'
import TableLayoutModal from './TableLayoutModal'

interface HistoricalBetData {
  bets: Record<BetKey, number>
  results: Record<BetKey, { won: boolean, amount: number }>
}

interface HistoryTableProps {
  spins: Spin[]
  baseUnit?: number
  bettingSystem?: BettingSystemConfig  // Betting system from session config
  onBetPlaced?: (
    totalWagered: number,
    totalReturned: number,
    pnl: number,
    bettingMatrix?: Record<string, number>,
    groupResults?: Record<string, number>,
    spinNumber?: number,
    spinTimestamp?: number
  ) => void
  onNumberAdded?: (number: number) => void
  sessionStats?: {
    currentBankroll: number
    totalWagered: number
    totalReturned: number
    roi: number
  }
  historicalBets?: Record<string, HistoricalBetData>
  onHistoricalBetsUpdate?: (newBets: Record<string, HistoricalBetData>) => void
  dealers?: Array<{ id: string; name: string; nickname?: string }>
  selectedCustomGroups?: SelectedGroup[]  // Custom groups from session config
}

// Mapping of betting groups to their display info and BetKey
interface BetOption {
  label: string
  betKey: BetKey
  color: string
}

const BET_OPTIONS: Record<string, BetOption[]> = {
  color: [
    { label: 'R', betKey: 'red', color: 'bg-red-600 hover:bg-red-700' },
    { label: 'B', betKey: 'black', color: 'bg-gray-900 hover:bg-gray-800 border border-gray-600' }
  ],
  evenOdd: [
    { label: 'E', betKey: 'even', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'O', betKey: 'odd', color: 'bg-cyan-600 hover:bg-cyan-700' }
  ],
  lowHigh: [
    { label: 'L', betKey: 'low', color: 'bg-amber-700 hover:bg-amber-800' },
    { label: 'H', betKey: 'high', color: 'bg-gray-600 hover:bg-gray-700' }
  ],
  column: [
    { label: '1st', betKey: 'col1', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: '2nd', betKey: 'col2', color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '3rd', betKey: 'col3', color: 'bg-lime-600 hover:bg-lime-700' }
  ],
  dozen: [
    { label: '1st', betKey: 'dozen1', color: 'bg-red-700 hover:bg-red-800' },
    { label: '2nd', betKey: 'dozen2', color: 'bg-cyan-700 hover:bg-cyan-800' },
    { label: '3rd', betKey: 'dozen3', color: 'bg-green-700 hover:bg-green-800' }
  ],
  alt1: [
    { label: 'A', betKey: 'alt1_1', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'B', betKey: 'alt1_2', color: 'bg-pink-600 hover:bg-pink-700' }
  ],
  alt2: [
    { label: 'AA', betKey: 'alt2_1', color: 'bg-lime-700 hover:bg-lime-800' },
    { label: 'BB', betKey: 'alt2_2', color: 'bg-purple-700 hover:bg-purple-800' }
  ],
  alt3: [
    { label: 'AAA', betKey: 'alt3_1', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'BBB', betKey: 'alt3_2', color: 'bg-yellow-700 hover:bg-yellow-800' }
  ],
  edgeCenter: [
    { label: 'E', betKey: 'edge', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'C', betKey: 'center', color: 'bg-orange-600 hover:bg-orange-700' }
  ],
  six: [
    { label: '1st', betKey: 'six1', color: 'bg-red-700 hover:bg-red-800' },
    { label: '2nd', betKey: 'six2', color: 'bg-blue-700 hover:bg-blue-800' },
    { label: '3rd', betKey: 'six3', color: 'bg-green-700 hover:bg-green-800' },
    { label: '4th', betKey: 'six4', color: 'bg-green-700 hover:bg-green-800' },
    { label: '5th', betKey: 'six5', color: 'bg-blue-700 hover:bg-blue-800' },
    { label: '6th', betKey: 'six6', color: 'bg-red-700 hover:bg-red-800' }
  ],
  // Wheel groups
  specials1: [
    { label: 'Vois', betKey: 'voisins', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Orph', betKey: 'orphelins', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { label: 'Tier', betKey: 'tiers', color: 'bg-green-600 hover:bg-green-700' }
  ],
  specials2: [
    { label: 'Vois', betKey: 'voisins', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'N-Vois', betKey: 'non_voisin', color: 'bg-pink-600 hover:bg-pink-700' }
  ],
  wheelAB: [
    { label: 'A', betKey: 'a', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'B', betKey: 'b', color: 'bg-pink-600 hover:bg-pink-700' }
  ],
  wheelAABB: [
    { label: 'AA', betKey: 'aa', color: 'bg-lime-700 hover:bg-lime-800' },
    { label: 'BB', betKey: 'bb', color: 'bg-purple-700 hover:bg-purple-800' }
  ],
  wheelAAABBB: [
    { label: 'AAA', betKey: 'aaa', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'BBB', betKey: 'bbb', color: 'bg-yellow-700 hover:bg-yellow-800' }
  ],
  wheelA6B6: [
    { label: 'A6', betKey: 'a6', color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'B6', betKey: 'b6', color: 'bg-purple-600 hover:bg-purple-700' }
  ],
  wheelA9B9: [
    { label: 'A9', betKey: 'a9', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { label: 'B9', betKey: 'b9', color: 'bg-orange-600 hover:bg-orange-700' }
  ],
  wheelHalves: [
    { label: 'Right', betKey: 'right_18', color: 'bg-teal-600 hover:bg-teal-700' },
    { label: 'Left', betKey: 'left_18', color: 'bg-purple-600 hover:bg-purple-700' }
  ],
  wheelQuarters: [
    { label: '1st', betKey: 'nine_1st', color: 'bg-red-700 hover:bg-red-800' },
    { label: '2nd', betKey: 'nine_2nd', color: 'bg-cyan-700 hover:bg-cyan-800' },
    { label: '3rd', betKey: 'nine_3rd', color: 'bg-green-700 hover:bg-green-800' },
    { label: '4th', betKey: 'nine_4th', color: 'bg-purple-700 hover:bg-purple-800' }
  ]
}

export default function HistoryTable({
  spins,
  baseUnit = 10,
  bettingSystem,
  selectedCustomGroups = [],
  onBetPlaced,
  onNumberAdded,
  sessionStats,
  historicalBets = {},
  onHistoricalBetsUpdate,
  dealers = []
}: HistoryTableProps) {
  const [bets, setBets] = useState<Record<BetKey, number>>({} as Record<BetKey, number>)
  const [results, setResults] = useState<Record<BetKey, { won: boolean, amount: number }>>({})
  const [showResults, setShowResults] = useState(false)
  const [modalOpen, setModalOpen] = useState<'dozen' | 'column' | 'color' | 'evenOdd' | 'lowHigh' | 'alt1' | 'alt2' | 'alt3' | 'edgeCenter' | 'six' | null>(null)
  const [betMode, setBetMode] = useState<'table' | 'wheel' | 'custom'>('table')

  console.log('🎮 Current betMode:', betMode)

  // Group-level betting progression - using ref for synchronous updates
  const groupProgressionsRef = React.useRef<Record<string, { position: number; consecutiveWins: number; consecutiveLosses?: number; lastOutcome: 'win' | 'loss' | null }>>({
    // Table groups
    'red-black': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'even-odd': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'low-high': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'dozens': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'columns': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'six-groups': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'alt1': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'alt2': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'alt3': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'edge-center': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    // Wheel special groups
    'voisins': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'orphelins': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'tiers': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'jeu-zero': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'non-voisin': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    // Wheel quarters
    'wheel-quarters': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    // Wheel halves
    'wheel-halves': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    // Wheel alternating groups
    'wheel-ab': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'wheel-aabb': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'wheel-aaabbb': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'wheel-a6b6': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
    'wheel-a9b9': { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null },
  })

  // Helper: Get betting group category for progression tracking
  const getGroupCategory = (betKey: BetKey): string => {
    // Custom groups - each gets its own independent progression
    if (betKey.startsWith('custom-')) return betKey

    // Table groups
    if (['red', 'black'].includes(betKey)) return 'red-black'
    if (['even', 'odd'].includes(betKey)) return 'even-odd'
    if (['low', 'high'].includes(betKey)) return 'low-high'
    if (['dozen1', 'dozen2', 'dozen3'].includes(betKey)) return 'dozens'
    if (['col1', 'col2', 'col3'].includes(betKey)) return 'columns'
    if (['six1', 'six2', 'six3', 'six4', 'six5', 'six6'].includes(betKey)) return 'six-groups'
    if (['alt1_1', 'alt1_2'].includes(betKey)) return 'alt1'
    if (['alt2_1', 'alt2_2'].includes(betKey)) return 'alt2'
    if (['alt3_1', 'alt3_2'].includes(betKey)) return 'alt3'
    if (['edge', 'center'].includes(betKey)) return 'edge-center'

    // Wheel special groups (each has independent tracking)
    if (['voisins', 'voisin'].includes(betKey)) return 'voisins'
    if (betKey === 'orphelins') return 'orphelins'
    if (betKey === 'tiers') return 'tiers'
    if (betKey === 'jeu_zero') return 'jeu-zero'
    if (betKey === 'non_voisin') return 'non-voisin'

    // Wheel quarters (grouped together)
    if (['nine_1st', 'nine_2nd', 'nine_3rd', 'nine_4th'].includes(betKey)) return 'wheel-quarters'

    // Wheel halves (grouped together)
    if (['right_18', 'left_18'].includes(betKey)) return 'wheel-halves'

    // Wheel alternating groups (each pair grouped together)
    if (['a', 'b'].includes(betKey)) return 'wheel-ab'
    if (['aa', 'bb'].includes(betKey)) return 'wheel-aabb'
    if (['aaa', 'bbb'].includes(betKey)) return 'wheel-aaabbb'
    if (['a6', 'b6'].includes(betKey)) return 'wheel-a6b6'
    if (['a9', 'b9'].includes(betKey)) return 'wheel-a9b9'

    return 'uncategorized'
  }

  // Helper: Get betting sequence based on system
  const getBettingSequence = (): number[] => {
    if (!bettingSystem) {
      // Default to Martingale if no system specified
      return [1, 2, 4, 8, 16, 32, 64, 128]
    }

    const systemId = bettingSystem.id

    switch (systemId) {
      case 'flat':
        // Flat betting - no progression
        return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

      case 'martingale':
        // Double after every loss
        return [1, 2, 4, 8, 16, 32, 64, 128]

      case 'fibonacci':
        // Fibonacci sequence
        return [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]

      case 'dalembert':
        // Increase by 1 unit after loss
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

      case 'reverse-dalembert':
        // Increase by 1 unit after win (but same sequence)
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

      case 'paroli':
        // Double after wins (max 3 consecutive wins)
        return [1, 2, 4, 1, 2, 4, 1, 2, 4]

      case 'custom':
        // Outcome-based custom system - use Martingale sequence
        // The custom rules will control progression behavior
        if (bettingSystem.customRules?.maxMultiplier) {
          const max = bettingSystem.customRules.maxMultiplier
          const sequence = [1]
          let current = 1
          while (current < max) {
            current *= 2
            sequence.push(Math.min(current, max))
          }
          return sequence
        }
        return [1, 2, 4, 8, 16, 32, 64, 128]

      case 'custom-sequential':
        // Sequential progression system - use custom sequence
        if (bettingSystem.sequentialRules?.sequence) {
          return bettingSystem.sequentialRules.sequence
        }
        console.warn('Sequential system missing sequence, defaulting to Martingale')
        return [1, 2, 4, 8, 16, 32, 64, 128]

      default:
        // For unknown systems, use Martingale as default
        console.warn(`Unknown betting system: ${systemId}, defaulting to Martingale`)
        return [1, 2, 4, 8, 16, 32, 64, 128]
    }
  }

  // Helper: Get chip value for a specific bet based on group progression
  const getChipValue = (betKey: BetKey): number => {
    const category = getGroupCategory(betKey)
    const tracker = groupProgressionsRef.current[category]

    if (!tracker) {
      console.warn(`⚠️ No tracker found for betKey: ${betKey}, category: ${category}`)
      return baseUnit
    }

    const sequence = getBettingSequence()
    const multiplier = sequence[tracker.position] || 1
    const chipValue = baseUnit * multiplier

    // Log for wheel groups only
    if (betKey === 'aaa' || betKey === 'bbb' || betKey === 'a6' || betKey === 'non_voisin') {
      console.log(`💰 getChipValue(${betKey}): category=${category}, position=${tracker.position}, chipValue=$${chipValue}`)
    }

    return chipValue
  }

  const handleBetClick = (betKey: BetKey, isDoubleClick: boolean) => {
    console.log(`🎯 handleBetClick called: betKey=${betKey}, isDoubleClick=${isDoubleClick}, showResults=${showResults}`)

    if (showResults) {
      console.log('⛔ Betting blocked - results are showing')
      return // Prevent betting when results are showing
    }

    const chipValue = getChipValue(betKey)
    console.log(`💵 Adding bet: ${betKey} with chipValue=$${chipValue}`)

    setBets(prev => {
      const currentBet = prev[betKey] || 0
      const newBet = isDoubleClick ? currentBet * 2 : currentBet + chipValue
      console.log(`📝 Bet updated: ${betKey} from $${currentBet} to $${newBet}`)
      return { ...prev, [betKey]: newBet }
    })
  }

  // Calculate payouts for each bet type
  const calculatePayouts = (num: number): Record<BetKey, { won: boolean, amount: number }> => {
    const payoutRates: Record<BetKey, number> = {
      red: 2, black: 2, even: 2, odd: 2, low: 2, high: 2,
      dozen1: 3, dozen2: 3, dozen3: 3,
      col1: 3, col2: 3, col3: 3,
      alt1_1: 2, alt1_2: 2,
      alt2_1: 2, alt2_2: 2,
      alt3_1: 2, alt3_2: 2,
      edge: 2, center: 2,
      six1: 6, six2: 6, six3: 6, six4: 6, six5: 6, six6: 6,
      // Wheel groups
      voisins: 2.1, orphelins: 4.6, tiers: 3, jeu_zero: 5.3, voisin: 2.1, non_voisin: 1.85,
      nine_1st: 4, nine_2nd: 4, nine_3rd: 4, nine_4th: 4,
      right_18: 2, left_18: 2,
      a: 2, b: 2, aa: 2, bb: 2, aaa: 2, bbb: 2,
      a6: 2, b6: 2, a9: 2, b9: 2
    }

    // Check which groups the number belongs to
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
    const isRed = redNumbers.includes(num)
    const isBlack = num !== 0 && !isRed
    const isEven = num !== 0 && num % 2 === 0
    const isOdd = num !== 0 && num % 2 === 1
    const isLow = num >= 1 && num <= 18
    const isHigh = num >= 19 && num <= 36

    const col = num === 0 ? 0 : (num % 3 === 0 ? 3 : num % 3)
    const dozen = num === 0 ? 0 : Math.ceil(num / 12)

    const alt1 = [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num)
    const alt2 = [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num)
    const alt3 = [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num)
    const edge = [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num)
    const sixGroup = num === 0 ? 0 : Math.ceil(num / 6)

    const wins: Record<BetKey, { won: boolean, amount: number }> = {} as Record<BetKey, { won: boolean, amount: number }>

    Object.entries(bets).forEach(([key, betAmount]) => {
      const betKey = key as BetKey
      let won = false

      switch (betKey) {
        case 'red': won = isRed; break
        case 'black': won = isBlack; break
        case 'even': won = isEven; break
        case 'odd': won = isOdd; break
        case 'low': won = isLow; break
        case 'high': won = isHigh; break
        case 'col1': won = col === 1; break
        case 'col2': won = col === 2; break
        case 'col3': won = col === 3; break
        case 'dozen1': won = dozen === 1; break
        case 'dozen2': won = dozen === 2; break
        case 'dozen3': won = dozen === 3; break
        case 'alt1_1': won = alt1; break
        case 'alt1_2': won = !alt1 && num !== 0; break
        case 'alt2_1': won = alt2; break
        case 'alt2_2': won = !alt2 && num !== 0; break
        case 'alt3_1': won = alt3; break
        case 'alt3_2': won = !alt3 && num !== 0; break
        case 'edge': won = edge; break
        case 'center': won = !edge && num !== 0; break
        case 'six1': won = sixGroup === 1; break
        case 'six2': won = sixGroup === 2; break
        case 'six3': won = sixGroup === 3; break
        case 'six4': won = sixGroup === 4; break
        case 'six5': won = sixGroup === 5; break
        case 'six6': won = sixGroup === 6; break
        // Wheel groups - Using centralized WHEEL_GROUPS from lib/roulette-logic.ts
        case 'voisins':
        case 'voisin':
          won = WHEEL_GROUPS.voisins.includes(num); break
        case 'orphelins':
          won = WHEEL_GROUPS.orphelins.includes(num); break
        case 'tiers':
          won = WHEEL_GROUPS.tiers.includes(num); break
        case 'jeu_zero':
          won = WHEEL_GROUPS.jeu_zero.includes(num); break
        case 'non_voisin':
          won = WHEEL_GROUPS.non_voisin.includes(num); break
        case 'nine_1st':
          won = WHEEL_GROUPS.first_9.includes(num); break
        case 'nine_2nd':
          won = WHEEL_GROUPS.second_9.includes(num); break
        case 'nine_3rd':
          won = WHEEL_GROUPS.third_9.includes(num); break
        case 'nine_4th':
          won = WHEEL_GROUPS.fourth_9.includes(num); break
        case 'right_18':
          won = WHEEL_GROUPS.right.includes(num); break
        case 'left_18':
          won = WHEEL_GROUPS.left.includes(num); break
        case 'a':
          won = WHEEL_GROUPS.a.includes(num); break
        case 'b':
          won = WHEEL_GROUPS.b.includes(num); break
        case 'aa':
          won = WHEEL_GROUPS.aa.includes(num); break
        case 'bb':
          won = WHEEL_GROUPS.bb.includes(num); break
        case 'aaa':
          won = WHEEL_GROUPS.aaa.includes(num); break
        case 'bbb':
          won = WHEEL_GROUPS.bbb.includes(num); break
        case 'a6':
          won = WHEEL_GROUPS.a6.includes(num); break
        case 'b6':
          won = WHEEL_GROUPS.b6.includes(num); break
        case 'a9':
          won = WHEEL_GROUPS.a9.includes(num); break
        case 'b9':
          won = WHEEL_GROUPS.b9.includes(num); break
        default:
          // Check if this is a custom group bet
          if (betKey.startsWith('custom-')) {
            const customGroup = selectedCustomGroups.find(g => g.id === betKey)
            if (customGroup && customGroup.customGroup) {
              won = customGroup.customGroup.numbers.includes(num)
              // Calculate payout rate based on coverage (36 numbers total)
              // Formula: 36 / numbers_in_group (e.g., 18 numbers = 2x, 12 numbers = 3x)
              const coverage = customGroup.customGroup.numbers.length
              payoutRates[betKey] = Math.max(1, Number((36 / coverage).toFixed(2)))
            }
          }
          break
      }

      const amount = won ? betAmount * payoutRates[betKey] - betAmount : -betAmount
      wins[betKey] = { won, amount }
    })

    return wins
  }

  // Track the last processed spin count to avoid duplicate processing
  const [lastProcessedCount, setLastProcessedCount] = React.useState<number>(0)

  // Use a ref to track processed spin keys to prevent double-processing
  const processedSpinsRef = React.useRef<Set<string>>(new Set())

  // Use a ref to track if we're currently processing to prevent concurrent execution
  const isProcessingRef = React.useRef<boolean>(false)

  // Use a ref to track current bets without triggering re-renders
  const betsRef = React.useRef(bets)
  React.useEffect(() => {
    betsRef.current = bets
  }, [bets])

  // When a new spin is added, calculate results
  // IMPORTANT: Only depends on spins.length, NOT on bets
  React.useEffect(() => {
    if (spins.length > 0 && spins.length > lastProcessedCount) {
      const latestSpin = spins[0]
      // Use spin ID as key (more stable than timestamp)
      const spinKey = latestSpin.id || latestSpin.spin_number?.toString() || new Date(latestSpin.created_at).getTime().toString()

      // Get current bets from ref
      const currentBets = betsRef.current

      console.log('🔍 Effect triggered:', { spinKey, hasBets: Object.keys(currentBets).length > 0, alreadyProcessed: processedSpinsRef.current.has(spinKey), isProcessing: isProcessingRef.current })

      // Only process if we have bets AND this spin hasn't been processed yet AND we're not already processing
      if (Object.keys(currentBets).length > 0 && !processedSpinsRef.current.has(spinKey) && !isProcessingRef.current) {
        console.log('✅ Processing bets for spin:', { spinKey, number: latestSpin.number, bets: currentBets })

        // Set processing flag immediately to prevent concurrent execution
        isProcessingRef.current = true

        // Mark this spin as processed immediately AND update count to prevent double-processing
        processedSpinsRef.current.add(spinKey)
        setLastProcessedCount(spins.length) // Move this EARLIER to prevent race condition
        console.log('🔒 Marked spin as processed:', spinKey)

        const calcResults = calculatePayouts(latestSpin.number)
        setResults(calcResults)
        setShowResults(true)

        console.log('✅ Bet results calculated:', { spinKey, results: calcResults })

        // Update group progressions based on results (synchronous ref update)
        console.log('🔄 Updating progressions for spin:', spinKey)
        console.log('📋 Current bets:', currentBets)
        const processedCategories = new Set<string>()

        Object.entries(currentBets).forEach(([key, amount]) => {
          if (amount > 0) {
            const betKey = key as BetKey
            const category = getGroupCategory(betKey)
            console.log(`🔍 Processing bet: ${betKey} → category: ${category}`)

            // Only update each category once per spin
            if (processedCategories.has(category)) {
              console.log(`⏭️  Skipping ${betKey} - category ${category} already processed`)
              return
            }
            processedCategories.add(category)

            const won = calcResults[betKey]?.won || false

            if (!groupProgressionsRef.current[category]) {
              groupProgressionsRef.current[category] = { position: 0, consecutiveWins: 0, consecutiveLosses: 0, lastOutcome: null }
            }

            const tracker = groupProgressionsRef.current[category]
            const sequence = getBettingSequence()
            const oldPosition = tracker.position
            const oldValue = baseUnit * sequence[oldPosition]
            const systemId = bettingSystem?.id || 'martingale'

            // Update progression based on betting system
            if (won) {
              tracker.consecutiveWins++
              tracker.consecutiveLosses = 0  // Reset consecutive losses on win
              tracker.lastOutcome = 'win'

              switch (systemId) {
                case 'flat':
                  // No progression - always stay at position 0
                  tracker.position = 0
                  break

                case 'martingale':
                  // Reset to base bet after win
                  tracker.position = 0
                  tracker.consecutiveWins = 0
                  break

                case 'fibonacci':
                  // Step back 2 positions on win (but not below 0)
                  tracker.position = Math.max(tracker.position - 2, 0)
                  break

                case 'dalembert':
                  // Decrease by 1 on win (but not below 0)
                  tracker.position = Math.max(tracker.position - 1, 0)
                  break

                case 'reverse-dalembert':
                  // INCREASE by 1 on win (opposite of D'Alembert)
                  tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
                  break

                case 'paroli':
                  // Progress on win, but reset after 3 consecutive wins
                  if (tracker.consecutiveWins >= 3) {
                    tracker.position = 0
                    tracker.consecutiveWins = 0
                  } else {
                    tracker.position = Math.min(tracker.position + 1, Math.min(2, sequence.length - 1))
                  }
                  break

                case 'custom':
                  // Outcome-based custom system
                  if (bettingSystem?.customRules) {
                    const rules = bettingSystem.customRules
                    if (rules.resetAfterWin || rules.onWin === 'reset') {
                      tracker.position = 0
                      tracker.consecutiveWins = 0
                    } else if (rules.onWin === 'double') {
                      tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
                    }
                    // 'same' = do nothing
                  }
                  break

                case 'custom-sequential':
                  // Sequential progression system
                  if (bettingSystem?.sequentialRules) {
                    const seqRules = bettingSystem.sequentialRules
                    switch (seqRules.onWin) {
                      case 'reset':
                        tracker.position = 0
                        tracker.consecutiveWins = 0
                        break
                      case 'moveBack1':
                        tracker.position = Math.max(tracker.position - 1, 0)
                        break
                      case 'moveBack2':
                        tracker.position = Math.max(tracker.position - 2, 0)
                        break
                      case 'stay':
                        // Keep current position
                        break
                    }
                    // Check for reset after consecutive wins
                    if (seqRules.resetAfterConsecutiveWins && tracker.consecutiveWins >= seqRules.resetAfterConsecutiveWins) {
                      tracker.position = 0
                      tracker.consecutiveWins = 0
                    }
                  }
                  break

                default:
                  // Default to Martingale behavior
                  tracker.position = 0
                  tracker.consecutiveWins = 0
                  break
              }
            } else {
              // Loss
              tracker.consecutiveWins = 0
              tracker.lastOutcome = 'loss'

              switch (systemId) {
                case 'flat':
                  // No progression - always stay at position 0
                  tracker.position = 0
                  break

                case 'martingale':
                case 'fibonacci':
                case 'dalembert':
                  // Progress forward on loss
                  tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
                  break

                case 'reverse-dalembert':
                  // DECREASE by 1 on loss (opposite of D'Alembert)
                  tracker.position = Math.max(tracker.position - 1, 0)
                  break

                case 'paroli':
                  // Reset on loss (Paroli only progresses on wins)
                  tracker.position = 0
                  break

                case 'custom':
                  // Outcome-based custom system - handle consecutive losses
                  if (bettingSystem?.customRules) {
                    const rules = bettingSystem.customRules
                    const consecutiveLosses = tracker.lastOutcome === 'loss' ?
                      (tracker.consecutiveLosses || 0) + 1 : 1
                    tracker.consecutiveLosses = consecutiveLosses

                    // Determine which rule to apply based on consecutive losses
                    let action = rules.onThirdLoss  // Default to 3rd loss rule for 3+ losses
                    if (consecutiveLosses === 1) action = rules.onFirstLoss
                    else if (consecutiveLosses === 2) action = rules.onSecondLoss

                    if (action === 'reset') {
                      tracker.position = 0
                    } else if (action === 'double') {
                      tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
                    } else if (action === 'pause') {
                      // Keep position same, betting will be paused
                      console.log('🛑 Custom system: PAUSE triggered')
                    }
                    // 'same' = do nothing
                  }
                  break

                case 'custom-sequential':
                  // Sequential progression system
                  if (bettingSystem?.sequentialRules) {
                    const seqRules = bettingSystem.sequentialRules
                    switch (seqRules.onLoss) {
                      case 'moveForward1':
                        tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
                        break
                      case 'moveForward2':
                        tracker.position = Math.min(tracker.position + 2, sequence.length - 1)
                        break
                      case 'stay':
                        // Keep current position
                        break
                    }
                  }
                  break

                default:
                  // Default to Martingale behavior
                  tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
                  break
              }
            }

            const newValue = baseUnit * sequence[tracker.position]
            console.log(`📊 ${betKey} (${category}): ${won ? 'WIN' : 'LOSS'} | System: ${systemId} | Position ${oldPosition}→${tracker.position} | Value $${oldValue}→$${newValue}`)
          }
        })

        console.log('✅ Final progressions:', groupProgressionsRef.current)

        // Update historical bets through callback
        if (onHistoricalBetsUpdate) {
          const updatedBets = {
            ...historicalBets,
            [spinKey]: { bets: { ...currentBets }, results: calcResults }
          }
          console.log('✅ Updating historicalBets:', { spinKey, totalKeys: Object.keys(updatedBets).length })
          onHistoricalBetsUpdate(updatedBets)
        }

        // Calculate totals for callback
        const totalWagered = Object.values(currentBets).reduce((sum, bet) => sum + bet, 0)
        const totalPnL = Object.values(calcResults).reduce((sum, result) => sum + result.amount, 0)
        const totalReturned = totalWagered + totalPnL

        // Convert results to simple Record<string, number> format
        const groupResults: Record<string, number> = {}
        Object.entries(calcResults).forEach(([key, result]) => {
          groupResults[key] = result.amount
        })

        // Get the timestamp from the spin for parent to use
        const spinTimestamp = new Date(latestSpin.created_at).getTime()

        // Notify parent component with betting matrix and results
        if (onBetPlaced) {
          onBetPlaced(totalWagered, totalReturned, totalPnL, currentBets, groupResults, latestSpin.number, spinTimestamp)
        }

        // Reset processing flag immediately after progression update is complete
        isProcessingRef.current = false
        console.log('🔓 Processing complete for spin:', spinKey)

        // Auto-clear betting row after 1.5 seconds
        setTimeout(() => {
          setShowResults(false)
          setBets({})
          setResults({})
        }, 1500)
      }
    }
  }, [spins.length, lastProcessedCount, onBetPlaced, onHistoricalBetsUpdate])

  const clearBets = () => {
    setBets({})
    setResults({})
    setShowResults(false)
  }

  // Helper to map SelectedGroup to BetOptions for rendering
  const getGroupBetOptions = (group: SelectedGroup): BetOption[] => {
    // For custom groups created by the player
    if (group.type === 'custom' && group.customGroup) {
      return [{
        label: group.name,
        betKey: group.id as BetKey,
        color: 'bg-yellow-600 hover:bg-yellow-700'
      }]
    }

    // Map standard group IDs to their bet options
    switch (group.id) {
      // Table Groups
      case 'color': return BET_OPTIONS.color
      case 'even-odd': return BET_OPTIONS.evenOdd
      case 'low-high': return BET_OPTIONS.lowHigh
      case 'column': return BET_OPTIONS.column
      case 'dozen': return BET_OPTIONS.dozen
      case 'alt1': return BET_OPTIONS.alt1
      case 'alt2': return BET_OPTIONS.alt2
      case 'alt3': return BET_OPTIONS.alt3
      case 'ec': return BET_OPTIONS.edgeCenter
      case 'six': return BET_OPTIONS.six

      // Wheel Groups
      case 'vois-orph-tier': return BET_OPTIONS.specials1
      case 'voisins-nonvoisins': return BET_OPTIONS.specials2
      case 'wheel-quarters': return BET_OPTIONS.wheelQuarters
      case 'ab-split': return BET_OPTIONS.wheelAB
      case 'aabb-split': return BET_OPTIONS.wheelAABB
      case 'aaabbb-split': return BET_OPTIONS.wheelAAABBB
      case 'a6b6-split': return BET_OPTIONS.wheelA6B6
      case 'a9b9-split': return BET_OPTIONS.wheelA9B9
      case 'right-left': return BET_OPTIONS.wheelHalves

      default: return []
    }
  }

  // Helper to render a bet button with result display
  const renderBetButton = (option: BetOption, additionalClasses: string = 'flex-1') => {
    const hasBet = !!bets[option.betKey]
    const result = results[option.betKey]
    const showResult = showResults && result
    const chipValue = getChipValue(option.betKey)

    console.log(`🔧 renderBetButton called for: ${option.betKey}, chipValue=$${chipValue}`)

    return (
      <button
        key={option.betKey}
        onClick={(e) => {
          console.log(`👆 Button clicked: ${option.betKey}`)
          handleBetClick(option.betKey, e.detail === 2)
        }}
        className={`relative ${additionalClasses} px-1 py-1 rounded text-xs font-bold text-white transition-all ${
          showResult
            ? result.won
              ? 'bg-green-600 animate-pulse'
              : 'bg-red-900'
            : hasBet
              ? option.color
              : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span>{showResult ? (result.won ? `+$${result.amount}` : `-$${Math.abs(result.amount)}`) : option.label}</span>
          {!showResult && <span className="text-[9px] opacity-70">[${chipValue}]</span>}
        </div>
        {hasBet && !showResult && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
            ${bets[option.betKey]}
          </span>
        )}
      </button>
    )
  }

  if (spins.length === 0) {
    return <p className="text-gray-400 text-center py-8">Click a number to get started</p>
  }

  return (
    <>
      <TableLayoutModal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        groupType={modalOpen}
      />
      {/* Mode Selector */}
      <div className="mb-2 flex items-center gap-2 px-2">
        <span className="text-xs text-gray-400 font-semibold">Bet Type:</span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              console.log('🔄 Switching to TABLE mode')
              setBetMode('table')
            }}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              betMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Table Groups
          </button>
          <button
            onClick={() => {
              console.log('🔄 Switching to WHEEL mode')
              setBetMode('wheel')
            }}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              betMode === 'wheel'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Wheel Groups
          </button>
          <button
            onClick={() => {
              console.log('🔄 Switching to CUSTOM mode')
              setBetMode('custom')
            }}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              betMode === 'custom'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Custom Groups
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300 w-14">Number</th>
              {betMode === 'table' ? (
                // Table Groups Headers
                <>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors w-14"
                onClick={() => setModalOpen('color')}
                title="Click to view color layout"
              >
                Color 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors w-16"
                onClick={() => setModalOpen('evenOdd')}
                title="Click to view even/odd layout"
              >
                Even/Odd 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors w-16"
                onClick={() => setModalOpen('lowHigh')}
                title="Click to view low/high layout"
              >
                Low/High 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('column')}
                title="Click to view column layout"
              >
                Column 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('dozen')}
                title="Click to view dozen layout"
              >
                Dozen 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('alt1')}
                title="Click to view Alt1 layout"
              >
                Alt1 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('alt2')}
                title="Click to view Alt2 layout"
              >
                Alt2 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('alt3')}
                title="Click to view Alt3 layout"
              >
                Alt3 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('edgeCenter')}
                title="Click to view edge/center layout"
              >
                E/C 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setModalOpen('six')}
                title="Click to view six groups layout"
              >
                Six 🔍
              </th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300 w-14">Wheel Pos</th>
                </>
              ) : betMode === 'wheel' ? (
                // Wheel Groups Headers
                <>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Specials 1</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Specials 2</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">A/B</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">AA/BB</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">AAA/BBB</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Alt 6</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Alt 9</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Right/Left</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Quarters</th>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300 w-14">Wheel Pos</th>
                </>
              ) : (
                // Custom Groups Headers
                <th colSpan={10} className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Custom Groups</th>
              )}
            </tr>
          </thead>
        <tbody>
          {/* BETTING ROW */}
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
                    Total: ${Object.values(bets).reduce((sum, bet) => sum + bet, 0)}
                  </div>
                )}
              </div>
            </td>
            {(() => {
              console.log(`🎯 Rendering betting buttons for mode: ${betMode}`)
              return betMode === 'table' ? (
              // Table Groups Betting Buttons
              <>
            {/* Color */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.color.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Even/Odd */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.evenOdd.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Low/High */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.lowHigh.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Column */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.column.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Dozen */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.dozen.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Alt1 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.alt1.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Alt2 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.alt2.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Alt3 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.alt3.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Edge/Center */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.edgeCenter.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Six */}
            <td className="px-1 py-1">
              <div className="grid grid-cols-2 gap-0.5">
                {BET_OPTIONS.six.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
              </>
            ) : betMode === 'wheel' ? (
              // Wheel Groups Betting Buttons
              <>
            {/* Specials 1 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.specials1.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Specials 2 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.specials2.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* A/B */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.wheelAB.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* AA/BB */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.wheelAABB.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* AAA/BBB */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.wheelAAABBB.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* A6/B6 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.wheelA6B6.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* A9/B9 */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.wheelA9B9.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Right/Left */}
            <td className="px-1 py-1">
              <div className="flex flex-col gap-0.5">
                {BET_OPTIONS.wheelHalves.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
            {/* Quarters */}
            <td className="px-1 py-1">
              <div className="grid grid-cols-2 gap-0.5">
                {BET_OPTIONS.wheelQuarters.map((option) => renderBetButton(option, 'w-full'))}
              </div>
            </td>
              </>
            ) : (
              // Custom Groups - Show message or betting buttons
              <>
                {selectedCustomGroups && selectedCustomGroups.length > 0 ? (
                  // Show custom group bet buttons with proper splits
                  selectedCustomGroups.slice(0, 10).map((group) => {
                    const betOptions = getGroupBetOptions(group)
                    const isSixGroup = group.id === 'six'
                    const isWheelQuarters = group.id === 'wheel-quarters'

                    return (
                      <td key={group.id} className="px-1 py-1">
                        <div className={isSixGroup || isWheelQuarters ? 'grid grid-cols-2 gap-0.5' : 'flex flex-col gap-0.5'}>
                          {betOptions.map((option) => renderBetButton(option, 'w-full'))}
                        </div>
                      </td>
                    )
                  })
                ) : (
                  // Show onboarding message with Elite tier requirement
                  <td colSpan={10} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-4 mx-auto max-w-xl text-center">
                      <div className="text-yellow-400 text-lg font-semibold">
                        💡 Interested in custom groups?
                      </div>

                      {/* Bet Assistant Badge */}
                      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-400/50 rounded-lg px-4 py-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-2xl">👑</span>
                          <span className="text-purple-300 font-bold text-sm">BET ASSISTANT FEATURE</span>
                        </div>
                        <p className="text-purple-200 text-xs">
                          Custom Groups are available exclusively in Bet Assistant
                        </p>
                      </div>

                      <div className="text-gray-300 text-sm leading-relaxed">
                        Go to <span className="text-cyan-400 font-semibold">Session Config</span> in the settings above to create your own custom number groups and track them here with your chosen betting system!
                      </div>
                      <div className="text-gray-400 text-xs italic">
                        (Custom groups allow you to bet on any combination of numbers you choose)
                      </div>

                      {/* Sign Up CTA */}
                      <div className="mt-2 text-xs text-gray-400">
                        Want to use custom groups? <span className="text-purple-400 font-semibold">Sign up for Bet Assistant</span> to unlock this feature
                      </div>
                    </div>
                  </td>
                )}
              </>
            )
            })()}
            {/* Wheel Position */}
            <td className="px-1 py-1 text-center">
              <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs font-semibold">
                -
              </span>
            </td>
          </tr>
          {/* HISTORY ROWS - Hide when in custom mode with no groups */}
          {betMode !== 'custom' && spins.map((spin, index) => {
            // Check if this is a card start event
            if ((spin as any).isCardStart) {
              return (
                <tr key={index} className="border-t-2 border-cyan-500 bg-gradient-to-r from-cyan-900/30 via-cyan-800/10 to-cyan-900/30">
                  <td colSpan={12} className="px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-cyan-300 font-bold text-xs">
                        🎴 Card #{(spin as any).cardNumber} Started - Target: ${(spin as any).cardTarget}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            }

            // Check if this is a card end event
            if ((spin as any).isCardEnd) {
              const profit = (spin as any).cardProfit || 0
              const success = (spin as any).cardSuccess || false
              const target = (spin as any).cardTarget || 0
              const betsUsed = (spin as any).cardBetsUsed || 0
              const maxBets = (spin as any).cardMaxBets || 0

              return (
                <tr key={index} className={`border-t-2 ${success ? 'border-green-500 bg-gradient-to-r from-green-900/30 via-green-800/10 to-green-900/30' : 'border-red-500 bg-gradient-to-r from-red-900/30 via-red-800/10 to-red-900/30'}`}>
                  <td colSpan={12} className="px-2 py-1 text-center">
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
            }

            // Check if this is a dealer change event
            if ((spin as any).isDealerChange) {
              const dealerName = (spin as any).dealerName || `Dealer ${(spin as any).dealerNumber}`

              return (
                <tr key={index} className="border-t-2 border-yellow-500 bg-yellow-900/20">
                  <td colSpan={12} className="px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-yellow-400 font-bold text-xs">
                        🎰 Changed to dealer: <span className="text-yellow-300">{dealerName}</span>
                      </span>
                    </div>
                  </td>
                </tr>
              )
            }

            const num = spin.number
            const alt1 = num === 0 ? '-' : [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B'
            const alt2 = num === 0 ? '-' : [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB'
            const alt3 = num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB'
            const edgeCenter = num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) ? 'E' : 'C'
            const sixGroup = num === 0 ? '-' : num <= 6 ? '1st' : num <= 12 ? '2nd' : num <= 18 ? '3rd' : num <= 24 ? '4th' : num <= 30 ? '5th' : '6th'
            const wheelPosition = WHEEL_ORDER.indexOf(num)

            // Check if we have bet results for this spin - use spin ID as key
            const spinKey = spin.id || spin.spin_number?.toString() || new Date(spin.created_at).getTime().toString()
            const spinBetData = historicalBets[spinKey]

            if (index === 0) {
              console.log('🔍 Checking for bet data:', {
                spinKey,
                spinNumber: spin.number,
                hasData: !!spinBetData,
                allKeys: Object.keys(historicalBets)
              })
            }

            // Helper to render cell with optional P/L badge
            // For categories with multiple options, check ALL possible betKeys
            const renderCellWithBadge = (content: React.ReactNode, className: string, betKeys: BetKey | BetKey[]) => {
              const keysArray = Array.isArray(betKeys) ? betKeys : [betKeys]

              // Find the first betKey that has a result
              let betResult = null
              for (const key of keysArray) {
                if (spinBetData?.results[key]) {
                  betResult = spinBetData.results[key]
                  break
                }
              }

              // Debug: log if we have a result for this cell
              if (betResult && index === 0) {
                console.log('Rendering badge for betKeys:', betKeys, 'result:', betResult)
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
              <tr key={spin.id || index} className="border-b border-gray-700/50 hover:bg-gray-800/50">
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
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    spin.color === 'red' ? 'R' : spin.color === 'black' ? 'B' : 'G',
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      spin.color === 'red' ? 'bg-red-600/30 text-red-400' :
                      spin.color === 'black' ? 'bg-gray-600/30 text-gray-300' :
                      'bg-green-600/30 text-green-400'
                    }`,
                    ['red', 'black']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    spin.even_odd === 'even' ? 'E' : spin.even_odd === 'odd' ? 'O' : '-',
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      spin.even_odd === 'even' ? 'bg-purple-600/30 text-purple-400' :
                      spin.even_odd === 'odd' ? 'bg-cyan-600/30 text-cyan-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['even', 'odd']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    spin.low_high === 'low' ? 'L' : spin.low_high === 'high' ? 'H' : '-',
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      spin.low_high === 'low' ? 'bg-amber-700/30 text-amber-400' :
                      spin.low_high === 'high' ? 'bg-gray-600/30 text-gray-300' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['low', 'high']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    spin.column_num > 0 ? `${spin.column_num}st` : '-',
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      spin.column_num === 1 ? 'bg-orange-600/30 text-orange-400' :
                      spin.column_num === 2 ? 'bg-teal-600/30 text-teal-400' :
                      spin.column_num === 3 ? 'bg-lime-600/30 text-lime-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['col1', 'col2', 'col3']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    spin.dozen === 'first' ? '1st' : spin.dozen === 'second' ? '2nd' : spin.dozen === 'third' ? '3rd' : '-',
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      spin.dozen === 'first' ? 'bg-red-700/30 text-red-400' :
                      spin.dozen === 'second' ? 'bg-cyan-700/30 text-cyan-400' :
                      spin.dozen === 'third' ? 'bg-green-700/30 text-green-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['dozen1', 'dozen2', 'dozen3']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    alt1,
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      alt1 === 'A' ? 'bg-indigo-600/30 text-indigo-400' :
                      alt1 === 'B' ? 'bg-pink-600/30 text-pink-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['alt1_1', 'alt1_2']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    alt2,
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      alt2 === 'AA' ? 'bg-lime-700/30 text-lime-400' :
                      alt2 === 'BB' ? 'bg-purple-700/30 text-purple-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['alt2_1', 'alt2_2']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    alt3,
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      alt3 === 'AAA' ? 'bg-blue-600/30 text-blue-400' :
                      alt3 === 'BBB' ? 'bg-yellow-700/30 text-yellow-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['alt3_1', 'alt3_2']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    edgeCenter,
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      edgeCenter === 'E' ? 'bg-purple-600/30 text-purple-400' :
                      edgeCenter === 'C' ? 'bg-orange-600/30 text-orange-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['edge', 'center']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  {renderCellWithBadge(
                    sixGroup,
                    `px-1.5 py-0.5 rounded text-xs font-bold ${
                      sixGroup === '1st' || sixGroup === '6th' ? 'bg-red-700/30 text-red-400' :
                      sixGroup === '2nd' || sixGroup === '5th' ? 'bg-blue-700/30 text-blue-400' :
                      sixGroup === '3rd' || sixGroup === '4th' ? 'bg-green-700/30 text-green-400' :
                      'bg-gray-600/30 text-gray-400'
                    }`,
                    ['six1', 'six2', 'six3', 'six4', 'six5', 'six6']
                  )}
                </td>
                <td className="px-1 py-1 text-center">
                  <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs font-semibold">
                    {wheelPosition >= 0 ? wheelPosition : '-'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}
