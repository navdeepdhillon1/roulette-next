// lib/decideBet.ts
import type { Spin, Card, CardStep, Decision, SkipStrategy } from '@/stores/gameState'

// Main decision function with skip logic
export function makeDecisionWithSkips(
  spins: Spin[],
  cardState: Card,
  skipStrategy: SkipStrategy
): Decision {
  // Get base analytics
  const base = calculateBaseDecision(spins)
  
  // Check skip conditions
  const skipReasons: string[] = []
  let shouldSkip = false
  
  // 1. Check consecutive losses
  const recentLosses = countRecentLosses(cardState.steps)
  if (recentLosses >= skipStrategy.maxConsecutiveLosses) {
    skipReasons.push(`${recentLosses} consecutive losses - cool down needed`)
    shouldSkip = true
  }
  
  // 2. Check volatility
  const volatility = calculateVolatility(spins, 10)
  if (volatility > skipStrategy.maxVolatility) {
    skipReasons.push(`High volatility (${(volatility * 100).toFixed(0)}%)`)
    shouldSkip = true
  }
  
  // 3. Check confidence
  if (base.confidence < skipStrategy.minConfidence) {
    skipReasons.push(`Low confidence (${(base.confidence * 100).toFixed(0)}%)`)
    shouldSkip = true
  }
  
  // 4. Check survival probability
  const survivalProb = calculateSurvivalProbability(cardState, base.stake || 5)
  if (survivalProb < skipStrategy.minSurvival) {
    skipReasons.push(`Poor survival chance (${(survivalProb * 100).toFixed(0)}%)`)
    shouldSkip = true
  }
  
  // 5. Pattern break detection
  if (skipStrategy.skipOnPatternBreak && detectPatternBreak(spins, cardState)) {
    skipReasons.push("Pattern invalidated - wait for new setup")
    shouldSkip = true
  }
  
  // 6. After big win
  if (skipStrategy.skipAfterBigWin && checkRecentBigWin(cardState.steps)) {
    skipReasons.push("Consolidating after significant win")
    shouldSkip = true
  }
  
  // 7. Skip streak recovery
  const currentSkipStreak = getCurrentSkipStreak(cardState.steps)
  if (currentSkipStreak > 0 && skipStrategy.requireConfirmationAfterSkip) {
    if (base.confidence < 0.75) {
      skipReasons.push("Awaiting stronger signal after skip")
      shouldSkip = true
    }
  }
  
  // Determine decision type
  let decision: "BET" | "SKIP" | "SIT_OUT"
  if (shouldSkip) {
    decision = skipReasons.length > 2 ? "SIT_OUT" : "SKIP"
  } else {
    decision = "BET"
  }
  
  return {
    ...base,
    decision,
    skipReasons,
    riskLevel: calculateRiskLevel(base, cardState),
    marketCondition: assessMarketCondition(spins),
    survivalProb
  }
}

// Calculate base decision without skip logic
function calculateBaseDecision(spins: Spin[]): Decision {
  if (spins.length < 5) {
    return {
      decision: "SKIP",
      side: null,
      betOn: null,
      stake: null,
      confidence: 0,
      reasons: ["Not enough data - need at least 5 spins"],
      skipReasons: [],
      riskLevel: "high",
      survivalProb: 0.5,
      expectedValue: 0,
      patternQuality: "none",
      marketCondition: "volatile",
      metrics: {}
    }
  }
  
  // Get last 40 non-zero spins
  const recentSpins = spins.filter(s => s.n !== 0).slice(-40)
  
  // Calculate metrics for different windows
  const metrics5 = calculateWindowMetrics(recentSpins.slice(-5))
  const metrics10 = calculateWindowMetrics(recentSpins.slice(-10))
  const metrics15 = calculateWindowMetrics(recentSpins.slice(-15))
  
  // Determine direction based on patterns
  const direction = determineDirection(metrics5, metrics10, metrics15)
  
  // Determine which side to bet on
  let betOn: "A" | "B" | null = null
  let side: "FOLLOW" | "STAY" | null = null
  
  if (direction.action === "FOLLOW") {
    side = "FOLLOW"
    betOn = metrics5.majorityColor === "red" ? "A" : "B"
  } else if (direction.action === "STAY") {
    side = "STAY"
    betOn = metrics5.majorityColor === "red" ? "B" : "A"
  }
  
  // Calculate confidence
  const confidence = calculateConfidence(metrics5, metrics10, metrics15, direction)
  
  // Determine stake (simple progression for now)
  const stake = 5 // Base unit
  
  return {
    decision: confidence > 0.3 ? "BET" : "SKIP",
    side,
    betOn,
    stake,
    confidence,
    reasons: direction.reasons,
    skipReasons: [],
    riskLevel: "medium",
    survivalProb: 0.7,
    expectedValue: 0,
    patternQuality: direction.strength > 0.6 ? "strong" : direction.strength > 0.3 ? "moderate" : "weak",
    marketCondition: metrics10.volatility > 0.6 ? "volatile" : "stable",
    metrics: {
      metrics5,
      metrics10,
      metrics15
    }
  }
}

