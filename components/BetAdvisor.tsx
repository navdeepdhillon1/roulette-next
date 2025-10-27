import React, { useState, useMemo } from 'react';
import { Activity, Flame, Snowflake, Eye, BarChart3, Filter, Bell, Calculator, TrendingUp, AlertTriangle, Zap, DollarSign, Users, Target, CheckCircle2, X } from 'lucide-react';
import { useBettingData } from './BettingDataContext';
import EnhancedRaceCard from './EnhancedRaceCard';
// ==================== TYPE DEFINITIONS ====================
interface Spin {
  spinId: string;
  number: string;
  ts: number;
}

interface GroupMetrics {
  hitRate: number;
  deviation: number;
  zScore: number;
  streak: number;
  absence: number;
  ewma: number;
  roi: number;
  volatility: number;
  alternations: number;
}

interface RaceResult {
  groups: GroupMetrics[];
  scores: number[];
  leader: number | 'TIE';
  badges: ('HOT' | 'COLD' | 'WATCH' | 'NEUTRAL')[];
  names: string[];
  colors: string[];
  volatilityLevels: ('STABLE' | 'MODERATE' | 'VOLATILE')[];
}

interface GroupData {
  id: string;
  name: string;
  category: string;
  family: '18s' | '12s' | '6s' | 'wheel' | 'special';
  metrics: {
    score: number;
    badge: 'HOT' | 'COLD' | 'WATCH' | 'NEUTRAL';
    volatility: 'STABLE' | 'MODERATE' | 'VOLATILE';
    zScore: number;
    streak: number;
    absence: number;
    roi: number;
    hitRate: number;
    isLeader: boolean;
  };
}

interface Alert {
  id: string;
  name: string;
  criteria: string;
  active: boolean;
  matchCount: number;
  triggered: boolean;
}

interface CompositeStrategy {
  id: string;
  name: string;
  groups: string[];
  totalStake: number;
  expectedPayout: number;
  coverage: number;
}

type MainTabType = 'toppers' | 'advisor';
type ToppersTabType = 'table-common' | 'table-special' | 'wheel-common' | 'wheel-special';
type AdvisorTabType = 'filter' | 'alerts' | 'calculator' | 'analytics';

// ==================== CONSTANTS ====================
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
const ODD_NUMBERS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
const EVEN_NUMBERS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
const LOW_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const HIGH_NUMBERS = [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
const DOZEN1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DOZEN2 = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const DOZEN3 = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
const COL1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
const COL2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const COL3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

// Table Special Groups
const EDGE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 34, 35, 36, 31, 32, 33, 28, 29, 30, 25, 26, 27];
const CENTER_NUMBERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const SIXLINE1 = [1, 2, 3, 4, 5, 6];
const SIXLINE2 = [7, 8, 9, 10, 11, 12];
const SIXLINE3 = [13, 14, 15, 16, 17, 18];
const SIXLINE4 = [19, 20, 21, 22, 23, 24];
const SIXLINE5 = [25, 26, 27, 28, 29, 30];
const SIXLINE6 = [31, 32, 33, 34, 35, 36];

// 1st Alternate Streets (A/B) - Alternating streets 1,3,5,7,9,11 vs 2,4,6,8,10,12
const ALT1_A = [1, 2, 3, 7, 8, 9, 13, 14, 15, 19, 20, 21, 25, 26, 27, 31, 32, 33];
const ALT1_B = [4, 5, 6, 10, 11, 12, 16, 17, 18, 22, 23, 24, 28, 29, 30, 34, 35, 36];

// 2nd Alternate Streets (AA/BB) - Alternating pairs of streets
const ALT2_AA = [1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18, 25, 26, 27, 28, 29, 30];
const ALT2_BB = [7, 8, 9, 10, 11, 12, 19, 20, 21, 22, 23, 24, 31, 32, 33, 34, 35, 36];

// 3rd Alternate Streets (AAA/BBB) - Alternating triplets of streets
const ALT3_AAA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 19, 20, 21, 22, 23, 24, 25, 26, 27];
const ALT3_BBB = [10, 11, 12, 13, 14, 15, 16, 17, 18, 28, 29, 30, 31, 32, 33, 34, 35, 36];

// Wheel Common Groups (accurate European wheel layout)
const VOISINS = [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]; // Voisins du Zero (17 numbers)
const TIERS = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33]; // Tiers du Cylindre (12 numbers)
const ORPHELINS = [17, 34, 6, 1, 20, 14, 31, 9]; // Orphelins (8 numbers)
const JEU_ZERO = [12, 35, 3, 26, 0, 32, 15]; // Jeu Zero (7 numbers)
const NON_VOISINS = [17, 34, 6, 1, 20, 14, 31, 9, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33]; // Non-Voisins (20 numbers)

// Wheel 18's (Right/Left split)
const WHEEL_RIGHT = [32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10]; // Right half
const WHEEL_LEFT = [5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]; // Left half

// Wheel 9's (Quadrant split)
const WHEEL_9_1ST = [32, 15, 19, 4, 21, 2, 25, 17, 34]; // 1st 9
const WHEEL_9_2ND = [6, 27, 13, 36, 11, 30, 8, 23, 10]; // 2nd 9
const WHEEL_9_3RD = [5, 24, 16, 33, 1, 20, 14, 31, 9]; // 3rd 9
const WHEEL_9_4TH = [22, 18, 29, 7, 28, 12, 35, 3, 26]; // 4th 9

// Wheel Special Groups - A/B Patterns
const WHEEL_A = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3]; // A pattern
const WHEEL_B = [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26]; // B pattern

// AA/BB Pattern
const WHEEL_AA = [32, 15, 21, 2, 34, 6, 36, 11, 23, 10, 16, 33, 14, 31, 18, 29, 12, 35]; // AA pattern
const WHEEL_BB = [19, 4, 25, 17, 27, 13, 30, 8, 5, 24, 1, 20, 9, 22, 7, 28, 3, 26]; // BB pattern

// AAA/BBB Pattern
const WHEEL_AAA = [32, 15, 19, 25, 17, 34, 36, 11, 30, 5, 24, 16, 14, 31, 9, 7, 28, 12]; // AAA pattern
const WHEEL_BBB = [4, 21, 2, 6, 27, 13, 8, 23, 10, 33, 1, 20, 22, 18, 29, 35, 3, 26]; // BBB pattern

// A6/B6 Pattern
const WHEEL_A6 = [32, 15, 19, 4, 21, 2, 36, 11, 30, 8, 23, 10, 14, 31, 9, 22, 18, 29]; // A6 pattern
const WHEEL_B6 = [25, 17, 34, 6, 27, 13, 5, 24, 16, 33, 1, 20, 7, 28, 12, 35, 3, 26]; // B6 pattern

// A9/B9 Pattern
const WHEEL_A9 = [32, 15, 19, 4, 21, 2, 25, 17, 34, 5, 24, 16, 33, 1, 20, 14, 31, 9]; // A9 pattern
const WHEEL_B9 = [6, 27, 13, 36, 11, 30, 8, 23, 10, 22, 18, 29, 7, 28, 12, 35, 3, 26]; // B9 pattern

const THRESHOLDS = {
  HOT_Z: 1.0,
  COLD_Z: -1.0,
  WATCH_Z: 0.5,
  EWMA_ALPHA: 0.2,
  VOLATILITY_STABLE: 0.35,
  VOLATILITY_VOLATILE: 0.65,
};

