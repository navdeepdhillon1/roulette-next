import { Spin, Anomaly } from './types'

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
