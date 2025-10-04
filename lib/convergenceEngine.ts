// convergenceEngine.ts - pure analytics utilities (no JSX)

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ConvergenceResult {
  numbers: number[]
  confidence: Confidence
  reasoning: string[]
  activePatterns?: string[]
}

export interface ConvergenceStrength {
  strength: number
  interpretation: string
}

// Basic convergence calculation: rank numbers by recent frequency and derive confidence
export function calculateConvergence(history: number[]): ConvergenceResult {
  const sanitized = (history || []).filter(n => Number.isInteger(n) && n >= 0 && n <= 36)
  const window = sanitized.slice(-36)

  const counts = new Map<number, number>()
  for (let i = 0; i <= 36; i++) counts.set(i, 0)
  window.forEach(n => counts.set(n, (counts.get(n) || 0) + 1))

  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([num]) => num)

  const top5 = ranked.slice(0, 5)

  let confidence: Confidence = 'LOW'
  if (sanitized.length > 25) confidence = 'HIGH'
  else if (sanitized.length > 10) confidence = 'MEDIUM'

  const reasoning = [
    `Analyzed ${sanitized.length} spins (last ${window.length})`,
    'Ranked by recent frequency within last 36 spins'
  ]

  return {
    numbers: top5,
    confidence,
    reasoning,
    activePatterns: []
  }
}

// Convert convergence result into a numeric strength 0-100 with interpretation
export function getConvergenceStrength(result: ConvergenceResult): ConvergenceStrength {
  const base = result.confidence === 'HIGH' ? 80 : result.confidence === 'MEDIUM' ? 55 : 30
  // Slightly adjust by spread of the top numbers (fewer duplicates => weaker); here we just use count
  const adjustment = Math.max(0, 5 - new Set(result.numbers).size) * -2
  const strength = Math.max(0, Math.min(100, base + adjustment))

  const interpretation = strength >= 70 ? 'Strong' : strength >= 40 ? 'Moderate' : 'Weak'
  return { strength, interpretation }
}