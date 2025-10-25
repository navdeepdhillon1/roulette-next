'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

interface Spin {
  number: number;
  color: 'red' | 'black' | 'green';
  evenOdd: 'even' | 'odd' | null;
  lowHigh: 'low' | 'high' | null;
  column: 1 | 2 | 3 | null;
  dozen: 1 | 2 | 3 | null;
}

export default function BasicTracker() {
  const [spins, setSpins] = useState<Spin[]>([]);
  const [inputNumber, setInputNumber] = useState('');
  const [showHeatMap, setShowHeatMap] = useState(false);

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const MAX_FREE_SPINS = 20;

  const getNumberProperties = (num: number): Spin => {
    return {
      number: num,
      color: num === 0 ? 'green' : redNumbers.includes(num) ? 'red' : 'black',
      evenOdd: num === 0 ? null : num % 2 === 0 ? 'even' : 'odd',
      lowHigh: num === 0 ? null : num <= 18 ? 'low' : 'high',
      column: num === 0 ? null : (num % 3 === 1 ? 1 : num % 3 === 2 ? 2 : 3) as 1 | 2 | 3,
      dozen: num === 0 ? null : (num <= 12 ? 1 : num <= 24 ? 2 : 3) as 1 | 2 | 3,
    };
  };

  const addNumber = () => {
    const num = parseInt(inputNumber);
    if (isNaN(num) || num < 0 || num > 36) return;

    if (spins.length >= MAX_FREE_SPINS) {
      alert('🔒 Free tier limited to 20 spins. Upgrade to Pro for unlimited tracking!');
      return;
    }

    const newSpin = getNumberProperties(num);
    setSpins([newSpin, ...spins]);
    setInputNumber('');
  };

  const addNumberDirectly = (num: number) => {
    if (num < 0 || num > 36) return;

    if (spins.length >= MAX_FREE_SPINS) {
      alert('🔒 Free tier limited to 20 spins. Upgrade to Pro for unlimited tracking!');
      return;
    }

    const newSpin = getNumberProperties(num);
    setSpins([newSpin, ...spins]);
  };

  const undoLastSpin = () => {
    if (spins.length === 0) return;
    setSpins(spins.slice(1)); // Remove first item (most recent)
  };

  const calculateHitCount = (num: number) => {
    return spins.slice(0, 36).filter(s => s.number === num).length;
  };

  // Analytics helper functions
  const isInGroup = (num: number, groupId: string): boolean => {
    switch(groupId) {
      case 'red': return redNumbers.includes(num);
      case 'black': return num > 0 && !redNumbers.includes(num);
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
      default: return false;
    }
  };

  const calculateGroupHits = (numbers: number[], groupId: string): number => {
    return numbers.filter(num => isInGroup(num, groupId)).length;
  };

  const calculateStreak = (groupId: string, history: Spin[]): { current: number, max: number } => {
    if (history.length === 0) return { current: 0, max: 0 };

    let max = 0;
    let tempStreak = 0;

    // Calculate max streak
    for (const spin of history) {
      if (isInGroup(spin.number, groupId)) {
        tempStreak++;
        max = Math.max(max, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak from most recent
    let current = 0;
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i].number, groupId)) {
        current++;
      } else {
        break;
      }
    }

    return { current, max };
  };

  const calculateAbsence = (groupId: string, history: Spin[]): { current: number, max: number } => {
    if (history.length === 0) return { current: 0, max: 0 };

    let current = 0;
    let max = 0;
    let tempAbsence = 0;

    // Find current absence (spins since last hit)
    for (let i = 0; i < history.length; i++) {
      if (isInGroup(history[i].number, groupId)) {
        current = i;
        break;
      }
    }
    if (current === 0 && !isInGroup(history[0].number, groupId)) {
      current = history.length;
    }

    // Calculate max absence
    for (const spin of history) {
      if (!isInGroup(spin.number, groupId)) {
        tempAbsence++;
        max = Math.max(max, tempAbsence);
      } else {
        tempAbsence = 0;
      }
    }

    return { current, max };
  };

  const getExpectedPercentage = (groupId: string): number => {
    const expectations: Record<string, number> = {
      'red': 48.6, 'black': 48.6,
      'even': 48.6, 'odd': 48.6,
      'low': 48.6, 'high': 48.6,
      'dozen1': 32.4, 'dozen2': 32.4, 'dozen3': 32.4,
      'col1': 32.4, 'col2': 32.4, 'col3': 32.4,
    };
    return expectations[groupId] || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
     
      
      <div className="text-white">
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="text-center mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent blur-3xl"></div>
            <h1 className="relative text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                BASIC TRACKER
              </span>
            </h1>
            <p className="text-yellow-400/60 mt-2 text-sm tracking-widest">FREE TIER - COMMON BETS</p>
          </div>

          {/* Session Info Card */}
          <Card className="mb-4 p-4 bg-gray-900 border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-yellow-400 text-xs uppercase">Session</span>
                <p className="text-lg font-bold text-white">Free-{Date.now().toString().slice(-6)}</p>
              </div>
              <div>
                <span className="text-yellow-400 text-xs uppercase">Spins</span>
                <p className="text-lg font-bold text-white">{spins.length}</p>
              </div>
              <div>
                <span className="text-yellow-400 text-xs uppercase">Status</span>
                <p className="text-lg font-bold text-green-400">Active</p>
              </div>
              <div className={`px-4 py-2 rounded ${spins.length >= 15 ? 'bg-red-900/50 border border-red-500' : 'bg-gray-800'}`}>
                <span className="text-yellow-400 text-xs uppercase">Limit</span>
                <p className="text-lg font-bold text-white">{spins.length}/{MAX_FREE_SPINS}</p>
              </div>
            </div>
          </Card>

          {/* Two-Column Layout */}
          <div className="flex gap-4">
            {/* LEFT COLUMN: Number Grid & Input */}
            <div className="w-3/5 space-y-4">
              {/* Number Input Bar with Recent Numbers */}
              <Card className="p-3 bg-gray-900 border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-sm">Last 20:</span>
                <div className="flex gap-1">
                  {spins.slice(0, 20).map((spin, idx) => (
                    <div
                      key={idx}
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${idx === 0 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                        ${spin.number === 0 ? 'bg-green-600' :
                          spin.color === 'red' ? 'bg-red-600' : 'bg-gray-800 border border-gray-500'}
                        text-white cursor-pointer hover:scale-110 transition-all
                      `}
                      onClick={() => setInputNumber(spin.number.toString())}
                    >
                      {spin.number}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={inputNumber}
                  onChange={(e) => setInputNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNumber()}
                  className="w-14 px-2 py-1 bg-black border border-gray-600 rounded text-center text-sm text-white"
                  placeholder="0-36"
                />
                <button
                  onClick={addNumber}
                  disabled={spins.length >= MAX_FREE_SPINS}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-bold"
                >
                  ADD
                </button>
                <button
                  onClick={undoLastSpin}
                  disabled={spins.length === 0}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-bold"
                  title="Undo last entry"
                >
                  ↶ UNDO
                </button>
              </div>
            </div>
          </Card>

              {/* Upgrade Warning if near limit */}
              {spins.length >= 15 && (
                <Card className="p-3 bg-yellow-900/20 border-yellow-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-400 font-bold text-sm">
                      You've used {spins.length} of {MAX_FREE_SPINS} free spins
                    </p>
                    <p className="text-yellow-400/70 text-xs">
                      Upgrade to Pro for unlimited tracking + 47 betting groups
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-sm">
                  Upgrade Now
                </button>
              </div>
                </Card>
              )}

              {/* Table Grid */}
              <Card className="p-4 bg-gray-900 border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-yellow-400">Number Grid</h3>
              <button
                onClick={() => setShowHeatMap(!showHeatMap)}
                className="text-xs text-gray-400 hover:text-white"
              >
                {showHeatMap ? 'Hide' : 'Show'} Heat Map
              </button>
            </div>

            <div className="space-y-1">
              {/* Zero */}
              <div className="relative">
                <button
                  onClick={() => addNumberDirectly(0)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-white transition"
                >
                  0
                  {calculateHitCount(0) > 0 && (
                    <span className="absolute top-0 right-0 bg-yellow-400 text-black text-xs rounded-full px-1">
                      {calculateHitCount(0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-12 gap-1">
                {/* Top row */}
                {[3,6,9,12,15,18,21,24,27,30,33,36].map(num => {
                  const hitCount = calculateHitCount(num);
                  const isHot = showHeatMap && hitCount >= 3;
                  const isCold = showHeatMap && hitCount === 0;

                  return (
                    <button
                      key={num}
                      onClick={() => addNumberDirectly(num)}
                      className={`
                        relative py-3 rounded font-bold text-white transition
                        ${isHot ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                        ${isCold ? 'opacity-50' : ''}
                        ${redNumbers.includes(num) 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'}
                      `}
                    >
                      {num}
                      {hitCount > 0 && (
                        <span className={`absolute -top-1 -right-1 text-xs rounded-full px-1 ${
                          isHot ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-600 text-white'
                        }`}>
                          {hitCount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Middle row */}
                {[2,5,8,11,14,17,20,23,26,29,32,35].map(num => {
                  const hitCount = calculateHitCount(num);
                  const isHot = showHeatMap && hitCount >= 3;
                  const isCold = showHeatMap && hitCount === 0;

                  return (
                    <button
                      key={num}
                      onClick={() => addNumberDirectly(num)}
                      className={`
                        relative py-3 rounded font-bold text-white transition
                        ${isHot ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                        ${isCold ? 'opacity-50' : ''}
                        ${redNumbers.includes(num) 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'}
                      `}
                    >
                      {num}
                      {hitCount > 0 && (
                        <span className={`absolute -top-1 -right-1 text-xs rounded-full px-1 ${
                          isHot ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-600 text-white'
                        }`}>
                          {hitCount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Bottom row */}
                {[1,4,7,10,13,16,19,22,25,28,31,34].map(num => {
                  const hitCount = calculateHitCount(num);
                  const isHot = showHeatMap && hitCount >= 3;
                  const isCold = showHeatMap && hitCount === 0;

                  return (
                    <button
                      key={num}
                      onClick={() => addNumberDirectly(num)}
                      className={`
                        relative py-3 rounded font-bold text-white transition
                        ${isHot ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                        ${isCold ? 'opacity-50' : ''}
                        ${redNumbers.includes(num) 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'}
                      `}
                    >
                      {num}
                      {hitCount > 0 && (
                        <span className={`absolute -top-1 -right-1 text-xs rounded-full px-1 ${
                          isHot ? 'bg-yellow-400 text-black font-bold' : 'bg-gray-600 text-white'
                        }`}>
                          {hitCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Analytics Table */}
            <div className="w-2/5">
              <Card className="sticky top-4 p-4 bg-gray-900 border-gray-700">
                <h3 className="text-lg font-bold text-yellow-400 mb-3">Live Stats - Common Bets</h3>

                {spins.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No spins recorded yet. Add numbers to see live statistics!
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                    <table className="w-full text-xs text-white">
                      <thead className="sticky top-0 z-10 bg-gray-800">
                        <tr>
                          <th className="px-2 py-2 text-left border-r border-gray-700">Group</th>
                          <th className="px-1 py-2 text-center border-r border-gray-700">Streak</th>
                          <th className="px-1 py-2 text-center border-r border-gray-700">Absence</th>
                          <th className="px-1 py-2 text-center border-r border-gray-700">Hits (L9)</th>
                          <th className="px-1 py-2 text-center border-r border-gray-700">Act%</th>
                          <th className="px-1 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'red', name: 'Red', type: 'color' },
                          { id: 'black', name: 'Black', type: 'color' },
                          { id: 'even', name: 'Even', type: 'evenodd' },
                          { id: 'odd', name: 'Odd', type: 'evenodd' },
                          { id: 'low', name: 'Low (1-18)', type: 'lowhigh' },
                          { id: 'high', name: 'High (19-36)', type: 'lowhigh' },
                          { id: 'dozen1', name: '1st Dozen', type: 'dozen' },
                          { id: 'dozen2', name: '2nd Dozen', type: 'dozen' },
                          { id: 'dozen3', name: '3rd Dozen', type: 'dozen' },
                          { id: 'col1', name: 'Column 1', type: 'column' },
                          { id: 'col2', name: 'Column 2', type: 'column' },
                          { id: 'col3', name: 'Column 3', type: 'column' },
                        ].map((group) => {
                          const spinNumbers = spins.map(s => s.number);
                          const streak = calculateStreak(group.id, spins);
                          const absence = calculateAbsence(group.id, spins);
                          const hits9 = calculateGroupHits(spinNumbers.slice(0, 9), group.id);
                          const actual = spinNumbers.length > 0
                            ? (calculateGroupHits(spinNumbers, group.id) / spinNumbers.length * 100)
                            : 0;
                          const expected = getExpectedPercentage(group.id);
                          const deviation = actual - expected;
                          const isHot = deviation > 10;
                          const isCold = deviation < -10;

                          return (
                            <tr
                              key={group.id}
                              className={`
                                hover:bg-gray-800/50 border-b border-gray-800
                                ${group.type === 'color' ? 'bg-red-900/10' : ''}
                                ${group.type === 'evenodd' ? 'bg-purple-900/10' : ''}
                                ${group.type === 'lowhigh' ? 'bg-blue-900/10' : ''}
                                ${group.type === 'dozen' ? 'bg-orange-900/10' : ''}
                                ${group.type === 'column' ? 'bg-green-900/10' : ''}
                              `}
                            >
                              <td className={`
                                px-2 py-2 font-semibold border-r border-gray-700
                                ${group.id === 'red' ? 'text-red-400' : ''}
                                ${group.id === 'black' ? 'text-gray-300' : ''}
                                ${group.type === 'evenodd' ? 'text-purple-400' : ''}
                                ${group.type === 'lowhigh' ? 'text-blue-400' : ''}
                                ${group.type === 'dozen' ? 'text-orange-400' : ''}
                                ${group.type === 'column' ? 'text-green-400' : ''}
                              `}>
                                {group.name}
                              </td>
                              <td className={`px-1 py-2 text-center border-r border-gray-700 ${
                                streak.current >= 5 ? 'bg-green-900/30 text-green-400 font-bold' : ''
                              }`}>
                                {streak.current}{streak.current >= 5 ? ' 🔥' : ''}
                              </td>
                              <td className={`px-1 py-2 text-center border-r border-gray-700 ${
                                absence.current >= 10 ? 'bg-red-900/30 text-red-400 font-bold' :
                                absence.current >= 8 ? 'bg-orange-900/30 text-orange-400 font-bold' : ''
                              }`}>
                                {absence.current}{absence.current >= 10 ? ' 🚨' : absence.current >= 8 ? ' ⚠️' : ''}
                              </td>
                              <td className="px-1 py-2 text-center border-r border-gray-700">{hits9}</td>
                              <td className="px-1 py-2 text-center border-r border-gray-700">{actual.toFixed(1)}%</td>
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
                )}
              </Card>
            </div>
          </div>

          {/* History Table - 6 Common Bets Only - Full Width Below */}
          <Card className="mt-4 p-4 bg-gray-900 border-gray-700">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">History - Common Bets</h3>
            
            {spins.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No spins recorded yet. Add numbers to start tracking!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-center border border-gray-700 text-yellow-400">Number</th>
                      <th className="px-3 py-2 text-center border border-gray-700 text-yellow-400">Color</th>
                      <th className="px-3 py-2 text-center border border-gray-700 text-yellow-400">Even/Odd</th>
                      <th className="px-3 py-2 text-center border border-gray-700 text-yellow-400">Low/High</th>
                      <th className="px-3 py-2 text-center border border-gray-700 text-yellow-400">Column</th>
                      <th className="px-3 py-2 text-center border border-gray-700 text-yellow-400">Dozen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spins.slice(0, 20).map((spin, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/50">
                        <td className="px-3 py-2 text-center border border-gray-700">
                          <div className={`
                            w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold
                            ${spin.number === 0 ? 'bg-green-600' :
                              spin.color === 'red' ? 'bg-red-600' : 'bg-gray-800 border-2 border-gray-500'}
                            text-white
                          `}>
                            {spin.number}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-700">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            spin.color === 'green' ? 'bg-green-600/20 text-green-400' :
                            spin.color === 'red' ? 'bg-red-600/20 text-red-400' : 
                            'bg-gray-600/20 text-gray-300'
                          }`}>
                            {spin.color.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-700">
                          {spin.evenOdd ? (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              spin.evenOdd === 'even' 
                                ? 'bg-purple-600/20 text-purple-400' 
                                : 'bg-orange-600/20 text-orange-400'
                            }`}>
                              {spin.evenOdd.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-700">
                          {spin.lowHigh ? (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              spin.lowHigh === 'low' 
                                ? 'bg-blue-600/20 text-blue-400' 
                                : 'bg-teal-600/20 text-teal-400'
                            }`}>
                              {spin.lowHigh.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-700">
                          {spin.column ? (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              spin.column === 1 ? 'bg-cyan-600/20 text-cyan-400' :
                              spin.column === 2 ? 'bg-teal-600/20 text-teal-400' :
                              'bg-lime-600/20 text-lime-400'
                            }`}>
                              {spin.column === 1 ? '1st' : spin.column === 2 ? '2nd' : '3rd'}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-700">
                          {spin.dozen ? (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              spin.dozen === 1 ? 'bg-blue-600/20 text-blue-400' :
                              spin.dozen === 2 ? 'bg-purple-600/20 text-purple-400' :
                              'bg-orange-600/20 text-orange-400'
                            }`}>
                              {spin.dozen === 1 ? '1st' : spin.dozen === 2 ? '2nd' : '3rd'}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Upgrade CTA - Full Width */}
          <Card className="mt-4 p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-2xl font-bold mb-2">Want Advanced Analytics?</h2>
              <p className="text-gray-300 mb-4">
                Upgrade to <strong className="text-blue-400">Pro</strong> to unlock unlimited spins, 47 betting groups,
                pattern detection, probability analysis, and cloud storage!
              </p>
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105">
                Upgrade to Pro - $9.99/mo
              </button>
              <p className="text-xs text-gray-400 mt-2">7-day free trial • Cancel anytime</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}