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
  customRules?: CustomSystemRules
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