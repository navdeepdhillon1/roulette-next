// WheelBetGroups.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

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

interface WheelBetGroupsProps {
  spinHistory: number[];
}

export default function WheelBetGroups({ spinHistory }: WheelBetGroupsProps) {
  const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());
  const orderedHistory = spinHistory;

  // European wheel order
  const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

  // Define all 20 wheel groups
  const WHEEL_GROUPS = [
    // Common Bets 1 (3 groups)
    { id: 'voisins', name: 'Voisins', type: 'common1', numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25] },
    { id: 'orphelins', name: 'Orphelins', type: 'common1', numbers: [17, 34, 6, 1, 20, 14, 31, 9] },
    { id: 'tiers', name: 'Tiers', type: 'common1', numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33] },

    // Common Bets 2 (2 groups)
    { id: 'voisin', name: 'Voisin', type: 'common2', numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 1, 20, 14, 31, 9] },
    { id: 'non-voisin', name: 'Non-Voisin', type: 'common2', numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33] },

    // 18's (2 groups) - Split the wheel into left and right halves
    { id: 'right-18', name: 'Right 18', type: '18s', numbers: [32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10] },
    { id: 'left-18', name: 'Left 18', type: '18s', numbers: [5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26] },

    // 9's (4 groups) - Split wheel into quarters
    { id: '1st-9', name: '1st 9', type: '9s', numbers: [32, 15, 19, 4, 21, 2, 25, 17, 34] },
    { id: '2nd-9', name: '2nd 9', type: '9s', numbers: [6, 27, 13, 36, 11, 30, 8, 23, 10] },
    { id: '3rd-9', name: '3rd 9', type: '9s', numbers: [5, 24, 16, 33, 1, 20, 14, 31, 9] },
    { id: '4th-9', name: '4th 9', type: '9s', numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26] },

    // A/B pattern (2 groups) - Alternating halves
    { id: 'a', name: 'A', type: 'ab', numbers: [0, 15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26] },
    { id: 'b', name: 'B', type: 'ab', numbers: [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3] },

    // AA/BB pattern (2 groups) - Double alternating
    { id: 'aa', name: 'AA', type: 'aabb', numbers: [0, 32, 19, 21, 25, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3] },
    { id: 'bb', name: 'BB', type: 'aabb', numbers: [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26] },

    // AAA/BBB pattern (2 groups) - Triple alternating
    { id: 'aaa', name: 'AAA', type: 'aaabbb', numbers: [0, 32, 15, 4, 21, 2, 34, 6, 27, 36, 11, 30, 10, 5, 24, 33, 1, 20, 9, 22, 18, 7, 28, 12, 26] },
    { id: 'bbb', name: 'BBB', type: 'aaabbb', numbers: [19, 25, 17, 13, 8, 23, 16, 14, 31, 29, 35, 3] },

    // A6/B6 pattern (2 groups) - Groups of 6
    { id: 'a6', name: 'A6', type: 'a6b6', numbers: [0, 32, 15, 19, 4, 21, 27, 13, 36, 11, 30, 8, 16, 33, 1, 20, 14, 31, 28, 12, 35, 3, 26] },
    { id: 'b6', name: 'B6', type: 'a6b6', numbers: [2, 25, 17, 34, 6, 23, 10, 5, 24, 9, 22, 18, 29, 7] },

    // A9/B9 pattern (2 groups) - Groups of 9
    { id: 'a9', name: 'A9', type: 'a9b9', numbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 5, 24, 16, 33, 1, 20, 14, 31, 9] },
    { id: 'b9', name: 'B9', type: 'a9b9', numbers: [34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 22, 18, 29, 7, 28, 12, 35, 3, 26] }
  ];

  // Check if number belongs to group
  const isInGroup = (num: number, groupId: string): boolean => {
    const group = WHEEL_GROUPS.find(g => g.id === groupId);
    return group ? group.numbers.includes(num) : false;
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

  // Get expected percentage based on group size
  const getExpectedPercentage = (groupId: string): number => {
    const group = WHEEL_GROUPS.find(g => g.id === groupId);
    if (!group) return 0;
    return (group.numbers.length / 37) * 100;
  };

  // Get row color based on group type
  const getRowColor = (type: string) => {
    switch(type) {
      case 'common1': return 'bg-cyan-900/10';
      case 'common2': return 'bg-teal-900/10';
      case '18s': return 'bg-blue-900/10';
      case '9s': return 'bg-purple-900/10';
      case 'ab': return 'bg-yellow-900/10';
      case 'aabb': return 'bg-orange-900/10';
      case 'aaabbb': return 'bg-red-900/10';
      case 'a6b6': return 'bg-pink-900/10';
      case 'a9b9': return 'bg-indigo-900/10';
      default: return '';
    }
  };

  useEffect(() => {
    const newFlashingRows = new Set<string>();

    WHEEL_GROUPS.forEach(group => {
      const streak = calculateStreak(group.id, orderedHistory);
      const absence = calculateAbsence(group.id, orderedHistory);

      if (streak.current >= 5 || absence.current >= 10) {
        newFlashingRows.add(group.id);
      }
    });

    setFlashingRows(newFlashingRows);
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
                <th colSpan={7} className="px-1 py-1 text-center border-r border-gray-700 bg-blue-900/30">
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
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L72</th>
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L144</th>
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L288</th>
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Act%</th>
                <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Exp%</th>
              </tr>
            </thead>
            <tbody>
              {WHEEL_GROUPS.map((group, index) => {
                const hits = {
                  l9: calculateHits(orderedHistory.slice(0, 9), group.id),
                  l18: calculateHits(orderedHistory.slice(0, 18), group.id),
                  l27: calculateHits(orderedHistory.slice(0, 27), group.id),
                  l36: calculateHits(orderedHistory.slice(0, 36), group.id),
                  l72: calculateHits(orderedHistory.slice(0, 72), group.id),
                  l144: calculateHits(orderedHistory.slice(0, 144), group.id),
                  l288: calculateHits(orderedHistory.slice(0, 288), group.id)
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

                const nextGroup = WHEEL_GROUPS[index + 1];
                const isLastInGroup = !nextGroup || nextGroup.type !== group.type;

                const groupColors: Record<string, string> = {
                  'common1': 'border-cyan-500/50',
                  'common2': 'border-teal-500/50',
                  '18s': 'border-blue-500/50',
                  '9s': 'border-purple-500/50',
                  'ab': 'border-yellow-500/50',
                  'aabb': 'border-orange-500/50',
                  'aaabbb': 'border-red-500/50',
                  'a6b6': 'border-pink-500/50',
                  'a9b9': 'border-indigo-500/50'
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
                      ${group.type === 'common1' ? 'text-cyan-400' : ''}
                      ${group.type === 'common2' ? 'text-teal-400' : ''}
                      ${group.type === '18s' ? 'text-blue-400' : ''}
                      ${group.type === '9s' ? 'text-purple-400' : ''}
                      ${group.type === 'ab' ? 'text-yellow-400' : ''}
                      ${group.type === 'aabb' ? 'text-orange-400' : ''}
                      ${group.type === 'aaabbb' ? 'text-red-400' : ''}
                      ${group.type === 'a6b6' ? 'text-pink-400' : ''}
                      ${group.type === 'a9b9' ? 'text-indigo-400' : ''}
                    `}>
                      {group.name}
                    </td>

                    {/* STREAKS */}
                    <td className={`px-1 py-2 text-center border-r border-gray-700 bg-blue-900/20 ${
                      streak.current >= 5 ? 'pulse-green' : ''
                    }`}>
                      <span className={streak.current >= 5 ? 'text-green-400 font-bold text-lg' : ''}>
                        {streak.current}
                        {streak.current >= 5 && ' 🔥'}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{streak.max}</td>

                    {/* ABSENCES */}
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

                    {/* LAST SEEN */}
                    <td className="px-1 py-2 text-center border-r border-gray-700">
                      {lastSeen >= 0 ? lastSeen : '-'}
                    </td>

                    {/* HIT COUNTS */}
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l9}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l18}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l27}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l36}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l72}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l144}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l288}</td>

                    {/* PERCENTAGES */}
                    <td className="px-1 py-2 text-center border-r border-gray-700">{actual.toFixed(1)}</td>
                    <td className="px-1 py-2 text-center border-r border-gray-700">{expected.toFixed(1)}</td>
                    <td className={`px-1 py-2 text-center border-r border-gray-700 font-bold ${
                      isHot ? 'text-red-400' : isCold ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}
                    </td>

                    {/* STATUS */}
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
