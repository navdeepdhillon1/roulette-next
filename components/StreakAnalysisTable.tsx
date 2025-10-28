import React, { useMemo } from 'react';
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

export default function StreakAnalysisTable({ spinHistory }: { spinHistory: number[] }) {
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

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

  const calculateStreaks = (values: string[]): StreakData[] => {
    if (values.length === 0) return [];

    // Group by unique value types
    const uniqueValues = Array.from(new Set(values));
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

      // Determine status
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

  const streakData = useMemo(() => {
    if (spinHistory.length === 0) return { color: [], evenOdd: [], dozen: [], column: [], lowHigh: [] };

    const colors = spinHistory.map(getNumberColor);
    const evenOdds = spinHistory.map(getNumberEvenOdd);
    const dozens = spinHistory.map(getNumberDozen);
    const columns = spinHistory.map(getNumberColumn);
    const lowHighs = spinHistory.map(getNumberLowHigh);

    return {
      color: calculateStreaks(colors),
      evenOdd: calculateStreaks(evenOdds),
      dozen: calculateStreaks(dozens),
      column: calculateStreaks(columns),
      lowHigh: calculateStreaks(lowHighs)
    };
  }, [spinHistory]);

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

  if (spinHistory.length === 0) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">📈 Streak Analysis</h3>
        <p className="text-gray-400">No spin data yet. Start adding spins to see streak analysis.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Color Streaks */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">🎨</span> Color Streaks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-600 text-gray-400">
                <th className="px-4 py-2 text-left">Color</th>
                <th className="px-4 py-2 text-center">Current</th>
                <th className="px-4 py-2 text-center">Max</th>
                <th className="px-4 py-2 text-center">Avg</th>
                <th className="px-4 py-2 text-center">Switches</th>
              </tr>
            </thead>
            <tbody>
              {streakData.color.map(renderStreakRow)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Even/Odd Streaks */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">🔢</span> Even/Odd Streaks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-600 text-gray-400">
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-center">Current</th>
                <th className="px-4 py-2 text-center">Max</th>
                <th className="px-4 py-2 text-center">Avg</th>
                <th className="px-4 py-2 text-center">Switches</th>
              </tr>
            </thead>
            <tbody>
              {streakData.evenOdd.map(renderStreakRow)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dozen Streaks */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">📊</span> Dozen Streaks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-600 text-gray-400">
                <th className="px-4 py-2 text-left">Dozen</th>
                <th className="px-4 py-2 text-center">Current</th>
                <th className="px-4 py-2 text-center">Max</th>
                <th className="px-4 py-2 text-center">Avg</th>
                <th className="px-4 py-2 text-center">Switches</th>
              </tr>
            </thead>
            <tbody>
              {streakData.dozen.map(renderStreakRow)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Low/High Streaks */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">⬆️</span> Low/High Streaks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-600 text-gray-400">
                <th className="px-4 py-2 text-left">Range</th>
                <th className="px-4 py-2 text-center">Current</th>
                <th className="px-4 py-2 text-center">Max</th>
                <th className="px-4 py-2 text-center">Avg</th>
                <th className="px-4 py-2 text-center">Switches</th>
              </tr>
            </thead>
            <tbody>
              {streakData.lowHigh.map(renderStreakRow)}
            </tbody>
          </table>
        </div>
      </Card>

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
