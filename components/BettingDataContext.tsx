'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// ==================== TYPES ====================
interface SpinData {
  number: number
  timestamp: number
  sessionId?: string
  cardId?: string
}

interface SessionStats {
  totalSpins: number
  totalWagered: number
  totalReturned: number
  currentBankroll: number
  roi: number
}

interface BetRecommendation {
  id: string
  groupId: string
  groupName: string
  reason: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedAmount: number
  timestamp: number
}

interface BettingDataContextType {
  // Spin History
  spinHistory: SpinData[]
  addSpin: (spin: SpinData) => void
  clearSpins: () => void
  
  // Session Stats
  sessionStats: SessionStats
  updateSessionStats: (stats: Partial<SessionStats>) => void
  
  // Recommendations
  recommendations: BetRecommendation[]
  addRecommendation: (rec: Omit<BetRecommendation, 'id' | 'timestamp'>) => void
  clearRecommendations: () => void
  currentRecommendation: BetRecommendation | null
  setCurrentRecommendation: (rec: BetRecommendation | null) => void
  
  // UI State
  isAdvisorOpen: boolean
  setIsAdvisorOpen: (open: boolean) => void
  isBetCardOpen: boolean
  setIsBetCardOpen: (open: boolean) => void
}

// ==================== CONTEXT ====================
const BettingDataContext = createContext<BettingDataContextType | undefined>(undefined)

// ==================== PROVIDER ====================
export function BettingDataProvider({ children }: { children: ReactNode }) {
  // Spin History State
  const [spinHistory, setSpinHistory] = useState<SpinData[]>([])
  
  // Session Stats State
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSpins: 0,
    totalWagered: 0,
    totalReturned: 0,
    currentBankroll: 0,
    roi: 0
  })
  
  // Recommendations State
  const [recommendations, setRecommendations] = useState<BetRecommendation[]>([])
  const [currentRecommendation, setCurrentRecommendation] = useState<BetRecommendation | null>(null)
  
  // UI State
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false)
  const [isBetCardOpen, setIsBetCardOpen] = useState(false)

  // ==================== FUNCTIONS ====================
  
  const addSpin = (spin: SpinData) => {
    setSpinHistory(prev => [...prev, spin])
    setSessionStats(prev => ({
      ...prev,
      totalSpins: prev.totalSpins + 1
    }))
  }

  const clearSpins = () => {
    setSpinHistory([])
  }

  const updateSessionStats = (stats: Partial<SessionStats>) => {
    setSessionStats(prev => ({ ...prev, ...stats }))
  }

  const addRecommendation = (rec: Omit<BetRecommendation, 'id' | 'timestamp'>) => {
    const newRec: BetRecommendation = {
      ...rec,
      id: `rec-${Date.now()}`,
      timestamp: Date.now()
    }
    setRecommendations(prev => [...prev, newRec])
  }

  const clearRecommendations = () => {
    setRecommendations([])
    setCurrentRecommendation(null)
  }

  // ==================== CONTEXT VALUE ====================
  const value: BettingDataContextType = {
    spinHistory,
    addSpin,
    clearSpins,
    sessionStats,
    updateSessionStats,
    recommendations,
    addRecommendation,
    clearRecommendations,
    currentRecommendation,
    setCurrentRecommendation,
    isAdvisorOpen,
    setIsAdvisorOpen,
    isBetCardOpen,
    setIsBetCardOpen
  }

  return (
    <BettingDataContext.Provider value={value}>
      {children}
    </BettingDataContext.Provider>
  )
}

// ==================== HOOK ====================
export function useBettingData() {
  const context = useContext(BettingDataContext)
  if (context === undefined) {
    throw new Error('useBettingData must be used within a BettingDataProvider')
  }
  return context
}