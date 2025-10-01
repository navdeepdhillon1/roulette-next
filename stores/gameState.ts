// stores/gameState.ts
import { create } from 'zustand'

export type EvenGroup = "red/black" | "even/odd" | "low/high"
export type Side = "A" | "B"
export type BetAction = "bet" | "skip" | "pending"
export type BetOutcome = "win" | "loss" | "push" | "skipped"

export interface Spin { 
  n: number
  ts: number
}

export interface SessionLimits {
  bankrollStart: number
  targetProfit: number
  stopLoss: number
  maxMinutes: number
}

export interface CardSettings {
  group: EvenGroup
  perCardTarget: number
  maxBetsPerCard: 10
  maxStepsPerCard: 15
  progression: number[]
  baseUnit: number
  adaptiveRule: "stay" | "follow" | "adaptive9"
  skipPenalty: boolean
}

export interface CardStep {
    stepNumber: number
    betNumber: number | null
    spinNumber: number | null
    suggested: {
      action: BetAction
      side: Side | null
      stake: number | null
      confidence: number
      reasons: string[]
    }
    userAction: {
      action: BetAction
      side: Side | null
      stake: number | null
      timestamp: number
    }
    outcome: "win" | "loss" | "push" | "skipped" | "pending"  // Add "pending" here
    pl: number
    runningTotal: number
    bankrollAfter: number
    followedSuggestion: boolean
    progressionIndex: number
    skipStreak: number
  }
export interface SkipStrategy {
    maxConsecutiveLosses: number
    maxVolatility: number
    minConfidence: number
    minSurvival: number
    smartSkip: boolean
    skipAfterBigWin: boolean
    skipOnPatternBreak: boolean
    resetProgressionOnSkip: boolean
    requireConfirmationAfterSkip: boolean
  }
  

  export interface Decision {
    decision: "BET" | "SKIP" | "SIT_OUT"
    side: "FOLLOW" | "STAY" | null
    betOn: "A" | "B" | null
    stake: number | null
    confidence: number
    reasons: string[]
    skipReasons?: string[]
    riskLevel: "low" | "medium" | "high" | "extreme"
    survivalProb: number
    expectedValue: number
    patternQuality: "strong" | "moderate" | "weak" | "none"
    marketCondition: "stable" | "transitioning" | "volatile" | "chaotic"
    metrics: Record<string, unknown>
  }
export type CardStatus = "active" | "closed" | "abandoned"

export interface Card {
  id: string
  openedAt: number
  closedAt?: number
  status: CardStatus
  settings: CardSettings
  steps: CardStep[]
  actualBets: number
  totalSteps: number
  skipsCount: number
  maxSkipStreak: number
  finalPL?: number
  disciplinePct?: number
  skipDisciplinePct?: number
  volatilitySnapshot?: {
    look5: string
    look10: string
    look15: string
  }
  reflection?: string
  closureReason?: string
}

export interface GameState {
  spins: Spin[]
  bankroll: number
  sessionPL: number
  sessionLimits: SessionLimits
  cardsModeOn: boolean
  activeCard?: Card
  cardsArchive: Card[]

  addSpin: (n: number) => void
  startCardsMode: (limits: SessionLimits, settings: CardSettings) => void
  closeActiveCard: (result: "won" | "lost" | "manual", reflection?: string) => void
  setBankroll: (v: number) => void
  updateActiveCard: (step: CardStep) => void
  updateLastStep: (updatedStep: CardStep) => void
}

// Create the store
export const useGameState = create<GameState>((set, get) => ({
  // Initial state
  spins: [],
  bankroll: 1000,
  sessionPL: 0,
  sessionLimits: {
    bankrollStart: 1000,
    targetProfit: 100,
    stopLoss: 150,
    maxMinutes: 60
  },
  cardsModeOn: false,
  activeCard: undefined,
  cardsArchive: [],

  // Actions
  addSpin: (n: number) => {
    set((state) => {
      const newSpin: Spin = {
        n,
        ts: Date.now()
      }
      
      // Update spins
      const updatedSpins = [...state.spins, newSpin]
      
      // If cards mode is on and there's an active card, process it
      // (We'll add card logic here later)
      
      return {
        spins: updatedSpins
      }
    })
  },

  startCardsMode: (limits: SessionLimits, settings: CardSettings) => {
    set((state) => {
      const newCard: Card = {
        id: `card-${Date.now()}`,
        openedAt: Date.now(),
        status: "active",
        settings,
        steps: [],
        actualBets: 0,
        totalSteps: 0,
        skipsCount: 0,
        maxSkipStreak: 0
      }
      
      return {
        cardsModeOn: true,
        sessionLimits: limits,
        activeCard: newCard
      }
    })
  },

  closeActiveCard: (result: "won" | "lost" | "manual", reflection?: string) => {
    set((state) => {
      if (!state.activeCard) return state
      
      const closedCard: Card = {
        ...state.activeCard,
        closedAt: Date.now(),
        status: "closed",
        closureReason: result === "won" ? "target_reached" : 
                      result === "lost" ? "max_bets" : "manual",
        reflection
      }
      
      return {
        activeCard: undefined,
        cardsArchive: [...state.cardsArchive, closedCard]
      }
    })
  },

  setBankroll: (v: number) => {
    set({ bankroll: v })
  },

  updateActiveCard: (step: CardStep) => {
    set((state) => {
      if (!state.activeCard) return state
      
      // Get the previous running total
      const previousTotal = state.activeCard.steps.length > 0 
        ? state.activeCard.steps[state.activeCard.steps.length - 1].runningTotal 
        : 0
      
      // For bets, we need to calculate P/L based on the last spin
      let pl = 0
      let outcome: 'win' | 'loss' | 'skipped' = 'skipped'
      
      if (step.userAction.action === 'bet' && step.userAction.stake) {
        // Get the most recent spin
        const lastSpin = state.spins[state.spins.length - 1]
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(lastSpin.n)
        const isBlack = !isRed && lastSpin.n !== 0
        const betOnRed = step.userAction.side === 'A'
        
        if ((betOnRed && isRed) || (!betOnRed && isBlack)) {
          pl = step.userAction.stake  // Win
          outcome = 'win'
        } else {
          pl = -step.userAction.stake  // Loss
          outcome = 'loss'
        }
      }
      
      // Create the completed step with calculated P/L
      const completedStep: CardStep = {
        ...step,
        pl,
        outcome,
        runningTotal: previousTotal + pl
      }
      
      return {
        activeCard: {
          ...state.activeCard,
          steps: [...state.activeCard.steps, completedStep],
          totalSteps: state.activeCard.steps.length + 1,
          actualBets: step.userAction.action === 'bet' ? 
            state.activeCard.actualBets + 1 : state.activeCard.actualBets,
          skipsCount: step.userAction.action === 'skip' ? 
            state.activeCard.skipsCount + 1 : state.activeCard.skipsCount
        },
        sessionPL: state.sessionPL + pl,
        bankroll: state.bankroll + pl
      }
    })
  },
  
  updateLastStep: (updatedStep: CardStep) => {
    set((state) => {
      if (!state.activeCard || state.activeCard.steps.length === 0) return state
      
      const steps = [...state.activeCard.steps]
      steps[steps.length - 1] = updatedStep
      
      // Recalculate running total
      const runningTotal = steps.reduce((sum, s) => sum + s.pl, 0)
      updatedStep.runningTotal = runningTotal
      
      return {
        activeCard: {
          ...state.activeCard,
          steps
        },
        bankroll: state.bankroll + updatedStep.pl,
        sessionPL: state.sessionPL + updatedStep.pl
      }
    })
  }
}))