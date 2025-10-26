'use client'
import React, { useState } from 'react'
import { RED_NUMBERS, WHEEL_GROUPS, WHEEL_ORDER } from '@/lib/roulette-logic'
import type { Spin } from '@/lib/types'
import WheelLayoutModal from './WheelLayoutModal'

// Helper to avoid TS literal-union includes() argument mismatch
const inGroup = (arr: readonly number[], n: number) => arr.includes(n)

interface HistoricalWheelBetData {
  bets: Record<WheelBetKey, number>
  results: Record<WheelBetKey, { won: boolean, amount: number }>
}

interface WheelHistoryTableProps {
  spins: Spin[]
  selectedNumber: number | null
  baseUnit?: number
  onBetPlaced?: (
    totalWagered: number,
    totalReturned: number,
    pnl: number,
    bettingMatrix?: Record<string, number>,
    groupResults?: Record<string, number>,
    spinNumber?: number,
    spinTimestamp?: number
  ) => void
  historicalBets?: Record<string, HistoricalWheelBetData>
  onHistoricalBetsUpdate?: (newBets: Record<string, HistoricalWheelBetData>) => void
}

// Wheel betting groups with their bet keys and number counts
type WheelBetKey =
  | 'voisins' | 'orphelins' | 'tiers' | 'jeu_zero' | 'non_voisin'
  | 'a' | 'b' | 'aa' | 'bb' | 'aaa' | 'bbb'
  | 'a6' | 'b6' | 'a9' | 'b9'
  | 'right' | 'left'
  | 'first_9' | 'second_9' | 'third_9' | 'fourth_9'

interface WheelBetOption {
  key: WheelBetKey
  label: string
  color: string
  numberCount: number
}

// Define all wheel betting options with their number counts
const WHEEL_BET_OPTIONS: Record<string, WheelBetOption[]> = {
  specials1: [
    { key: 'voisins', label: 'Vois', color: 'bg-purple-600 hover:bg-purple-700', numberCount: 17 },
    { key: 'orphelins', label: 'Orph', color: 'bg-indigo-600 hover:bg-indigo-700', numberCount: 8 },
    { key: 'tiers', label: 'Tier', color: 'bg-blue-600 hover:bg-blue-700', numberCount: 12 }
  ],
  specials2: [
    { key: 'voisins', label: 'Vois', color: 'bg-purple-600 hover:bg-purple-700', numberCount: 17 },
    { key: 'non_voisin', label: 'N-Vois', color: 'bg-pink-600 hover:bg-pink-700', numberCount: 20 }
  ],
  ab: [
    { key: 'a', label: 'A', color: 'bg-red-600 hover:bg-red-700', numberCount: 18 },
    { key: 'b', label: 'B', color: 'bg-blue-600 hover:bg-blue-700', numberCount: 18 }
  ],
  aabb: [
    { key: 'aa', label: 'AA', color: 'bg-yellow-600 hover:bg-yellow-700', numberCount: 18 },
    { key: 'bb', label: 'BB', color: 'bg-green-600 hover:bg-green-700', numberCount: 18 }
  ],
  aaabbb: [
    { key: 'aaa', label: 'AAA', color: 'bg-pink-600 hover:bg-pink-700', numberCount: 18 },
    { key: 'bbb', label: 'BBB', color: 'bg-cyan-600 hover:bg-cyan-700', numberCount: 18 }
  ],
  alt6: [
    { key: 'a6', label: 'A6', color: 'bg-amber-600 hover:bg-amber-700', numberCount: 18 },
    { key: 'b6', label: 'B6', color: 'bg-teal-600 hover:bg-teal-700', numberCount: 18 }
  ],
  alt9: [
    { key: 'a9', label: 'A9', color: 'bg-lime-600 hover:bg-lime-700', numberCount: 18 },
    { key: 'b9', label: 'B9', color: 'bg-indigo-600 hover:bg-indigo-700', numberCount: 18 }
  ],
  rightLeft: [
    { key: 'right', label: 'Right', color: 'bg-rose-600 hover:bg-rose-700', numberCount: 18 },
    { key: 'left', label: 'Left', color: 'bg-violet-600 hover:bg-violet-700', numberCount: 18 }
  ],
  quarters: [
    { key: 'first_9', label: '1st', color: 'bg-red-700 hover:bg-red-800', numberCount: 9 },
    { key: 'second_9', label: '2nd', color: 'bg-yellow-700 hover:bg-yellow-800', numberCount: 9 },
    { key: 'third_9', label: '3rd', color: 'bg-green-700 hover:bg-green-800', numberCount: 9 },
    { key: 'fourth_9', label: '4th', color: 'bg-blue-700 hover:bg-blue-800', numberCount: 9 }
  ]
}

