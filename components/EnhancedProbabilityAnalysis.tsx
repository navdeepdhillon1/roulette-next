// components/EnhancedProbabilityAnalysis.tsx
// Complete Enhanced Probability Analysis with ALL 47 BETTING GROUPS

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Award, AlertCircle } from 'lucide-react';

// ============================================================================
// COMPLETE TYPE DEFINITIONS
// ============================================================================

interface NumberScore {
  number: number;
  hotScore: number;
  coldScore: number;
  combinedScore: number;
  probabilityScore: number;
  confidence: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
  hotSignals: string[];
  coldSignals: string[];
  totalSignals: number;
  isRed: boolean;
}

interface GroupStats {
  id: string;
  name: string;
  numbers: number[];
  type: 'table' | 'wheel';
  category: string;
  hitCount: number;
  expectedProb: number;
  actualFreq: number;
  deviation: number;
  zScore: number;
  currentStreak: number;
  currentAbsence: number;
  maxStreak: number;
  maxAbsence: number;
  expectedInterval: number;
  streakScore: number;
  dueScore: number;
  lastSeen: number;
}

interface Analysis {
  ready: boolean;
  totalSpins: number;
  message?: string;
  numberScores: NumberScore[];
  tableStats: GroupStats[];
  wheelStats: GroupStats[];
  hotTableGroups: GroupStats[];
  coldTableGroups: GroupStats[];
  hotWheelGroups: GroupStats[];
  coldWheelGroups: GroupStats[];
}

interface EnhancedProbabilityAnalysisProps {
  history: number[];
}

// ============================================================================
// ALL 47 BETTING GROUPS DEFINITIONS
// ============================================================================

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// TABLE GROUPS - 26 GROUPS
const TABLE_GROUPS = [
  // ===== Low/High (2) =====
  { id: 'low', name: 'Low (1-18)', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18], type: 'table' as const, category: 'Range' },
  { id: 'high', name: 'High (19-36)', numbers: [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36], type: 'table' as const, category: 'Range' },

  // ===== Red/Black (2) =====
  { id: 'red', name: 'Red', numbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36], type: 'table' as const, category: 'Color' },
  { id: 'black', name: 'Black', numbers: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35], type: 'table' as const, category: 'Color' },

  // ===== Even/Odd (2) =====
  { id: 'even', name: 'Even', numbers: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36], type: 'table' as const, category: 'Parity' },
  { id: 'odd', name: 'Odd', numbers: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35], type: 'table' as const, category: 'Parity' },

  // ===== Dozens (3) =====
  { id: 'dozen_1', name: '1st Dozen', numbers: [1,2,3,4,5,6,7,8,9,10,11,12], type: 'table' as const, category: 'Dozen' },
  { id: 'dozen_2', name: '2nd Dozen', numbers: [13,14,15,16,17,18,19,20,21,22,23,24], type: 'table' as const, category: 'Dozen' },
  { id: 'dozen_3', name: '3rd Dozen', numbers: [25,26,27,28,29,30,31,32,33,34,35,36], type: 'table' as const, category: 'Dozen' },

  // ===== Rows/Columns (3) =====
  { id: 'row_1', name: '1st Row', numbers: [1,4,7,10,13,16,19,22,25,28,31,34], type: 'table' as const, category: 'Row' },
  { id: 'row_2', name: '2nd Row', numbers: [2,5,8,11,14,17,20,23,26,29,32,35], type: 'table' as const, category: 'Row' },
  { id: 'row_3', name: '3rd Row', numbers: [3,6,9,12,15,18,21,24,27,30,33,36], type: 'table' as const, category: 'Row' },

  // ===== Six-lines (6) =====
  { id: 'six_1', name: "1st Six's", numbers: [1,2,3,4,5,6], type: 'table' as const, category: 'Double Street' },
  { id: 'six_2', name: "2nd Six's", numbers: [7,8,9,10,11,12], type: 'table' as const, category: 'Double Street' },
  { id: 'six_3', name: "3rd Six's", numbers: [13,14,15,16,17,18], type: 'table' as const, category: 'Double Street' },
  { id: 'six_4', name: "4th Six's", numbers: [19,20,21,22,23,24], type: 'table' as const, category: 'Double Street' },
  { id: 'six_5', name: "5th Six's", numbers: [25,26,27,28,29,30], type: 'table' as const, category: 'Double Street' },
  { id: 'six_6', name: "6th Six's", numbers: [31,32,33,34,35,36], type: 'table' as const, category: 'Double Street' },

  // ===== 1st Alternate A/B (2) =====
  { id: 'alt_1_a', name: 'Alt 1 - A', numbers: [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33], type: 'table' as const, category: '1st Alternate' },
  { id: 'alt_1_b', name: 'Alt 1 - B', numbers: [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36], type: 'table' as const, category: '1st Alternate' },

  // ===== 2nd Alternate AA/BB (2) =====
  { id: 'alt_2_aa', name: 'Alt 2 - AA', numbers: [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30], type: 'table' as const, category: '2nd Alternate' },
  { id: 'alt_2_bb', name: 'Alt 2 - BB', numbers: [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36], type: 'table' as const, category: '2nd Alternate' },

  // ===== 3rd Alternate AAA/BBB (2) =====
  { id: 'alt_3_aaa', name: 'Alt 3 - AAA', numbers: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27], type: 'table' as const, category: '3rd Alternate' },
  { id: 'alt_3_bbb', name: 'Alt 3 - BBB', numbers: [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36], type: 'table' as const, category: '3rd Alternate' },

  // ===== Edge/Center (2) =====
  { id: 'edge', name: 'Edge', numbers: [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36], type: 'table' as const, category: 'Edge/Center' },
  { id: 'center', name: 'Center', numbers: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27], type: 'table' as const, category: 'Edge/Center' },
];

