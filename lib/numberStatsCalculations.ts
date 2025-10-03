export interface NumberStat {
  number: number;
  streak: number;
  maxStreak: number;
  absence: number;
  maxAbsence: number;
  L9: number;
  L18: number;
  L27: number;
  L36: number;
  actualPercent: number;
  expectedPercent: number;
  deviation: number;
  temperature: 'HOT' | 'COLD' | 'NORMAL' | 'VERY HOT' | 'VERY COLD';
  justHit: boolean;
  hitCount: number;
}

export const getAllNumberStats = (history: number[]): NumberStat[] => {
  const stats: NumberStat[] = [];
  
  for (let num = 0; num <= 36; num++) {
    stats.push(getNumberStats(num, history));
  }
  
  return stats;
};

export const getNumberStats = (num: number, history: number[]): NumberStat => {
  // If no history, return default values
  if (!history || history.length === 0) {
    return {
      number: num,
      streak: 0,
      maxStreak: 0,
      absence: 0,
      maxAbsence: 0,
      L9: 0,
      L18: 0,
      L27: 0,
      L36: 0,
      actualPercent: 0,
      expectedPercent: 2.7,
      deviation: -2.7,
      temperature: 'NORMAL',
      justHit: false,
      hitCount: 0
    };
  }

  // Find all positions where this number hit
  const hitPositions = history.map((n, i) => n === num ? i : -1).filter(i => i >= 0);
  
  // Calculate absence
  const lastHitPosition = history.lastIndexOf(num);
  const absence = lastHitPosition === -1 ? history.length : history.length - lastHitPosition - 1;
  
  // Calculate streaks
  let currentStreak = 0;
  let maxStreak = 0;
  
  // Check current streak
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === num) {
      currentStreak++;
      if (i === 0 || history[i - 1] !== num) {
        break;
      }
    } else {
      break;
    }
  }
  
  // Calculate max streak throughout history
  let tempStreak = 0;
  for (const n of history) {
    if (n === num) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Calculate hit counts for different windows
  const L9 = history.slice(-9).filter(n => n === num).length;
  const L18 = history.slice(-18).filter(n => n === num).length;
  const L27 = history.slice(-27).filter(n => n === num).length;
  const L36 = history.slice(-36).filter(n => n === num).length;
  
  // Calculate percentages
  const totalSpins = Math.min(history.length, 36);
  const actualPercent = totalSpins > 0 ? (L36 / totalSpins) * 100 : 0;
  const expectedPercent = 2.7; // 1/37 * 100
  const deviation = actualPercent - expectedPercent;
  
  // Determine temperature
  let temperature: 'HOT' | 'COLD' | 'NORMAL' | 'VERY HOT' | 'VERY COLD' = 'NORMAL';
  if (deviation > 15) temperature = 'VERY HOT';
  else if (deviation > 7) temperature = 'HOT';
  else if (deviation < -15) temperature = 'VERY COLD';
  else if (deviation < -7) temperature = 'COLD';
  
  // Check if just hit
  const justHit = history.length > 0 && history[history.length - 1] === num;
  
  // Calculate max absence
  const gaps: number[] = [];
  let currentGap = 0;
  
  for (const n of history) {
    if (n === num) {
      if (currentGap > 0) gaps.push(currentGap);
      currentGap = 0;
    } else {
      currentGap++;
    }
  }
  if (currentGap > 0) gaps.push(currentGap);
  const maxAbsence = gaps.length > 0 ? Math.max(...gaps) : absence;
  
  return {
    number: num,
    streak: currentStreak,
    maxStreak: maxStreak,
    absence: absence,
    maxAbsence: maxAbsence,
    L9,
    L18,
    L27,
    L36,
    actualPercent,
    expectedPercent,
    deviation,
    temperature,
    justHit,
    hitCount: L36
  };
};

// Function to get heat color for the heat strip
export const getHeatColor = (stats: NumberStat): string => {
  if (stats.justHit) return 'bg-green-500';
  if (stats.temperature === 'VERY HOT') return 'bg-red-600';
  if (stats.temperature === 'HOT') return 'bg-red-500';
  if (stats.temperature === 'VERY COLD') return 'bg-blue-600';
  if (stats.temperature === 'COLD') return 'bg-blue-500';
  if (stats.absence > 50) return 'bg-yellow-500';
  return 'bg-gray-600';
};