export default function WheelHistoryTable({
  spins,
  selectedNumber,
  baseUnit = 10,
  onBetPlaced,
  historicalBets = {},
  onHistoricalBetsUpdate
}: WheelHistoryTableProps) {
  const [bets, setBets] = useState<Record<WheelBetKey, number>>({} as Record<WheelBetKey, number>)
  const [results, setResults] = useState<Record<WheelBetKey, { won: boolean, amount: number }>>({})
  const [showResults, setShowResults] = useState(false)
  const [modalOpen, setModalOpen] = useState<'specials1' | 'specials2' | 'voisins' | 'orphelins' | 'tiers' | 'jeu_zero' | 'non_voisin' | 'a' | 'b' | 'aa' | 'bb' | 'aaa' | 'bbb' | 'a6' | 'b6' | 'a9' | 'b9' | 'right' | 'left' | 'first_9' | 'second_9' | 'third_9' | 'fourth_9' | null>(null)

  // Track previous spin count to detect new spins
  const prevSpinCountRef = React.useRef(spins.length)
  const betsRef = React.useRef(bets)

  // Keep betsRef in sync with bets state
  React.useEffect(() => {
    betsRef.current = bets
  }, [bets])

  const handleBetClick = (betKey: WheelBetKey, isDoubleClick: boolean) => {
    if (showResults) return

    setBets(prev => {
      const currentBet = prev[betKey] || 0
      const newBet = isDoubleClick ? currentBet * 2 : currentBet + baseUnit
      return { ...prev, [betKey]: newBet }
    })
  }

  // Calculate payouts based on: (bet_amount / numbers_in_group) * 36
  const calculatePayouts = (num: number, numberCount: number, betAmount: number): number => {
    return (betAmount / numberCount) * 36
  }

  const calculateResults = (num: number): Record<WheelBetKey, { won: boolean, amount: number }> => {
    const wins: Record<WheelBetKey, { won: boolean, amount: number }> = {} as Record<WheelBetKey, { won: boolean, amount: number }>

    // Check group memberships
    const isVoisins = inGroup(WHEEL_GROUPS.voisins, num)
    const isOrphelins = inGroup(WHEEL_GROUPS.orphelins, num)
    const isTiers = inGroup(WHEEL_GROUPS.tiers, num)
    const isJeuZero = inGroup(WHEEL_GROUPS.jeu_zero, num)
    const isNonVoisin = inGroup(WHEEL_GROUPS.non_voisin, num)
    const isA = num > 0 && inGroup(WHEEL_GROUPS.a, num)
    const isB = num > 0 && inGroup(WHEEL_GROUPS.b, num)
    const isAA = num > 0 && inGroup(WHEEL_GROUPS.aa, num)
    const isBB = num > 0 && inGroup(WHEEL_GROUPS.bb, num)
    const isAAA = num > 0 && inGroup(WHEEL_GROUPS.aaa, num)
    const isBBB = num > 0 && inGroup(WHEEL_GROUPS.bbb, num)
    const isA6 = num > 0 && inGroup(WHEEL_GROUPS.a6, num)
    const isB6 = num > 0 && inGroup(WHEEL_GROUPS.b6, num)
    const isA9 = num > 0 && inGroup(WHEEL_GROUPS.a9, num)
    const isB9 = num > 0 && inGroup(WHEEL_GROUPS.b9, num)
    const isRight = num > 0 && inGroup(WHEEL_GROUPS.right, num)
    const isLeft = inGroup(WHEEL_GROUPS.left, num)
    const is1stQ = num > 0 && inGroup(WHEEL_GROUPS.first_9, num)
    const is2ndQ = num > 0 && inGroup(WHEEL_GROUPS.second_9, num)
    const is3rdQ = num > 0 && inGroup(WHEEL_GROUPS.third_9, num)
    const is4thQ = num > 0 && inGroup(WHEEL_GROUPS.fourth_9, num)

    // Calculate for each bet
    Object.entries(bets).forEach(([key, betAmount]) => {
      const betKey = key as WheelBetKey
      let won = false
      let numberCount = 0

      switch (betKey) {
        case 'voisins': won = isVoisins; numberCount = 17; break
        case 'orphelins': won = isOrphelins; numberCount = 8; break
        case 'tiers': won = isTiers; numberCount = 12; break
        case 'jeu_zero': won = isJeuZero; numberCount = 7; break
        case 'non_voisin': won = isNonVoisin; numberCount = 20; break
        case 'a': won = isA; numberCount = 18; break
        case 'b': won = isB; numberCount = 18; break
        case 'aa': won = isAA; numberCount = 18; break
        case 'bb': won = isBB; numberCount = 18; break
        case 'aaa': won = isAAA; numberCount = 18; break
        case 'bbb': won = isBBB; numberCount = 18; break
        case 'a6': won = isA6; numberCount = 18; break
        case 'b6': won = isB6; numberCount = 18; break
        case 'a9': won = isA9; numberCount = 18; break
        case 'b9': won = isB9; numberCount = 18; break
        case 'right': won = isRight; numberCount = 18; break
        case 'left': won = isLeft; numberCount = 18; break
        case 'first_9': won = is1stQ; numberCount = 9; break
        case 'second_9': won = is2ndQ; numberCount = 9; break
        case 'third_9': won = is3rdQ; numberCount = 9; break
        case 'fourth_9': won = is4thQ; numberCount = 9; break
      }

      const payout = won ? calculatePayouts(num, numberCount, betAmount) : 0
      const amount = won ? payout - betAmount : -betAmount
      wins[betKey] = { won, amount }
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

      // Convert results to P/L format (positive for wins, negative for losses)
      const groupResults: Record<string, number> = {}
      Object.entries(calcResults).forEach(([key, result]) => {
        const betAmount = currentBets[key as WheelBetKey]
        // result.amount is already the P/L: (payout - betAmount) for wins, -betAmount for losses
        groupResults[key] = result.amount
      })

      // Get the timestamp from the spin for parent to use
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

  const clearBets = () => {
    setBets({})
    setResults({})
    setShowResults(false)
  }

  // Render bet button
  const renderBetButton = (option: WheelBetOption, additionalClasses: string = 'w-full') => {
    const hasBet = !!bets[option.key]
    const result = results[option.key]
    const showResult = showResults && result

    return (
      <button
        key={option.key}
        onClick={(e) => handleBetClick(option.key, e.detail === 2)}
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
        {showResult ? (result.won ? `+$${result.amount.toFixed(0)}` : `-$${Math.abs(result.amount).toFixed(0)}`) : option.label}
        {hasBet && !showResult && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
            ${bets[option.key]}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <WheelLayoutModal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        groupType={modalOpen}
      />
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-800 sticky top-0">
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="px-1 py-2 text-center w-10">Num</th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('specials1')}
                  title="Click to view Specials 1 layout"
                >
                  Specials 1 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('specials2')}
                  title="Click to view Specials 2 layout"
                >
                  Specials 2 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors w-10"
                  onClick={() => setModalOpen('a')}
                  title="Click to view A/B layout"
                >
                  A/B 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('aa')}
                  title="Click to view AA/BB layout"
                >
                  AA/BB 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('aaa')}
                  title="Click to view AAA/BBB layout"
                >
                  AAA/BBB 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('a6')}
                  title="Click to view Alternate 6's layout"
                >
                  Alt 6 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('a9')}
                  title="Click to view Alternate 9's layout"
                >
                  Alt 9 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('right')}
                  title="Click to view Right/Left layout"
                >
                  Right/Left 🔍
                </th>
                <th
                  className="px-1 py-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setModalOpen('first_9')}
                  title="Click to view Quarters layout"
                >
                  Quarters 🔍
                </th>
                <th className="px-1 py-2 text-center">Wheel Pos</th>
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
              {/* Specials 1 */}
              <td className="px-1 py-1">
                <div className="grid grid-cols-2 gap-0.5">
                  {WHEEL_BET_OPTIONS.specials1.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* Specials 2 */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.specials2.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* A/B */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.ab.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* AA/BB */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.aabb.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* AAA/BBB */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.aaabbb.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* Alt 6's */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.alt6.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* Alt 9's */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.alt9.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* Right/Left */}
              <td className="px-1 py-1">
                <div className="flex flex-col gap-0.5">
                  {WHEEL_BET_OPTIONS.rightLeft.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* Quarters */}
              <td className="px-1 py-1">
                <div className="grid grid-cols-2 gap-0.5">
                  {WHEEL_BET_OPTIONS.quarters.map((option) => renderBetButton(option))}
                </div>
              </td>
              {/* Wheel Position - empty for bet row */}
              <td className="px-1 py-1 text-center">
                <div className="text-gray-500 text-xs">-</div>
              </td>
            </tr>

            {/* HISTORY ROWS */}
            {spins.map((spin, idx) => {
              // Check if this is a card start event
              if ((spin as any).isCardStart) {
                return (
                  <tr key={idx} className="border-t-2 border-cyan-500 bg-gradient-to-r from-cyan-900/30 via-cyan-800/10 to-cyan-900/30">
                    <td colSpan={11} className="px-2 py-1 text-center">
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
                  <tr key={idx} className={`border-t-2 ${success ? 'border-green-500 bg-gradient-to-r from-green-900/30 via-green-800/10 to-green-900/30' : 'border-red-500 bg-gradient-to-r from-red-900/30 via-red-800/10 to-red-900/30'}`}>
                    <td colSpan={11} className="px-2 py-1 text-center">
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
                return (
                  <tr key={idx} className="border-t-2 border-yellow-500 bg-yellow-900/20">
                    <td colSpan={11} className="px-2 py-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-yellow-400 font-bold text-xs">
                          🎰 Changed to dealer {(spin as any).dealerNumber}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              }

              const num = spin.number

              // Check group memberships
              const isVoisins = inGroup(WHEEL_GROUPS.voisins, num)
              const isOrphelins = inGroup(WHEEL_GROUPS.orphelins, num)
              const isTiers = inGroup(WHEEL_GROUPS.tiers, num)
              const isJeuZero = inGroup(WHEEL_GROUPS.jeu_zero, num)
              const isNonVoisin = inGroup(WHEEL_GROUPS.non_voisin, num)

              const isA = num > 0 && inGroup(WHEEL_GROUPS.a, num)
              const isB = num > 0 && inGroup(WHEEL_GROUPS.b, num)
              const isAA = num > 0 && inGroup(WHEEL_GROUPS.aa, num)
              const isBB = num > 0 && inGroup(WHEEL_GROUPS.bb, num)
              const isAAA = num > 0 && inGroup(WHEEL_GROUPS.aaa, num)
              const isBBB = num > 0 && inGroup(WHEEL_GROUPS.bbb, num)
              const isA6 = num > 0 && inGroup(WHEEL_GROUPS.a6, num)
              const isB6 = num > 0 && inGroup(WHEEL_GROUPS.b6, num)
              const isA9 = num > 0 && inGroup(WHEEL_GROUPS.a9, num)
              const isB9 = num > 0 && inGroup(WHEEL_GROUPS.b9, num)
              const isRight = num > 0 && inGroup(WHEEL_GROUPS.right, num)
              const isLeft = inGroup(WHEEL_GROUPS.left, num)
              const is1stQ = num > 0 && inGroup(WHEEL_GROUPS.first_9, num)
              const is2ndQ = num > 0 && inGroup(WHEEL_GROUPS.second_9, num)
              const is3rdQ = num > 0 && inGroup(WHEEL_GROUPS.third_9, num)
              const is4thQ = num > 0 && inGroup(WHEEL_GROUPS.fourth_9, num)

              // Get wheel position
              const wheelPosition = WHEEL_ORDER.indexOf(num)

              // Determine group values
              let specials1 = '-'
              if (isVoisins) specials1 = 'Voisin'
              else if (isOrphelins) specials1 = 'Orphein'
              else if (isTiers) specials1 = 'Tier'
              else if (isJeuZero) specials1 = 'Jeu Zero'

              let specials2 = '-'
              if (isVoisins) specials2 = 'Voisin'
              else if (isNonVoisin) specials2 = 'Non-Voisin'

              let quarter = '-'
              if (is1stQ) quarter = '1st Q'
              else if (is2ndQ) quarter = '2nd Q'
              else if (is3rdQ) quarter = '3rd Q'
              else if (is4thQ) quarter = '4th Q'

              // Check if we have bet results for this spin
              const spinKey = new Date(spin.created_at).getTime().toString()
              const spinBetData = historicalBets[spinKey]

              // Helper to render cell with P/L badge
              const renderCellWithBadge = (content: React.ReactNode, className: string, betKeys: WheelBetKey | WheelBetKey[]) => {
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
                <tr key={idx} className={`border-t border-gray-700 transition-all ${
                  selectedNumber === num ? 'bg-yellow-400/20 ring-2 ring-yellow-400/50' : 'hover:bg-gray-700/30'
                }`}>
                  <td className="px-1 py-2 text-center font-bold">
                    <span className={`px-2 py-1 rounded ${
                      num === 0 ? 'bg-green-600' :
                      inGroup(RED_NUMBERS, num) ? 'bg-red-600' :
                      'bg-black border border-gray-600'
                    } text-white ${selectedNumber === num ? 'ring-2 ring-yellow-400' : ''}`}>
                      {num}
                    </span>
                  </td>
                  <td className="px-1 py-2 text-center">
                    {specials1 === 'Voisin' && renderCellWithBadge(
                      <span className="px-1 py-0.5 bg-purple-600/30 text-purple-400 rounded text-xs">
                        {specials1}
                      </span>,
                      '',
                      'voisins'
                    )}
                    {specials1 === 'Orphein' && renderCellWithBadge(
                      <span className="px-1 py-0.5 bg-indigo-600/30 text-indigo-400 rounded text-xs">
                        {specials1}
                      </span>,
                      '',
                      'orphelins'
                    )}
                    {specials1 === 'Tier' && renderCellWithBadge(
                      <span className="px-1 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">
                        {specials1}
                      </span>,
                      '',
                      'tiers'
                    )}
                    {specials1 === 'Jeu Zero' && renderCellWithBadge(
                      <span className="px-1 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">
                        {specials1}
                      </span>,
                      '',
                      'jeu_zero'
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {specials2 === 'Voisin' && renderCellWithBadge(
                      <span className="px-1 py-0.5 bg-purple-600/30 text-purple-400 rounded text-xs">
                        {specials2}
                      </span>,
                      '',
                      'voisins'
                    )}
                    {specials2 === 'Non-Voisin' && renderCellWithBadge(
                      <span className="px-1 py-0.5 bg-orange-600/30 text-orange-400 rounded text-xs">
                        {specials2}
                      </span>,
                      '',
                      'non_voisin'
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      isA ? (
                        <span className="px-1 py-0.5 bg-red-600/30 text-red-400 rounded text-xs">A</span>
                      ) : isB ? (
                        <span className="px-1 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">B</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['a', 'b']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      isAA ? (
                        <span className="px-1 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">AA</span>
                      ) : isBB ? (
                        <span className="px-1 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">BB</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['aa', 'bb']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      isAAA ? (
                        <span className="px-1 py-0.5 bg-pink-600/30 text-pink-400 rounded text-xs">AAA</span>
                      ) : isBBB ? (
                        <span className="px-1 py-0.5 bg-cyan-600/30 text-cyan-400 rounded text-xs">BBB</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['aaa', 'bbb']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      isA6 ? (
                        <span className="px-1 py-0.5 bg-amber-600/30 text-amber-400 rounded text-xs">A6</span>
                      ) : isB6 ? (
                        <span className="px-1 py-0.5 bg-teal-600/30 text-teal-400 rounded text-xs">B6</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['a6', 'b6']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      isA9 ? (
                        <span className="px-1 py-0.5 bg-lime-600/30 text-lime-400 rounded text-xs">A9</span>
                      ) : isB9 ? (
                        <span className="px-1 py-0.5 bg-indigo-600/30 text-indigo-400 rounded text-xs">B9</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['a9', 'b9']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      isRight ? (
                        <span className="px-1 py-0.5 bg-rose-600/30 text-rose-400 rounded text-xs">Right</span>
                      ) : isLeft ? (
                        <span className="px-1 py-0.5 bg-violet-600/30 text-violet-400 rounded text-xs">Left</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['right', 'left']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {renderCellWithBadge(
                      quarter === '1st Q' ? (
                        <span className="px-1 py-0.5 bg-red-600/30 text-red-400 rounded text-xs">1st Q</span>
                      ) : quarter === '2nd Q' ? (
                        <span className="px-1 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">2nd Q</span>
                      ) : quarter === '3rd Q' ? (
                        <span className="px-1 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">3rd Q</span>
                      ) : quarter === '4th Q' ? (
                        <span className="px-1 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">4th Q</span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      ),
                      '',
                      ['first_9', 'second_9', 'third_9', 'fourth_9']
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs font-semibold">
                      {wheelPosition >= 0 ? wheelPosition : '-'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {spins.length === 0 && (
              <tr className="border-t border-gray-700">
                <td className="px-2 py-4 text-center text-gray-500" colSpan={11}>
                  No spins recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}
