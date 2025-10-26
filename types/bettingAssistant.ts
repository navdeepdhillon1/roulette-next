// types/bettingAssistant.ts

export type BetKey = 
  | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' 
  | 'dozen1' | 'dozen2' | 'dozen3' 
  | 'col1' | 'col2' | 'col3'
  | 'alt1_1' | 'alt1_2' 
  | 'alt2_1' | 'alt2_2' 
  | 'alt3_1' | 'alt3_2'
  | 'edge' | 'center' 
  | 'six1' | 'six2' | 'six3' | 'six4' | 'six5' | 'six6'

export interface BetRecord {
  id: string
  timestamp: number
  bets: Record<BetKey, number>
  spinNumber: number | null
  results: Record<BetKey, number>
  totalPnL: number
  betType: string
  betAmount: number
  outcome: 'win' | 'loss'
  winAmount: number
  numberHit: number
  cardId: string
  betNumber: number
  runningCardTotal: number
  runningBankroll: number
}

export interface BettingSystemConfig {
  id: string
  name: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
  emoji?: string
  baseBet: number
  currentBet: number
  consecutiveWins: number
  consecutiveLosses: number
  sequenceIndex?: number
  isCustom?: boolean
  customRules?: CustomSystemRules  // OLD: Outcome-based rules (keep for backward compatibility)
  sequentialRules?: SequentialProgressionRules  // NEW: Sequential progression system
}

export interface CustomSystemRules {
  onWin: BetAction
  onFirstLoss: BetAction
  onSecondLoss: BetAction
  onThirdLoss: BetAction
  maxMultiplier: number
  resetAfterWin: boolean
  pauseAfterLosses: number | null
}

// NEW: Sequential Progression System
export interface SequentialProgressionRules {
  sequence: number[]  // Array of multipliers, e.g., [1, 1, 2, 2, 4, 4, 8, 8]
  onWin: 'reset' | 'moveBack1' | 'moveBack2' | 'stay'
  onLoss: 'moveForward1' | 'moveForward2' | 'stay'
  resetAfterConsecutiveWins?: number  // Auto-reset after X consecutive wins
  resetAfterConsecutiveLosses?: number  // Auto-reset after X consecutive losses
  atSequenceEnd: 'stay' | 'reset' | 'pause'  // What to do at end of sequence
  currentPosition: number  // Current position in sequence (0-indexed)
}

export type BetAction =
  | 'same'
  | 'double'
  | 'reset'
  | { type: 'increase', amount: number }
  | { type: 'multiply', factor: number }
  | 'pause'

export interface BetCard {
  id: string
  cardNumber: number
  target: number
  maxBets: number
  bets: BetRecord[]
  status: 'locked' | 'active' | 'completed' | 'failed'
  currentTotal: number
  betsUsed: number
  startTime: Date | null
}

// Group selection for "My Groups" layout
export type GroupType = 'table' | 'wheel' | 'custom'

export interface CustomGroup {
  id: string
  name: string
  numbers: number[]  // Array of roulette numbers (0-36)
}

export interface SelectedGroup {
  type: GroupType
  id: string  // e.g., 'red', 'voisins', or custom group ID
  name: string  // Display name
  customGroup?: CustomGroup  // Only for custom groups
}

export interface SessionConfig {
  bankroll: number
  stopProfit: number
  stopLoss: number
  timeLimit: number
  cardTargetAmount: number
  maxBetsPerCard: number
  totalCards: number
  betMode: 'table' | 'wheel'
  betCategory: 'common' | 'special'
  bettingSystem: BettingSystemConfig
  selectedGroups?: SelectedGroup[]  // Groups selected for "My Groups" layout
  historyLayout?: 'table' | 'wheel' | 'my-groups'  // Current layout view
  // Casino & Dealer tracking
  casinoId?: string | null
  casinoName?: string | null
  dealerId?: string | null
  dealerName?: string | null
  tableNumber?: string | null
}

export interface SessionState {
  id: string
  config: SessionConfig
  cards: BetCard[]
  currentCardIndex: number
  currentBankroll: number
  totalWagered: number
  totalReturned: number
}

export interface ProbabilityGroupStats {
  id: string
  name: string
  streakScore: number
  dueScore: number
  currentStreak: number
  currentAbsence: number
  zScore: number
}