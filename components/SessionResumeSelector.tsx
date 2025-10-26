// components/SessionResumeSelector.tsx
// UI for resuming active sessions (Elite tier)

'use client'

import { useState, useEffect } from 'react'
import { listUserSessions, loadBettingSession, loadCardSteps } from '@/lib/bettingAssistantStorage'
import type { SessionState } from '@/types/bettingAssistant'

interface SessionResumeSelectorProps {
  userId: string
  onResumeSession: (session: SessionState, supabaseSessionId: string, casinoId: string | null, dealerId: string | null, tableNumber: string | null) => void
  onStartNew: () => void
}

export default function SessionResumeSelector({
  userId,
  onResumeSession,
  onStartNew,
}: SessionResumeSelectorProps) {
  const [loading, setLoading] = useState(true)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)

  useEffect(() => {
    loadActiveSessions()
  }, [userId])

  const loadActiveSessions = async () => {
    setLoading(true)
    const result = await listUserSessions(userId, 50)

    if ('sessions' in result) {
      // Filter for active sessions only
      const active = result.sessions.filter((s) => s.status === 'active')
      setActiveSessions(active)
    }

    setLoading(false)
  }

  const handleResumeSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId)

    try {
      // Load session and cards from Supabase
      const result = await loadBettingSession(userId, sessionId)

      if ('error' in result) {
        alert(`Failed to load session: ${result.error}`)
        setLoadingSessionId(null)
        return
      }

      const { session: supabaseSession, cards: supabaseCards } = result

      // Convert Supabase data to SessionState format
      const cards = await Promise.all(
        supabaseCards.map(async (card: any) => {
          // Load all steps for this card
          const stepsResult = await loadCardSteps(card.id)
          const steps = 'steps' in stepsResult ? stepsResult.steps : []

          // Convert steps to BetRecord format
          const bets = steps.map((step: any) => ({
            id: `bet-${step.step_number}`,
            timestamp: new Date(step.created_at).getTime(),
            betType: step.bet_type || 'unknown',
            betAmount: step.total_stake || 0,
            outcome: step.outcome,
            winAmount: step.payout || 0,
            numberHit: step.spin_number || 0,
            cardId: card.id,
            betNumber: step.bet_number || 0,
            runningCardTotal: step.running_card_total || 0,
            runningBankroll: step.running_bankroll || 0,
            bets: step.bet_groups || {},
            spinNumber: step.spin_number || 0,
            results: {},
            totalPnL: step.net_pl || 0,
          }))

          return {
            id: card.id,
            cardNumber: card.card_number,
            target: card.target,
            maxBets: card.max_bets,
            bets,
            status: card.status,
            currentTotal: card.current_total || 0,
            betsUsed: card.bets_used || 0,
            startTime: card.started_at ? new Date(card.started_at) : null,
          }
        })
      )

      const sessionState: SessionState = {
        id: supabaseSession.id,
        config: supabaseSession.config,
        cards,
        currentCardIndex: supabaseSession.current_card_index || 0,
        currentBankroll: supabaseSession.current_bankroll,
        totalWagered: supabaseSession.total_wagered || 0,
        totalReturned: supabaseSession.total_returned || 0,
      }

      // Extract location data from session
      const casinoId = supabaseSession.casino_id || null
      const tableNumber = supabaseSession.table_number || null

      // Try to get dealer_id from the most recent step
      let dealerId: string | null = null
      const stepsResult = await loadCardSteps(cards[supabaseSession.current_card_index]?.id)
      if ('steps' in stepsResult && stepsResult.steps.length > 0) {
        const lastStep = stepsResult.steps[stepsResult.steps.length - 1]
        dealerId = lastStep.dealer_id || null
      }

      onResumeSession(sessionState, sessionId, casinoId, dealerId, tableNumber)
    } catch (err) {
      alert(`Error loading session: ${err}`)
      setLoadingSessionId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-cyan-500/30">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-300">Loading your sessions...</p>
        </div>
      </div>
    )
  }

  if (activeSessions.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-cyan-500/30">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Sessions</h3>
          <p className="text-gray-400 mb-6">You don't have any sessions in progress</p>
          <button
            onClick={onStartNew}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
          >
            Start New Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-cyan-400 mb-2">Welcome Back!</h2>
        <p className="text-gray-300">You have {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid gap-4">
        {activeSessions.map((session) => {
          const profit = (session.total_returned || 0) - (session.total_wagered || 0)
          const roi = session.total_wagered > 0
            ? ((profit / session.total_wagered) * 100).toFixed(1)
            : '0.0'

          return (
            <div
              key={session.id}
              className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{session.session_name}</h3>
                  <p className="text-sm text-gray-400">
                    Started {new Date(session.started_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">
                    Last active {new Date(session.last_activity_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                  </div>
                  <div className={`text-sm ${parseFloat(roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ROI: {roi}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-center">
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Bankroll</div>
                  <div className="text-lg font-bold text-cyan-400">${session.current_bankroll.toFixed(0)}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Card</div>
                  <div className="text-lg font-bold text-white">
                    {session.current_card_index + 1} / {session.config.totalCards}
                  </div>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Wagered</div>
                  <div className="text-lg font-bold text-orange-400">${session.total_wagered.toFixed(0)}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Returned</div>
                  <div className="text-lg font-bold text-green-400">${session.total_returned.toFixed(0)}</div>
                </div>
              </div>

              <button
                onClick={() => handleResumeSession(session.id)}
                disabled={loadingSessionId === session.id}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSessionId === session.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🔄</span>
                    Loading...
                  </span>
                ) : (
                  '▶️ Resume Session'
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="text-center pt-4 border-t border-gray-700">
        <button
          onClick={onStartNew}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all"
        >
          + Start New Session Instead
        </button>
      </div>
    </div>
  )
}
