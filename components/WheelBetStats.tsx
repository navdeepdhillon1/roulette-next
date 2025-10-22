// WheelBetStats.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface WheelBetStatsProps {
  spinHistory: number[];
}
// Add these pulse styles
const pulseStyles = `
  @keyframes greenPulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }
  @keyframes yellowPulse {
    0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
    100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
  }
  .pulse-green {
    animation: greenPulse 2s infinite;
    border-radius: 4px;
    background: rgba(34, 197, 94, 0.1);
  }
  .pulse-yellow {
    animation: yellowPulse 2s infinite;
    border-radius: 4px;
    background: rgba(234, 179, 8, 0.1);
  }
`;
export default function WheelBetStats({ spinHistory }: WheelBetStatsProps) {
  const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());
  const orderedHistory = spinHistory;
  
  // Define wheel bet groups
  const WHEEL_BET_GROUPS = [
    // Special Bets
    { id: 'voisins', name: 'Voisins', type: 'special' },
    { id: 'orphelins', name: 'Orphelins', type: 'special' },
    { id: 'tiers', name: 'Tiers', type: 'special' },
    { id: 'non-voisin', name: 'Non-Voisin', type: 'special' },
    
    // 18's (1:1) Groups
    { id: 'a', name: 'A', type: 'eighteen' },
    { id: 'b', name: 'B', type: 'eighteen' },
    { id: 'aa', name: 'AA', type: 'eighteen' },
    { id: 'bb', name: 'BB', type: 'eighteen' },
    { id: 'aaa', name: 'AAA', type: 'eighteen' },
    { id: 'bbb', name: 'BBB', type: 'eighteen' },
    { id: 'a6', name: 'A6', type: 'eighteen' },
    { id: 'b6', name: 'B6', type: 'eighteen' },
    { id: 'a9', name: 'A9', type: 'eighteen' },
    { id: 'b9', name: 'B9', type: 'eighteen' },
    { id: 'right', name: 'Right', type: 'eighteen' },
    { id: 'left', name: 'Left', type: 'eighteen' },
    
    // 9's Sectors
    { id: '1st9', name: '1st 9', type: 'sectors' },
    { id: '2nd9', name: '2nd 9', type: 'sectors' },
    { id: '3rd9', name: '3rd 9', type: 'sectors' },
    { id: '4th9', name: '4th 9', type: 'sectors' },
  ];

  // Check if number belongs to group
  const isInGroup = (num: number, groupId: string): boolean => {
    switch(groupId) {
      // Special Bets
      case 'voisins': return [0,2,3,4,7,12,15,18,19,21,22,25,26,28,29,32,35].includes(num);
      case 'orphelins': return [1,6,9,14,17,20,31,34].includes(num);
      case 'tiers': return [5,8,10,11,13,16,23,24,27,30,33,36].includes(num);
      case 'non-voisin': return [1,5,6,8,9,10,11,13,14,16,17,20,23,24,27,30,31,33,34,36].includes(num);
      
      // 18's Groups
      case 'a': return [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
      case 'b': return [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(num);
      case 'aa': return [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num);
      case 'bb': return [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num);
      case 'aaa': return [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num);
      case 'bbb': return [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num);
      case 'a6': return [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num);
      case 'b6': return [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num);
      case 'a9': return [1,2,3,4,5,6,7,8,9].includes(num);
      case 'b9': return [10,11,12,13,14,15,16,17,18].includes(num);
      case 'right': return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].includes(num);
      case 'left': return [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36].includes(num);
      
      // 9's Sectors
      case '1st9': return [1,2,3,4,5,6,7,8,9].includes(num);
      case '2nd9': return [10,11,12,13,14,15,16,17,18].includes(num);
      case '3rd9': return [19,20,21,22,23,24,25,26,27].includes(num);
      case '4th9': return [28,29,30,31,32,33,34,35,36].includes(num);
      
      default: return false;
    }
  };

  const calculateStreak = (groupId: string, history: number[]): { current: number, max: number } => {
    if (history.length === 0) return { current: 0, max: 0 };
    
    let max = 0;
    let tempStreak = 0;
    
    for (const num of history) {
      if (isInGroup(num, groupId)) {
        tempStreak++;
        max = Math.max(max, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    let current = 0;
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i], groupId)) {
        current++;
      } else {
        break;
      }
    }
    
    return { current, max };
  };

  const calculateAbsence = (groupId: string, history: number[]): { current: number, max: number } => {
    if (history.length === 0) return { current: 0, max: 0 };
    
    let current = 0;
    let max = 0;
    let tempAbsence = 0;
    
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i], groupId)) {
        current = i;
        break;
      }
    }
    if (current === 0 && !isInGroup(history[0], groupId)) {
      current = history.length;
    }
    
    for (const num of history) {
      if (!isInGroup(num, groupId)) {
        tempAbsence++;
        max = Math.max(max, tempAbsence);
      } else {
        tempAbsence = 0;
      }
    }
    
    return { current, max };
  };

  // useEffect AFTER all required functions are defined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const newFlashingRows = new Set<string>();
    
    WHEEL_BET_GROUPS.forEach(group => {
      const streak = calculateStreak(group.id, orderedHistory);
      const absence = calculateAbsence(group.id, orderedHistory);
      
      if (streak.current >= 5 || absence.current >= 10) {
        newFlashingRows.add(group.id);
      }
    });
    
    setFlashingRows(newFlashingRows);
  }, [orderedHistory]);

  // Other utility functions
  const calculateHits = (numbers: number[], groupId: string): number => {
    return numbers.filter(num => isInGroup(num, groupId)).length;
  };

  const findLastSeen = (groupId: string, history: number[]): number => {
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i], groupId)) {
        return i;
      }
    }
    return -1;
  };

  const getExpectedPercentage = (groupId: string): number => {
    const expectations: Record<string, number> = {
      'voisins': 45.9,
      'orphelins': 21.6,
      'tiers': 32.4,
      'non-voisin': 54.1,
      'a': 48.6, 'b': 48.6,
      'aa': 48.6, 'bb': 48.6,
      'aaa': 48.6, 'bbb': 48.6,
      'a6': 48.6, 'b6': 48.6,
      'a9': 24.3, 'b9': 48.6,
      'right': 48.6, 'left': 48.6,
      '1st9': 24.3, '2nd9': 24.3, '3rd9': 24.3, '4th9': 24.3,
    };
    return expectations[groupId] || 0;
  };

  const getRowColor = (groupId: string, type: string) => {
    // Pair-specific colors for the 18's groups
    const pairColors: Record<string, string> = {
      'a': 'bg-emerald-900/20',
      'b': 'bg-emerald-900/20',
      'aa': 'bg-teal-900/20',
      'bb': 'bg-teal-900/20',
      'aaa': 'bg-sky-900/20',
      'bbb': 'bg-sky-900/20',
      'a6': 'bg-indigo-900/20',
      'b6': 'bg-indigo-900/20',
      'a9': 'bg-violet-900/20',
      'b9': 'bg-violet-900/20',
      'right': 'bg-fuchsia-900/20',
      'left': 'bg-fuchsia-900/20',
    };

    // If group has a pair color, use it
    if (pairColors[groupId]) {
      return pairColors[groupId];
    }

    // Otherwise use type-based color
    switch(type) {
      case 'special': return 'bg-purple-900/10';
      case 'sectors': return 'bg-cyan-900/10';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
    <style>{pulseStyles}</style>  {/* Add this line */}
    
    <Card className="bg-gray-900 border-gray-700">
      <div className="overflow-x-auto" style={{ maxHeight: '690px' }}>
        <table className="w-full text-xs text-white">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-800">
              <th rowSpan={2} className="px-2 py-2 text-left border-r border-gray-700 sticky left-0 bg-gray-800">
                Group
              </th>
              <th colSpan={2} className="px-1 py-1 text-center border-r border-gray-700 bg-orange-900/30">
                Streak
              </th>
              <th colSpan={2} className="px-1 py-1 text-center border-r border-gray-700 bg-purple-900/30">
                Absence
              </th>
              <th rowSpan={2} className="px-1 py-2 text-center border-r border-gray-700">
                Last<br/>Seen
              </th>
              <th colSpan={4} className="px-1 py-1 text-center border-r border-gray-700 bg-blue-900/30">
                Hit Count
              </th>
              <th colSpan={2} className="px-1 py-1 text-center border-r border-gray-700 bg-green-900/30">
                Percentage
              </th>
              <th rowSpan={2} className="px-1 py-2 text-center border-r border-gray-700">
                Dev
              </th>
              <th rowSpan={2} className="px-1 py-2 text-center">
                Status
              </th>
            </tr>
            <tr className="bg-gray-800">
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs bg-blue-900/50">Now</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Max</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs bg-blue-900/50">Now</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Max</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L9</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L18</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L27</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L36</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Act%</th>
              <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Exp%</th>
            </tr>
          </thead>
          <tbody>
            {WHEEL_BET_GROUPS.map((group, index) => {
              const hits = {
                l9: calculateHits(orderedHistory.slice(0, 9), group.id),
                l18: calculateHits(orderedHistory.slice(0, 18), group.id),
                l27: calculateHits(orderedHistory.slice(0, 27), group.id),
                l36: calculateHits(orderedHistory.slice(0, 36), group.id)
              };
              
              const absence = calculateAbsence(group.id, orderedHistory);
              const streak = calculateStreak(group.id, orderedHistory);
              const lastSeen = findLastSeen(group.id, orderedHistory);
              
              const actual = orderedHistory.length > 0 
                ? (calculateHits(orderedHistory, group.id) / orderedHistory.length * 100)
                : 0;
              const expected = getExpectedPercentage(group.id);
              const deviation = actual - expected;
              
              const isHot = deviation > 10;
              const isCold = deviation < -10;
              
              const nextGroup = WHEEL_BET_GROUPS[index + 1];
              const isLastInGroup = !nextGroup || nextGroup.type !== group.type;
              
              const groupColors: Record<string, string> = {
                'special': 'border-purple-500/50',
                'eighteen': 'border-green-500/50',
                'sectors': 'border-cyan-500/50'
              };

              return (
                <tr
                  key={group.id}
                  className={`
                    hover:bg-gray-800/50
                    ${getRowColor(group.id, group.type)}
                    ${flashingRows.has(group.id) ? 'animate-pulse' : ''}
                    ${isLastInGroup ? 'border-b-2' : 'border-b'}
                    ${isLastInGroup ? groupColors[group.type] : 'border-gray-800'}
                  `}
                >
                  <td className={`
                    px-2 py-2 font-semibold border-r border-gray-700 sticky left-0 bg-gray-900
                    ${group.type === 'special' ? 'text-purple-400' : ''}
                    ${group.type === 'eighteen' ? 'text-green-400' : ''}
                    ${group.type === 'sectors' ? 'text-cyan-400' : ''}
                  `}>
                    {group.name}
                  </td>
                  
                  <td className={`px-1 py-2 text-center border-r border-gray-700 bg-blue-900/20 ${
  streak.current >= 5 ? 'pulse-green' : ''
}`}>
  <span className={streak.current >= 5 ? 'text-green-400 font-bold text-lg' : ''}>
    {streak.current}
    {streak.current >= 5 && ' 🔥'}
  </span>
</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{streak.max}</td>
                  <td className={`px-1 py-2 text-center border-r border-gray-700 bg-blue-900/20 ${
  absence.current >= 8 ? 'pulse-red animate-pulse bg-red-900/20' :
  absence.current >= 4 ? 'pulse-yellow' : ''
}`}>
  <span className={`${
    absence.current >= 10 ? 'text-red-600 font-bold text-2xl' :
    absence.current >= 8 ? 'text-red-500 font-bold text-xl' : 
    absence.current >= 4 ? 'text-orange-400 font-bold text-lg' : 
    'text-white'
  }`}>
    {absence.current}
    {absence.current >= 10 && ' 🚨'}
    {absence.current >= 8 && absence.current < 10 && ' ⚠️'}
    {absence.current >= 4 && absence.current < 8 && ' ⚡'}
  </span>
</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{absence.max}</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">
                    {lastSeen >= 0 ? lastSeen : '-'}
                  </td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l9}</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l18}</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l27}</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l36}</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{actual.toFixed(1)}</td>
                  <td className="px-1 py-2 text-center border-r border-gray-700">{expected.toFixed(1)}</td>
                  <td className={`px-1 py-2 text-center border-r border-gray-700 font-bold ${
                    isHot ? 'text-red-400' : isCold ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}
                  </td>
                  <td className={`px-1 py-2 text-center font-bold ${
                    isHot ? 'text-red-400' : isCold ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {isHot ? 'HOT' : isCold ? 'COLD' : 'NORM'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
    </div>
  );
}