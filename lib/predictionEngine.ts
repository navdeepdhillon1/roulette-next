import { NumberStat, getAllNumberStats, getNumberStats } from './numberStatsCalculations';

// Group metadata for weighting
interface GroupData {
  name: string;
  family: 'binary' | 'dozen' | 'column' | 'six' | 'wheel' | 'individual';
  size: number;
  active: boolean;
  streak: number;
  absence: number;
  numbers: number[];
}

// IDF (Inverse Document Frequency) weighting
const calculateIDF = (groupSize: number): number => {
  return Math.log(37 / groupSize);
};

// Family weights (as discussed)
const FAMILY_WEIGHTS = {
  individual: 1.2,
  six: 1.0,
  wheel: 0.9,
  dozen: 0.8,
  column: 0.7,
  binary: 0.6
};

// Analyze binary groups (Red/Black, Even/Odd, High/Low)
const analyzeBinaryGroups = (history: number[]): GroupData[] => {
  const groups: GroupData[] = [];
  const recent = history.slice(-10);
  
  // Red/Black analysis
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
  
  const redStreak = countStreak(recent, n => redNumbers.includes(n));
  const blackStreak = countStreak(recent, n => blackNumbers.includes(n));
  const redAbsence = findAbsence(history, n => redNumbers.includes(n));
  const blackAbsence = findAbsence(history, n => blackNumbers.includes(n));
  
  groups.push({
    name: 'Red',
    family: 'binary',
    size: 18,
    active: redStreak >= 3 || redAbsence === 0,
    streak: redStreak,
    absence: redAbsence,
    numbers: redNumbers
  });
  
  groups.push({
    name: 'Black',
    family: 'binary',
    size: 18,
    active: blackStreak >= 3 || blackAbsence === 0,
    streak: blackStreak,
    absence: blackAbsence,
    numbers: blackNumbers
  });
  
  // Even/Odd analysis
  const evenStreak = countStreak(recent, n => n > 0 && n % 2 === 0);
  const oddStreak = countStreak(recent, n => n > 0 && n % 2 === 1);
  const evenNumbers = Array.from({length: 18}, (_, i) => (i + 1) * 2);
  const oddNumbers = Array.from({length: 18}, (_, i) => (i * 2) + 1);
  
  groups.push({
    name: 'Even',
    family: 'binary',
    size: 18,
    active: evenStreak >= 3,
    streak: evenStreak,
    absence: findAbsence(history, n => n > 0 && n % 2 === 0),
    numbers: evenNumbers
  });
  
  groups.push({
    name: 'Odd',
    family: 'binary',
    size: 18,
    active: oddStreak >= 3,
    streak: oddStreak,
    absence: findAbsence(history, n => n > 0 && n % 2 === 1),
    numbers: oddNumbers
  });
  
  // High/Low analysis
  const highStreak = countStreak(recent, n => n >= 19 && n <= 36);
  const lowStreak = countStreak(recent, n => n >= 1 && n <= 18);
  
  groups.push({
    name: 'High',
    family: 'binary',
    size: 18,
    active: highStreak >= 3,
    streak: highStreak,
    absence: findAbsence(history, n => n >= 19 && n <= 36),
    numbers: Array.from({length: 18}, (_, i) => i + 19)
  });
  
  groups.push({
    name: 'Low',
    family: 'binary',
    size: 18,
    active: lowStreak >= 3,
    streak: lowStreak,
    absence: findAbsence(history, n => n >= 1 && n <= 18),
    numbers: Array.from({length: 18}, (_, i) => i + 1)
  });
  
  return groups;
};

// Analyze dozen groups
const analyzeDozenGroups = (history: number[]): GroupData[] => {
  const groups: GroupData[] = [];
  const recent = history.slice(-10);
  
  for (let d = 1; d <= 3; d++) {
    const dozenNumbers = Array.from({length: 12}, (_, i) => ((d - 1) * 12) + i + 1);
    const streak = countStreak(recent, n => Math.ceil(n / 12) === d);
    const absence = findAbsence(history, n => Math.ceil(n / 12) === d);
    
    groups.push({
      name: `Dozen ${d}`,
      family: 'dozen',
      size: 12,
      active: streak >= 2 || absence > 15,
      streak: streak,
      absence: absence,
      numbers: dozenNumbers
    });
  }
  
  return groups;
};

// Calculate convergence score for each number
export const calculateConvergence = (history: number[]): Map<number, number> => {
  const scores = new Map<number, number>();
  
  // Initialize all numbers with 0
  for (let i = 0; i <= 36; i++) {
    scores.set(i, 0);
  }
  
  // Get all active groups
  const binaryGroups = analyzeBinaryGroups(history);
  const dozenGroups = analyzeDozenGroups(history);
  const allGroups = [...binaryGroups, ...dozenGroups];
  
  // Get individual number stats
  const numberStats = getAllNumberStats(history);
  
  // Calculate scores for each number
  for (let num = 0; num <= 36; num++) {
    let score = 0;
    let familiesInvolved = new Set<string>();
    
    // Check which groups contain this number
    allGroups.forEach(group => {
      if (group.active && group.numbers.includes(num)) {
        const idf = calculateIDF(group.size);
        const familyWeight = FAMILY_WEIGHTS[group.family];
        const streakBonus = group.streak > 0 ? Math.min(group.streak, 5) : 0;
        
        score += (idf * familyWeight * (1 + streakBonus * 0.2));
        familiesInvolved.add(group.family);
      }
    });
    
    // Add individual number heat
    const numStat = numberStats.find(s => s.number === num);
    if (numStat) {
      if (numStat.temperature === 'HOT' || numStat.temperature === 'VERY HOT') {
        score += FAMILY_WEIGHTS.individual * 5;
      }
      if (numStat.absence > 30) {
        score += FAMILY_WEIGHTS.individual * 3; // Due numbers
      }
    }
    
    // De-duplication factor
    if (familiesInvolved.size > 3) {
      score *= 0.8;
    }
    
    scores.set(num, score);
  }
  
  return scores;
};

// Helper functions
const countStreak = (sequence: number[], predicate: (n: number) => boolean): number => {
  let count = 0;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (sequence[i] === 0) continue; // Skip zero
    if (predicate(sequence[i])) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

const findAbsence = (history: number[], predicate: (n: number) => boolean): number => {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === 0) continue;
    if (predicate(history[i])) {
      return history.length - 1 - i;
    }
  }
  return history.length;
};

// Get top predictions
export const getTopPredictions = (history: number[], count: number = 5): number[] => {
  const scores = calculateConvergence(history);
  
  // Sort by score
  const sorted = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([num]) => num);
  
  return sorted;
};

// Calculate entropy for confidence
export const calculateEntropy = (scores: Map<number, number>): number => {
  const total = Array.from(scores.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return 10; // Max entropy if no patterns
  
  let entropy = 0;
  scores.forEach(score => {
    if (score > 0) {
      const p = score / total;
      entropy -= p * Math.log(p);
    }
  });
  
  return entropy;
};

// Determine confidence level
export const getConfidence = (entropy: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (entropy < 2.5) return 'HIGH';
  if (entropy < 3.5) return 'MEDIUM';
  return 'LOW';
};