const SAMPLE_GROUPS: GroupData[] = [
  { id: 'red', name: 'RED', category: 'Table Common', family: '18s', metrics: { score: 78, badge: 'HOT', volatility: 'STABLE', zScore: 1.4, streak: 6, absence: 0, roi: 8, hitRate: 0.54, isLeader: true } },
  { id: 'black', name: 'BLACK', category: 'Table Common', family: '18s', metrics: { score: 45, badge: 'COLD', volatility: 'STABLE', zScore: -0.9, streak: 0, absence: 6, roi: -8, hitRate: 0.42, isLeader: false } },
  { id: 'odd', name: 'ODD', category: 'Table Common', family: '18s', metrics: { score: 75, badge: 'HOT', volatility: 'STABLE', zScore: 1.2, streak: 5, absence: 0, roi: 7, hitRate: 0.53, isLeader: true } },
  { id: 'even', name: 'EVEN', category: 'Table Common', family: '18s', metrics: { score: 48, badge: 'COLD', volatility: 'MODERATE', zScore: -0.5, streak: 0, absence: 5, roi: -3, hitRate: 0.47, isLeader: false } },
  { id: 'low', name: 'LOW', category: 'Table Common', family: '18s', metrics: { score: 55, badge: 'NEUTRAL', volatility: 'MODERATE', zScore: 0.3, streak: 2, absence: 0, roi: 2, hitRate: 0.50, isLeader: false } },
  { id: 'high', name: 'HIGH', category: 'Table Common', family: '18s', metrics: { score: 71, badge: 'HOT', volatility: 'STABLE', zScore: 1.1, streak: 4, absence: 0, roi: 6, hitRate: 0.52, isLeader: true } },
  { id: 'd1', name: 'D1', category: 'Table Common', family: '12s', metrics: { score: 41, badge: 'COLD', volatility: 'VOLATILE', zScore: -1.1, streak: 0, absence: 12, roi: -6, hitRate: 0.28, isLeader: false } },
  { id: 'd2', name: 'D2', category: 'Table Common', family: '12s', metrics: { score: 68, badge: 'HOT', volatility: 'STABLE', zScore: 1.2, streak: 4, absence: 0, roi: 5, hitRate: 0.39, isLeader: true } },
  { id: 'd3', name: 'D3', category: 'Table Common', family: '12s', metrics: { score: 54, badge: 'NEUTRAL', volatility: 'MODERATE', zScore: 0.1, streak: 1, absence: 1, roi: 0, hitRate: 0.33, isLeader: false } },
  { id: 'c2', name: 'C2', category: 'Table Common', family: '12s', metrics: { score: 64, badge: 'WATCH', volatility: 'STABLE', zScore: 0.9, streak: 4, absence: 0, roi: 3, hitRate: 0.36, isLeader: true } },
  { id: 'voisins', name: 'Voisins', category: 'Wheel Common', family: 'wheel', metrics: { score: 73, badge: 'HOT', volatility: 'STABLE', zScore: 1.3, streak: 7, absence: 0, roi: 7, hitRate: 0.48, isLeader: true } },
  { id: 'orphelins', name: 'Orphelins', category: 'Wheel Common', family: 'wheel', metrics: { score: 44, badge: 'COLD', volatility: 'VOLATILE', zScore: -0.8, streak: 0, absence: 8, roi: -4, hitRate: 0.19, isLeader: false } },
];

const CORRELATIONS: Record<string, Record<string, number>> = {
  'red': { 'odd': 0.85, 'high': 0.62, 'd2': 0.45, 'voisins': 0.38, 'black': -0.95, 'even': -0.82 },
  'black': { 'even': 0.83, 'low': 0.58, 'd1': 0.42, 'red': -0.95, 'odd': -0.80 },
  'odd': { 'red': 0.85, 'high': 0.55, 'voisins': 0.41, 'even': -0.92 },
  'even': { 'black': 0.83, 'low': 0.52, 'odd': -0.92 },
  'high': { 'red': 0.62, 'odd': 0.55, 'd3': 0.68, 'low': -0.88 },
  'low': { 'black': 0.58, 'even': 0.52, 'd1': 0.71, 'high': -0.88 },
};

// ==================== CALCULATION FUNCTIONS ====================
function calculateVolatility(spins: number[], groupNumbers: number[]): { volatility: number; alternations: number } {
  if (spins.length < 2) return { volatility: 0, alternations: 0 };
  
  let alternations = 0;
  for (let i = 1; i < spins.length; i++) {
    const wasHit = groupNumbers.includes(spins[i - 1]);
    const isHit = groupNumbers.includes(spins[i]);
    if (wasHit !== isHit) alternations++;
  }
  
  const alternationRate = alternations / (spins.length - 1);
  const volatility = Math.min(1, alternationRate * 2);
  
  return { volatility, alternations };
}

function calculateMetrics(spins: number[], groupNumbers: number[], expected: number = 0.5): GroupMetrics {
  const hits = spins.filter(n => groupNumbers.includes(n)).length;
  const hitRate = spins.length > 0 ? hits / spins.length : 0;
  const deviation = hitRate - expected;
  const n = spins.length;
  const zScore = n > 0 ? (hits - n * expected) / Math.sqrt(n * expected * (1 - expected)) : 0;

  // Streak: count from index 0 (most recent) until we hit a miss
  let streak = 0;
  for (let i = 0; i < spins.length; i++) {
    if (groupNumbers.includes(spins[i])) {
      streak++;
    } else {
      break; // Stop at first miss
    }
  }

  // Absence: count from index 0 (most recent) until we hit a match
  let absence = 0;
  for (let i = 0; i < spins.length; i++) {
    if (groupNumbers.includes(spins[i])) {
      break; // Stop at first hit
    } else {
      absence++;
    }
  }
  
  let ewma = 0;
  const alpha = THRESHOLDS.EWMA_ALPHA;
  for (let i = 0; i < spins.length; i++) {
    const hit = groupNumbers.includes(spins[i]) ? 1 : 0;
    ewma = alpha * hit + (1 - alpha) * ewma;
  }
  
  let roi = 0;
  for (const spin of spins) {
    roi += groupNumbers.includes(spin) ? 1 : -1;
  }
  
  const { volatility, alternations } = calculateVolatility(spins, groupNumbers);
  
  return { hitRate, deviation, zScore, streak, absence, ewma, roi, volatility, alternations };
}

function calculateScore(metrics: GroupMetrics): number {
  const zNorm = Math.max(0, Math.min(1, (metrics.zScore + 3) / 6));
  const ewmaNorm = Math.max(0, Math.min(1, metrics.ewma));
  const roiNorm = Math.max(0, Math.min(1, (metrics.roi + 36) / 72));
  const streakNorm = Math.max(0, Math.min(1, metrics.streak / 10));
  const absenceNorm = Math.max(0, Math.min(1, 1 - metrics.absence / 20));
  
  const score = (
    0.35 * zNorm +
    0.20 * ewmaNorm +
    0.15 * roiNorm +
    0.10 * streakNorm +
    0.10 * absenceNorm +
    0.10 * 0.5
  ) * 100;
  
  return Math.round(score);
}

function getBadge(metrics: GroupMetrics): 'HOT' | 'COLD' | 'WATCH' | 'NEUTRAL' {
  if (metrics.zScore >= THRESHOLDS.HOT_Z) return 'HOT';
  if (metrics.zScore <= THRESHOLDS.COLD_Z) return 'COLD';
  if (Math.abs(metrics.zScore) >= THRESHOLDS.WATCH_Z) return 'WATCH';
  return 'NEUTRAL';
}

function getVolatilityLevel(volatility: number): 'STABLE' | 'MODERATE' | 'VOLATILE' {
  if (volatility < THRESHOLDS.VOLATILITY_STABLE) return 'STABLE';
  if (volatility > THRESHOLDS.VOLATILITY_VOLATILE) return 'VOLATILE';
  return 'MODERATE';
}

