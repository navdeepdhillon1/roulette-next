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
  const MAX_FREE_SPINS = 50;

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
      alert('🔒 Free tier limited to 50 spins. Upgrade to Pro for unlimited tracking!');
      return;
    }
    
    const newSpin = getNumberProperties(num);
    setSpins([newSpin, ...spins]);
    setInputNumber('');
  };

  const calculateHitCount = (num: number) => {
    return spins.slice(0, 36).filter(s => s.number === num).length;
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
              <div className={`px-4 py-2 rounded ${spins.length >= 40 ? 'bg-red-900/50 border border-red-500' : 'bg-gray-800'}`}>
                <span className="text-yellow-400 text-xs uppercase">Limit</span>
                <p className="text-lg font-bold text-white">{spins.length}/{MAX_FREE_SPINS}</p>
              </div>
            </div>
          </Card>

          {/* Number Input Bar with Recent Numbers */}
          <Card className="mb-4 p-3 bg-gray-900 border-gray-700">
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
              </div>
            </div>
          </Card>

          {/* Upgrade Warning if near limit */}
          {spins.length >= 40 && (
            <Card className="mb-4 p-3 bg-yellow-900/20 border-yellow-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-400 font-bold text-sm">
                      You've used {spins.length} of {MAX_FREE_SPINS} free spins
                    </p>
                    <p className="text-yellow-400/70 text-xs">
                      Upgrade to Pro for unlimited tracking + 57 betting groups
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
          <Card className="mb-4 p-4 bg-gray-900 border-gray-700">
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
                  onClick={() => setInputNumber('0')}
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
                      onClick={() => setInputNumber(num.toString())}
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
                      onClick={() => setInputNumber(num.toString())}
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
                      onClick={() => setInputNumber(num.toString())}
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

          {/* History Table - 6 Common Bets Only */}
          <Card className="mb-4 p-4 bg-gray-900 border-gray-700">
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

          {/* Upgrade CTA */}
          <Card className="p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-2xl font-bold mb-2">Want Advanced Analytics?</h2>
              <p className="text-gray-300 mb-4">
                Upgrade to <strong className="text-blue-400">Pro</strong> to unlock 57 betting groups, 
                pattern detection, probability chamber, and unlimited cloud storage!
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