// WHEEL GROUPS - 21 GROUPS
const WHEEL_GROUPS = [
  // ===== Special Bets 1 (4) =====
  { id: 'voisins', name: 'Voisins', numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25], type: 'wheel' as const, category: 'Special Bets 1' },
  { id: 'orphelins', name: 'Orphelins', numbers: [17,34,6,1,20,14,31,9], type: 'wheel' as const, category: 'Special Bets 1' },
  { id: 'tiers', name: 'Tiers', numbers: [27,13,36,11,30,8,23,10,5,24,16,33], type: 'wheel' as const, category: 'Special Bets 1' },
  { id: 'jeu_zero', name: 'Jeu Zero', numbers: [12,35,3,26,0,32,15], type: 'wheel' as const, category: 'Special Bets 1' },

  // ===== Special Bets 2 (2) =====
  { id: 'voisin', name: 'Voisin', numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25], type: 'wheel' as const, category: 'Special Bets 2' },
  { id: 'non_voisin', name: 'Non-Voisin', numbers: [17,34,6,1,20,14,31,9,27,13,36,11,30,8,23,10,5,24,16,33], type: 'wheel' as const, category: 'Special Bets 2' },

  // ===== 18's A/B (2) =====
  { id: 'wheel_18_a', name: '18-A', numbers: [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3], type: 'wheel' as const, category: '18s A/B' },
  { id: 'wheel_18_b', name: '18-B', numbers: [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26], type: 'wheel' as const, category: '18s A/B' },

  // ===== 18's AA/BB (2) =====
  { id: 'wheel_18_aa', name: '18-AA', numbers: [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35], type: 'wheel' as const, category: '18s AA/BB' },
  { id: 'wheel_18_bb', name: '18-BB', numbers: [19,4,25,17,27,13,30,8,5,24,1,20,9,22,7,28,3,26], type: 'wheel' as const, category: '18s AA/BB' },

  // ===== 18's AAA/BBB (2) =====
  { id: 'wheel_18_aaa', name: '18-AAA', numbers: [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12], type: 'wheel' as const, category: '18s AAA/BBB' },
  { id: 'wheel_18_bbb', name: '18-BBB', numbers: [4,21,2,6,27,13,8,23,10,33,1,20,22,18,29,35,3,26], type: 'wheel' as const, category: '18s AAA/BBB' },

  // ===== 18's A6/B6 (2) =====
  { id: 'wheel_18_a6', name: '18-A6', numbers: [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29], type: 'wheel' as const, category: '18s A6/B6' },
  { id: 'wheel_18_b6', name: '18-B6', numbers: [25,17,34,6,27,13,5,24,16,33,1,20,7,28,12,35,3,26], type: 'wheel' as const, category: '18s A6/B6' },

  // ===== 18's A9/B9 (2) =====
  { id: 'wheel_18_a9', name: '18-A9', numbers: [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9], type: 'wheel' as const, category: '18s A9/B9' },
  { id: 'wheel_18_b9', name: '18-B9', numbers: [6,27,13,36,11,30,8,23,10,22,18,29,7,28,12,35,3,26], type: 'wheel' as const, category: '18s A9/B9' },

  // ===== 18's Right/Left (2) =====
  { id: 'wheel_18_right', name: '18-Right', numbers: [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10], type: 'wheel' as const, category: '18s Right/Left' },
  { id: 'wheel_18_left', name: '18-Left', numbers: [5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26], type: 'wheel' as const, category: '18s Right/Left' },

  // ===== 9's (4) =====
  { id: 'wheel_9_1st', name: '9-1st', numbers: [32,15,19,4,21,2,25,17,34], type: 'wheel' as const, category: '9s' },
  { id: 'wheel_9_2nd', name: '9-2nd', numbers: [6,27,13,36,11,30,8,23,10], type: 'wheel' as const, category: '9s' },
  { id: 'wheel_9_3rd', name: '9-3rd', numbers: [5,24,16,33,1,20,14,31,9], type: 'wheel' as const, category: '9s' },
  { id: 'wheel_9_4th', name: '9-4th', numbers: [22,18,29,7,28,12,35,3,26], type: 'wheel' as const, category: '9s' },
];

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

