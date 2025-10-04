// PredictionOracle.tsx
import React, { useState, useMemo } from 'react';
// Import the convergence functions - adjust path as needed based on your structure
import { calculateConvergence, getConvergenceStrength, type ConvergenceResult } from '../lib/convergenceEngine';

interface PredictionData {
  convergence: {
    numbers: number[];
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string[];
    strength: number;
    activePatterns?: string[];
    scores?: Map<number, number>;
  };
  momentum: number[];
  contrarian: number[];
  chaos: number[];
}

interface Strategy {
  id: string;
  name: string;
  avatar: string;
  title: string;
  style: string;
  description: string;
  predictions: number[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string[];
  convergenceStrength?: number;
}

const PredictionOracle: React.FC<{ history: number[] }> = ({ history }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  
  // Calculate predictions using proper algorithms
  const predictions = useMemo<PredictionData>(() => {
    console.log('🎯 Calculating predictions with history:', history?.length, 'spins');
    
    if (!history || history.length < 5) {
      return {
        convergence: { 
          numbers: [17, 23, 5, 32, 11], 
          confidence: 'LOW' as const,
          reasoning: ['Insufficient data - need at least 10 spins'],
          strength: 0,
          scores: new Map<number, number>(), // Add empty scores Map
          activePatterns: []
        },
        momentum: [22, 18, 29, 7, 28],
        contrarian: [31, 14, 0, 9, 26],
        chaos: [2, 15, 21, 36, 11]
      };
    }
    
    // CONVERGENCE: Use the proper IDF-weighted algorithm
    const convergenceResult = calculateConvergence(history);
    const convergenceStrength = getConvergenceStrength(convergenceResult);
    console.log('🔮 Convergence result:', convergenceResult);
    console.log('💪 Convergence strength:', convergenceStrength);
    
    // MOMENTUM: Recent hot sectors and numbers
    const recentWindow = history.slice(-20);
    const sectorHits = {
      voisins: [0,2,3,4,7,12,15,18,19,21,22,25,26,28,29,32,35],
      tiers: [5,8,10,11,13,16,23,24,27,30,33,36],
      orphelins: [1,6,9,14,17,20,31,34]
    };
    
    // Find which sector is hottest
    const sectorScores = Object.entries(sectorHits).map(([sector, numbers]) => ({
      sector,
      hits: recentWindow.filter(n => numbers.includes(n)).length,
      numbers
    }));
    sectorScores.sort((a, b) => b.hits - a.hits);
    
    // Get momentum numbers from hot sectors
    const momentumNumbers: number[] = [];
    for (const sector of sectorScores) {
      for (const num of sector.numbers) {
        if (!momentumNumbers.includes(num) && recentWindow.includes(num)) {
          momentumNumbers.push(num);
          if (momentumNumbers.length >= 5) break;
        }
      }
      if (momentumNumbers.length >= 5) break;
    }
    
    // Fill with recent unique if needed
    const recentUnique = [...new Set(recentWindow)].filter(n => n >= 0 && n <= 36);
    while (momentumNumbers.length < 5 && recentUnique.length > 0) {
      const num = recentUnique.shift()!;
      if (!momentumNumbers.includes(num)) {
        momentumNumbers.push(num);
      }
    }
    
    // CONTRARIAN: Find cold numbers (haven't appeared or rare)
    const allNumbers = Array.from({length: 37}, (_, i) => i);
    const frequency = new Map<number, number>();
    history.forEach(n => {
      if (n >= 0 && n <= 36) {
        frequency.set(n, (frequency.get(n) || 0) + 1);
      }
    });
    
    // Sort by least frequent
    const coldNumbers = allNumbers
      .sort((a, b) => (frequency.get(a) || 0) - (frequency.get(b) || 0))
      .slice(0, 8); // Get more than 5 for variety
    
    // CHAOS: Use pseudo-random based on recent patterns
    const chaosBase = recentWindow.reduce((sum, n) => sum + n, 0);
    const chaosNumbers = Array.from({length: 5}, (_, i) => {
      return (chaosBase * (i + 7) + history.length * (i + 13)) % 37;
    });
    
    return {
      convergence: {
        numbers: convergenceResult.numbers.length >= 5 
          ? convergenceResult.numbers.slice(0, 5)
          : [...convergenceResult.numbers, ...coldNumbers].slice(0, 5),
        confidence: convergenceResult.confidence,
        reasoning: convergenceResult.reasoning,
        strength: convergenceStrength.strength,
        activePatterns: convergenceResult.activePatterns,
        scores: convergenceResult.scores // Add the missing scores property
      },
      momentum: momentumNumbers.length >= 5 ? momentumNumbers.slice(0, 5) : [22, 18, 29, 7, 28],
      contrarian: coldNumbers.slice(0, 5),
      chaos: chaosNumbers
    };
  }, [history]);
  
  const strategies: Strategy[] = [
    {
      id: 'convergence',
      name: 'Oracle Convergence',
      avatar: '🎯',
      title: 'The Pattern Seeker',
      style: 'from-blue-500 to-cyan-500',
      description: 'IDF-weighted multi-group convergence analysis',
      predictions: predictions.convergence.numbers,
      confidence: predictions.convergence.confidence,
      reasoning: predictions.convergence.reasoning,
      convergenceStrength: predictions.convergence.strength
    },
    {
      id: 'physics',
      name: 'Oracle Momentum',
      avatar: '🌊',
      title: 'The Flow Reader',
      style: 'from-purple-500 to-pink-500',
      description: 'Follows hot sectors and wheel momentum',
      predictions: predictions.momentum,
      confidence: history.length > 15 ? 'MEDIUM' : 'LOW',
      reasoning: [
        'Tracking physical wheel sectors for momentum',
        'Recent hot zones indicate dealer signature'
      ]
    },
    {
      id: 'contrarian',
      name: 'Oracle Contrarian',
      avatar: '🔄',
      title: 'The Cycle Breaker',
      style: 'from-orange-500 to-red-500',
      description: 'Predicts overdue numbers based on absence',
      predictions: predictions.contrarian,
      confidence: history.length > 30 ? 'MEDIUM' : 'LOW',
      reasoning: [
        'Extended absence creates statistical pressure',
        'Regression to mean principle suggests emergence'
      ]
    },
    {
      id: 'chaos',
      name: 'Oracle Chaos',
      avatar: '⚡',
      title: 'The Wild Card',
      style: 'from-yellow-500 to-green-500',
      description: 'Volatility-based pseudo-random selection',
      predictions: predictions.chaos,
      confidence: 'LOW',
      reasoning: [
        'High entropy detected in recent patterns',
        'Embracing randomness when patterns fail'
      ]
    }
  ];

  // Find consensus numbers (appearing in multiple strategies)
  const allPredictions = strategies.flatMap(s => s.predictions);
  const predictionCounts = allPredictions.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const consensus = Object.entries(predictionCounts)
    .filter(([_, count]) => count >= 2)
    .map(([num]) => parseInt(num))
    .sort((a, b) => predictionCounts[b] - predictionCounts[a]);

  return (
    <div className="space-y-6">
      {/* Header with animated gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-2">
            🔮 Prediction Oracle Chamber
          </h2>
          <p className="text-purple-200 text-sm">
            Multiple analytical spirits offer their visions. Choose wisely, or seek consensus.
          </p>
          {history.length > 0 && (
            <p className="text-purple-300 text-xs mt-2">
              Analyzing {history.length} spins | Convergence Strength: {predictions.convergence.strength?.toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* Convergence Strength Meter */}
      {predictions.convergence.strength !== undefined && (
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-gray-600/30">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">
            Convergence Analysis Strength
          </h3>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                predictions.convergence.strength > 70 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                predictions.convergence.strength > 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${Math.min(100, predictions.convergence.strength)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Weak</span>
            <span className="text-gray-300 font-semibold">
              {predictions.convergence.strength !== undefined 
                ? (predictions.convergence.strength > 70 ? 'Very strong convergence' :
                   predictions.convergence.strength > 50 ? 'Strong convergence' :
                   predictions.convergence.strength > 30 ? 'Moderate convergence' :
                   predictions.convergence.strength > 10 ? 'Weak convergence' :
                   'Minimal convergence')
                : 'No convergence detected'}
            </span>
            <span>Strong</span>
          </div>
          {predictions.convergence.activePatterns && predictions.convergence.activePatterns.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Active patterns: {predictions.convergence.activePatterns.slice(0, 3).join(', ')}
              {predictions.convergence.activePatterns.length > 3 && ` +${predictions.convergence.activePatterns.length - 3} more`}
            </p>
          )}
        </div>
      )}

      {/* Consensus Panel */}
      {consensus.length > 0 && (
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-lg p-4 border border-green-500/30">
          <h3 className="text-sm font-semibold mb-3 text-green-300">
            ✨ Consensus Predictions (Multiple Oracles Agree)
          </h3>
          <div className="flex gap-2 flex-wrap">
            {consensus.map(num => (
              <div
                key={`consensus-${num}`}
                className="bg-green-600 text-white rounded-lg px-3 py-2 font-bold shadow-lg shadow-green-600/50 relative"
              >
                {num}
                <span className="absolute -top-1 -right-1 bg-green-400 text-green-900 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {predictionCounts[num]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-400 mt-2">
            Strong signal - {consensus.length} number{consensus.length > 1 ? 's' : ''} confirmed by multiple strategies
          </p>
        </div>
      )}

      {/* Oracle Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {strategies.map(strategy => (
          <OracleCard
            key={strategy.id}
            strategy={strategy}
            isSelected={selectedStrategy === strategy.id}
            onSelect={() => setSelectedStrategy(strategy.id)}
          />
        ))}
      </div>

      {/* Data Quality Indicator */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 text-xl">📊</span>
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">Data Quality Assessment</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-blue-400">Sample Size:</span>
                <span className={`ml-1 ${history.length > 50 ? 'text-green-400' : history.length > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {history.length} spins
                </span>
              </div>
              <div>
                <span className="text-blue-400">Patterns:</span>
                <span className="ml-1 text-blue-200">
                  {predictions.convergence.activePatterns?.length || 0} active
                </span>
              </div>
              <div>
                <span className="text-blue-400">Confidence:</span>
                <span className={`ml-1 ${
                  predictions.convergence.confidence === 'HIGH' ? 'text-green-400' :
                  predictions.convergence.confidence === 'MEDIUM' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {predictions.convergence.confidence}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Oracle Disclaimer */}
      <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg p-4 border border-amber-500/30">
        <div className="flex items-start gap-2">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div className="text-sm text-amber-200">
            <p className="font-semibold mb-1">Oracle Disclaimer</p>
            <p className="text-xs">
              Predictions use IDF-weighted convergence, sector analysis, and statistical modeling. 
              No system can predict random events with certainty. For entertainment and analysis only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OracleCard: React.FC<{
  strategy: Strategy;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ strategy, isSelected, onSelect }) => {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        relative rounded-lg p-4 cursor-pointer transition-all transform
        ${isSelected ? 'scale-105 shadow-2xl' : 'hover:scale-102 shadow-lg'}
        bg-gradient-to-br ${strategy.style}
        border-2 ${isSelected ? 'border-white' : 'border-transparent'}
      `}
    >
      {/* Oracle Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{strategy.avatar}</span>
          <div>
            <h4 className="font-bold text-white">{strategy.name}</h4>
            <p className="text-xs text-white/80 italic">{strategy.title}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`${getConfidenceColor(strategy.confidence)} px-2 py-1 rounded text-xs text-white font-semibold`}>
            {strategy.confidence}
          </div>
          {strategy.convergenceStrength !== undefined && strategy.id === 'convergence' && (
            <div className="text-xs text-white/70">
              {strategy.convergenceStrength.toFixed(0)}% strength
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/90 mb-3">
        {strategy.description}
      </p>

      {/* Predictions */}
      <div className="bg-black/30 rounded-lg p-3 mb-3">
        <p className="text-xs text-white/70 mb-2">Divination reveals:</p>
        <div className="flex gap-2 flex-wrap">
          {strategy.predictions.map((num, idx) => (
            <span
              key={`${strategy.id}-pred-${idx}`}
              className="bg-white/20 backdrop-blur text-white rounded px-2 py-1 text-sm font-bold"
            >
              {num}
            </span>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div className="text-xs text-white/80 space-y-1">
        {strategy.reasoning.slice(0, 3).map((reason, idx) => (
          <p key={`${strategy.id}-reason-${idx}`}>• {reason}</p>
        ))}
      </div>

      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-white text-purple-600 rounded-full p-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PredictionOracle;