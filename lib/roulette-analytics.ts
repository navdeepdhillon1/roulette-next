import type { Spin } from './types'

export function calculateHitCounts(spins: Spin[], matcher: (spin: Spin) => boolean): [number, number, number, number] {
  const windows = [9, 18, 27, 36]
  const counts: number[] = []
  windows.forEach(window => {
    const lastNSpins = spins.slice(0, Math.min(window, spins.length))
    const hits = lastNSpins.filter(matcher).length
    counts.push(hits)
  })
  return counts as [number, number, number, number]
}

export function calculateAbsence(spins: Spin[], matcher: (spin: Spin) => boolean): { now: number, max: number } {
  let currentAbsence = 0
  let maxAbsence = 0
  let tempAbsence = 0
  
  for (let i = 0; i < spins.length; i++) {
    if (matcher(spins[i])) {
      if (i === 0) currentAbsence = 0
      maxAbsence = Math.max(maxAbsence, tempAbsence)
      tempAbsence = 0
    } else {
      tempAbsence++
      if (i === 0) currentAbsence = tempAbsence
    }
  }
  maxAbsence = Math.max(maxAbsence, tempAbsence)
  
  const lastHitIndex = spins.findIndex(matcher)
  if (lastHitIndex === -1) currentAbsence = spins.length
  else currentAbsence = lastHitIndex
  
  return { now: currentAbsence, max: maxAbsence }
}

export function calculateConsecutive(spins: Spin[], matcher: (spin: Spin) => boolean): { now: number, max: number } {
  let currentConsecutive = 0
  let maxConsecutive = 0
  let tempConsecutive = 0
  
  for (let i = 0; i < spins.length; i++) {
    if (matcher(spins[i])) {
      tempConsecutive++
      if (i === 0 || (i === 1 && tempConsecutive === 2)) currentConsecutive = tempConsecutive
      maxConsecutive = Math.max(maxConsecutive, tempConsecutive)
    } else {
      tempConsecutive = 0
      if (i === 0) currentConsecutive = 0
    }
  }
  
  return { now: currentConsecutive, max: maxConsecutive }
}

export function expectedPercentageFor(groupId: string): number {
  const expectedMap: { [key: string]: number } = {
    'red': 48.65, 'black': 48.65, 'green': 2.70,
    'even': 48.65, 'odd': 48.65,
    'low': 48.65, 'high': 48.65,
    '1st_dozen': 32.43, '2nd_dozen': 32.43, '3rd_dozen': 32.43,
    '1st_column': 32.43, '2nd_column': 32.43, '3rd_column': 32.43,
    'alt1_a': 48.65, 'alt1_b': 48.65,
    'alt2_aa': 48.65, 'alt2_bb': 48.65,
    'alt3_aaa': 48.65, 'alt3_bbb': 48.65,
    'edge': 48.65, 'center': 48.65,
    '1st_six': 16.22, '2nd_six': 16.22, '3rd_six': 16.22,
    '4th_six': 16.22, '5th_six': 16.22, '6th_six': 16.22
  }
  return expectedMap[groupId] || 0
}

export function statusFrom(percentage: number, expected: number, absenceNow: number): 'HOT' | 'COLD' | 'ALERT' | 'NORM' {
  const deviation = percentage - expected
  const absDeviation = Math.abs(deviation)
  if (absenceNow > 15 && expected > 30) return 'ALERT'
  if (absenceNow > 20 && expected > 15) return 'ALERT'
  if (absenceNow > 30 && expected > 2) return 'ALERT'
  if (absDeviation < expected * 0.1) return 'NORM'
  if (deviation > expected * 0.15) return 'HOT'
  if (deviation < -expected * 0.15) return 'COLD'
  return 'NORM'
}

export function hitCountsByNumberForWindow(spinsNumbers: number[], window: number = 36): Record<number, number> {
  const counts: Record<number, number> = {}
  const last = spinsNumbers.slice(0, Math.min(window, spinsNumbers.length))
  for (let i = 0; i <= 36; i++) {
    counts[i] = 0
  }
  for (const n of last) {
    if (typeof n === 'number' && n >= 0 && n <= 36) counts[n]++
  }
  return counts
}


