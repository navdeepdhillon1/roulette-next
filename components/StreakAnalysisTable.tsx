import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';

interface StreakData {
  group: string;
  currentStreak: number;
  currentValue: string;
  maxStreak: number;
  avgStreak: number;
  totalSwitches: number;
  status: 'hot' | 'approaching-max' | 'normal';
}

type TabView = 'table' | 'wheel';

export default function StreakAnalysisTable({ spinHistory }: { spinHistory: number[] }) {
  const [activeTab, setActiveTab] = useState<TabView>('table');

  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  // ============================================================================
  // TABLE-BASED GROUP FUNCTIONS
  // ============================================================================

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'GREEN';
    return RED_NUMBERS.includes(num) ? 'RED' : 'BLACK';
  };

  const getNumberEvenOdd = (num: number): string => {
    if (num === 0) return 'ZERO';
    return num % 2 === 0 ? 'EVEN' : 'ODD';
  };

  const getNumberDozen = (num: number): string => {
    if (num === 0) return 'ZERO';
    if (num <= 12) return 'D1';
    if (num <= 24) return 'D2';
    return 'D3';
  };

  const getNumberColumn = (num: number): string => {
    if (num === 0) return 'ZERO';
    const col = num % 3;
    if (col === 1) return 'C1';
    if (col === 2) return 'C2';
    return 'C3';
  };

  const getNumberLowHigh = (num: number): string => {
    if (num === 0) return 'ZERO';
    return num <= 18 ? 'LOW' : 'HIGH';
  };

  const getNumberSixLine = (num: number): string => {
    if (num === 0) return 'ZERO';
    if (num <= 6) return 'SIX1';
    if (num <= 12) return 'SIX2';
    if (num <= 18) return 'SIX3';
    if (num <= 24) return 'SIX4';
    if (num <= 30) return 'SIX5';
    return 'SIX6';
  };

  const getNumberAlt1 = (num: number): string => {
    if (num === 0) return 'ZERO';
    const alt1_1 = [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33];
    return alt1_1.includes(num) ? 'ALT1_1' : 'ALT1_2';
  };

  const getNumberAlt2 = (num: number): string => {
    if (num === 0) return 'ZERO';
    const alt2_1 = [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30];
    return alt2_1.includes(num) ? 'ALT2_1' : 'ALT2_2';
  };

  const getNumberAlt3 = (num: number): string => {
    if (num === 0) return 'ZERO';
    const alt3_1 = [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27];
    return alt3_1.includes(num) ? 'ALT3_1' : 'ALT3_2';
  };

  const getNumberEdgeCenter = (num: number): string => {
    if (num === 0) return 'ZERO';
    const edge = [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36];
    return edge.includes(num) ? 'EDGE' : 'CENTER';
  };

  // ============================================================================
  // WHEEL-BASED GROUP FUNCTIONS
  // ============================================================================

  const getNumberVoisinsOrphelinsTiers = (num: number): string => {
    const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
    const orphelins = [17,34,6,1,20,14,31,9];
    const tiers = [27,13,36,11,30,8,23,10,5,24,16,33];

    if (voisins.includes(num)) return 'VOISINS';
    if (orphelins.includes(num)) return 'ORPHELINS';
    if (tiers.includes(num)) return 'TIERS';
    return 'OTHER';
  };

  const getNumberJeuZero = (num: number): string => {
    const jeu_zero = [12,35,3,26,0,32,15];
    return jeu_zero.includes(num) ? 'JEU_ZERO' : 'OTHER';
  };

  const getNumberAB = (num: number): string => {
    const a = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
    return a.includes(num) ? 'A' : 'B';
  };

  const getNumberAABB = (num: number): string => {
    const aa = [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35];
    return aa.includes(num) ? 'AA' : 'BB';
  };

  const getNumberAAABBB = (num: number): string => {
    const aaa = [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12];
    return aaa.includes(num) ? 'AAA' : 'BBB';
  };

  const getNumberA6B6 = (num: number): string => {
    const a6 = [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29];
    return a6.includes(num) ? 'A6' : 'B6';
  };

  const getNumberA9B9 = (num: number): string => {
    const a9 = [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9];
    return a9.includes(num) ? 'A9' : 'B9';
  };

  const getNumberRightLeft = (num: number): string => {
    const right = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10];
    return right.includes(num) ? 'RIGHT' : 'LEFT';
  };

  const getNumberWheelSector = (num: number): string => {
    const first_9 = [32,15,19,4,21,2,25,17,34];
    const second_9 = [6,27,13,36,11,30,8,23,10];
    const third_9 = [5,24,16,33,1,20,14,31,9];
    const fourth_9 = [22,18,29,7,28,12,35,3,26];

    if (first_9.includes(num)) return '1ST_9';
    if (second_9.includes(num)) return '2ND_9';
    if (third_9.includes(num)) return '3RD_9';
    if (fourth_9.includes(num)) return '4TH_9';
    return num === 0 ? 'ZERO' : 'OTHER';
  };

  // ============================================================================
  // STREAK CALCULATION
  // ============================================================================

  const calculateStreaks = (values: string[]): StreakData[] => {
    if (values.length === 0) return [];

    const uniqueValues = Array.from(new Set(values)).filter(v => v !== 'ZERO' && v !== 'OTHER');
    const results: StreakData[] = [];

    uniqueValues.forEach(value => {
      let currentStreak = 0;
      let maxStreak = 0;
      let streakLengths: number[] = [];
      let tempStreak = 0;
      let switches = 0;

      // Calculate current streak (from most recent)
      for (let i = 0; i < values.length; i++) {
        if (values[i] === value) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate max streak and all streak lengths
      for (let i = 0; i < values.length; i++) {
        if (values[i] === value) {
          tempStreak++;
        } else {
          if (tempStreak > 0) {
            streakLengths.push(tempStreak);
            maxStreak = Math.max(maxStreak, tempStreak);
            switches++;
          }
          tempStreak = 0;
        }
      }
      if (tempStreak > 0) {
        streakLengths.push(tempStreak);
        maxStreak = Math.max(maxStreak, tempStreak);
      }

      const avgStreak = streakLengths.length > 0
        ? Math.round((streakLengths.reduce((a, b) => a + b, 0) / streakLengths.length) * 10) / 10
        : 0;

      let status: 'hot' | 'approaching-max' | 'normal' = 'normal';
      if (currentStreak >= maxStreak * 0.8 && currentStreak >= 3) {
        status = 'approaching-max';
      } else if (currentStreak >= 3) {
        status = 'hot';
      }

      results.push({
        group: value,
        currentStreak,
        currentValue: value,
        maxStreak,
        avgStreak,
        totalSwitches: switches,
        status
      });
    });

    return results.sort((a, b) => b.currentStreak - a.currentStreak);
  };

  // ============================================================================
  // CALCULATE ALL STREAKS
  // ============================================================================

  const streakData = useMemo(() => {
    if (spinHistory.length === 0) {
      return {
        // Table bets
        color: [], evenOdd: [], dozen: [], column: [], lowHigh: [],
        sixLine: [], alt1: [], alt2: [], alt3: [], edgeCenter: [],
        // Wheel bets
        vot: [], jeuZero: [], ab: [], aabb: [], aaabbb: [],
        a6b6: [], a9b9: [], rightLeft: [], wheelSector: []
      };
    }

    return {
      // Table bets
      color: calculateStreaks(spinHistory.map(getNumberColor)),
      evenOdd: calculateStreaks(spinHistory.map(getNumberEvenOdd)),
      dozen: calculateStreaks(spinHistory.map(getNumberDozen)),
      column: calculateStreaks(spinHistory.map(getNumberColumn)),
      lowHigh: calculateStreaks(spinHistory.map(getNumberLowHigh)),
      sixLine: calculateStreaks(spinHistory.map(getNumberSixLine)),
      alt1: calculateStreaks(spinHistory.map(getNumberAlt1)),
      alt2: calculateStreaks(spinHistory.map(getNumberAlt2)),
      alt3: calculateStreaks(spinHistory.map(getNumberAlt3)),
      edgeCenter: calculateStreaks(spinHistory.map(getNumberEdgeCenter)),
      // Wheel bets
      vot: calculateStreaks(spinHistory.map(getNumberVoisinsOrphelinsTiers)),
      jeuZero: calculateStreaks(spinHistory.map(getNumberJeuZero)),
      ab: calculateStreaks(spinHistory.map(getNumberAB)),
      aabb: calculateStreaks(spinHistory.map(getNumberAABB)),
      aaabbb: calculateStreaks(spinHistory.map(getNumberAAABBB)),
      a6b6: calculateStreaks(spinHistory.map(getNumberA6B6)),
      a9b9: calculateStreaks(spinHistory.map(getNumberA9B9)),
      rightLeft: calculateStreaks(spinHistory.map(getNumberRightLeft)),
      wheelSector: calculateStreaks(spinHistory.map(getNumberWheelSector))
    };
  }, [spinHistory]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderStreakRow = (data: StreakData) => {
    const isCurrentValue = data.currentStreak > 0;
    const statusColor = data.status === 'approaching-max' ? 'text-red-400' :
                       data.status === 'hot' ? 'text-orange-400' : 'text-gray-300';

    return (
      <tr key={data.group} className={`border-b border-gray-700 ${isCurrentValue ? 'bg-blue-900/20' : ''}`}>
        <td className="px-4 py-3 font-semibold">
          <span className={isCurrentValue ? 'text-cyan-400' : ''}>{data.group}</span>
        </td>
        <td className={`px-4 py-3 text-center font-bold ${statusColor}`}>
          {data.currentStreak}
          {data.status === 'approaching-max' && ' 🔥'}
          {data.status === 'hot' && ' ⚡'}
        </td>
        <td className="px-4 py-3 text-center text-yellow-400 font-bold">{data.maxStreak}</td>
        <td className="px-4 py-3 text-center text-gray-300">{data.avgStreak}</td>
        <td className="px-4 py-3 text-center text-gray-400 text-sm">{data.totalSwitches}</td>
      </tr>
    );
  };

  const renderStreakSection = (title: string, emoji: string, data: StreakData[]) => {
    if (data.length === 0) return null;

    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">{emoji}</span> {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-600 text-gray-400">
                <th className="px-4 py-2 text-left">Group</th>
                <th className="px-4 py-2 text-center">Current</th>
                <th className="px-4 py-2 text-center">Max</th>
                <th className="px-4 py-2 text-center">Avg</th>
                <th className="px-4 py-2 text-center">Switches</th>
              </tr>
            </thead>
            <tbody>
              {data.map(renderStreakRow)}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  if (spinHistory.length === 0) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">📈 Streak Analysis</h3>
        <p className="text-gray-400">No spin data yet. Start adding spins to see streak analysis.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === 'table'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📊 Table Bets
        </button>
        <button
          onClick={() => setActiveTab('wheel')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === 'wheel'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🎡 Wheel Bets
        </button>
      </div>

      {/* Table Bets Content */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          {renderStreakSection('Color Streaks', '🎨', streakData.color)}
          {renderStreakSection('Even/Odd Streaks', '🔢', streakData.evenOdd)}
          {renderStreakSection('Dozen Streaks', '📊', streakData.dozen)}
          {renderStreakSection('Column Streaks', '📋', streakData.column)}
          {renderStreakSection('Low/High Streaks', '⬆️', streakData.lowHigh)}
          {renderStreakSection('Six Line Streaks', '➖', streakData.sixLine)}
          {renderStreakSection('Alternative Pattern 1', '🔄', streakData.alt1)}
          {renderStreakSection('Alternative Pattern 2', '🔁', streakData.alt2)}
          {renderStreakSection('Alternative Pattern 3', '🔃', streakData.alt3)}
          {renderStreakSection('Edge/Center Streaks', '🎯', streakData.edgeCenter)}
        </div>
      )}

      {/* Wheel Bets Content */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          {renderStreakSection('Voisins/Orphelins/Tiers', '🎡', streakData.vot)}
          {renderStreakSection('Jeu Zero', '🎰', streakData.jeuZero)}
          {renderStreakSection('A/B Pattern', '🔵', streakData.ab)}
          {renderStreakSection('AA/BB Pattern', '🟢', streakData.aabb)}
          {renderStreakSection('AAA/BBB Pattern', '🔴', streakData.aaabbb)}
          {renderStreakSection('A6/B6 Pattern', '🟠', streakData.a6b6)}
          {renderStreakSection('A9/B9 Pattern', '🟡', streakData.a9b9)}
          {renderStreakSection('Right/Left Pattern', '↔️', streakData.rightLeft)}
          {renderStreakSection('Wheel Sectors (9s)', '🧩', streakData.wheelSector)}
        </div>
      )}

      {/* Legend */}
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">●</span>
            <span className="text-gray-300">Currently Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">⚡</span>
            <span className="text-gray-300">Hot Streak (3+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">🔥</span>
            <span className="text-gray-300">Approaching Max (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold">Max</span>
            <span className="text-gray-300">Longest Streak Ever</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