function calculateGroupStats(
  numbers: number[], 
  history: number[], 
  groupSize: number
): Omit<GroupStats, 'id' | 'name' | 'type' | 'numbers' | 'category'> {
  const totalSpins = history.length;
  
  // Hit count
  const hitCount = history.filter(n => numbers.includes(n)).length;
  
  // Expected probability and frequency
  const expectedProb = groupSize / 37;
  const expectedHits = totalSpins * expectedProb;
  const actualFreq = hitCount / totalSpins;
  const deviation = actualFreq - expectedProb;
  
  // Z-score calculation (statistical significance)
  const stdDev = Math.sqrt(totalSpins * expectedProb * (1 - expectedProb));
  const zScore = stdDev > 0 ? (hitCount - expectedHits) / stdDev : 0;
  
  // Current streak (consecutive hits from most recent)
  let currentStreak = 0;
  for (let i = totalSpins - 1; i >= 0; i--) {
    if (numbers.includes(history[i])) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Max streak in history
  let maxStreak = 0;
  let tempStreak = 0;
  for (let i = totalSpins - 1; i >= 0; i--) {
    if (numbers.includes(history[i])) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Current absence (spins since last hit)
  let currentAbsence = 0;
  for (let i = totalSpins - 1; i >= 0; i--) {
    if (numbers.includes(history[i])) {
      break;
    } else {
      currentAbsence++;
    }
  }
  
  // Max absence in history
  let maxAbsence = 0;
  let tempAbsence = 0;
  for (let i = totalSpins - 1; i >= 0; i--) {
    if (numbers.includes(history[i])) {
      maxAbsence = Math.max(maxAbsence, tempAbsence);
      tempAbsence = 0;
    } else {
      tempAbsence++;
    }
  }
  maxAbsence = Math.max(maxAbsence, tempAbsence);
  
  // Last seen
  const lastSeenIndex = history.findIndex(n => numbers.includes(n));
  const lastSeen = lastSeenIndex === -1 ? totalSpins : lastSeenIndex;
  
  // Expected interval between hits
  const expectedInterval = 37 / groupSize;
  
  // Hot Score (streak-based with exponential weighting)
  const baseWeight = groupSize <= 1 ? 40 : groupSize <= 6 ? 35 : groupSize <= 9 ? 30 : groupSize <= 12 ? 25 : 20;
  const streakScore = currentStreak > 0 ? baseWeight * Math.pow(1.15, currentStreak) : 0;
  
  // Cold Score (absence/due based)
  const absenceRatio = currentAbsence / expectedInterval;
  const dueScore = currentAbsence > 0 ? Math.min(100, absenceRatio * 50) : 0;
  
  return {
    hitCount,
    expectedProb,
    actualFreq,
    deviation,
    zScore,
    currentStreak,
    currentAbsence,
    maxStreak,
    maxAbsence,
    expectedInterval,
    streakScore,
    dueScore,
    lastSeen,
  };
}

function analyzeHistory(history: number[]): Analysis {
  if (history.length < 5) {
    return {
      ready: false,
      totalSpins: history.length,
      message: `Need at least 5 spins for probability analysis (${history.length}/5)`,
      numberScores: [],
      tableStats: [],
      wheelStats: [],
      hotTableGroups: [],
      coldTableGroups: [],
      hotWheelGroups: [],
      coldWheelGroups: [],
    };
  }

  // Analyze all 47 groups
  const tableStats: GroupStats[] = TABLE_GROUPS.map(group => ({
    ...group,
    ...calculateGroupStats(group.numbers, history, group.numbers.length),
  }));

  const wheelStats: GroupStats[] = WHEEL_GROUPS.map(group => ({
    ...group,
    ...calculateGroupStats(group.numbers, history, group.numbers.length),
  }));

  // Calculate number-level convergence scores
  const allGroups = [...tableStats, ...wheelStats];
  const numberScores: NumberScore[] = Array.from({ length: 37 }, (_, num): NumberScore => {
    let hotScore = 0;
    let coldScore = 0;
    const hotSignals: string[] = [];
    const coldSignals: string[] = [];

    // Check all groups that contain this number
    allGroups.forEach(group => {
      if (group.numbers.includes(num)) {
        // Hot signals: groups with active streaks
        if (group.currentStreak > 0) {
          const groupWeight = group.type === 'wheel' ? 1.1 : 1.0;
          hotScore += group.streakScore * groupWeight;
          
          if (group.currentStreak >= 2) {
            hotSignals.push(`${group.name} (${group.currentStreak})`);
          }
        }
        
        // Cold signals: groups with significant absence
        if (group.currentAbsence > 0) {
          const groupWeight = group.type === 'wheel' ? 1.1 : 1.0;
          coldScore += group.dueScore * groupWeight;
          
          if (group.dueScore > 40) {
            coldSignals.push(`${group.name} (${group.currentAbsence})`);
          }
        }
      }
    });

    // Combined score with signal multiplier
    const totalSignals = hotSignals.length + coldSignals.length;
    const signalMultiplier = 1 + (totalSignals * 0.15);
    const combinedScore = ((hotScore * 0.6) + (coldScore * 0.4)) * signalMultiplier;

    return {
      number: num,
      hotScore,
      coldScore,
      combinedScore,
      probabilityScore: 0,
      confidence: 'VERY LOW',
      hotSignals,
      coldSignals,
      totalSignals,
      isRed: RED_NUMBERS.includes(num),
    };
  });

  // Normalize probability scores to 0-100 range
  const maxScore = Math.max(...numberScores.map(s => s.combinedScore), 1);
  numberScores.forEach(score => {
    score.probabilityScore = (score.combinedScore / maxScore) * 100;
    
    // Assign confidence levels
    if (score.probabilityScore >= 90 && score.totalSignals >= 5) {
      score.confidence = 'VERY HIGH';
    } else if (score.probabilityScore >= 70 && score.totalSignals >= 4) {
      score.confidence = 'HIGH';
    } else if (score.probabilityScore >= 50 && score.totalSignals >= 3) {
      score.confidence = 'MEDIUM';
    } else if (score.probabilityScore >= 30) {
      score.confidence = 'LOW';
    } else {
      score.confidence = 'VERY LOW';
    }
  });

  // Sort groups by convergence strength
  const hotTableGroups = [...tableStats]
    .filter(g => g.streakScore > 0)
    .sort((a, b) => b.streakScore - a.streakScore)
    .slice(0, 15);

  const coldTableGroups = [...tableStats]
    .filter(g => g.dueScore > 0)
    .sort((a, b) => b.dueScore - a.dueScore)
    .slice(0, 15);

  const hotWheelGroups = [...wheelStats]
    .filter(g => g.streakScore > 0)
    .sort((a, b) => b.streakScore - a.streakScore)
    .slice(0, 12);

  const coldWheelGroups = [...wheelStats]
    .filter(g => g.dueScore > 0)
    .sort((a, b) => b.dueScore - a.dueScore)
    .slice(0, 12);

  return {
    ready: true,
    totalSpins: history.length,
    numberScores: numberScores.sort((a, b) => b.probabilityScore - a.probabilityScore),
    tableStats,
    wheelStats,
    hotTableGroups,
    coldTableGroups,
    hotWheelGroups,
    coldWheelGroups,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EnhancedProbabilityAnalysis({ history }: EnhancedProbabilityAnalysisProps) {
  const [convergenceView, setConvergenceView] = useState<'numbers' | 'table' | 'wheel'>('numbers');
  const [detailView, setDetailView] = useState<'hot' | 'cold' | 'all'>('hot');

  const analysis = useMemo(() => analyzeHistory(history), [history]);

  if (!analysis.ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-400">{analysis.message}</p>
          <div className="mt-4 text-sm text-gray-500">
            <div className="mb-2">Analyzing across <span className="text-white font-bold">47 betting groups:</span></div>
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
              <div className="bg-gray-800 rounded px-3 py-1">
                <span className="text-blue-400 font-semibold">26</span> Table Groups
              </div>
              <div className="bg-gray-800 rounded px-3 py-1">
                <span className="text-purple-400 font-semibold">21</span> Wheel Groups
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getAnalysisQuality = () => {
    if (analysis.totalSpins >= 100) return { label: 'EXCELLENT', color: 'text-green-400' };
    if (analysis.totalSpins >= 50) return { label: 'VERY GOOD', color: 'text-green-500' };
    if (analysis.totalSpins >= 25) return { label: 'GOOD', color: 'text-yellow-400' };
    return { label: 'FAIR', color: 'text-orange-400' };
  };

  const quality = getAnalysisQuality();

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Award className="text-blue-400" />
              Enhanced Probability Analysis
            </h2>
            <p className="text-blue-200">
              Tracking <span className="text-yellow-400 font-bold">47 betting groups</span> • {analysis.totalSpins} spins analyzed
            </p>
            <p className="text-xs text-gray-400 mt-1">
              26 Table Groups + 21 Wheel Sectors = Complete Coverage
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Analysis Quality</div>
            <div className={`text-2xl font-bold ${quality.color}`}>
              {quality.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {TABLE_GROUPS.length} table • {WHEEL_GROUPS.length} wheel
            </div>
          </div>
        </div>
      </div>

      {/* Convergence View Selector */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setConvergenceView('numbers')}
          className={`px-6 py-4 rounded-lg font-semibold transition-all ${
            convergenceView === 'numbers'
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-105'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <div className="text-lg">🎯 Number Convergence</div>
          <div className="text-xs opacity-80">Individual 0-36 Analysis</div>
        </button>
        <button
          onClick={() => setConvergenceView('table')}
          className={`px-6 py-4 rounded-lg font-semibold transition-all ${
            convergenceView === 'table'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <div className="text-lg">📊 Table Groups</div>
          <div className="text-xs opacity-80">26 Betting Categories</div>
        </button>
        <button
          onClick={() => setConvergenceView('wheel')}
          className={`px-6 py-4 rounded-lg font-semibold transition-all ${
            convergenceView === 'wheel'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <div className="text-lg">🎡 Wheel Sectors</div>
          <div className="text-xs opacity-80">21 Wheel Neighborhoods</div>
        </button>
      </div>

      {/* Hot/Cold/All Filter */}
      <div className="flex gap-2 bg-gray-800/50 p-2 rounded-lg">
        <button
          onClick={() => setDetailView('hot')}
          className={`flex-1 px-4 py-2 rounded font-semibold transition-all ${
            detailView === 'hot'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔥 Hot Convergence
        </button>
        <button
          onClick={() => setDetailView('cold')}
          className={`flex-1 px-4 py-2 rounded font-semibold transition-all ${
            detailView === 'cold'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ❄️ Cold Convergence
        </button>
        <button
          onClick={() => setDetailView('all')}
          className={`flex-1 px-4 py-2 rounded font-semibold transition-all ${
            detailView === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📊 All Statistics
        </button>
      </div>

      {/* NUMBER CONVERGENCE VIEW */}
      {convergenceView === 'numbers' && (
        <div className="space-y-4">
          {detailView !== 'cold' && (
            <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl border border-red-500/30 p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <TrendingUp size={24} />
                Hot Number Convergence (Top 10)
                <span className="text-sm text-gray-400 ml-2">Analyzed from {TABLE_GROUPS.length + WHEEL_GROUPS.length} groups</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {analysis.numberScores
                  .filter(n => n.hotScore > 0)
                  .slice(0, 10)
                  .map((item) => (
                    <div key={item.number} className="bg-gray-900/50 rounded-lg p-4 border border-red-500/30 hover:border-red-500 transition-all hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ${
                          item.number === 0 ? 'bg-green-600' :
                          item.isRed ? 'bg-red-600' :
                          'bg-gray-800 border-2 border-gray-600'
                        }`}>
                          {item.number}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-400">
                            {item.probabilityScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.totalSignals} signals
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs text-center px-2 py-1 rounded font-semibold ${
                        item.confidence === 'VERY HIGH' ? 'bg-red-500/30 text-red-200' :
                        item.confidence === 'HIGH' ? 'bg-orange-500/30 text-orange-200' :
                        item.confidence === 'MEDIUM' ? 'bg-yellow-500/30 text-yellow-200' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {item.confidence}
                      </div>
                      {item.hotSignals.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                          {item.hotSignals.slice(0, 2).map((sig, i) => (
                            <div key={i} className="truncate">• {sig}</div>
                          ))}
                          {item.hotSignals.length > 2 && (
                            <div className="text-gray-500">+{item.hotSignals.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {detailView !== 'hot' && (
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <TrendingDown size={24} />
                Cold Number Convergence (Top 10)
                <span className="text-sm text-gray-400 ml-2">Analyzed from {TABLE_GROUPS.length + WHEEL_GROUPS.length} groups</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {analysis.numberScores
                  .filter(n => n.coldScore > 0)
                  .sort((a, b) => b.coldScore - a.coldScore)
                  .slice(0, 10)
                  .map((item) => (
                    <div key={item.number} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500 transition-all hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold opacity-70 shadow-lg ${
                          item.number === 0 ? 'bg-green-600' :
                          item.isRed ? 'bg-red-600' :
                          'bg-gray-800 border-2 border-gray-600'
                        }`}>
                          {item.number}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">
                            {item.coldScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-400">
                            due score
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-center px-2 py-1 rounded font-semibold bg-cyan-500/30 text-cyan-200">
                        OVERDUE
                      </div>
                      {item.coldSignals.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                          {item.coldSignals.slice(0, 2).map((sig, i) => (
                            <div key={i} className="truncate">• {sig}</div>
                          ))}
                          {item.coldSignals.length > 2 && (
                            <div className="text-gray-500">+{item.coldSignals.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TABLE GROUPS VIEW - ALL 26 GROUPS */}
      {convergenceView === 'table' && (
        <div className="space-y-4">
          {detailView !== 'cold' && analysis.hotTableGroups.length > 0 && (
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-500/30 p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <TrendingUp size={24} />
                Hot Table Groups (Top {analysis.hotTableGroups.length} of {TABLE_GROUPS.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.hotTableGroups.map((group) => (
                  <div key={group.id} className="bg-gray-900/50 rounded-lg p-4 border border-blue-500/30 hover:border-blue-500 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white">{group.name}</h4>
                        <p className="text-xs text-gray-400">{group.category} • {group.numbers.length} nums</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-400">
                          {group.streakScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-400">Hot</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Streak</div>
                        <div className="text-base font-bold text-orange-400">{group.currentStreak}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Z-Score</div>
                        <div className={`text-base font-bold ${
                          group.zScore > 2 ? 'text-red-500' :
                          group.zScore > 1 ? 'text-orange-400' : 'text-gray-400'
                        }`}>
                          {group.zScore > 0 ? '+' : ''}{group.zScore.toFixed(2)}σ
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailView !== 'hot' && analysis.coldTableGroups.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 rounded-xl border border-cyan-500/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <TrendingDown size={24} />
                Cold Table Groups (Top {analysis.coldTableGroups.length} of {TABLE_GROUPS.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.coldTableGroups.map((group) => (
                  <div key={group.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white">{group.name}</h4>
                        <p className="text-xs text-gray-400">{group.category} • {group.numbers.length} nums</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-cyan-400">
                          {group.dueScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-400">Due</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Absence</div>
                        <div className="text-base font-bold text-cyan-400">{group.currentAbsence}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Expected</div>
                        <div className="text-base font-bold text-gray-300">
                          {group.expectedInterval.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WHEEL SECTORS VIEW - ALL 21 GROUPS */}
      {convergenceView === 'wheel' && (
        <div className="space-y-4">
          {detailView !== 'cold' && analysis.hotWheelGroups.length > 0 && (
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30 p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                <TrendingUp size={24} />
                Hot Wheel Sectors (Top {analysis.hotWheelGroups.length} of {WHEEL_GROUPS.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.hotWheelGroups.map((group) => (
                  <div key={group.id} className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white">{group.name}</h4>
                        <p className="text-xs text-gray-400">{group.category} • {group.numbers.length} nums</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-400">
                          {group.streakScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-400">Hot</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Streak</div>
                        <div className="text-base font-bold text-orange-400">{group.currentStreak}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Z-Score</div>
                        <div className={`text-base font-bold ${
                          group.zScore > 2 ? 'text-red-500' :
                          group.zScore > 1 ? 'text-orange-400' : 'text-gray-400'
                        }`}>
                          {group.zScore > 0 ? '+' : ''}{group.zScore.toFixed(2)}σ
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailView !== 'hot' && analysis.coldWheelGroups.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/30 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <TrendingDown size={24} />
                Cold Wheel Sectors (Top {analysis.coldWheelGroups.length} of {WHEEL_GROUPS.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.coldWheelGroups.map((group) => (
                  <div key={group.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white">{group.name}</h4>
                        <p className="text-xs text-gray-400">{group.category} • {group.numbers.length} nums</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-cyan-400">
                          {group.dueScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-400">Due</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Absence</div>
                        <div className="text-base font-bold text-cyan-400">{group.currentAbsence}</div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-1.5">
                        <div className="text-gray-400">Expected</div>
                        <div className="text-base font-bold text-gray-300">
                          {group.expectedInterval.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistical Disclaimer */}
      <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-500/30 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-200">
            <p className="font-semibold mb-1">Complete Statistical Analysis</p>
            <p className="text-xs text-amber-200/80">
              This system analyzes patterns across all <strong>47 betting groups</strong> (26 table + 21 wheel) using rigorous 
              statistical methods. Z-scores indicate statistical significance, while convergence scores identify multi-group 
              pattern alignment. All roulette outcomes remain independent and random. For educational analysis only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}