// Window metrics calculation
interface WindowMetrics {
  redCount: number
  blackCount: number
  flipsPercent: number
  zScore: number
  entropy: number
  volatility: number
  majorityColor: "red" | "black"
  runLength: number
}

function calculateWindowMetrics(window: Spin[]): WindowMetrics {
  if (window.length === 0) {
    return {
      redCount: 0,
      blackCount: 0,
      flipsPercent: 0,
      zScore: 0,
      entropy: 0,
      volatility: 0,
      majorityColor: "red",
      runLength: 0
    }
  }
  
  const redCount = window.filter(s => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(s.n)).length
  const blackCount = window.length - redCount
  
  // Calculate flips (alternations)
  let flips = 0
  for (let i = 1; i < window.length; i++) {
    const prev = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(window[i-1].n)
    const curr = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(window[i].n)
    if (prev !== curr) flips++
  }
  const flipsPercent = window.length > 1 ? flips / (window.length - 1) : 0
  
  // Calculate z-score (bias)
  const p0 = 18/37 // Fair probability for red/black
  const expected = window.length * p0
  const zScore = window.length > 0 ? (redCount - expected) / Math.sqrt(window.length * p0 * (1 - p0)) : 0
  
  // Calculate entropy (0 to 1, lower means more structured)
  const pRed = redCount / window.length
  const pBlack = blackCount / window.length
  let entropy = 0
  if (pRed > 0) entropy -= pRed * Math.log2(pRed)
  if (pBlack > 0) entropy -= pBlack * Math.log2(pBlack)
  entropy = entropy / Math.log2(2) // Normalize to 0-1
  
  // Calculate current run length
  let runLength = 1
  const lastColor = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(window[window.length - 1].n)
  for (let i = window.length - 2; i >= 0; i--) {
    const color = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(window[i].n)
    if (color === lastColor) runLength++
    else break
  }
  
  return {
    redCount,
    blackCount,
    flipsPercent,
    zScore,
    entropy,
    volatility: flipsPercent,
    majorityColor: redCount > blackCount ? "red" : "black",
    runLength
  }
}

// Determine betting direction
function determineDirection(metrics5: WindowMetrics, metrics10: WindowMetrics, metrics15: WindowMetrics) {
  const votes: { action: string, weight: number, reason: string }[] = []
  
  // 5-spin window (weight: 0.25)
  if (metrics5.flipsPercent >= 0.6) {
    votes.push({ action: "STAY", weight: 0.25, reason: "High alternation in last 5" })
  } else if (Math.abs(metrics5.zScore) >= 2.0 || metrics5.entropy <= 0.8) {
    votes.push({ action: "FOLLOW", weight: 0.25, reason: "Strong bias in last 5" })
  } else if (metrics5.runLength >= 3) {
    votes.push({ action: "FOLLOW", weight: 0.25, reason: "Momentum building" })
  }
  
  // 10-spin window (weight: 0.5)
  if (metrics10.flipsPercent >= 0.6) {
    votes.push({ action: "STAY", weight: 0.5, reason: "Consistent alternation pattern" })
  } else if (Math.abs(metrics10.zScore) >= 1.5) {
    votes.push({ action: "FOLLOW", weight: 0.5, reason: "Medium-term bias detected" })
  } else if (metrics10.entropy <= 0.85) {
    votes.push({ action: "FOLLOW", weight: 0.5, reason: "Structured pattern in last 10" })
  }
  
  // 15-spin window (weight: 0.25)
  if (Math.abs(metrics15.zScore) >= 1.0) {
    votes.push({ action: "FOLLOW", weight: 0.25, reason: "Long-term trend present" })
  }
  
  // Aggregate votes
  let followScore = 0
  let stayScore = 0
  const reasons: string[] = []
  
  for (const vote of votes) {
    if (vote.action === "FOLLOW") followScore += vote.weight
    else if (vote.action === "STAY") stayScore += vote.weight
    reasons.push(vote.reason)
  }
  
  const totalScore = followScore + stayScore
  const strength = Math.max(followScore, stayScore) / Math.max(totalScore, 1)
  
  if (followScore > stayScore) {
    return { action: "FOLLOW", strength, reasons }
  } else if (stayScore > followScore) {
    return { action: "STAY", strength, reasons }
  } else {
    return { action: "NEUTRAL", strength: 0, reasons: ["No clear pattern"] }
  }
}

