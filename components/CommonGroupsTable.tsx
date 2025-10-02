// CommonGroupsTable.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

// Add this style tag right before your component function
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

interface CommonGroupsTableProps {
  spinHistory: number[];
  onAddNumber?: (num: number) => void;
}

export default function CommonGroupsTable({ spinHistory, onAddNumber }: CommonGroupsTableProps) {
  const [inputNumber, setInputNumber] = useState('');
  const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());
  const orderedHistory = spinHistory;
  
  // Red numbers constant
  const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  
  // Wheel sectors
  const WHEEL_SECTORS = {
    'Voisins': [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25],
    'Tiers': [27,13,36,11,30,8,23,10,5,24,16,33],
    'Orphelins': [1,20,14,31,9,17,34,6]
  };

  // Define all common groups
  const COMMON_GROUPS = [
    // Colors
    { id: 'red', name: 'Red', type: 'color' },
    { id: 'black', name: 'Black', type: 'color' },
    { id: 'green', name: 'Green', type: 'color' },
    // Even/Odd
    { id: 'even', name: 'Even', type: 'evenodd' },
    { id: 'odd', name: 'Odd', type: 'evenodd' },
    // Low/High
    { id: 'low', name: 'Low (1-18)', type: 'lowhigh' },
    { id: 'high', name: 'High (19-36)', type: 'lowhigh' },
    // Dozens
    { id: 'dozen1', name: '1st Dozen', type: 'dozen' },
    { id: 'dozen2', name: '2nd Dozen', type: 'dozen' },
    { id: 'dozen3', name: '3rd Dozen', type: 'dozen' },
    // Columns
    { id: 'col1', name: 'Column 1', type: 'column' },
    { id: 'col2', name: 'Column 2', type: 'column' },
    { id: 'col3', name: 'Column 3', type: 'column' },
    // Quarters
    { id: 'q1', name: 'Q1 (1-9)', type: 'quarter' },
    { id: 'q2', name: 'Q2 (10-18)', type: 'quarter' },
    { id: 'q3', name: 'Q3 (19-27)', type: 'quarter' },
    { id: 'q4', name: 'Q4 (28-36)', type: 'quarter' },
    // Wheel Sectors
    { id: 'voisins', name: 'Voisins', type: 'sector' },
    { id: 'tiers', name: 'Tiers', type: 'sector' },
    { id: 'orphelins', name: 'Orphelins', type: 'sector' },
  ];

  // Check if number belongs to group
  const isInGroup = (num: number, groupId: string): boolean => {
    switch(groupId) {
      case 'red': return RED_NUMBERS.includes(num);
      case 'black': return num > 0 && !RED_NUMBERS.includes(num);
      case 'green': return num === 0;
      case 'even': return num > 0 && num % 2 === 0;
      case 'odd': return num > 0 && num % 2 === 1;
      case 'low': return num >= 1 && num <= 18;
      case 'high': return num >= 19 && num <= 36;
      case 'dozen1': return num >= 1 && num <= 12;
      case 'dozen2': return num >= 13 && num <= 24;
      case 'dozen3': return num >= 25 && num <= 36;
      case 'col1': return num > 0 && num % 3 === 1;
      case 'col2': return num > 0 && num % 3 === 2;
      case 'col3': return num > 0 && num % 3 === 0;
      case 'q1': return num >= 1 && num <= 9;
      case 'q2': return num >= 10 && num <= 18;
      case 'q3': return num >= 19 && num <= 27;
      case 'q4': return num >= 28 && num <= 36;
      case 'voisins': return WHEEL_SECTORS.Voisins.includes(num);
      case 'tiers': return WHEEL_SECTORS.Tiers.includes(num);
      case 'orphelins': return WHEEL_SECTORS.Orphelins.includes(num);
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
    
    // Calculate max streak
    for (const num of history) {
      if (isInGroup(num, groupId)) {
        tempStreak++;
        max = Math.max(max, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Calculate current streak from most recent
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
  
  // Calculate absence - spins since last hit
  const calculateAbsence = (groupId: string, history: number[]): { current: number, max: number } => {
    if (history.length === 0) return { current: 0, max: 0 };
    
    let current = 0;
    let max = 0;
    let tempAbsence = 0;
    
    // Find current absence (spins since last hit)
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i], groupId)) {
        current = i;  // Found it, absence is the index
        break;
      }
    }
    if (current === 0 && !isInGroup(history[0], groupId)) {
      current = history.length; // Never hit
    }
    
    // Calculate max absence
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

  // FIXED: Find last seen with history parameter
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
      'red': 48.6, 'black': 48.6, 'green': 2.7,
      'even': 48.6, 'odd': 48.6,
      'low': 48.6, 'high': 48.6,
      'dozen1': 32.4, 'dozen2': 32.4, 'dozen3': 32.4,
      'col1': 32.4, 'col2': 32.4, 'col3': 32.4,
      'q1': 24.3, 'q2': 24.3, 'q3': 24.3, 'q4': 24.3,
      'voisins': 45.9, 'tiers': 32.4, 'orphelins': 21.6
    };
    return expectations[groupId] || 0;
  };

  // Get row color based on group type
  const getRowColor = (type: string) => {
    switch(type) {
      case 'color': return 'bg-red-900/10';
      case 'evenodd': return 'bg-purple-900/10';
      case 'lowhigh': return 'bg-blue-900/10';
      case 'dozen': return 'bg-orange-900/10';
      case 'column': return 'bg-green-900/10';
      case 'quarter': return 'bg-yellow-900/10';
      case 'sector': return 'bg-teal-900/10';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <style>{pulseStyles}</style>
      
      {/* Last 20 Numbers Display */}
      <Card className="p-3 bg-gray-900 border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold text-sm">Last 20:</span>
            <div className="flex gap-1">
              {spinHistory.slice(0, 20).map((num, idx) => (
                <div
                  key={idx}
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${idx === 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                    ${num === 0 ? 'bg-green-600' :
                      RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-black border border-gray-600'}
                    text-white cursor-pointer hover:scale-110 transition-all
                  `}
                  onClick={() => setInputNumber(num.toString())}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick Add */}
          {onAddNumber && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="36"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onAddNumber(parseInt(inputNumber))}
                className="w-14 px-2 py-1 bg-black border border-gray-600 rounded text-center text-sm"
                placeholder="0-36"
              />
              <button
                onClick={() => {
                  const num = parseInt(inputNumber);
                  if (!isNaN(num) && num >= 0 && num <= 36 && onAddNumber) {
                    onAddNumber(num);
                    setInputNumber('');
                  }
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-bold"
              >
                ADD
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Table */}
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

        {/* Sub-header row */}
        <tr className="bg-gray-800">
    {/* Streak sub-headers */}
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Now</th>
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Max</th>
    {/* Absence sub-headers */}
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Now</th>
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Max</th>
    {/* NO Last Seen sub-header because it has rowSpan=2 */}
    {/* Hit Count sub-headers */}
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L9</th>
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L18</th>
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L27</th>
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">L36</th>
    {/* Percentage sub-headers */}
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Act%</th>
    <th className="px-1 py-1 text-center border-r border-gray-700 text-xs">Exp%</th>
    {/* NO Dev or Status sub-headers because they have rowSpan=2 */}
  </tr>
      </thead>
      <tbody>
        {COMMON_GROUPS.map((group, index) => {
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
          
          const nextGroup = COMMON_GROUPS[index + 1];
          const isLastInGroup = !nextGroup || nextGroup.type !== group.type;
          
          const groupColors: Record<string, string> = {
            'color': 'border-red-500/50',
            'evenodd': 'border-purple-500/50',
            'lowhigh': 'border-blue-500/50',
            'dozen': 'border-orange-500/50',
            'column': 'border-green-500/50',
            'quarter': 'border-yellow-500/50',
            'sector': 'border-teal-500/50'
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
                ${group.type === 'color' && group.id === 'red' ? 'text-red-400' : ''}
                ${group.type === 'color' && group.id === 'black' ? 'text-gray-300' : ''}
                ${group.type === 'color' && group.id === 'green' ? 'text-green-400' : ''}
                ${group.type === 'evenodd' ? 'text-purple-400' : ''}
                ${group.type === 'lowhigh' ? 'text-blue-400' : ''}
                ${group.type === 'dozen' ? 'text-orange-400' : ''}
                ${group.type === 'column' ? 'text-green-400' : ''}
                ${group.type === 'quarter' ? 'text-yellow-400' : ''}
                ${group.type === 'sector' ? 'text-teal-400' : ''}
              `}>
                {group.name}
              </td>
              
              {/* STREAKS - FIRST */}
              <td className={`px-1 py-2 text-center border-r border-gray-700 ${
                streak.current >= 5 ? 'pulse-green' : ''
              }`}>
                <span className={streak.current >= 5 ? 'text-green-400 font-bold text-lg' : ''}>
                  {streak.current}
                  {streak.current >= 5 && ' 🔥'}
                </span>
              </td>
              <td className="px-1 py-2 text-center border-r border-gray-700">{streak.max}</td>
              
              {/* ABSENCES - SECOND */}
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
              
              {/* LAST SEEN - THIRD */}
              <td className="px-1 py-2 text-center border-r border-gray-700">
                {lastSeen >= 0 ? lastSeen : '-'}
              </td>
              
              {/* HIT COUNTS */}
              <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l9}</td>
              <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l18}</td>
              <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l27}</td>
              <td className="px-1 py-2 text-center border-r border-gray-700">{hits.l36}</td>
              
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