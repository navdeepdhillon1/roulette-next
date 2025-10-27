'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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

interface Dealer {
  id: string
  name: string
  nickname?: string
}

interface GameControlBarProps {
  currentDealer: number
  onDealerChange: (dealer: number) => void
  availableDealers?: Dealer[]
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
  currentView?: 'layout' | 'wheelLayout' | 'my-groups'
  onViewChange?: (view: 'layout' | 'wheelLayout' | 'my-groups') => void
  hasSelectedGroups?: boolean  // Whether user has configured custom groups
  useCards?: boolean  // Whether session uses structured card system
}

export default function GameControlBar({
  currentDealer,
  onDealerChange,
  availableDealers = [],
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
  onViewChange,
  hasSelectedGroups = false,
  useCards = true
}: GameControlBarProps) {
  const [cardTrackingEnabled, setCardTrackingEnabled] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
            {availableDealers.length > 0 ? (
              availableDealers.map((dealer, index) => (
                <option key={dealer.id} value={index + 1}>
                  {dealer.name}{dealer.nickname ? ` "${dealer.nickname}"` : ''}
                </option>
              ))
            ) : (
              <>
                <option value={1}>Dealer 1</option>
                <option value={2}>Dealer 2</option>
                <option value={3}>Dealer 3</option>
                <option value={4}>Dealer 4</option>
                <option value={5}>Dealer 5</option>
              </>
            )}
          </select>

          {/* Switch Layout Button */}
          {currentView && onViewChange && (
            <select
              value={currentView || 'layout'}
              onChange={(e) => onViewChange(e.target.value as 'layout' | 'wheelLayout' | 'my-groups')}
              className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-lg transition-all border border-gray-600 cursor-pointer"
            >
              <option value="layout">🎲 Table Groups</option>
              <option value="wheelLayout">🎡 Wheel Groups</option>
              {hasSelectedGroups && (
                <option value="my-groups">⭐ My Groups</option>
              )}
            </select>
          )}

          {/* Card Tracking Toggle - Only show when NOT using structured card system */}
          {!useCards && onCardStart && onCardEnd && (
            <button
              onClick={() => setCardTrackingEnabled(!cardTrackingEnabled)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border ${
                cardTrackingEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-500'
                  : 'bg-gray-900 hover:bg-gray-700 text-gray-300 border-gray-600'
              }`}
              title="Toggle manual card tracking on/off for session segmentation"
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

        {/* Right: Export Button & Help */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            title="View help guide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </button>
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

      {/* Help Modal - Rendered via Portal */}
      {mounted && showHelpModal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }} onClick={() => setShowHelpModal(false)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative" style={{ zIndex: 100000 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Betting Assistant Guide
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Quick Start */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-300 mb-2">🚀 Quick Start</h3>
                <ol className="text-sm text-gray-300 space-y-2 ml-4">
                  <li><span className="text-white font-semibold">1.</span> Click a number on the roulette table that just came up</li>
                  <li><span className="text-white font-semibold">2.</span> Click the <span className="text-yellow-400 font-semibold">"Add"</span> button to record the spin</li>
                  <li><span className="text-white font-semibold">3.</span> Track your progress toward the card target</li>
                  <li><span className="text-white font-semibold">4.</span> Complete all {useCards ? 'cards' : 'bets'} or reach session limits</li>
                </ol>
              </div>

              {/* How to Track Your Play */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'tracking' ? null : 'tracking')}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <span className="text-white font-bold flex items-center gap-2">
                    📊 How to Track Your Play
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'tracking' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'tracking' && (
                  <div className="p-4 bg-gray-850 space-y-4">
                    <p className="text-sm text-gray-300">
                      The Betting Assistant offers two powerful ways to track your gameplay, depending on how detailed you want to be:
                    </p>

                    {/* Method 1: Full Bet Tracking */}
                    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-purple-300 mb-2">🎯 Method 1: Full Bet Tracking (Recommended)</h4>
                      <p className="text-xs text-gray-300 mb-2">
                        Duplicate your actual casino bets in the interface for complete tracking of wagered amounts, positions, and outcomes.
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-semibold min-w-[60px]">Step 1:</span>
                          <span className="text-gray-300">When you place a real bet at the casino, click the corresponding bet card(s) in the interface</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-semibold min-w-[60px]">Step 2:</span>
                          <span className="text-gray-300">Enter your actual bet amount for each position (e.g., $10 on Red, $5 on Dozen 1)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-semibold min-w-[60px]">Step 3:</span>
                          <span className="text-gray-300">Click the winning number on the roulette table when it comes up</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-semibold min-w-[60px]">Step 4:</span>
                          <span className="text-gray-300">Click "Add" - the system automatically calculates your wins, losses, and profit for each bet</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded">
                        <p className="text-xs text-green-300 font-semibold mb-1">✅ Benefits:</p>
                        <ul className="text-xs text-gray-300 space-y-1 ml-3">
                          <li>• Track <span className="text-white font-semibold">exact wagered amounts</span> per betting position</li>
                          <li>• See <span className="text-white font-semibold">precise profit/loss</span> for each spin and overall</li>
                          <li>• Monitor <span className="text-white font-semibold">ROI and betting patterns</span> with detailed analytics</li>
                          <li>• Perfect for <span className="text-white font-semibold">bankroll management</span> and strategy testing</li>
                          <li>• Export complete betting history to CSV for analysis</li>
                        </ul>
                      </div>
                    </div>

                    {/* Method 2: Outcome Only Tracking */}
                    <div className="bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-500/30 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-cyan-300 mb-2">📈 Method 2: Outcome-Only Tracking (Simplified)</h4>
                      <p className="text-xs text-gray-300 mb-2">
                        Just track which groups are winning without recording specific bet amounts or positions.
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-cyan-400 font-semibold min-w-[60px]">Step 1:</span>
                          <span className="text-gray-300">Simply click the winning number on the roulette table as each spin occurs</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-cyan-400 font-semibold min-w-[60px]">Step 2:</span>
                          <span className="text-gray-300">Click "Add" to record the outcome</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-cyan-400 font-semibold min-w-[60px]">Step 3:</span>
                          <span className="text-gray-300">View group statistics (hot/cold streaks, patterns, frequencies) below</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                        <p className="text-xs text-blue-300 font-semibold mb-1">✅ Best For:</p>
                        <ul className="text-xs text-gray-300 space-y-1 ml-3">
                          <li>• <span className="text-white font-semibold">Pattern observation</span> without tracking finances</li>
                          <li>• Identifying <span className="text-white font-semibold">hot and cold groups</span> in real-time</li>
                          <li>• <span className="text-white font-semibold">Quick tracking</span> when you don't want to input bet amounts</li>
                          <li>• <span className="text-white font-semibold">Learning and research</span> before committing money</li>
                          <li>• Building a <span className="text-white font-semibold">historical database</span> of outcomes by dealer/casino</li>
                        </ul>
                      </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                      <p className="text-xs text-orange-300 font-bold mb-2">💡 Pro Tip:</p>
                      <p className="text-xs text-gray-300">
                        Start with <span className="text-white font-semibold">Outcome-Only Tracking</span> to learn the interface and observe patterns.
                        Once comfortable, switch to <span className="text-white font-semibold">Full Bet Tracking</span> for comprehensive session analysis and bankroll management.
                        You can use both methods in different sessions based on your goals!
                      </p>
                    </div>

                    {/* What Gets Tracked */}
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <p className="text-xs font-semibold text-gray-400 mb-2">What the System Tracks:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                        <div>• Spin numbers & timestamps</div>
                        <div>• Win/loss streaks by group</div>
                        <div>• Dealer performance patterns</div>
                        <div>• Hot & cold groups</div>
                        <div>• Session duration</div>
                        <div>• Group frequencies</div>
                        <div>• Statistical anomalies</div>
                        <div>• Bankroll progression</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card System */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'cards' ? null : 'cards')}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <span className="text-white font-bold flex items-center gap-2">
                    🎴 Understanding the Card System
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'cards' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'cards' && (
                  <div className="p-4 bg-gray-850 space-y-3">
                    <p className="text-sm text-gray-300">Each card is a mini-session with its own profit target and bet limit. This enforces discipline and prevents emotional betting.</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                        <p className="font-bold text-green-400 mb-1">✓ Benefits</p>
                        <ul className="text-gray-300 space-y-1">
                          <li>• Clear profit targets</li>
                          <li>• Bet limits prevent chasing</li>
                          <li>• Psychological breaks</li>
                          <li>• Track discipline</li>
                        </ul>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                        <p className="font-bold text-blue-400 mb-1">🎯 How It Works</p>
                        <ul className="text-gray-300 space-y-1">
                          <li>• Reach target → Success ✅</li>
                          <li>• Hit max bets → Failed ❌</li>
                          <li>• Next card unlocks</li>
                          <li>• Complete all cards</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls & Features */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'controls' ? null : 'controls')}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <span className="text-white font-bold flex items-center gap-2">
                    🎮 Controls & Features
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'controls' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'controls' && (
                  <div className="p-4 bg-gray-850 space-y-3 text-sm text-gray-300">
                    <div><span className="text-cyan-400 font-semibold">Dealer Selector:</span> Track which dealer is spinning to analyze dealer-specific patterns</div>
                    <div><span className="text-purple-400 font-semibold">Layout Switcher:</span> Toggle between Table Groups, Wheel Groups, or your custom My Groups view</div>
                    <div><span className="text-yellow-400 font-semibold">Add Button:</span> Records the current spin and updates all statistics automatically</div>
                    <div><span className="text-red-400 font-semibold">Undo Button:</span> Remove the last spin if you made a mistake</div>
                    <div><span className="text-green-400 font-semibold">Export CSV:</span> Download your complete session data for external analysis</div>
                  </div>
                )}
              </div>

              {/* Betting System */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'betting' ? null : 'betting')}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <span className="text-white font-bold flex items-center gap-2">
                    💰 Betting System Progression
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'betting' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'betting' && (
                  <div className="p-4 bg-gray-850 space-y-3 text-sm text-gray-300">
                    <p>Your selected betting system automatically adjusts bet sizes based on wins and losses:</p>
                    <ul className="space-y-2 ml-4">
                      <li>• <span className="text-white font-semibold">Flat:</span> Same bet every time (safest)</li>
                      <li>• <span className="text-white font-semibold">Martingale:</span> Double after loss, reset on win (high risk)</li>
                      <li>• <span className="text-white font-semibold">D'Alembert:</span> Increase by 1 unit on loss, decrease on win (balanced)</li>
                      <li>• <span className="text-white font-semibold">Paroli:</span> Double after win up to 3 times, reset on loss (positive progression)</li>
                      <li>• <span className="text-white font-semibold">Fibonacci:</span> Follow Fibonacci sequence on losses (moderate risk)</li>
                      <li>• <span className="text-white font-semibold">Custom:</span> Define your own rules for maximum flexibility</li>
                    </ul>
                    <p className="text-yellow-400 text-xs mt-2">⚠️ Your current bet is displayed at the top of the card</p>
                  </div>
                )}
              </div>

              {/* Tips & Best Practices */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'tips' ? null : 'tips')}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <span className="text-white font-bold flex items-center gap-2">
                    💡 Tips & Best Practices
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'tips' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'tips' && (
                  <div className="p-4 bg-gray-850 space-y-2 text-sm text-gray-300">
                    <p className="text-green-400 font-semibold">✅ Do:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Stick to your stop-loss and stop-profit limits</li>
                      <li>• Take breaks between failed cards</li>
                      <li>• Track dealer patterns over multiple sessions</li>
                      <li>• Review exported data to refine your strategy</li>
                      <li>• Use smaller targets for higher success rates</li>
                    </ul>
                    <p className="text-red-400 font-semibold mt-3">❌ Don't:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Chase losses beyond your max bets</li>
                      <li>• Skip tracking spins (affects accuracy)</li>
                      <li>• Ignore session limits (bankroll management)</li>
                      <li>• Switch betting systems mid-card</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
