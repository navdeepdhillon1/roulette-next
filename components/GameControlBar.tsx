'use client'

import React, { useState } from 'react'

interface SpinData {
  number: number
  timestamp: number
  sessionId?: string
  cardId?: string
  dealer?: number
  isDealerChange?: boolean
  dealerNumber?: number
  // Optional betting fields
  betType?: string
  betAmount?: number
  payout?: number
  profitLoss?: number
  bankrollAfter?: number
}

interface SessionStats {
  totalSpins: number
  totalWagered: number
  totalReturned: number
  currentBankroll: number
  roi: number
}

interface GameControlBarProps {
  currentDealer: number
  onDealerChange: (dealer: number) => void
  spinHistory: SpinData[]
  sessionStats: SessionStats
  sessionId?: string
  currentCardNumber?: number
  currentCardTarget?: number
  currentCardProfit?: number
  currentCardBetsUsed?: number
  currentCardMaxBets?: number
  onCardStart?: (cardNumber: number, cardTarget: number) => void
  onCardEnd?: (cardNumber: number, cardProfit: number, cardSuccess: boolean, cardTarget: number, cardBetsUsed: number, cardMaxBets: number) => void
  currentView?: 'layout' | 'wheelLayout'
  onViewChange?: (view: 'layout' | 'wheelLayout') => void
}

export default function GameControlBar({
  currentDealer,
  onDealerChange,
  spinHistory,
  sessionStats,
  sessionId,
  currentCardNumber,
  currentCardTarget,
  currentCardProfit,
  currentCardBetsUsed,
  currentCardMaxBets,
  onCardStart,
  onCardEnd,
  currentView,
  onViewChange
}: GameControlBarProps) {
  const [cardTrackingEnabled, setCardTrackingEnabled] = useState(false)

  const handleExportCSV = () => {
    // Prepare CSV data with dealer tracking and betting info
    let currentDealer = 1 // Start with Dealer 1

    // Get session/card info from first spin (if available)
    const firstSpin = spinHistory[spinHistory.length - 1]
    const exportSessionId = sessionId || firstSpin?.sessionId || 'N/A'
    const exportCardId = firstSpin?.cardId || 'N/A'

    // Create metadata header
    const metadata = [
      `# Roulette Session Export`,
      `# Session ID: ${exportSessionId}`,
      `# Card ID: ${exportCardId}`,
      `# Exported: ${new Date().toISOString()}`,
      `# Total Spins: ${sessionStats.totalSpins}`,
      `#`
    ]

    const headers = ['Timestamp', 'Number', 'Type', 'Dealer', 'Bet_Type', 'Wager', 'Payout', 'PnL', 'Bankroll']

    const rows = spinHistory.map(spin => {
      if ((spin as any).isDealerChange) {
        currentDealer = (spin as any).dealerNumber
        return [
          new Date(spin.timestamp).toISOString(),
          '-',
          'Dealer_Change',
          `Dealer ${currentDealer}`,
          '-', '-', '-', '-', '-'
        ]
      }
      return [
        new Date(spin.timestamp).toISOString(),
        spin.number.toString(),
        'Spin',
        `Dealer ${currentDealer}`,
        spin.betType || '-',
        spin.betAmount ? `$${spin.betAmount.toFixed(2)}` : '-',
        spin.payout !== undefined ? `$${spin.payout.toFixed(2)}` : '-',
        spin.profitLoss !== undefined ? `$${spin.profitLoss >= 0 ? '+' : ''}${spin.profitLoss.toFixed(2)}` : '-',
        spin.bankrollAfter !== undefined ? `$${spin.bankrollAfter.toFixed(2)}` : '-'
      ]
    })

    // Add session stats at the bottom
    rows.push([])
    rows.push(['# SESSION STATISTICS'])
    rows.push(['Total Spins', sessionStats.totalSpins.toString()])
    rows.push(['Total Wagered', `$${sessionStats.totalWagered.toFixed(2)}`])
    rows.push(['Total Returned', `$${sessionStats.totalReturned.toFixed(2)}`])
    rows.push(['Profit/Loss', `$${(sessionStats.totalReturned - sessionStats.totalWagered).toFixed(2)}`])
    rows.push(['Current Bankroll', `$${sessionStats.currentBankroll.toFixed(2)}`])
    rows.push(['ROI', `${sessionStats.roi.toFixed(2)}%`])

    // Convert to CSV string with metadata header
    const csvContent = [
      ...metadata,
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `roulette_session_${exportSessionId || Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  return (
    <div className="bg-gray-800/70 rounded-lg border border-gray-700 p-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Dealer Selector, Switch Layout Button & Card Controls */}
        <div className="flex items-center gap-3">
          <label htmlFor="dealer-select-bar" className="text-gray-300 font-semibold text-sm">
            Select:
          </label>
          <select
            id="dealer-select-bar"
            value={currentDealer}
            onChange={(e) => onDealerChange(Number(e.target.value))}
            className="bg-gray-900 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value={1}>Dealer 1</option>
            <option value={2}>Dealer 2</option>
            <option value={3}>Dealer 3</option>
            <option value={4}>Dealer 4</option>
            <option value={5}>Dealer 5</option>
          </select>

          {/* Switch Layout Button */}
          {currentView && onViewChange && (
            <button
              onClick={() => onViewChange(currentView === 'layout' ? 'wheelLayout' : 'layout')}
              className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 border border-gray-600"
              title={`Switch to ${currentView === 'layout' ? 'Wheel' : 'Table'} Layout`}
            >
              {currentView === 'layout' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  Switch to Wheel Layout
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M9 3v18" />
                  </svg>
                  Switch to Table Layout
                </>
              )}
            </button>
          )}

          {/* Card Tracking Toggle */}
          {onCardStart && onCardEnd && (
            <button
              onClick={() => setCardTrackingEnabled(!cardTrackingEnabled)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border ${
                cardTrackingEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-500'
                  : 'bg-gray-900 hover:bg-gray-700 text-gray-300 border-gray-600'
              }`}
              title="Toggle card tracking on/off"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Track Cards: {cardTrackingEnabled ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Card Start/End Buttons - Only show when tracking is enabled */}
          {cardTrackingEnabled && onCardStart && currentCardNumber && currentCardTarget && (
            <button
              onClick={() => onCardStart(currentCardNumber, currentCardTarget)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title={`Start tracking Card #${currentCardNumber}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Start Card #{currentCardNumber}
            </button>
          )}

          {cardTrackingEnabled && onCardEnd && currentCardNumber && currentCardProfit !== undefined && currentCardTarget !== undefined && currentCardBetsUsed !== undefined && currentCardMaxBets !== undefined && (
            <button
              onClick={() => {
                const cardSuccess = currentCardProfit >= currentCardTarget
                onCardEnd(currentCardNumber, currentCardProfit, cardSuccess, currentCardTarget, currentCardBetsUsed, currentCardMaxBets)
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title={`End tracking Card #${currentCardNumber}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              End Card #{currentCardNumber}
            </button>
          )}
        </div>

        {/* Right: Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            title="Export session data as CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
