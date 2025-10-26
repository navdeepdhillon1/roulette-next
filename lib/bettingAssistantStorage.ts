// lib/bettingAssistantStorage.ts
// Cloud storage functions for Betting Assistant (Elite Tier)

import { supabase } from './supabase'
import type { SessionState, BetCard, BetRecord, SessionConfig } from '@/types/bettingAssistant'

// ============================================================================
// CASINOS MANAGEMENT
// ============================================================================

export interface CasinoData {
  name: string
  type: 'online' | 'physical'
  location?: string
  address?: string
  website?: string
  platform?: string // e.g., "Evolution Gaming", "Playtech"
  notes?: string
  favorite?: boolean
}

/**
 * Create a new casino
 */
export async function createCasino(
  userId: string,
  casinoData: CasinoData
): Promise<{ casinoId: string } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('casinos')
      .insert({
        user_id: userId,
        ...casinoData,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    return { casinoId: data.id }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * List all casinos for a user
 */
export async function listCasinos(
  userId: string,
  options?: { type?: 'online' | 'physical'; favoritesOnly?: boolean }
): Promise<{ casinos: any[] } | { error: string }> {
  try {
    let query = supabase
      .from('casinos')
      .select('*')
      .eq('user_id', userId)
      .order('favorite', { ascending: false })
      .order('name', { ascending: true })

    if (options?.type) {
      query = query.eq('type', options.type)
    }

    if (options?.favoritesOnly) {
      query = query.eq('favorite', true)
    }

    const { data, error } = await query

    if (error) return { error: error.message }
    return { casinos: data || [] }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Update casino details
 */
export async function updateCasino(
  casinoId: string,
  updates: Partial<CasinoData>
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase
      .from('casinos')
      .update(updates)
      .eq('id', casinoId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Delete a casino (will cascade delete all dealers and sessions)
 */
export async function deleteCasino(
  casinoId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase
      .from('casinos')
      .delete()
      .eq('id', casinoId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

// ============================================================================
// DEALERS MANAGEMENT
// ============================================================================

export interface DealerData {
  name: string
  nickname?: string
  gender?: 'male' | 'female' | 'other'
  appearance?: string
  typical_shift?: string
  notes?: string
  rating?: number // 1-5
}

/**
 * Create a new dealer for a casino
 */
export async function createDealer(
  userId: string,
  casinoId: string,
  dealerData: DealerData
): Promise<{ dealerId: string } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('dealers')
      .insert({
        user_id: userId,
        casino_id: casinoId,
        ...dealerData,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    return { dealerId: data.id }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * List dealers for a specific casino
 */
export async function listDealersByCasino(
  casinoId: string,
  options?: { sortBy?: 'name' | 'rating' | 'profit' }
): Promise<{ dealers: any[] } | { error: string }> {
  try {
    let query = supabase
      .from('dealers')
      .select('*')
      .eq('casino_id', casinoId)

    // Apply sorting
    if (options?.sortBy === 'rating') {
      query = query.order('rating', { ascending: false, nullsLast: true })
    } else if (options?.sortBy === 'profit') {
      query = query.order('total_profit', { ascending: false })
    } else {
      query = query.order('name', { ascending: true })
    }

    const { data, error } = await query

    if (error) return { error: error.message }
    return { dealers: data || [] }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * List all dealers for a user (across all casinos)
 */
export async function listAllDealers(
  userId: string
): Promise<{ dealers: any[] } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('dealers')
      .select('*, casinos(name, type)')
      .eq('user_id', userId)
      .order('total_profit', { ascending: false })

    if (error) return { error: error.message }
    return { dealers: data || [] }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Update dealer details
 */
export async function updateDealer(
  dealerId: string,
  updates: Partial<DealerData>
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase
      .from('dealers')
      .update(updates)
      .eq('id', dealerId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Delete a dealer
 */
export async function deleteDealer(
  dealerId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase
      .from('dealers')
      .delete()
      .eq('id', dealerId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new betting session in Supabase
 */
export async function createBettingSession(
  userId: string,
  config: SessionConfig,
  sessionName?: string,
  casinoId?: string,
  tableNumber?: string,
  wheelNumber?: string,
  notes?: string
): Promise<{ sessionId: string } | { error: string }> {
  try {
    const sessionData: any = {
      user_id: userId,
      session_name: sessionName || `Session ${new Date().toLocaleDateString()}`,
      config: config as any,
      current_bankroll: config.bankroll,
      current_card_index: 0,
      status: 'active',
    }

    // Add optional fields
    if (casinoId) sessionData.casino_id = casinoId
    if (tableNumber) sessionData.table_number = tableNumber
    if (wheelNumber) sessionData.wheel_number = wheelNumber
    if (notes) sessionData.notes = notes

    const { data, error } = await supabase
      .from('betting_sessions')
      .insert(sessionData)
      .select('id')
      .single()

    if (error) return { error: error.message }
    return { sessionId: data.id }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Load an active or specific betting session
 */
export async function loadBettingSession(
  userId: string,
  sessionId?: string
): Promise<{ session: any; cards: any[] } | { error: string }> {
  try {
    let query = supabase
      .from('betting_sessions')
      .select('*')
      .eq('user_id', userId)

    if (sessionId) {
      query = query.eq('id', sessionId)
    } else {
      // Load most recent active session
      query = query.eq('status', 'active').order('last_activity_at', { ascending: false }).limit(1)
    }

    const { data: session, error: sessionError } = await query.single()

    if (sessionError) return { error: sessionError.message }

    // Load all cards for this session
    const { data: cards, error: cardsError } = await supabase
      .from('betting_cards')
      .select('*')
      .eq('session_id', session.id)
      .order('card_number', { ascending: true })

    if (cardsError) return { error: cardsError.message }

    return { session, cards: cards || [] }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Update session state (bankroll, card index, totals)
 */
export async function updateBettingSession(
  sessionId: string,
  updates: {
    currentCardIndex?: number
    currentBankroll?: number
    totalWagered?: number
    totalReturned?: number
    status?: 'active' | 'completed' | 'abandoned'
    config?: SessionConfig
  }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const updateData: any = {
      last_activity_at: new Date().toISOString(),
    }

    if (updates.currentCardIndex !== undefined) updateData.current_card_index = updates.currentCardIndex
    if (updates.currentBankroll !== undefined) updateData.current_bankroll = updates.currentBankroll
    if (updates.totalWagered !== undefined) updateData.total_wagered = updates.totalWagered
    if (updates.totalReturned !== undefined) updateData.total_returned = updates.totalReturned
    if (updates.status) updateData.status = updates.status
    if (updates.config) updateData.config = updates.config as any

    if (updates.status === 'completed' || updates.status === 'abandoned') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('betting_sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * List all sessions for a user (for history viewer)
 */
export async function listUserSessions(
  userId: string,
  limit: number = 20
): Promise<{ sessions: any[] } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('betting_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: false })
      .limit(limit)

    if (error) return { error: error.message }
    return { sessions: data || [] }
  } catch (err) {
    return { error: String(err) }
  }
}

// ============================================================================
// CARD MANAGEMENT
// ============================================================================

/**
 * Create all cards for a session
 */
export async function createBettingCards(
  userId: string,
  sessionId: string,
  cards: BetCard[]
): Promise<{ success: boolean } | { error: string }> {
  try {
    const cardsData = cards.map((card) => ({
      user_id: userId,
      session_id: sessionId,
      card_number: card.cardNumber,
      target: card.target,
      max_bets: card.maxBets,
      current_total: card.currentTotal,
      bets_used: card.betsUsed,
      status: card.status,
      started_at: card.startTime ? new Date(card.startTime).toISOString() : null,
    }))

    const { error } = await supabase.from('betting_cards').insert(cardsData)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Update a card's state
 */
export async function updateBettingCard(
  sessionId: string,
  cardNumber: number,
  updates: {
    currentTotal?: number
    betsUsed?: number
    skipsCount?: number
    status?: 'locked' | 'active' | 'completed' | 'failed'
    disciplinePct?: number
    skipDisciplinePct?: number
  }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const updateData: any = {}

    if (updates.currentTotal !== undefined) updateData.current_total = updates.currentTotal
    if (updates.betsUsed !== undefined) updateData.bets_used = updates.betsUsed
    if (updates.skipsCount !== undefined) updateData.skips_count = updates.skipsCount
    if (updates.status) updateData.status = updates.status
    if (updates.disciplinePct !== undefined) updateData.discipline_pct = updates.disciplinePct
    if (updates.skipDisciplinePct !== undefined) updateData.skip_discipline_pct = updates.skipDisciplinePct

    if (updates.status === 'active' && !updates.hasOwnProperty('started_at')) {
      updateData.started_at = new Date().toISOString()
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('betting_cards')
      .update(updateData)
      .eq('session_id', sessionId)
      .eq('card_number', cardNumber)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

/**
 * Load all steps for a card
 */
export async function loadCardSteps(
  cardId: string
): Promise<{ steps: any[] } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('betting_card_steps')
      .select('*')
      .eq('card_id', cardId)
      .order('step_number', { ascending: true })

    if (error) return { error: error.message }
    return { steps: data || [] }
  } catch (err) {
    return { error: String(err) }
  }
}

// ============================================================================
// CARD STEP MANAGEMENT (Individual Bets/Skips)
// ============================================================================

/**
 * Save a card step (bet or skip)
 */
export async function saveBettingCardStep(
  userId: string,
  sessionId: string,
  cardId: string, // This is local card ID like "card-1", we'll extract card number
  bet: BetRecord,
  stepNumber: number,
  dealerId?: string,
  suggestedAction?: string,
  suggestedSide?: string,
  confidence?: number,
  reasons?: any,
  followedSuggestion?: boolean
): Promise<{ success: boolean } | { error: string }> {
  try {
    // Extract card number from local card ID (e.g., "card-1" -> 1)
    const cardNumber = parseInt(cardId.split('-')[1] || '1')

    // First, find the actual card UUID by session_id + card_number
    const { data: cardData, error: cardError } = await supabase
      .from('betting_cards')
      .select('id')
      .eq('session_id', sessionId)
      .eq('card_number', cardNumber)
      .single()

    if (cardError || !cardData) {
      return { error: `Card not found: ${cardError?.message || 'Unknown error'}` }
    }

    const stepData: any = {
      user_id: userId,
      session_id: sessionId,
      card_id: cardData.id, // Use the actual UUID from database
      step_number: stepNumber, // Use sequential step number instead of bet.id
      bet_number: bet.betType === 'skip' ? null : parseInt(bet.id.split('-')[1] || '0'),
      spin_number: bet.spinNumber,
      bet_type: bet.betType,
      bet_groups: bet.betMatrix as any,
      total_stake: bet.stake,
      outcome: bet.outcome,
      payout: bet.payout,
      net_pl: bet.pnL,
      running_card_total: bet.runningCardTotal,
      running_bankroll: bet.runningBankroll,
      user_action: bet.betType === 'skip' ? 'skip' : 'bet',
    }

    // Add optional dealer
    if (dealerId) stepData.dealer_id = dealerId

    // Add optional decision engine data
    if (suggestedAction) stepData.suggested_action = suggestedAction
    if (suggestedSide) stepData.suggested_side = suggestedSide
    if (confidence !== undefined) stepData.confidence = confidence
    if (reasons) stepData.reasons = reasons
    if (followedSuggestion !== undefined) stepData.followed_suggestion = followedSuggestion

    const { error } = await supabase.from('betting_card_steps').insert(stepData)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: String(err) }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user has Pro or Elite tier (required for cloud storage)
 */
export async function hasEliteTierAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) return false
    return data.tier === 'pro' || data.tier === 'elite'
  } catch {
    return false
  }
}

/**
 * Delete old completed sessions (cleanup)
 */
export async function deleteOldSessions(
  userId: string,
  olderThanDays: number = 90
): Promise<{ deleted: number } | { error: string }> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await supabase
      .from('betting_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate.toISOString())
      .select('id')

    if (error) return { error: error.message }
    return { deleted: data?.length || 0 }
  } catch (err) {
    return { error: String(err) }
  }
}
