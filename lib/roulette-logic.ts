import { Spin, Anomaly } from './types'

// Centralized roulette constants and helpers
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]
export const GREEN_NUMBERS = [0]

// European wheel order (clockwise from 0)
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
]

export type GroupKey =
  | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high'
  | 'dozen1' | 'dozen2' | 'dozen3'
  | 'col1' | 'col2' | 'col3'
  | 'six1' | 'six2' | 'six3' | 'six4' | 'six5' | 'six6'
  | 'alt1_1' | 'alt1_2' | 'alt2_1' | 'alt2_2' | 'alt3_1' | 'alt3_2'
  | 'edge' | 'center'

// Wheel/racetrack groups used by the Wheel view
export const WHEEL_BETS = {
  special: [
    { key: 'voisins', label: 'Voisins', color: 'bg-purple-600', numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25] },
    { key: 'orphelins', label: 'Orphelins', color: 'bg-indigo-600', numbers: [17,34,6,1,20,14,31,9] },
    { key: 'tiers', label: 'Tiers', color: 'bg-blue-600', numbers: [27,13,36,11,30,8,23,10,5,24,16,33] },
    { key: 'jeu_zero', label: 'Jeu Zero', color: 'bg-teal-600', numbers: [12,35,3,26,0,32,15] },
    { key: 'non_voisin', label: 'Non-Voisin', color: 'bg-pink-600', numbers: [17,34,6,1,20,14,31,9,27,13,36,11,30,8,23,10,5,24,16,33] }
  ],
  wheel18s: [
    { key: 'a_b', label: 'A/B', colorA: 'bg-red-600', colorB: 'bg-blue-600', groupA: [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3], groupB: [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26] },
    { key: 'aa_bb', label: 'AA/BB', colorA: 'bg-green-600', colorB: 'bg-yellow-600', groupA: [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35], groupB: [19,4,25,17,27,13,30,8,5,24,1,20,9,22,7,28,3,26] },
    { key: 'aaa_bbb', label: 'AAA/BBB', colorA: 'bg-cyan-600', colorB: 'bg-rose-600', groupA: [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12], groupB: [4,21,2,6,27,13,8,23,10,33,1,20,22,18,29,35,3,26] },
    { key: 'a6_b6', label: 'A6/B6', colorA: 'bg-orange-600', colorB: 'bg-lime-600', groupA: [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29], groupB: [25,17,34,6,27,13,5,24,16,33,1,20,7,28,12,35,3,26] },
    { key: 'a9_b9', label: 'A9/B9', colorA: 'bg-amber-600', colorB: 'bg-emerald-600', groupA: [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9], groupB: [6,27,13,36,11,30,8,23,10,22,18,29,7,28,12,35,3,26] },
    { key: 'right_left', label: 'Right/Left', colorA: 'bg-fuchsia-600', colorB: 'bg-sky-600', groupA: [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10], groupB: [5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26] }
  ],
  sectors9s: [
    { key: '1st_9', label: '1st 9', color: 'bg-red-700', numbers: [32,15,19,4,21,2,25,17,34] },
    { key: '2nd_9', label: '2nd 9', color: 'bg-blue-700', numbers: [6,27,13,36,11,30,8,23,10] },
    { key: '3rd_9', label: '3rd 9', color: 'bg-green-700', numbers: [5,24,16,33,1,20,14,31,9] },
    { key: '4th_9', label: '4th 9', color: 'bg-yellow-700', numbers: [22,18,29,7,28,12,35,3,26] }
  ]
} as const

// Wheel group membership lists for statistics and history
export const WHEEL_GROUPS = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  orphelins: [17, 34, 6, 1, 20, 14, 31, 9],
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  jeu_zero: [12, 35, 3, 26, 0, 32, 15],
  non_voisin: [1, 6, 8, 10, 11, 13, 14, 16, 17, 20, 23, 24, 27, 30, 31, 33, 34, 36],
  a: [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33],
  b: [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36],
  aa: [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30],
  bb: [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36],
  aaa: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27],
  bbb: [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36],
  a6: [1,2,3,4,5,6,19,20,21,22,23,24],
  b6: [7,8,9,10,11,12,13,14,15,16,17,18,25,26,27,28,29,30,31,32,33,34,35,36],
  a9: [1,2,3,4,5,6,7,8,9],
  b9: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],
  right: [19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20],
  left: [14,31,9,22,18,29,7,28,12,35,3,26,0,32,15],
  first_9: [32,15,19,4,21,2,25,17,34],
  second_9: [6,27,13,36,11,30,8,23,10],
  third_9: [5,24,16,33,1,20,14,31,9],
  fourth_9: [22,18,29,7,28,12,35,3,26]
} as const
// Alt/edge/center membership lists for quick checks
const ALT_EDGE_CENTER: Record<Exclude<GroupKey, 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'col1' | 'col2' | 'col3' | 'six1' | 'six2' | 'six3' | 'six4' | 'six5' | 'six6'>, number[]> = {
  alt1_1: [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33],
  alt1_2: [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36],
  alt2_1: [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30],
  alt2_2: [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36],
  alt3_1: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27],
  alt3_2: [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36],
  edge: [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36],
  center: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
}