// Calculate confidence score
function calculateConfidence(
  metrics5: WindowMetrics,
  metrics10: WindowMetrics,
  metrics15: WindowMetrics,
  direction: any
): number {
  let confidence = 0.5 // Base confidence
  
  // Adjust based on pattern strength
  confidence += direction.strength * 0.2
  
  // Adjust based on consistency across windows
  if (Math.sign(metrics5.zScore) === Math.sign(metrics10.zScore)) {
    confidence += 0.1
  }
  
  // Penalize high volatility
  confidence -= metrics10.volatility * 0.2
  
  // Bonus for low entropy (structured pattern)
  if (metrics10.entropy < 0.8) {
    confidence += 0.15
  }
  
  return Math.max(0, Math.min(1, confidence))
}

// Helper functions
function countRecentLosses(steps: CardStep[]): number {
  let count = 0
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].outcome === "loss") count++
    else if (steps[i].outcome === "win") break
  }
  return count
}

function getCurrentSkipStreak(steps: CardStep[]): number {
  let count = 0
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].userAction.action === "skip") count++
    else break
  }
  return count
}

function detectPatternBreak(spins: Spin[], card: Card): boolean {
  // Simple pattern break: if the last 3 spins are opposite to previous trend
  if (spins.length < 10) return false
  
  const last3 = spins.slice(-3)
  const prev7 = spins.slice(-10, -3)
  
  const last3Red = last3.filter(s => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(s.n)).length
  const prev7Red = prev7.filter(s => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(s.n)).length
  
  const last3RedPct = last3Red / 3
  const prev7RedPct = prev7Red / 7
  
  return Math.abs(last3RedPct - prev7RedPct) > 0.5
}

function checkRecentBigWin(steps: CardStep[]): boolean {
  if (steps.length === 0) return false
  const lastWin = steps.filter(s => s.outcome === "win").pop()
  return lastWin ? lastWin.pl >= (lastWin.userAction.stake || 0) * 1.5 : false
}

function calculateRiskLevel(decision: any, card: Card): "low" | "medium" | "high" | "extreme" {
  const lossCount = card.steps.filter(s => s.outcome === "loss").length
  const bankrollRisk = (decision.stake || 0) / 100 // Assume 100 base bankroll
  
  if (decision.confidence < 0.3 || lossCount >= 5) return "extreme"
  if (decision.confidence < 0.5 || lossCount >= 3) return "high"
  if (decision.confidence < 0.7 || bankrollRisk > 0.05) return "medium"
  return "low"
}

function assessMarketCondition(spins: Spin[]): "stable" | "transitioning" | "volatile" | "chaotic" {
  if (spins.length < 10) return "volatile"
  
  const volatility = calculateVolatility(spins, 10)
  
  if (volatility > 0.75) return "chaotic"
  if (volatility > 0.6) return "volatile"
  if (volatility > 0.45) return "transitioning"
  return "stable"
}

function calculateVolatility(spins: Spin[], window: number): number {
  const recent = spins.slice(-window)
  if (recent.length < 2) return 0
  
  let flips = 0
  for (let i = 1; i < recent.length; i++) {
    const prevRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(recent[i-1].n)
    const currRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(recent[i].n)
    if (prevRed !== currRed) flips++
  }
  
  return flips / (recent.length - 1)
}

function calculateSurvivalProbability(card: Card, nextStake: number): number {
  // Simple survival calculation based on remaining bankroll and stake size
  const totalPL = card.steps.reduce((sum, s) => sum + s.pl, 0)
  const assumedBankroll = 100 + totalPL
  
  if (assumedBankroll <= 0) return 0
  
  const stakePct = nextStake / assumedBankroll
  const remainingBets = card.settings.maxBetsPerCard - card.actualBets
  
  // Simple estimation: can we afford the remaining bets at this stake level?
  const worstCase = nextStake * remainingBets
  const survivalRatio = assumedBankroll / worstCase
  
  return Math.max(0, Math.min(1, survivalRatio))
}