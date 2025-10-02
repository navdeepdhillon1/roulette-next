// PatternDetectionEngine.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface SpinData {
  number: number;
  timestamp: Date;
  color: 'RED' | 'BLACK' | 'GREEN';
  isEven: boolean;
  isLow: boolean;
  dozen: 1 | 2 | 3 | 0;
  column: 1 | 2 | 3 | 0;
  quarter: 1 | 2 | 3 | 4 | 0;
}

interface PatternStrength {
  group: string;
  pattern: string;
  strength: number;
  volatility: number;
  streak: number;
  status: 'STABLE' | 'VOLATILE' | 'NEUTRAL';
}

interface GroupAnalysis {
    name: string;
    currentValue: string;
    patternType: 'STREAK' | 'ALTERNATING' | 'CHAOS' | 'DOMINANT';
    patternStrength: number;
    volatility: number;
    streakLength: number;
    lastSeen: Map<string, number>;
    switchRate: number;
    confidence: number;
    status: 'STABLE' | 'VOLATILE' | 'NEUTRAL';  // ADD THIS LINE

}

export default function PatternDetectionEngine({ spinHistory }: { spinHistory: number[] }) {
    console.log('Spin history received:', spinHistory);
  const [patterns, setPatterns] = useState<Map<string, GroupAnalysis>>(new Map());
  const [correlations, setCorrelations] = useState<Map<string, number>>(new Map());
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Number to spin data converter
  const numberToSpinData = (num: number): SpinData => {
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const color = num === 0 ? 'GREEN' : redNumbers.includes(num) ? 'RED' : 'BLACK';
    
    return {
      number: num,
      timestamp: new Date(),
      color,
      isEven: num > 0 && num % 2 === 0,
      isLow: num >= 1 && num <= 18,
      dozen: num === 0 ? 0 : Math.ceil(num / 12) as 1 | 2 | 3,
      column: num === 0 ? 0 : ((num - 1) % 3 + 1) as 1 | 2 | 3,
      quarter: num === 0 ? 0 : Math.ceil(num / 9) as 1 | 2 | 3 | 4,
    };
  };

  // Calculate pattern for each group
  const analyzeGroup = (groupName: string, values: string[]): GroupAnalysis => {
    if (values.length < 2) {
      return {
        name: groupName,
        currentValue: values[0] || 'N/A',
        patternType: 'CHAOS',
        patternStrength: 0,
        volatility: 0,
        streakLength: 0,
        lastSeen: new Map(),
        switchRate: 0,
        confidence: 0,
        status: 'NEUTRAL'  // ← ADD THIS LINE
      };
    }

    // Calculate streak
    let currentStreak = 1;
    const currentValue = values[values.length - 1];
    for (let i = values.length - 2; i >= 0; i--) {
      if (values[i] === currentValue) currentStreak++;
      else break;
    }

    // Calculate switch rate (volatility)
    let switches = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1]) switches++;
    }
    const switchRate = (switches / (values.length - 1)) * 100;

    // Determine pattern type
    let patternType: 'STREAK' | 'ALTERNATING' | 'CHAOS' | 'DOMINANT';
    if (currentStreak >= 4) patternType = 'STREAK';
    else if (switchRate > 80) patternType = 'ALTERNATING';
    else if (switchRate < 30) patternType = 'DOMINANT';
    else patternType = 'CHAOS';

    // Calculate pattern strength
    const patternStrength = patternType === 'STREAK' ? 
      Math.min(100, currentStreak * 20) :
      patternType === 'ALTERNATING' ? 
      Math.min(100, switchRate) :
      patternType === 'DOMINANT' ?
      Math.min(100, 100 - switchRate) : 
      25;

    // Determine volatility status
    let status: 'STABLE' | 'VOLATILE' | 'NEUTRAL';
    if (switchRate < 35) status = 'STABLE';
    else if (switchRate > 65) status = 'VOLATILE';
    else status = 'NEUTRAL';

    // Calculate confidence based on pattern clarity and volatility
    const confidence = status === 'STABLE' ? 
      patternStrength * 1.2 : 
      status === 'VOLATILE' ? 
      patternStrength * 0.7 : 
      patternStrength;

    return {
      name: groupName,
      currentValue,
      patternType,
      patternStrength,
      volatility: switchRate,
      streakLength: currentStreak,
      lastSeen: new Map(),
      switchRate,
      confidence: Math.min(100, confidence),
      status
    };
  };

  // Analyze all groups
  useEffect(() => {
    if (spinHistory.length < 3) return;

    const spins = spinHistory.map(numberToSpinData);
    const newPatterns = new Map<string, GroupAnalysis>();

    // Color analysis
    const colors = spins.map(s => s.color);
    newPatterns.set('COLOR', analyzeGroup('COLOR', colors));

    // Even/Odd analysis
    const evenOdd = spins.map(s => s.number === 0 ? 'ZERO' : s.isEven ? 'EVEN' : 'ODD');
    newPatterns.set('EVEN_ODD', analyzeGroup('EVEN_ODD', evenOdd));

    // Dozen analysis
    const dozens = spins.map(s => s.dozen === 0 ? 'ZERO' : `D${s.dozen}`);
    newPatterns.set('DOZENS', analyzeGroup('DOZENS', dozens));

    // Column analysis
    const columns = spins.map(s => s.column === 0 ? 'ZERO' : `C${s.column}`);
    newPatterns.set('COLUMNS', analyzeGroup('COLUMNS', columns));

    // Low/High analysis
    const lowHigh = spins.map(s => s.number === 0 ? 'ZERO' : s.isLow ? 'LOW' : 'HIGH');
    newPatterns.set('LOW_HIGH', analyzeGroup('LOW_HIGH', lowHigh));

    // Quarter analysis
    const quarters = spins.map(s => s.quarter === 0 ? 'ZERO' : `Q${s.quarter}`);
    newPatterns.set('QUARTERS', analyzeGroup('QUARTERS', quarters));

    setPatterns(newPatterns);

    // Calculate correlations
    calculateCorrelations(newPatterns);

    // Calculate alignment score
    const aligned = Array.from(newPatterns.values()).filter(p => p.confidence > 70).length;
    setAlignmentScore((aligned / newPatterns.size) * 100);

    // Generate recommendations
    generateRecommendations(newPatterns);
  }, [spinHistory]);

  const calculateCorrelations = (patterns: Map<string, GroupAnalysis>) => {
    const newCorrelations = new Map<string, number>();
    
    // Simple correlation based on matching pattern types
    const colorPattern = patterns.get('COLOR');
    const evenOddPattern = patterns.get('EVEN_ODD');
    
    if (colorPattern && evenOddPattern) {
      if (colorPattern.patternType === evenOddPattern.patternType) {
        newCorrelations.set('COLOR_EVENODD', 0.8);
      } else {
        newCorrelations.set('COLOR_EVENODD', 0.3);
      }
    }

    setCorrelations(newCorrelations);
  };

  const generateRecommendations = (patterns: Map<string, GroupAnalysis>) => {
    const recs = [];
    
    // Find strongest patterns
    const sorted = Array.from(patterns.values()).sort((a, b) => b.confidence - a.confidence);
    
    for (let i = 0; i < Math.min(5, sorted.length); i++) {
      const pattern = sorted[i];
      if (pattern.confidence > 60) {
        recs.push({
          group: pattern.name,
          value: pattern.currentValue,
          confidence: pattern.confidence,
          action: pattern.patternType === 'STREAK' ? 'FOLLOW' : 
                 pattern.patternType === 'ALTERNATING' ? 'ALTERNATE' : 
                 'OBSERVE'
        });
      }
    }
    
    setRecommendations(recs);
  };

  const getProgressBarColor = (value: number) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'STABLE': return 'text-green-500';
      case 'VOLATILE': return 'text-red-500';
      case 'NEUTRAL': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            🎯 Pattern Detection Engine
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-white">⚡ LIVE</span>
            <span className="text-white">Spin #{spinHistory.length}</span>
          </div>
        </div>
      </Card>

      {/* Main Pattern Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pattern Strength Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Patterns</h3>
          <div className="space-y-3">
            {Array.from(patterns.entries()).map(([key, pattern]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {pattern.name.replace('_', '/')}:
                  </span>
                  <span className="text-sm">
                    {pattern.patternType} - {pattern.currentValue}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressBarColor(pattern.patternStrength)}`}
                      style={{ width: `${pattern.patternStrength}%` }}
                    />
                  </div>
                  <span className="text-sm w-12">{Math.round(pattern.patternStrength)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Volatility Index Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Volatility Index</h3>
          <div className="space-y-3">
            {Array.from(patterns.entries()).map(([key, pattern]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {pattern.name.replace('_', '/')}:
                  </span>
                  <span className={`text-sm font-bold ${getStatusColor(pattern.status)}`}>
                    {pattern.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        pattern.volatility > 65 ? 'bg-red-500' : 
                        pattern.volatility > 35 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${pattern.volatility}%` }}
                    />
                  </div>
                  <span className="text-sm w-12">{Math.round(pattern.volatility)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alignment Alert */}
      {alignmentScore > 60 && (
        <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600">
          <div className="text-white">
            <h3 className="text-lg font-bold mb-2">
              🚨 Multi-Dimensional Alignment Detected!
            </h3>
            <p>
              {Math.round(alignmentScore)}% of patterns are aligned - STRONG SIGNAL
            </p>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>{rec.group}: {rec.value}</span>
              <span className="font-bold">{rec.action}</span>
              <span className={`font-bold ${rec.confidence > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                {Math.round(rec.confidence)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}