export function checkIfGroupWon(num: number, group: GroupKey): boolean {
  if (num === 0) {
    return group === 'red' ? false : group === 'black' ? false :
      group === 'even' ? false : group === 'odd' ? false :
      group === 'low' ? false : group === 'high' ? false :
      group.startsWith('dozen') ? false :
      group.startsWith('col') ? false :
      group.startsWith('six') ? false :
      ALT_EDGE_CENTER[group as keyof typeof ALT_EDGE_CENTER]?.includes(num) ?? false
  }

  switch (group) {
    case 'red': return RED_NUMBERS.includes(num)
    case 'black': return BLACK_NUMBERS.includes(num)
    case 'even': return num % 2 === 0
    case 'odd': return num % 2 === 1
    case 'low': return num >= 1 && num <= 18
    case 'high': return num >= 19 && num <= 36
    case 'dozen1': return num >= 1 && num <= 12
    case 'dozen2': return num >= 13 && num <= 24
    case 'dozen3': return num >= 25 && num <= 36
    case 'col1': return num % 3 === 1
    case 'col2': return num % 3 === 2
    case 'col3': return num % 3 === 0
    case 'six1': return num >= 1 && num <= 6
    case 'six2': return num >= 7 && num <= 12
    case 'six3': return num >= 13 && num <= 18
    case 'six4': return num >= 19 && num <= 24
    case 'six5': return num >= 25 && num <= 30
    case 'six6': return num >= 31 && num <= 36
    case 'alt1_1':
    case 'alt1_2':
    case 'alt2_1':
    case 'alt2_2':
    case 'alt3_1':
    case 'alt3_2':
    case 'edge':
    case 'center':
      return ALT_EDGE_CENTER[group]?.includes(num) ?? false
    default:
      return false
  }
}

export function getGroupPayout(group: GroupKey): number {
  if (['red','black','even','odd','low','high','alt1_1','alt1_2','alt2_1','alt2_2','alt3_1','alt3_2','edge','center'].includes(group)) {
    return 1
  }
  if (['dozen1','dozen2','dozen3','col1','col2','col3'].includes(group)) {
    return 2
  }
  if (['six1','six2','six3','six4','six5','six6'].includes(group)) {
    return 5
  }
  return 0
}

export const NUMBERS = {
  RED: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  BLACK: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
  GREEN: [0]
}

export function getNumberProperties(num: number): Omit<Spin, 'id' | 'session_id' | 'spin_number' | 'created_at'> {
  const color = NUMBERS.RED.includes(num) ? 'red' : 
                NUMBERS.BLACK.includes(num) ? 'black' : 'green'
  
  return {
    number: num,
    color,
    even_odd: num === 0 ? 'zero' : num % 2 === 0 ? 'even' : 'odd',
    low_high: num === 0 ? 'zero' : num <= 18 ? 'low' : 'high',
    dozen: num === 0 ? 'zero' : 
           num <= 12 ? 'first' : 
           num <= 24 ? 'second' : 'third',
    column_num: num === 0 ? 0 : ((num - 1) % 3) + 1
  }
}

export function detectAnomalies(spins: Spin[], threshold = 16): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  if (spins.length < threshold) return anomalies
  
  // Check for missing dozens in last N spins
  const recentSpins = spins.slice(0, threshold)
  const dozens = { first: 0, second: 0, third: 0 }
  const colors = { red: 0, black: 0, green: 0 }
  const columns = { 1: 0, 2: 0, 3: 0 }
  
  recentSpins.forEach(spin => {
    // Count dozens
    if (spin.dozen === 'first') dozens.first++
    else if (spin.dozen === 'second') dozens.second++
    else if (spin.dozen === 'third') dozens.third++
    
    // Count colors
    if (spin.color === 'red') colors.red++
    else if (spin.color === 'black') colors.black++
    else if (spin.color === 'green') colors.green++
    
    // Count columns
    if (spin.column_num > 0) {
      columns[spin.column_num as 1 | 2 | 3]++
    }
  })
  
  // Check for missing dozens (statistical impossibility)
  if (dozens.first === 0) {
    anomalies.push({
      anomaly_type: 'missing_dozen',
      description: `First dozen (1-12) has not appeared in ${threshold} spins - Statistical impossibility!`,
      severity: 'critical',
      pattern_data: { dozen: 'first', count: 0, threshold }
    })
  }
  if (dozens.second === 0) {
    anomalies.push({
      anomaly_type: 'missing_dozen',
      description: `Second dozen (13-24) has not appeared in ${threshold} spins - Statistical impossibility!`,
      severity: 'critical',
      pattern_data: { dozen: 'second', count: 0, threshold }
    })
  }
  if (dozens.third === 0) {
    anomalies.push({
      anomaly_type: 'missing_dozen',
      description: `Third dozen (25-36) has not appeared in ${threshold} spins - Statistical impossibility!`,
      severity: 'critical',
      pattern_data: { dozen: 'third', count: 0, threshold }
    })
  }
  
  // Check for extreme color bias
  const colorBias = Math.max(colors.red, colors.black) / threshold
  if (colorBias > 0.75 && threshold >= 20) {
    const dominantColor = colors.red > colors.black ? 'red' : 'black'
    anomalies.push({
      anomaly_type: 'color_bias',
      description: `Extreme ${dominantColor} bias: ${Math.round(colorBias * 100)}% in last ${threshold} spins`,
      severity: 'high',
      pattern_data: { colors, threshold, bias: colorBias }
    })
  }
  
  // Check for missing columns
  Object.entries(columns).forEach(([col, count]) => {
    if (count === 0 && threshold >= 15) {
      anomalies.push({
        anomaly_type: 'missing_column',
        description: `Column ${col} has not appeared in ${threshold} spins`,
        severity: 'high',
        pattern_data: { column: col, count: 0, threshold }
      })
    }
  })
  
  return anomalies
}
