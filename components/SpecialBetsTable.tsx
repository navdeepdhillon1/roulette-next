import React, { useState, useEffect } from 'react';  // Add useEffect
import { Card } from '@/components/ui/card';

interface SpecialBetsTableProps {
  spinHistory: number[];
}

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

interface SpecialBetsTableProps {
  spinHistory: number[];
}
export default function SpecialBetsTable({ spinHistory }: SpecialBetsTableProps) {
    const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());
    const orderedHistory = spinHistory;
    
    

  // Define special groups
  const SPECIAL_GROUPS = [
    // Six Groups
    { id: 's1', name: 'S1 (1-6)', type: 'six' },
    { id: 's2', name: 'S2 (7-12)', type: 'six' },
    { id: 's3', name: 'S3 (13-18)', type: 'six' },
    { id: 's4', name: 'S4 (19-24)', type: 'six' },
    { id: 's5', name: 'S5 (25-30)', type: 'six' },
    { id: 's6', name: 'S6 (31-36)', type: 'six' },
    // Alternative Groups
    { id: 'a1a', name: 'Alt1 A', type: 'alternative' },
    { id: 'a1b', name: 'Alt1 B', type: 'alternative' },
    { id: 'a2a', name: 'Alt2 AA', type: 'alternative' },
    { id: 'a2b', name: 'Alt2 BB', type: 'alternative' },
    { id: 'a3a', name: 'Alt3 AAA', type: 'alternative' },
    { id: 'a3b', name: 'Alt3 BBB', type: 'alternative' },
    // Position Groups
    { id: 'edge', name: 'Edge', type: 'position' },
    { id: 'center', name: 'Center', type: 'position' },
    // Wheel Quarters
    { id: 'wq1', name: 'Wheel Q1', type: 'wheelquarter' },
    { id: 'wq2', name: 'Wheel Q2', type: 'wheelquarter' },
    { id: 'wq3', name: 'Wheel Q3', type: 'wheelquarter' },
    { id: 'wq4', name: 'Wheel Q4', type: 'wheelquarter' },
    // Special Wheel Bets
{ id: 'voisins', name: 'Voisins', type: 'wheelbets' },
{ id: 'tiers', name: 'Tiers', type: 'wheelbets' },
{ id: 'orphelins', name: 'Orphelins', type: 'wheelbets' },
  ];

  // Check if number belongs to group
  const isInGroup = (num: number, groupId: string): boolean => {
    switch(groupId) {
      // Six Groups
      case 's1': return num >= 1 && num <= 6;
      case 's2': return num >= 7 && num <= 12;
      case 's3': return num >= 13 && num <= 18;
      case 's4': return num >= 19 && num <= 24;
      case 's5': return num >= 25 && num <= 30;
      case 's6': return num >= 31 && num <= 36;
      
      // Alternative Groups
      case 'a1a': return [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num);
      case 'a1b': return [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num);
      case 'a2a': return [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num);
      case 'a2b': return [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num);
      case 'a3a': return [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num);
      case 'a3b': return [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num);
      
      // Position Groups
      case 'edge': return [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num);
      case 'center': return [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num);
      
      // Wheel Quarters (European wheel layout)
      case 'wq1': return [0,32,15,19,4,21,2,25,17].includes(num);
      case 'wq2': return [34,6,27,13,36,11,30,8,23].includes(num);
      case 'wq3': return [10,5,24,16,33,1,20,14,31].includes(num);
      case 'wq4': return [9,22,18,29,7,28,12,35,3,26].includes(num);
      
       // Special Wheel Bets - FIX THESE CASES
       case 'voisins': return [0,2,3,4,7,12,15,18,19,21,22,25,26,28,29,32,35].includes(num);
       case 'tiers': return [5,8,10,11,13,16,23,24,27,30,33,36].includes(num);
       case 'orphelins': return [1,6,9,14,17,20,31,34].includes(num);
      
      default: return false;
    }
  };

  // Calculate hit counts
  const calculateHits = (numbers: number[], groupId: string): number => {
    return numbers.filter(num => isInGroup(num, groupId)).length;
  };

  // Calculate streak
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

  // Calculate absence
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

  // Find last seen
  const findLastSeen = (groupId: string, history: number[]): number => {
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i], groupId)) {
        return i;
      }
    }
    return -1;
  };

  // Get expected percentage
  const getExpectedPercentage = (groupId: string): number => {
    const expectations: Record<string, number> = {
      's1': 16.2, 's2': 16.2, 's3': 16.2, 's4': 16.2, 's5': 16.2, 's6': 16.2,
      'a1a': 48.6, 'a1b': 48.6, 'a2a': 48.6, 'a2b': 48.6, 'a3a': 48.6, 'a3b': 48.6,
      'edge': 48.6, 'center': 48.6,
      'wq1': 24.3, 'wq2': 24.3, 'wq3': 24.3, 'wq4': 24.3,
      'voisins': 45.9, 'tiers': 32.4, 'orphelins': 21.6,
    };
    return expectations[groupId] || 0;
  };

  // Get row color
  const getRowColor = (type: string) => {
    switch(type) {
      case 'six': return 'bg-cyan-900/10';
      case 'alternative': return 'bg-purple-900/10';
      case 'position': return 'bg-pink-900/10';
      case 'wheelquarter': return 'bg-yellow-900/10';
      case 'wheelbets': return 'bg-indigo-900/10';
      default: return '';
    }
  };
  // WheelBetStats.tsx - Already has it but make sure it's right before useEffect:
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const newFlashingRows = new Set<string>();
    
    SPECIAL_GROUPS.forEach(group => {
      const streak = calculateStreak(group.id, orderedHistory);
      const absence = calculateAbsence(group.id, orderedHistory);
      
      if (streak.current >= 5 || absence.current >= 10) {
        newFlashingRows.add(group.id);
      }
    });
    
    setFlashingRows(newFlashingRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedHistory]);

  return (
    <div className="space-y-4">
      <style>{pulseStyles}</style>
      
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
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Now</th>
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Max</th>
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Now</th>
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
              {SPECIAL_GROUPS.map((group, index) => {
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
                
                const nextGroup = SPECIAL_GROUPS[index + 1];
                const isLastInGroup = !nextGroup || nextGroup.type !== group.type;
                
                const groupColors: Record<string, string> = {
                  'six': 'border-cyan-500/50',
                  'alternative': 'border-purple-500/50',
                  'position': 'border-pink-500/50',
                  'wheelquarter': 'border-yellow-500/50',
                  'wheelbets': 'border-indigo-500/50'
                };
                
                return (
                  <tr 
                    key={group.id} 
                    className={`
                      hover:bg-gray-800/50
                      ${getRowColor(group.type)}
                      ${flashingRows.has(group.id) ? 'animate-pulse' : ''}
                      ${isLastInGroup ? 'border-b-2' : 'border-b'}
                      ${isLastInGroup ? groupColors[group.type] : 'border-gray-800'}
                    `}
                  >
                    <td className={`
                      px-2 py-2 font-semibold border-r border-gray-700 sticky left-0 bg-gray-900
                      ${group.type === 'six' ? 'text-cyan-400' : ''}
                      ${group.type === 'alternative' ? 'text-purple-400' : ''}
                      ${group.type === 'position' ? 'text-pink-400' : ''}
                      ${group.type === 'wheelquarter' ? 'text-yellow-400' : ''}
                      ${group.type === 'wheelbets' ? 'text-indigo-400' : ''}
                    `}>
                      {group.name}
                    </td>
                    
                    <td className={`px-1 py-2 text-center border-r border-gray-700 ${
                      streak.current >= 5 ? 'pulse-green' : ''
                    }`}>
                      <span className={streak.current >= 5 ? 'text-green-400 font-bold text-lg' : ''}>
                        {streak.current}
                        {streak.current >= 5 && ' 🔥'}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{streak.max}</td>
                    
                    <td className={`px-1 py-2 text-center border-r border-gray-700 ${
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