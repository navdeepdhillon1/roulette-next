// components/SessionHistoryViewer.tsx
// Session history browser with analytics (Elite tier)

'use client'

import { useState, useEffect } from 'react'
import { listUserSessions, loadBettingSession, loadCardSteps } from '@/lib/bettingAssistantStorage'
import { listCasinos } from '@/lib/bettingAssistantStorage'

interface SessionHistoryViewerProps {
  userId: string
  onClose: () => void
}

export default function SessionHistoryViewer({ userId, onClose }: SessionHistoryViewerProps) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [filteredSessions, setFilteredSessions] = useState<any[]>([])
  const [casinos, setCasinos] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'abandoned'>('all')
  const [filterCasino, setFilterCasino] = useState<string>('all')
  const [filterProfit, setFilterProfit] = useState<'all' | 'winning' | 'losing'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'roi'>('date')

  useEffect(() => {
    loadData()
  }, [userId])

  useEffect(() => {
    applyFilters()
  }, [sessions, filterStatus, filterCasino, filterProfit, sortBy])

  const loadData = async () => {
    setLoading(true)

    // Load sessions
    const sessionsResult = await listUserSessions(userId, 100)
    if ('sessions' in sessionsResult) {
      // Filter out active sessions
      const completedSessions = sessionsResult.sessions.filter((s) => s.status !== 'active')
      setSessions(completedSessions)
    }

    // Load casinos for filter
    const casinosResult = await listCasinos(userId)
    if ('casinos' in casinosResult) {
      setCasinos(casinosResult.casinos)
    }

    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...sessions]

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus)
    }

    // Casino filter
    if (filterCasino !== 'all') {
      filtered = filtered.filter((s) => s.casino_id === filterCasino)
    }

    // Profit filter
    if (filterProfit !== 'all') {
      filtered = filtered.filter((s) => {
        const profit = (s.total_returned || 0) - (s.total_wagered || 0)
        return filterProfit === 'winning' ? profit > 0 : profit < 0
      })
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.completed_at || b.started_at).getTime() - new Date(a.completed_at || a.started_at).getTime()
      } else if (sortBy === 'profit') {
        const profitA = (a.total_returned || 0) - (a.total_wagered || 0)
        const profitB = (b.total_returned || 0) - (b.total_wagered || 0)
        return profitB - profitA
      } else {
        // ROI
        const roiA = a.total_wagered > 0 ? ((a.total_returned - a.total_wagered) / a.total_wagered) * 100 : 0
        const roiB = b.total_wagered > 0 ? ((b.total_returned - b.total_wagered) / b.total_wagered) * 100 : 0
        return roiB - roiA
      }
    })

    setFilteredSessions(filtered)
  }

  const loadSessionDetails = async (sessionId: string) => {
    setLoadingDetails(true)
    const result = await loadBettingSession(userId, sessionId)

    if ('session' in result) {
      // Load steps for all cards
      const cardsWithSteps = await Promise.all(
        result.cards.map(async (card: any) => {
          const stepsResult = await loadCardSteps(card.id)
          const steps = 'steps' in stepsResult ? stepsResult.steps : []
          return { ...card, steps }
        })
      )

      setSelectedSession({ ...result.session, cards: cardsWithSteps })
    }

    setLoadingDetails(false)
  }

  // Calculate summary stats
  const totalSessions = filteredSessions.length
  const totalProfit = filteredSessions.reduce((sum, s) => sum + ((s.total_returned || 0) - (s.total_wagered || 0)), 0)
  const totalWagered = filteredSessions.reduce((sum, s) => sum + (s.total_wagered || 0), 0)
  const avgROI = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0
  const winningSessions = filteredSessions.filter((s) => ((s.total_returned || 0) - (s.total_wagered || 0)) > 0).length
  const winRate = totalSessions > 0 ? (winningSessions / totalSessions) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin text-6xl mb-4">🔄</div>
            <p className="text-xl text-gray-300">Loading session history...</p>
          </div>
        </div>
      </div>
    )
  }

  // Session detail modal
  if (selectedSession) {
    const profit = (selectedSession.total_returned || 0) - (selectedSession.total_wagered || 0)
    const roi = selectedSession.total_wagered > 0
      ? ((profit / selectedSession.total_wagered) * 100).toFixed(1)
      : '0.0'

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">{selectedSession.session_name}</h1>
              <p className="text-gray-400">
                {new Date(selectedSession.started_at).toLocaleString()} - {new Date(selectedSession.completed_at || selectedSession.started_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg"
            >
              ← Back to History
            </button>
          </div>

          {/* Session Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Profit</div>
              <div className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">ROI</div>
              <div className={`text-3xl font-bold ${parseFloat(roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {roi}%
              </div>
            </div>
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Wagered</div>
              <div className="text-3xl font-bold text-orange-400">
                ${selectedSession.total_wagered.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Cards Completed</div>
              <div className="text-3xl font-bold text-white">
                {selectedSession.cards?.filter((c: any) => c.status === 'completed').length || 0} / {selectedSession.cards?.length || 0}
              </div>
            </div>
          </div>

          {/* Cards Breakdown */}
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cards Breakdown</h2>
            <div className="space-y-3">
              {selectedSession.cards?.map((card: any) => {
                const cardProfit = card.current_total || 0
                return (
                  <div key={card.id} className="bg-black/40 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {card.status === 'completed' ? '✅' : card.status === 'failed' ? '❌' : '⏸️'}
                        </div>
                        <div>
                          <div className="font-bold text-white">Card #{card.card_number}</div>
                          <div className="text-sm text-gray-400">
                            Target: ${card.target} • Bets: {card.bets_used}/{card.max_bets}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${cardProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {cardProfit >= 0 ? '+' : ''}${cardProfit.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">{card.steps?.length || 0} steps</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Session History</h1>
            <p className="text-gray-400">Review your past betting sessions and performance</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg"
          >
            Close
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-400 mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-white">{totalSessions}</div>
          </div>
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-400 mb-1">Total Profit</div>
            <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(0)}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-400 mb-1">Avg ROI</div>
            <div className={`text-3xl font-bold ${avgROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {avgROI.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-400 mb-1">Win Rate</div>
            <div className="text-3xl font-bold text-blue-400">{winRate.toFixed(0)}%</div>
          </div>
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-400 mb-1">Total Wagered</div>
            <div className="text-3xl font-bold text-orange-400">${totalWagered.toFixed(0)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Casino</label>
              <select
                value={filterCasino}
                onChange={(e) => setFilterCasino(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="all">All Casinos</option>
                {casinos.map((casino) => (
                  <option key={casino.id} value={casino.id}>
                    {casino.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Profit/Loss</label>
              <select
                value={filterProfit}
                onChange={(e) => setFilterProfit(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="all">All</option>
                <option value="winning">Winning</option>
                <option value="losing">Losing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="date">Date (Newest)</option>
                <option value="profit">Profit (Highest)</option>
                <option value="roi">ROI (Highest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Sessions Found</h3>
            <p className="text-gray-400">Try adjusting your filters or complete some sessions first</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const profit = (session.total_returned || 0) - (session.total_wagered || 0)
              const roi = session.total_wagered > 0
                ? (((session.total_returned - session.total_wagered) / session.total_wagered) * 100).toFixed(1)
                : '0.0'

              return (
                <div
                  key={session.id}
                  className="bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 rounded-lg p-4 transition-all cursor-pointer"
                  onClick={() => loadSessionDetails(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{session.session_name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            session.status === 'completed'
                              ? 'bg-green-600 text-white'
                              : 'bg-orange-600 text-white'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(session.started_at).toLocaleString()} - {session.completed_at ? new Date(session.completed_at).toLocaleString() : 'Ongoing'}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Profit</div>
                        <div className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}${profit.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">ROI</div>
                        <div className={`text-lg font-bold ${parseFloat(roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {roi}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Wagered</div>
                        <div className="text-lg font-bold text-orange-400">${session.total_wagered.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Card</div>
                        <div className="text-lg font-bold text-white">
                          {session.current_card_index + 1}/{session.config.totalCards}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