function calculateRace(
  spins: number[],
  groups: number[][],
  names: string[],
  colors: string[],
  expected: number
): RaceResult {
  const numericSpins = spins.filter(n => !isNaN(n) && n !== 0);
  
  const metrics = groups.map(g => calculateMetrics(numericSpins, g, expected));
  const scores = metrics.map(m => calculateScore(m));
  const badges = metrics.map(m => getBadge(m));
  const volatilityLevels = metrics.map(m => getVolatilityLevel(m.volatility));
  
  let leader: number | 'TIE' = 'TIE';
  const maxScore = Math.max(...scores);
  const maxCount = scores.filter(s => s === maxScore).length;
  
  if (maxCount === 1) {
    leader = scores.indexOf(maxScore);
  }
  
  return { groups: metrics, scores, leader, badges, names, colors, volatilityLevels };
}

// ==================== RACE TRACK COMPONENT ====================
function RaceTrack({ result, compact = false }: { result: RaceResult; compact?: boolean }) {
  const { groups, scores, leader, badges, names, colors, volatilityLevels } = result;
  
  const getBadgeIcon = (badge: string) => {
    switch (badge) {
        case 'HOT': return '🔥';
        case 'COLD': return '❄️';
        case 'WATCH': return '👁️';
        default: return '≈';
    }
  };
  
  const getVolatilityIcon = (level: string) => {
    switch (level) {
        case 'STABLE': return '🟢';
        case 'MODERATE': return '🟡';
        case 'VOLATILE': return '🔴';
        default: return '≈';
    }
  };
  
  const getVolatilityColor = (level: string) => {
    switch (level) {
      case 'STABLE': return 'text-green-400';
      case 'MODERATE': return 'text-yellow-400';
      case 'VOLATILE': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className="space-y-2">
      {groups.map((group, idx) => (
        <div key={idx} className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className={`text-xs font-bold min-w-[80px] ${leader === idx ? 'animate-pulse' : ''}`}
              style={{ color: colors[idx] }}
            >
              {names[idx]}
            </span>
            <span className="text-xs">{getBadgeIcon(badges[idx])}</span>
            {!compact && (
              <>
                <span className="text-xs">{getVolatilityIcon(volatilityLevels[idx])}</span>
                <span className="text-xs text-gray-500">
                  S:{group.streak} A:{group.absence} Alt:{group.alternations}
                </span>
              </>
            )}
          </div>
          <div className="relative h-6 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/30">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${leader === idx ? 'shadow-lg' : ''}`}
              style={{ 
                width: `${scores[idx]}%`,
                background: `linear-gradient(to right, ${colors[idx]}, ${colors[idx]}dd)`,
                boxShadow: leader === idx ? `0 0 20px ${colors[idx]}80` : 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-2">
              <span className="text-sm font-bold text-white drop-shadow-lg">{scores[idx]}</span>
            </div>
          </div>
          {!compact && (
            <div className="mt-1 flex gap-2 text-xs">
              <span className="text-gray-400">
                Z: <span className={group.zScore > 0 ? 'text-green-400' : 'text-red-400'}>
                  {group.zScore > 0 ? '+' : ''}{group.zScore.toFixed(2)}
                </span>
              </span>
              <span className="text-gray-400"> . </span>
              <span className="text-gray-400">
                Vol: <span className={getVolatilityColor(volatilityLevels[idx])}>
                  {(group.volatility * 100).toFixed(0)}%
                </span>
              </span>
              <span className="text-gray-400"> .</span>
              <span className="text-gray-400">
                ROI: <span className={group.roi > 0 ? 'text-green-400' : 'text-red-400'}>
                  {group.roi > 0 ? '+' : ''}{group.roi}u
                </span>
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function BetAdvisor() {
  const [mainTab, setMainTab] = useState<MainTabType>('toppers');
  const [toppersTab, setToppersTab] = useState<ToppersTabType>('table-common');
  const [advisorTab, setAdvisorTab] = useState<AdvisorTabType>('filter');
  const [scenario, setScenario] = useState<'balanced' | 'red-hot' | 'volatility'>('balanced');
  const [unitSize, setUnitSize] = useState(10);
  const [bankroll, setBankroll] = useState(1000);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(['red', 'odd']));
  const [showFeatureHighlight, setShowFeatureHighlight] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', name: 'Hot Streak Alert', criteria: 'HOT + Streak ≥ 5', active: true, matchCount: 4, triggered: true },
    { id: '2', name: 'Value Play Alert', criteria: 'COLD + Absence ≤ 8', active: true, matchCount: 2, triggered: true },
    { id: '3', name: 'High Score Alert', criteria: 'Score ≥ 75', active: true, matchCount: 3, triggered: true },
  ]);

  // Get real spin history from context
  const { spinHistory } = useBettingData();

  // Use real spins if available, otherwise show demo
  // IMPORTANT: Memoize this so reference only changes when spinHistory actually changes
  const numericSpins = useMemo(() =>
    spinHistory.length > 0
      ? spinHistory
          .filter(s => {
            // Filter out notification spins (dealer change, card start/end)
            if ((s as any).isDealerChange || (s as any).isCardStart || (s as any).isCardEnd) return false
            // Filter out invalid numbers (only keep 0-36)
            return s.number >= 0 && s.number <= 36
          })
          .map(s => s.number)
      : (() => {
          // Demo data for when no real spins yet
          const base = Array.from({ length: 40 }, (_, i) => {
            let num: number;
            if (scenario === 'red-hot') {
              num = i % 10 < 6 ? RED_NUMBERS[i % RED_NUMBERS.length] : BLACK_NUMBERS[i % BLACK_NUMBERS.length];
            } else if (scenario === 'volatility') {
              num = i % 2 === 0 ? RED_NUMBERS[i % RED_NUMBERS.length] : BLACK_NUMBERS[i % BLACK_NUMBERS.length];
            } else {
              const arr = [...RED_NUMBERS, ...BLACK_NUMBERS, 0];
              num = arr[i % arr.length];
            }
            return num;
          });
          return base;
        })(),
    [spinHistory, scenario]
  );
  
  // Calculate races
  const redBlack = useMemo(() => calculateRace(numericSpins, [RED_NUMBERS, BLACK_NUMBERS], ['RED', 'BLACK'], ['#EF4444', '#6B7280'], 0.5), [numericSpins]);
  const oddEven = useMemo(() => calculateRace(numericSpins, [ODD_NUMBERS, EVEN_NUMBERS], ['ODD', 'EVEN'], ['#F97316', '#8B5CF6'], 0.5), [numericSpins]);
  const lowHigh = useMemo(() => calculateRace(numericSpins, [LOW_NUMBERS, HIGH_NUMBERS], ['LOW', 'HIGH'], ['#3B82F6', '#14B8A6'], 0.5), [numericSpins]);
  const dozens = useMemo(() => calculateRace(numericSpins, [DOZEN1, DOZEN2, DOZEN3], ['D1', 'D2', 'D3'], ['#3B82F6', '#8B5CF6', '#EC4899'], 1/3), [numericSpins]);
  const columns = useMemo(() => calculateRace(numericSpins, [COL1, COL2, COL3], ['C1', 'C2', 'C3'], ['#06B6D4', '#10B981', '#84CC16'], 1/3), [numericSpins]);

  // Table Special Races
  const edgeCenter = useMemo(() => calculateRace(numericSpins, [EDGE_NUMBERS, CENTER_NUMBERS], ['EDGE', 'CENTER'], ['#F59E0B', '#8B5CF6'], 0.5), [numericSpins]);
  const sixLines = useMemo(() => calculateRace(numericSpins, [SIXLINE1, SIXLINE2, SIXLINE3, SIXLINE4, SIXLINE5, SIXLINE6], ['6L-1', '6L-2', '6L-3', '6L-4', '6L-5', '6L-6'], ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'], 1/6), [numericSpins]);
  const alt1Groups = useMemo(() => calculateRace(numericSpins, [ALT1_A, ALT1_B], ['A', 'B'], ['#EF4444', '#3B82F6'], 0.5), [numericSpins]);
  const alt2Groups = useMemo(() => calculateRace(numericSpins, [ALT2_AA, ALT2_BB], ['AA', 'BB'], ['#F97316', '#8B5CF6'], 0.5), [numericSpins]);
  const alt3Groups = useMemo(() => calculateRace(numericSpins, [ALT3_AAA, ALT3_BBB], ['AAA', 'BBB'], ['#10B981', '#EC4899'], 0.5), [numericSpins]);

  // Wheel Common Races
  const wheelMajor = useMemo(() => calculateRace(numericSpins, [VOISINS, TIERS, ORPHELINS], ['Voisins', 'Tiers', 'Orphelins'], ['#EF4444', '#3B82F6', '#F59E0B'], 0.33), [numericSpins]);
  const voisinSplit = useMemo(() => calculateRace(numericSpins, [VOISINS, NON_VOISINS], ['Voisins', 'Non-Voisins'], ['#EF4444', '#6B7280'], 0.5), [numericSpins]);
  const wheelHalves = useMemo(() => calculateRace(numericSpins, [WHEEL_RIGHT, WHEEL_LEFT], ['Right 18', 'Left 18'], ['#3B82F6', '#F59E0B'], 0.5), [numericSpins]);
  const wheelNines = useMemo(() => calculateRace(numericSpins, [WHEEL_9_1ST, WHEEL_9_2ND, WHEEL_9_3RD, WHEEL_9_4TH], ['1st 9', '2nd 9', '3rd 9', '4th 9'], ['#EF4444', '#F97316', '#10B981', '#3B82F6'], 0.25), [numericSpins]);

  // Wheel Special Races
  const wheelAB = useMemo(() => calculateRace(numericSpins, [WHEEL_A, WHEEL_B], ['A Pattern', 'B Pattern'], ['#EF4444', '#3B82F6'], 0.5), [numericSpins]);
  const wheelAABB = useMemo(() => calculateRace(numericSpins, [WHEEL_AA, WHEEL_BB], ['AA Pattern', 'BB Pattern'], ['#F97316', '#8B5CF6'], 0.5), [numericSpins]);
  const wheelAAABBB = useMemo(() => calculateRace(numericSpins, [WHEEL_AAA, WHEEL_BBB], ['AAA Pattern', 'BBB Pattern'], ['#10B981', '#EC4899'], 0.5), [numericSpins]);
  const wheelA6B6 = useMemo(() => calculateRace(numericSpins, [WHEEL_A6, WHEEL_B6], ['A6 Pattern', 'B6 Pattern'], ['#06B6D4', '#F59E0B'], 0.5), [numericSpins]);
  const wheelA9B9 = useMemo(() => calculateRace(numericSpins, [WHEEL_A9, WHEEL_B9], ['A9 Pattern', 'B9 Pattern'], ['#8B5CF6', '#14B8A6'], 0.5), [numericSpins]);

  // Hot/Cold Analysis for current tab
  const getHotColdGroups = useMemo(() => {
    const WINDOW = 20;
    const recentSpins = numericSpins.slice(0, Math.min(WINDOW, numericSpins.length));

    if (recentSpins.length < 5) return { hot: [], cold: [] };

    let groups: Array<{ name: string; numbers: number[]; color: string }> = [];

    // Determine which groups to analyze based on active tab
    if (toppersTab === 'table-common') {
      groups = [
        { name: 'RED', numbers: RED_NUMBERS, color: '#EF4444' },
        { name: 'BLACK', numbers: BLACK_NUMBERS, color: '#6B7280' },
        { name: 'ODD', numbers: ODD_NUMBERS, color: '#F97316' },
        { name: 'EVEN', numbers: EVEN_NUMBERS, color: '#8B5CF6' },
        { name: 'LOW', numbers: LOW_NUMBERS, color: '#3B82F6' },
        { name: 'HIGH', numbers: HIGH_NUMBERS, color: '#14B8A6' },
        { name: 'D1', numbers: DOZEN1, color: '#3B82F6' },
        { name: 'D2', numbers: DOZEN2, color: '#8B5CF6' },
        { name: 'D3', numbers: DOZEN3, color: '#EC4899' },
        { name: 'C1', numbers: COL1, color: '#06B6D4' },
        { name: 'C2', numbers: COL2, color: '#10B981' },
        { name: 'C3', numbers: COL3, color: '#84CC16' },
      ];
    } else if (toppersTab === 'table-special') {
      groups = [
        { name: 'EDGE', numbers: EDGE_NUMBERS, color: '#F59E0B' },
        { name: 'CENTER', numbers: CENTER_NUMBERS, color: '#8B5CF6' },
        { name: 'A', numbers: ALT1_A, color: '#EF4444' },
        { name: 'B', numbers: ALT1_B, color: '#3B82F6' },
        { name: 'AA', numbers: ALT2_AA, color: '#F97316' },
        { name: 'BB', numbers: ALT2_BB, color: '#8B5CF6' },
        { name: 'AAA', numbers: ALT3_AAA, color: '#10B981' },
        { name: 'BBB', numbers: ALT3_BBB, color: '#EC4899' },
        { name: '6L-1', numbers: SIXLINE1, color: '#EF4444' },
        { name: '6L-2', numbers: SIXLINE2, color: '#F97316' },
        { name: '6L-3', numbers: SIXLINE3, color: '#F59E0B' },
        { name: '6L-4', numbers: SIXLINE4, color: '#10B981' },
        { name: '6L-5', numbers: SIXLINE5, color: '#3B82F6' },
        { name: '6L-6', numbers: SIXLINE6, color: '#8B5CF6' },
      ];
    } else if (toppersTab === 'wheel-common') {
      groups = [
        { name: 'Voisins', numbers: VOISINS, color: '#EF4444' },
        { name: 'Tiers', numbers: TIERS, color: '#3B82F6' },
        { name: 'Orphelins', numbers: ORPHELINS, color: '#F59E0B' },
        { name: 'Non-Voisins', numbers: NON_VOISINS, color: '#6B7280' },
        { name: 'Right 18', numbers: WHEEL_RIGHT, color: '#3B82F6' },
        { name: 'Left 18', numbers: WHEEL_LEFT, color: '#F59E0B' },
        { name: '1st 9', numbers: WHEEL_9_1ST, color: '#EF4444' },
        { name: '2nd 9', numbers: WHEEL_9_2ND, color: '#F97316' },
        { name: '3rd 9', numbers: WHEEL_9_3RD, color: '#10B981' },
        { name: '4th 9', numbers: WHEEL_9_4TH, color: '#3B82F6' },
      ];
    } else if (toppersTab === 'wheel-special') {
      groups = [
        { name: 'A Pattern', numbers: WHEEL_A, color: '#EF4444' },
        { name: 'B Pattern', numbers: WHEEL_B, color: '#3B82F6' },
        { name: 'AA Pattern', numbers: WHEEL_AA, color: '#F97316' },
        { name: 'BB Pattern', numbers: WHEEL_BB, color: '#8B5CF6' },
        { name: 'AAA Pattern', numbers: WHEEL_AAA, color: '#10B981' },
        { name: 'BBB Pattern', numbers: WHEEL_BBB, color: '#EC4899' },
        { name: 'A6 Pattern', numbers: WHEEL_A6, color: '#06B6D4' },
        { name: 'B6 Pattern', numbers: WHEEL_B6, color: '#F59E0B' },
        { name: 'A9 Pattern', numbers: WHEEL_A9, color: '#8B5CF6' },
        { name: 'B9 Pattern', numbers: WHEEL_B9, color: '#14B8A6' },
      ];
    }

    // Calculate metrics for each group
    const analyzed = groups.map(group => {
      const hits = recentSpins.filter(n => group.numbers.includes(n)).length;
      const hitRate = hits / recentSpins.length;

      // Calculate streak from most recent
      let streak = 0;
      for (let i = 0; i < recentSpins.length; i++) {
        if (group.numbers.includes(recentSpins[i])) {
          streak++;
        } else {
          break;
        }
      }

      // Calculate absence (spins since last hit)
      let absence = 0;
      for (let i = 0; i < recentSpins.length; i++) {
        if (group.numbers.includes(recentSpins[i])) {
          break;
        }
        absence++;
      }

      return {
        ...group,
        hits,
        hitRate,
        streak,
        absence,
        total: recentSpins.length,
      };
    });

    // Determine hot groups: ≥60% hit rate or 3+ streak
    const hot = analyzed
      .filter(g => g.hitRate >= 0.6 || g.streak >= 3)
      .sort((a, b) => b.hitRate - a.hitRate)
      .slice(0, 2);

    // Determine cold groups: ≤30% hit rate or 5+ spins missing
    const cold = analyzed
      .filter(g => g.hitRate <= 0.3 || g.absence >= 5)
      .sort((a, b) => a.hitRate - b.hitRate)
      .slice(0, 2);

    return { hot, cold };
  }, [numericSpins, toppersTab]);

  // Analytics functions
  const hotGroups = SAMPLE_GROUPS.filter(g => g.metrics.badge === 'HOT' && g.metrics.volatility === 'STABLE');
  
  const getCorrelation = (id1: string, id2: string): number => {
    return CORRELATIONS[id1]?.[id2] || 0;
  };
  
  const findCorrelatedGroups = (groupId: string, threshold: number = 0.5): GroupData[] => {
    const correlations = CORRELATIONS[groupId] || {};
    return SAMPLE_GROUPS.filter(g => {
      const corr = correlations[g.id];
      return corr && Math.abs(corr) >= threshold && g.id !== groupId;
    });
  };
  
  const detectDivergences = (): Array<{ group1: GroupData; group2: GroupData; correlation: number; divergence: string }> => {
    const divergences: Array<{ group1: GroupData; group2: GroupData; correlation: number; divergence: string }> = [];
    
    for (const group1 of SAMPLE_GROUPS) {
      const correlations = CORRELATIONS[group1.id] || {};
      for (const [id2, corr] of Object.entries(correlations)) {
        if (Math.abs(corr) >= 0.7) {
          const group2 = SAMPLE_GROUPS.find(g => g.id === id2);
          if (group2) {
            if (corr > 0 && group1.metrics.badge === 'HOT' && group2.metrics.badge === 'COLD') {
              divergences.push({
                group1,
                group2,
                correlation: corr,
                divergence: `${group1.name} HOT but ${group2.name} COLD (usually move together)`
              });
            }
            if (corr < -0.7 && group1.metrics.badge === group2.metrics.badge && group1.metrics.badge !== 'NEUTRAL') {
              divergences.push({
                group1,
                group2,
                correlation: corr,
                divergence: `${group1.name} & ${group2.name} both ${group1.metrics.badge} (usually opposite)`
              });
            }
          }
        }
      }
    }
    
    return divergences;
  };
  
  const divergences = detectDivergences();
  
  const generateCompositeStrategies = (): CompositeStrategy[] => {
    const strategies: CompositeStrategy[] = [];
    
    const hotStable = hotGroups.slice(0, 3);
    if (hotStable.length === 3) {
      strategies.push({
        id: 'triple-hot',
        name: '🔥 Triple Hot Stable',
        groups: hotStable.map(g => g.name),
        totalStake: unitSize * 3,
        expectedPayout: unitSize * 3 * 2,
        coverage: 48.6
      });
    }
    
    const redGroup = SAMPLE_GROUPS.find(g => g.id === 'red');
    const oddGroup = SAMPLE_GROUPS.find(g => g.id === 'odd');
    if (redGroup && oddGroup && redGroup.metrics.badge === 'HOT' && oddGroup.metrics.badge === 'HOT') {
      strategies.push({
        id: 'red-odd-combo',
        name: '⚡ Red-Odd Correlation',
        groups: ['RED', 'ODD'],
        totalStake: unitSize * 2,
        expectedPayout: unitSize * 2 * 1.8,
        coverage: 36.5
      });
    }
    
    const voisins = SAMPLE_GROUPS.find(g => g.id === 'voisins');
    const high = SAMPLE_GROUPS.find(g => g.id === 'high');
    if (voisins && high && voisins.metrics.badge === 'HOT' && high.metrics.badge === 'HOT') {
      strategies.push({
        id: 'voisins-high',
        name: '🎡 Voisins + High',
        groups: ['Voisins', 'HIGH'],
        totalStake: unitSize * 2.5,
        expectedPayout: unitSize * 2.5 * 2.2,
        coverage: 56.7
      });
    }
    
    return strategies;
  };
  
  const strategies = generateCompositeStrategies();
  
  const toggleGroup = (id: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroups(newSelected);
  };
  
  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };
  
  const calculateStake = (group: GroupData, units: number): { stake: number; payout: number; risk: number } => {
    const stake = unitSize * units;
    let payout = 0;
    
    if (group.family === '18s') payout = stake * 2;
    else if (group.family === '12s') payout = stake * 3;
    else if (group.family === '6s') payout = stake * 6;
    else payout = stake * 2;
    
    const risk = (stake / bankroll) * 100;
    
    return { stake, payout, risk };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
          📊 GAME STATS
          </h1>
        </div>

        {/* Main Navigation Tabs */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 mb-6 overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setMainTab('toppers')}
              className={`px-6 py-4 text-base font-semibold transition-all border-b-2 ${
                mainTab === 'toppers'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                  : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                <span>📊 Race Analytics</span>
                <span className="text-xs opacity-60">See Who's Winning</span>
              </div>
            </button>
            <button
              onClick={() => setMainTab('advisor')}
              className={`px-6 py-4 text-base font-semibold transition-all border-b-2 ${
                mainTab === 'advisor'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                  : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-6 h-6" />
                <span>⚡ Smart Advisor</span>
                <span className="text-xs opacity-60">Alerts, Calculator, Analytics</span>
              </div>
            </button>
          </div>
        </div>

        {/* TOPPERS TAB - Race Analytics */}
        {mainTab === 'toppers' && (
          <>
            {/* Toppers Sub-Tabs with Spin Count */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 mb-6 overflow-hidden">
              <div className="flex items-center">
                <div className="grid grid-cols-4 flex-1">
                  {[
                   { id: 'table-common' as const, icon: '📊', label: 'Table Common' },
                   { id: 'table-special' as const, icon: '⭐', label: 'Table Special' },
                   { id: 'wheel-common' as const, icon: '🎡', label: 'Wheel Common' },
                   { id: 'wheel-special' as const, icon: '🎯', label: 'Wheel Special' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setToppersTab(tab.id)}
                      className={`px-4 py-4 text-sm font-semibold transition-all border-b-2 ${
                        toppersTab === tab.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                          : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-6 py-4 text-sm text-green-400 font-semibold whitespace-nowrap border-b-2 border-transparent">
                  {spinHistory.length} spins ✓
                </div>
              </div>
            </div>

            {/* Hot/Cold Alerts Grid */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 mb-6">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                📊 ALERTS (Last 20 Spins)
              </div>

              {/* Show placeholder when not enough spins */}
              {numericSpins.length < 5 ? (
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl">⚡</div>
                    <div className="text-yellow-400 font-bold text-lg">
                      Alerts Require Spin Data
                    </div>
                    <div className="text-gray-400 text-sm max-w-md">
                      Add at least <span className="text-yellow-400 font-semibold">5 spins</span> to see hot/cold pattern alerts.
                      Best results with <span className="text-yellow-400 font-semibold">20+ spins</span> for accurate analysis.
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Current spins: <span className="text-yellow-400 font-semibold">{numericSpins.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Hot Groups - Left Column */}
                  <div className="space-y-3">
                    {getHotColdGroups.hot.map((group, idx) => (
                      <div
                        key={`hot-${idx}`}
                        className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🔥</span>
                            <span className="font-bold text-white">{group.name}</span>
                          </div>
                          <span className="text-red-400 font-bold text-lg">
                            {group.hits}/{group.total}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {group.streak >= 3 && (
                            <div className="flex items-center gap-1 text-orange-400">
                              <span>🔥</span>
                              <span className="font-semibold">{group.streak}-spin streak</span>
                            </div>
                          )}
                          <div className="text-gray-400">
                            Hit rate: <span className="text-red-400 font-semibold">
                              {(group.hitRate * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {getHotColdGroups.hot.length === 0 && (
                      <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 text-center text-gray-500 text-sm">
                        No hot groups detected
                      </div>
                    )}
                  </div>

                  {/* Cold Groups - Right Column */}
                  <div className="space-y-3">
                    {getHotColdGroups.cold.map((group, idx) => (
                      <div
                        key={`cold-${idx}`}
                        className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/30 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">❄️</span>
                            <span className="font-bold text-white">{group.name}</span>
                          </div>
                          <span className="text-cyan-400 font-bold text-lg">
                            {group.hits}/{group.total}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {group.absence >= 5 && (
                            <div className="flex items-center gap-1 text-cyan-400">
                              <span>❄️</span>
                              <span className="font-semibold">{group.absence} spins ago</span>
                            </div>
                          )}
                          <div className="text-gray-400">
                            Hit rate: <span className="text-cyan-400 font-semibold">
                              {(group.hitRate * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {getHotColdGroups.cold.length === 0 && (
                      <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 text-center text-gray-500 text-sm">
                        No cold groups detected
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toppers Content */}
            <div className="space-y-6">
              {toppersTab === 'table-common' && (
                <>
                  {/* Quick Navigation */}
                  <div className="sticky top-4 z-10 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3 shadow-lg">
                    <div className="text-xs font-semibold text-gray-400 mb-2">QUICK JUMP:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'red-vs-black', label: 'Red/Black' },
                        { id: 'odd-vs-even', label: 'Odd/Even' },
                        { id: 'low-vs-high', label: 'Low/High' },
                        { id: 'dozens', label: 'Dozens' },
                        { id: 'columns', label: 'Columns' }
                      ].map(link => (
                        <a
                          key={link.id}
                          href={`#${link.id}`}
                          className="px-3 py-1 bg-gray-800 hover:bg-cyan-600 text-gray-300 hover:text-white rounded text-xs font-medium transition-all"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                  <EnhancedRaceCard
                    result={redBlack}
                    title="🔴 Red vs Black"
                    payout="1:1"
                    spins={numericSpins}
                    groupNumbers={[RED_NUMBERS, BLACK_NUMBERS]}
                  />

                  <EnhancedRaceCard
                    result={oddEven}
                    title="🟠 Odd vs Even"
                    payout="1:1"
                    spins={numericSpins}
                    groupNumbers={[ODD_NUMBERS, EVEN_NUMBERS]}
                  />

                  <EnhancedRaceCard
                    result={lowHigh}
                    title="🔵 Low vs High"
                    payout="1:1"
                    spins={numericSpins}
                    groupNumbers={[LOW_NUMBERS, HIGH_NUMBERS]}
                  />

                  <EnhancedRaceCard
                    result={dozens}
                    title="🟣 Dozens"
                    payout="2:1"
                    spins={numericSpins}
                    groupNumbers={[DOZEN1, DOZEN2, DOZEN3]}
                  />

                  <EnhancedRaceCard
                    result={columns}
                    title="🟢 Columns"
                    payout="2:1"
                    spins={numericSpins}
                    groupNumbers={[COL1, COL2, COL3]}
                  />
                </div>
              </>
            )}
              
              {toppersTab === 'table-special' && (
                <>
                  {/* Quick Navigation */}
                  <div className="sticky top-4 z-10 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3 shadow-lg">
                    <div className="text-xs font-semibold text-gray-400 mb-2">QUICK JUMP:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'edge-vs-center', label: 'Edge/Center' },
                        { id: '1st-alternate-streets', label: '1st Alt Streets' },
                        { id: '2nd-alternate-streets', label: '2nd Alt Streets' },
                        { id: '3rd-alternate-streets', label: '3rd Alt Streets' },
                        { id: 'six-lines-1-36', label: 'Six Lines' }
                      ].map(link => (
                        <a
                          key={link.id}
                          href={`#${link.id}`}
                          className="px-3 py-1 bg-gray-800 hover:bg-cyan-600 text-gray-300 hover:text-white rounded text-xs font-medium transition-all"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <EnhancedRaceCard
                      result={edgeCenter}
                      title="🟠 Edge vs Center"
                      payout="Table Position"
                      spins={numericSpins}
                      groupNumbers={[EDGE_NUMBERS, CENTER_NUMBERS]}
                    />

                    <EnhancedRaceCard
                      result={alt1Groups}
                      title="🔴 1st Alternate Streets"
                      payout="A vs B"
                      spins={numericSpins}
                      groupNumbers={[ALT1_A, ALT1_B]}
                    />

                    <EnhancedRaceCard
                      result={alt2Groups}
                      title="🟠 2nd Alternate Streets"
                      payout="AA vs BB"
                      spins={numericSpins}
                      groupNumbers={[ALT2_AA, ALT2_BB]}
                    />

                    <EnhancedRaceCard
                      result={alt3Groups}
                      title="🟢 3rd Alternate Streets"
                      payout="AAA vs BBB"
                      spins={numericSpins}
                      groupNumbers={[ALT3_AAA, ALT3_BBB]}
                    />

                    <EnhancedRaceCard
                      result={sixLines}
                      title="🌸 Six Lines (1-36)"
                      payout="5:1"
                      spins={numericSpins}
                      groupNumbers={[SIXLINE1, SIXLINE2, SIXLINE3, SIXLINE4, SIXLINE5, SIXLINE6]}
                    />
                  </div>
                </>
              )}

              {toppersTab === 'wheel-common' && (
                <>
                  {/* Quick Navigation */}
                  <div className="sticky top-4 z-10 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3 shadow-lg">
                    <div className="text-xs font-semibold text-gray-400 mb-2">QUICK JUMP:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'major-wheel-sections', label: 'Major Sections' },
                        { id: 'voisins-vs-non-voisins', label: 'Voisins/Non-Voisins' },
                        { id: 'wheel-halves', label: 'Wheel Halves' },
                        { id: 'wheel-quadrants-9-s', label: 'Quadrants (9s)' }
                      ].map(link => (
                        <a
                          key={link.id}
                          href={`#${link.id}`}
                          className="px-3 py-1 bg-gray-800 hover:bg-cyan-600 text-gray-300 hover:text-white rounded text-xs font-medium transition-all"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <EnhancedRaceCard
                      result={wheelMajor}
                      title="🔴 Major Wheel Sections"
                      payout="French Bets"
                      spins={numericSpins}
                      groupNumbers={[VOISINS, TIERS, ORPHELINS]}
                    />
                    <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                      <div className="bg-red-900/20 rounded p-2 border border-red-500/30">
                        <div className="font-bold text-red-400 mb-1">Voisins du Zero</div>
                        <p className="text-gray-400">17 numbers around 0</p>
                        <p className="text-gray-300 text-[10px] mt-1">22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25</p>
                      </div>
                      <div className="bg-blue-900/20 rounded p-2 border border-blue-500/30">
                        <div className="font-bold text-blue-400 mb-1">Tiers du Cylindre</div>
                        <p className="text-gray-400">12 numbers opposite 0</p>
                        <p className="text-gray-300 text-[10px] mt-1">27,13,36,11,30,8,23,10,5,24,16,33</p>
                      </div>
                      <div className="bg-orange-900/20 rounded p-2 border border-orange-500/30">
                        <div className="font-bold text-orange-400 mb-1">Orphelins</div>
                        <p className="text-gray-400">8 numbers remaining</p>
                        <p className="text-gray-300 text-[10px] mt-1">17,34,6,1,20,14,31,9</p>
                      </div>
                    </div>

                    <EnhancedRaceCard
                      result={voisinSplit}
                      title="🟣 Voisins vs Non-Voisins"
                      payout="17 vs 20"
                      spins={numericSpins}
                      groupNumbers={[VOISINS, NON_VOISINS]}
                    />

                    <EnhancedRaceCard
                      result={wheelHalves}
                      title="🔵 Wheel Halves"
                      payout="Right vs Left"
                      spins={numericSpins}
                      groupNumbers={[WHEEL_RIGHT, WHEEL_LEFT]}
                    />

                    <EnhancedRaceCard
                      result={wheelNines}
                      title="🟢 Wheel Quadrants (9's)"
                      payout="Four Sectors"
                      spins={numericSpins}
                      groupNumbers={[WHEEL_9_1ST, WHEEL_9_2ND, WHEEL_9_3RD, WHEEL_9_4TH]}
                    />
                  </div>
                </>
              )}

              {toppersTab === 'wheel-special' && (
                <>
                  {/* Quick Navigation */}
                  <div className="sticky top-4 z-10 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3 shadow-lg">
                    <div className="text-xs font-semibold text-gray-400 mb-2">QUICK JUMP:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'a-b-pattern', label: 'A/B Pattern' },
                        { id: 'aa-bb-pattern', label: 'AA/BB Pattern' },
                        { id: 'aaa-bbb-pattern', label: 'AAA/BBB Pattern' },
                        { id: 'a6-b6-pattern', label: 'A6/B6 Pattern' },
                        { id: 'a9-b9-pattern', label: 'A9/B9 Pattern' }
                      ].map(link => (
                        <a
                          key={link.id}
                          href={`#${link.id}`}
                          className="px-3 py-1 bg-gray-800 hover:bg-cyan-600 text-gray-300 hover:text-white rounded text-xs font-medium transition-all"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <EnhancedRaceCard
                      result={wheelAB}
                      title="🔴 A/B Pattern"
                      payout="Alternating"
                      spins={numericSpins}
                      groupNumbers={[WHEEL_A, WHEEL_B]}
                    />

                  <EnhancedRaceCard
                    result={wheelAABB}
                    title="🟠 AA/BB Pattern"
                    payout="Double Alt"
                    spins={numericSpins}
                    groupNumbers={[WHEEL_AA, WHEEL_BB]}
                  />

                  <EnhancedRaceCard
                    result={wheelAAABBB}
                    title="🟢 AAA/BBB Pattern"
                    payout="Triple Alt"
                    spins={numericSpins}
                    groupNumbers={[WHEEL_AAA, WHEEL_BBB]}
                  />

                  <EnhancedRaceCard
                    result={wheelA6B6}
                    title="🔵 A6/B6 Pattern"
                    payout="Six-Based"
                    spins={numericSpins}
                    groupNumbers={[WHEEL_A6, WHEEL_B6]}
                  />

                  <EnhancedRaceCard
                    result={wheelA9B9}
                    title="🟣 A9/B9 Pattern"
                    payout="Nine-Based"
                    spins={numericSpins}
                    groupNumbers={[WHEEL_A9, WHEEL_B9]}
                  />

                  {/* Info Panel */}
                  <div className="lg:col-span-2 bg-blue-900/20 rounded-xl border border-blue-500/30 p-4">
                    <div className="text-sm font-bold text-blue-400 mb-2"> ℹ️ About Wheel Special Patterns:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                      <div>
                        <p className="mb-1"> . <span className="text-white font-semibold">A/B:</span> Basic alternating pattern on wheel</p>
                        <p className="mb-1"> . <span className="text-white font-semibold">AA/BB:</span> Double-step alternating pattern</p>
                        <p className="mb-1"> . <span className="text-white font-semibold">AAA/BBB:</span> Triple-step alternating pattern</p>
                      </div>
                      <div>
                        <p className="mb-1"> . <span className="text-white font-semibold">A6/B6:</span> Six-number based split pattern</p>
                        <p className="mb-1"> . <span className="text-white font-semibold">A9/B9:</span> Nine-number based split pattern</p>
                        <p className="text-yellow-400 mt-2"> ⚖️¸ These patterns follow wheel sequence, not table layout</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
            
            {/* Legend */}
            <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-blue-400 mb-3"> 🔴 Legend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-300">
                <div>
                  <p className="text-gray-400 mb-1">Badges:</p>
                  <p>🔥 HOT • ❄️ COLD • 👁️ WATCH • ≈ NEUTRAL</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Volatility:</p>
                  <p>🟢 Stable • 🟡 Moderate • 🔴 Volatile</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Metrics:</p>
                  <p>S = Streak • A = Absence • Alt = Alternations</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Score Range:</p>
                  <p>0-100 (Higher = Stronger)</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ADVISOR TAB - Smart Filter */}
        {mainTab === 'advisor' && (
          <>
            {/* Feature Highlight */}
            {showFeatureHighlight && (
              <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 rounded-xl p-6 mb-6 relative">
                <button
                  onClick={() => setShowFeatureHighlight(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-start gap-4">
                  <div className="text-5xl"> ✅ </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-3">Complete Advisor Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {[
                        { icon: Filter, color: 'cyan', title: 'Smart Filtering', items: ['Multi-criteria', 'Badge filter', 'Volatility', 'Score ranges'] },
                        { icon: Bell, color: 'yellow', title: 'Alert System', items: ['Custom alerts', 'Real-time', 'Match tracking', 'Notifications'] },
                        { icon: Calculator, color: 'purple', title: 'Quick Actions', items: ['Stake calc', 'Risk %', 'Bankroll', 'Payouts'] },
                        { icon: TrendingUp, color: 'green', title: 'Analytics', items: ['Correlations', 'Divergences', 'Strategies', 'Patterns'] },
                      ].map((feature, idx) => (
                        <div key={idx} className={`bg-gray-800/50 rounded-lg p-3 border border-${feature.color}-500/30`}>
                          <div className="flex items-center gap-2 mb-2">
                            <feature.icon className={`w-4 h-4 text-${feature.color}-400`} />
                            <span className={`font-bold text-${feature.color}-400 text-sm`}>{feature.title}</span>
                          </div>
                          <ul className="text-xs text-gray-300 space-y-1">
                            {feature.items.map((item, i) => (
                              <li key={i}> ✅ {item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Advisor Sub-Tabs */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 mb-6 overflow-hidden">
              <div className="grid grid-cols-4">
                {[
                  { id: 'filter' as const, icon: Filter, label: 'Filter Groups' },
                  { id: 'alerts' as const, icon: Bell, label: 'Alert System' },
                  { id: 'calculator' as const, icon: Calculator, label: 'Quick Actions' },
                  { id: 'analytics' as const, icon: TrendingUp, label: 'Analytics' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdvisorTab(tab.id)}
                    className={`px-4 py-4 text-sm font-semibold transition-all border-b-2 ${
                      advisorTab === tab.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                        : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Advisor Content */}
            <div className="space-y-4">
              {/* FILTER TAB */}
              {advisorTab === 'filter' && (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-cyan-500/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white"> 🔴 Filtered Groups (HOT + STABLE)</h2>
                      <div className="text-sm text-gray-400">{hotGroups.length} groups match</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hotGroups.map(group => (
                        <div
                          key={group.id}
                          className={`bg-gray-800/50 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                            selectedGroups.has(group.id)
                              ? 'border-cyan-400 shadow-lg shadow-cyan-500/20'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                          onClick={() => toggleGroup(group.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-lg font-bold text-white">{group.name}</div>
                            <div className="text-2xl font-bold text-cyan-400">{group.metrics.score}</div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Badge:</span>
                              <span className="text-red-400 font-semibold"> 🔥 {group.metrics.badge}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Streak:</span>
                              <span className="text-white font-semibold">{group.metrics.streak}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Volatility:</span>
                              <span className="text-green-400 font-semibold">🟢 {group.metrics.volatility}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">ROI:</span>
                              <span className={`font-semibold ${group.metrics.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {group.metrics.roi > 0 ? '+' : ''}{group.metrics.roi}u
                              </span>
                            </div>
                          </div>
                          {selectedGroups.has(group.id) && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <div className="flex items-center gap-1 text-xs text-cyan-400">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Selected</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 rounded-xl border border-blue-500/30 p-4">
                    <div className="text-sm font-bold text-blue-400 mb-2"> 🔴 ‹ Current Filter:</div>
                    <div className="text-xs text-gray-300">
                      Badge: HOT only . Volatility: STABLE only . Positive momentum groups
                    </div>
                  </div>
                </>
              )}
              
              {/* ALERTS TAB */}
              {advisorTab === 'alerts' && (
                <>
                  <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border-2 border-green-500/30 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Bell className="w-6 h-6 text-green-400" />
                      <h2 className="text-xl font-bold text-white">Create New Alert</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Alert Name"
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                      />
                      <select className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none">
                      <option>HOT + Streak ≥ 5</option>
                      <option>COLD + Absence ≤ 10</option>
                       <option>Score ≥ 70</option>
                        <option>Custom...</option>
                      </select>
                    </div>
                    <button className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all">
                      Create Alert
                    </button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-yellow-500/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white"> 🔴 Active Alerts</h2>
                      <div className="text-sm text-yellow-400 font-semibold animate-pulse">
                        {alerts.filter(a => a.triggered).length} Triggered!
                      </div>
                    </div>
                    <div className="space-y-3">
                      {alerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`bg-gray-800/50 rounded-lg p-4 border-2 transition-all ${
                            alert.triggered
                              ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                              : alert.active
                              ? 'border-gray-700'
                              : 'border-gray-800 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {alert.triggered && (
                                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                              )}
                              <div>
                                <div className="text-base font-bold text-white">{alert.name}</div>
                                <div className="text-xs text-gray-400">{alert.criteria}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {alert.matchCount > 0 && (
                                <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-semibold">
                                  {alert.matchCount} matches
                                </div>
                              )}
                              <button
                                onClick={() => toggleAlert(alert.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  alert.active
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {alert.active ? 'ON' : 'OFF'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* CALCULATOR TAB */}
              {advisorTab === 'calculator' && (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-purple-500/30 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                      <h2 className="text-xl font-bold text-white">Betting Settings</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-300 mb-2 block">
                          Unit Size: ${unitSize}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={unitSize}
                          onChange={(e) => setUnitSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-300 mb-2 block">
                          Bankroll: ${bankroll}
                        </label>
                        <input
                          type="number"
                          value={bankroll}
                          onChange={(e) => setBankroll(parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-cyan-500/30 p-6">
                    <h2 className="text-xl font-bold text-white mb-4"> ⚡ Quick Stake Calculator</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hotGroups.slice(0, 6).map(group => {
                        const calc1 = calculateStake(group, 1);
                        const calc2 = calculateStake(group, 2);
                        const calc3 = calculateStake(group, 5);
                        
                        return (
                          <div key={group.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-lg font-bold text-white">{group.name}</div>
                              <div className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                              🔥 HOT
                              </div>
                            </div>
                            <div className="space-y-2">
                              {[
                                { units: 1, calc: calc1, label: 'Safe' },
                                { units: 2, calc: calc2, label: 'Medium' },
                                { units: 5, calc: calc3, label: 'Aggressive' },
                              ].map(({ units, calc, label }) => (
                                <div key={units} className="bg-gray-900/50 rounded p-2">
                                  <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="text-gray-400">{label}: ${calc.stake}</span>
                                    <span className={`font-semibold ${calc.risk > 5 ? 'text-red-400' : calc.risk > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                      {calc.risk.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-400">Payout:</span>
                                    <span className="text-cyan-400 font-semibold">${calc.payout}</span>
                                  </div>
                                  <button className="w-full px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-semibold">
                                    Bet ${calc.stake}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              
              {/* ANALYTICS TAB */}
              {advisorTab === 'analytics' && (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-blue-500/30 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-6 h-6 text-blue-400" />
                      <h2 className="text-xl font-bold text-white">Correlation Matrix</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(CORRELATIONS).slice(0, 4).map(([groupId]) => {
                        const group = SAMPLE_GROUPS.find(g => g.id === groupId);
                        if (!group) return null;
                        
                        const correlated = findCorrelatedGroups(groupId, 0.5);
                        
                        return (
                          <div key={groupId} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="text-base font-bold text-white mb-3">{group.name}</div>
                            <div className="space-y-2">
                              {correlated.slice(0, 3).map(corrGroup => {
                                const corr = getCorrelation(groupId, corrGroup.id);
                                return (
                                  <div key={corrGroup.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">{corrGroup.name}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${corr > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                          style={{ width: `${Math.abs(corr) * 100}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs font-semibold ${corr > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {(corr * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-red-500/30 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                      <h2 className="text-xl font-bold text-white">Divergence Alerts</h2>
                    </div>
                    {divergences.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No significant divergences detected
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {divergences.map((div, idx) => (
                          <div key={idx} className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                              <div>
                                <div className="text-sm text-white font-semibold mb-1">{div.divergence}</div>
                                <div className="text-xs text-gray-400">
                                  Corr: {(div.correlation * 100).toFixed(0)}% . 
                                  Scores: {div.group1.metrics.score} vs {div.group2.metrics.score}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-green-500/30 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-6 h-6 text-green-400" />
                      <h2 className="text-xl font-bold text-white">Composite Strategies</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {strategies.map(strategy => (
                        <div key={strategy.id} className="bg-gray-800/50 rounded-lg p-4 border-2 border-gray-700 hover:border-green-500 transition-all">
                          <div className="text-lg font-bold text-white mb-3">{strategy.name}</div>
                          <div className="space-y-2 text-sm mb-3">
                            <div className="text-xs text-cyan-400 bg-cyan-500/10 rounded p-2 border border-cyan-500/30">
                              {strategy.groups.join(', ')}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Stake:</span>
                              <span className="text-red-400 font-semibold">${strategy.totalStake}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Payout:</span>
                              <span className="text-green-400 font-semibold">${strategy.expectedPayout.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Coverage:</span>
                              <span className="text-cyan-400 font-semibold">{strategy.coverage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}