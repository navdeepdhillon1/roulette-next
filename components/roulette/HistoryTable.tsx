import React, { useState } from 'react'
import type { Spin } from '@/lib/types'
import type { BetKey } from '@/types/bettingAssistant'
import { WHEEL_ORDER } from '@/lib/roulette-logic'
import TableLayoutModal from './TableLayoutModal'

interface HistoricalBetData {
  bets: Record<BetKey, number>
  results: Record<BetKey, { won: boolean, amount: number }>
}

interface HistoryTableProps {
  spins: Spin[]
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
  onNumberAdded?: (number: number) => void
  sessionStats?: {
    currentBankroll: number
    totalWagered: number
    totalReturned: number
    roi: number
  }
  historicalBets?: Record<string, HistoricalBetData>
  onHistoricalBetsUpdate?: (newBets: Record<string, HistoricalBetData>) => void
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
  ]
}

export default function HistoryTable({
  spins,
  baseUnit = 10,
  onBetPlaced,
  onNumberAdded,
  sessionStats,
  historicalBets = {},
  onHistoricalBetsUpdate
}: HistoryTableProps) {
  const [bets, setBets] = useState<Record<BetKey, number>>({} as Record<BetKey, number>)
  const [results, setResults] = useState<Record<BetKey, { won: boolean, amount: number }>>({})
  const [showResults, setShowResults] = useState(false)
  const [modalOpen, setModalOpen] = useState<'dozen' | 'column' | 'color' | 'evenOdd' | 'lowHigh' | 'alt1' | 'alt2' | 'alt3' | 'edgeCenter' | 'six' | null>(null)

  const handleBetClick = (betKey: BetKey, isDoubleClick: boolean) => {
    if (showResults) return // Prevent betting when results are showing

    setBets(prev => {
      const currentBet = prev[betKey] || 0
      const newBet = isDoubleClick ? currentBet * 2 : currentBet + baseUnit
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
      six1: 6, six2: 6, six3: 6, six4: 6, six5: 6, six6: 6
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
      }

      const amount = won ? betAmount * payoutRates[betKey] - betAmount : -betAmount
      wins[betKey] = { won, amount }
    })

    return wins
  }

  // Track the last processed spin to avoid duplicate processing
  const [lastProcessedSpinKey, setLastProcessedSpinKey] = React.useState<string | null>(null)

  // Use a ref to track current bets without triggering re-renders
  const betsRef = React.useRef(bets)
  React.useEffect(() => {
    betsRef.current = bets
  }, [bets])

  // When a new spin is added, calculate results
  // IMPORTANT: Only depends on spins.length, NOT on bets
  React.useEffect(() => {
    if (spins.length > 0 && !showResults) {
      const latestSpin = spins[0]
      const spinKey = new Date(latestSpin.created_at).getTime().toString()

      // Get current bets from ref
      const currentBets = betsRef.current

      // Only process if this is a NEW spin we haven't processed yet AND we have bets
      if (spinKey !== lastProcessedSpinKey && Object.keys(currentBets).length > 0) {
        const calcResults = calculatePayouts(latestSpin.number)
        setResults(calcResults)
        setShowResults(true)
        setLastProcessedSpinKey(spinKey)

        console.log('Storing bet results for spin:', spinKey, 'number:', latestSpin.number, calcResults)

        // Update historical bets through callback
        if (onHistoricalBetsUpdate) {
          const updatedBets = {
            ...historicalBets,
            [spinKey]: { bets: { ...currentBets }, results: calcResults }
          }
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

        // Auto-clear betting row after 3 seconds
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
  }

  // Helper to render a bet button with result display
  const renderBetButton = (option: BetOption, additionalClasses: string = 'flex-1') => {
    const hasBet = !!bets[option.betKey]
    const result = results[option.betKey]
    const showResult = showResults && result

    return (
      <button
        key={option.betKey}
        onClick={(e) => handleBetClick(option.betKey, e.detail === 2)}
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
        {showResult ? (result.won ? `+$${result.amount}` : `-$${Math.abs(result.amount)}`) : option.label}
        {hasBet && !showResult && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
            ${bets[option.betKey]}
          </span>
        )}
      </button>
    )
  }

  if (spins.length === 0) {
    return <p className="text-gray-400 text-center py-8">No spins recorded yet</p>
  }

  return (
    <>
      <TableLayoutModal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        groupType={modalOpen}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300 w-10">Number</th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors w-10"
                onClick={() => setModalOpen('color')}
                title="Click to view color layout"
              >
                Color 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors w-10"
                onClick={() => setModalOpen('evenOdd')}
                title="Click to view even/odd layout"
              >
                Even/Odd 🔍
              </th>
              <th
                className="px-1 py-1 text-center font-semibold text-xs text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors w-10"
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
              <th className="px-1 py-1 text-center font-semibold text-xs text-gray-300">Wheel Pos</th>
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
            {/* Wheel Position */}
            <td className="px-1 py-1 text-center">
              <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs font-semibold">
                -
              </span>
            </td>
          </tr>
          {/* HISTORY ROWS */}
          {spins.map((spin, index) => {
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
              return (
                <tr key={index} className="border-t-2 border-yellow-500 bg-yellow-900/20">
                  <td colSpan={12} className="px-2 py-1 text-center">
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
            const alt1 = num === 0 ? '-' : [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B'
            const alt2 = num === 0 ? '-' : [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB'
            const alt3 = num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB'
            const edgeCenter = num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) ? 'E' : 'C'
            const sixGroup = num === 0 ? '-' : num <= 6 ? '1st' : num <= 12 ? '2nd' : num <= 18 ? '3rd' : num <= 24 ? '4th' : num <= 30 ? '5th' : '6th'
            const wheelPosition = WHEEL_ORDER.indexOf(num)

            // Check if we have bet results for this spin - use timestamp as key
            const spinKey = new Date(spin.created_at).getTime().toString()
            const spinBetData = historicalBets[spinKey]

            if (spinBetData) {
              console.log('Found bet data for spin:', spinKey, 'number:', spin.number, spinBetData)
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
