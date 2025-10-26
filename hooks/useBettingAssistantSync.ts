// hooks/useBettingAssistantSync.ts
// Auto-save hook for Betting Assistant cloud storage (Elite tier)

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  createBettingSession,
  updateBettingSession,
  createBettingCards,
  updateBettingCard,
  saveBettingCardStep,
  hasEliteTierAccess,
} from '@/lib/bettingAssistantStorage'
import type { SessionState, BetCard, BetRecord } from '@/types/bettingAssistant'

interface SyncOptions {
  userId: string | null
  casinoId?: string | null
  dealerId?: string | null
  tableNumber?: string | null
  existingSessionId?: string | null // For resumed sessions
}

export function useBettingAssistantSync(
  session: SessionState | null,
  options: SyncOptions
) {
  console.log('[Sync Hook] Initialized with:', { hasSession: !!session, userId: options.userId, casinoId: options.casinoId })

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [hasEliteAccess, setHasEliteAccess] = useState(false)
  const [supabaseSessionId, setSupabaseSessionId] = useState<string | null>(
    options.existingSessionId || null
  )
  const [cardIdMapping, setCardIdMapping] = useState<Record<string, string>>({}) // local ID → Supabase UUID

  // Track what's been saved to avoid duplicate saves
  const savedSessionRef = useRef(false)
  const savedCardsRef = useRef<Set<string>>(new Set())
  const savedStepsRef = useRef<Set<string>>(new Set())

  // Check Elite tier access on mount
  useEffect(() => {
    async function checkAccess() {
      if (!options.userId) {
        setHasEliteAccess(false)
        return
      }

      const hasAccess = await hasEliteTierAccess(options.userId)
      setHasEliteAccess(hasAccess)
    }

    checkAccess()
  }, [options.userId])

  // Save session to Supabase when it's first created (skip if already have ID from resume)
  useEffect(() => {
    console.log('[Sync Hook] Save session check:', {
      hasSession: !!session,
      hasEliteAccess,
      userId: options.userId,
      savedAlready: savedSessionRef.current,
      hasSupabaseId: !!supabaseSessionId
    })

    if (!session || !hasEliteAccess || !options.userId || savedSessionRef.current || supabaseSessionId) return

    async function saveSession() {
      if (!session || !options.userId) return

      console.log('[Sync Hook] Creating session in Supabase...')
      setSyncStatus('syncing')
      const result = await createBettingSession(
        options.userId,
        session.config,
        `Session ${new Date().toLocaleDateString()}`,
        options.casinoId || undefined,
        options.tableNumber || undefined
      )

      if ('sessionId' in result) {
        setSupabaseSessionId(result.sessionId)
        savedSessionRef.current = true
        setSyncStatus('synced')
      } else {
        console.error('Failed to save session:', result.error)
        setSyncStatus('error')
      }
    }

    saveSession()
  }, [session, hasEliteAccess, options.userId, options.casinoId, options.tableNumber, supabaseSessionId])

  // Save cards when they're created
  useEffect(() => {
    if (!session || !supabaseSessionId || !hasEliteAccess || !options.userId) return

    const unsavedCards = session.cards.filter((card) => !savedCardsRef.current.has(card.id))
    if (unsavedCards.length === 0) return

    async function saveCards() {
      if (!session || !supabaseSessionId || !options.userId) return

      setSyncStatus('syncing')
      const result = await createBettingCards(options.userId, supabaseSessionId, unsavedCards)

      if ('success' in result) {
        unsavedCards.forEach((card) => savedCardsRef.current.add(card.id))
        setSyncStatus('synced')
      } else {
        console.error('Failed to save cards:', result.error)
        setSyncStatus('error')
      }
    }

    saveCards()
  }, [session?.cards, supabaseSessionId, hasEliteAccess, options.userId])

  // Update session state (bankroll, totals, card index)
  useEffect(() => {
    if (!session || !supabaseSessionId || !hasEliteAccess) return

    async function updateSession() {
      if (!session || !supabaseSessionId) return

      setSyncStatus('syncing')
      const result = await updateBettingSession(supabaseSessionId, {
        currentCardIndex: session.currentCardIndex,
        currentBankroll: session.currentBankroll,
        totalWagered: session.totalWagered,
        totalReturned: session.totalReturned,
        config: session.config,
      })

      if ('success' in result) {
        setSyncStatus('synced')
      } else {
        console.error('Failed to update session:', result.error)
        setSyncStatus('error')
      }
    }

    // Debounce updates to avoid too many saves
    const timeoutId = setTimeout(updateSession, 1000)
    return () => clearTimeout(timeoutId)
  }, [
    session?.currentCardIndex,
    session?.currentBankroll,
    session?.totalWagered,
    session?.totalReturned,
    session?.config,
    supabaseSessionId,
    hasEliteAccess,
  ])

  // Save card steps (bets/skips) as they happen
  useEffect(() => {
    if (!session || !supabaseSessionId || !hasEliteAccess || !options.userId) return

    const currentCard = session.cards[session.currentCardIndex]
    if (!currentCard) return

    // Get unsaved bets
    const unsavedBets = currentCard.bets.filter((bet) => !savedStepsRef.current.has(bet.id))
    if (unsavedBets.length === 0) return

    async function saveBets() {
      if (!session || !supabaseSessionId || !options.userId) return

      setSyncStatus('syncing')

      // Get Supabase card ID (we need to fetch it since we don't have UUID mapping yet)
      // For now, we'll use the card's local ID and rely on session_id + card_number uniqueness
      const currentCard = session.cards[session.currentCardIndex]

      for (let i = 0; i < unsavedBets.length; i++) {
        const bet = unsavedBets[i]
        const stepNumber = currentCard.bets.indexOf(bet) + 1 // 1-based step number

        const result = await saveBettingCardStep(
          options.userId,
          supabaseSessionId,
          currentCard.id, // Will be matched by card_number in the DB
          bet,
          stepNumber, // Pass the sequential step number
          options.dealerId || undefined
        )

        if ('success' in result) {
          savedStepsRef.current.add(bet.id)
        } else {
          console.error('Failed to save bet step:', result.error)
          setSyncStatus('error')
          return
        }
      }

      setSyncStatus('synced')
    }

    saveBets()
  }, [
    session?.cards?.[session?.currentCardIndex ?? 0]?.bets,
    supabaseSessionId,
    hasEliteAccess,
    options.userId,
    options.dealerId,
  ])

  // Update card status when it changes
  useEffect(() => {
    if (!session || !supabaseSessionId || !hasEliteAccess) return

    const currentCard = session.cards[session.currentCardIndex]
    if (!currentCard) return

    async function updateCard() {
      if (!session || !supabaseSessionId) return

      const currentCard = session.cards[session.currentCardIndex]

      setSyncStatus('syncing')
      const result = await updateBettingCard(supabaseSessionId, currentCard.cardNumber, {
        currentTotal: currentCard.currentTotal,
        betsUsed: currentCard.betsUsed,
        status: currentCard.status,
      })

      if ('success' in result) {
        setSyncStatus('synced')
      } else {
        console.error('Failed to update card:', result.error)
        setSyncStatus('error')
      }
    }

    // Debounce
    const timeoutId = setTimeout(updateCard, 500)
    return () => clearTimeout(timeoutId)
  }, [
    session?.cards?.[session?.currentCardIndex ?? 0]?.currentTotal,
    session?.cards?.[session?.currentCardIndex ?? 0]?.betsUsed,
    session?.cards?.[session?.currentCardIndex ?? 0]?.status,
    supabaseSessionId,
    hasEliteAccess,
  ])

  // Mark session as completed when it ends
  async function endSession() {
    if (!supabaseSessionId || !hasEliteAccess) return

    setSyncStatus('syncing')
    const result = await updateBettingSession(supabaseSessionId, {
      status: 'completed',
    })

    if ('success' in result) {
      setSyncStatus('synced')
      // Reset tracking
      savedSessionRef.current = false
      savedCardsRef.current.clear()
      savedStepsRef.current.clear()
      setSupabaseSessionId(null)
    } else {
      console.error('Failed to end session:', result.error)
      setSyncStatus('error')
    }
  }

  return {
    syncStatus,
    hasEliteAccess,
    supabaseSessionId,
    endSession,
  }
}
