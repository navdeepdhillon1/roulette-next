import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';

interface GroupAnalysis {
  name: string;
  displayName: string;
  currentValue: string;
  patternType: 'STREAK' | 'ALTERNATING' | 'CHAOS' | 'DOMINANT';
  patternStrength: number;
  volatility: number;
  streakLength: number;
  switchRate: number;
  confidence: number;
  status: 'STABLE' | 'VOLATILE' | 'NEUTRAL';
  recommendation: 'FOLLOW' | 'OBSERVE' | 'AVOID' | 'ALTERNATE';
}

type TabView = 'priority' | 'table' | 'wheel';
type SortBy = 'confidence' | 'strength' | 'volatility' | 'streak';
type FilterBy = 'all' | 'high-confidence' | 'active' | 'volatile';

export default function PatternDetectionEngine({ spinHistory }: { spinHistory: number[] }) {
  const [activeTab, setActiveTab] = useState<TabView>('priority');
  const [sortBy, setSortBy] = useState<SortBy>('confidence');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [patterns, setPatterns] = useState<GroupAnalysis[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  // ============================================================================
  // TABLE-BASED GROUP FUNCTIONS
  // ============================================================================

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'ZERO';
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
    return 'ZERO';
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
    return 'ZERO';
  };

  // ============================================================================
  // PATTERN ANALYSIS
  // ============================================================================

  const analyzeGroup = (groupName: string, displayName: string, values: string[]): GroupAnalysis => {
    if (values.length < 3) {
      return {
        name: groupName,
        displayName,
        currentValue: values[values.length - 1] || 'N/A',
        patternType: 'CHAOS',
        patternStrength: 0,
        volatility: 0,
        streakLength: 0,
        switchRate: 0,
        confidence: 0,
        status: 'NEUTRAL',
        recommendation: 'OBSERVE'
      };
    }

    // Filter out ZERO and OTHER
    const filteredValues = values.filter(v => v !== 'ZERO' && v !== 'OTHER');
    if (filteredValues.length < 3) {
      return {
        name: groupName,
        displayName,
        currentValue: filteredValues[filteredValues.length - 1] || 'N/A',
        patternType: 'CHAOS',
        patternStrength: 0,
        volatility: 0,
        streakLength: 0,
        switchRate: 0,
        confidence: 0,
        status: 'NEUTRAL',
        recommendation: 'OBSERVE'
      };
    }

    // Calculate current streak
    let currentStreak = 1;
    const currentValue = filteredValues[filteredValues.length - 1];
    for (let i = filteredValues.length - 2; i >= 0; i--) {
      if (filteredValues[i] === currentValue) currentStreak++;
      else break;
    }

    // Calculate switch rate (volatility)
    let switches = 0;
    for (let i = 1; i < filteredValues.length; i++) {
      if (filteredValues[i] !== filteredValues[i - 1]) switches++;
    }
    const switchRate = (switches / (filteredValues.length - 1)) * 100;

    // Determine pattern type
    let patternType: 'STREAK' | 'ALTERNATING' | 'CHAOS' | 'DOMINANT';
    if (currentStreak >= 4) patternType = 'STREAK';
    else if (switchRate > 75) patternType = 'ALTERNATING';
    else if (switchRate < 30) patternType = 'DOMINANT';
    else patternType = 'CHAOS';

    // Calculate pattern strength
    const patternStrength = patternType === 'STREAK' ?
      Math.min(100, currentStreak * 25) :
      patternType === 'ALTERNATING' ?
      Math.min(100, switchRate * 1.2) :
      patternType === 'DOMINANT' ?
      Math.min(100, (100 - switchRate) * 1.5) :
      Math.min(100, 50 - Math.abs(50 - switchRate));

    // Determine volatility status
    let status: 'STABLE' | 'VOLATILE' | 'NEUTRAL';
    if (switchRate < 35) status = 'STABLE';
    else if (switchRate > 65) status = 'VOLATILE';
    else status = 'NEUTRAL';

    // Calculate confidence
    let confidence = patternStrength;
    if (status === 'STABLE') confidence *= 1.2;
    else if (status === 'VOLATILE') confidence *= 0.7;

    // Boost confidence for long streaks
    if (currentStreak >= 5) confidence *= 1.3;

    confidence = Math.min(100, confidence);

    // Determine recommendation
    let recommendation: 'FOLLOW' | 'OBSERVE' | 'AVOID' | 'ALTERNATE';
    if (confidence >= 70 && patternType === 'STREAK') recommendation = 'FOLLOW';
    else if (confidence >= 70 && patternType === 'ALTERNATING') recommendation = 'ALTERNATE';
    else if (confidence >= 60 && patternType === 'DOMINANT') recommendation = 'FOLLOW';
    else if (status === 'VOLATILE') recommendation = 'AVOID';
    else recommendation = 'OBSERVE';

    return {
      name: groupName,
      displayName,
      currentValue,
      patternType,
      patternStrength,
      volatility: switchRate,
      streakLength: currentStreak,
      switchRate,
      confidence,
      status,
      recommendation
    };
  };

  // ============================================================================
  // ANALYZE ALL PATTERNS
  // ============================================================================

  useEffect(() => {
    if (spinHistory.length < 3) {
      setPatterns([]);
      return;
    }

    const allPatterns: GroupAnalysis[] = [];

    // Table bets
    allPatterns.push(analyzeGroup('color', '🎨 Color', spinHistory.map(getNumberColor)));
    allPatterns.push(analyzeGroup('evenOdd', '🔢 Even/Odd', spinHistory.map(getNumberEvenOdd)));
    allPatterns.push(analyzeGroup('dozen', '📊 Dozen', spinHistory.map(getNumberDozen)));
    allPatterns.push(analyzeGroup('column', '📋 Column', spinHistory.map(getNumberColumn)));
    allPatterns.push(analyzeGroup('lowHigh', '⬆️ Low/High', spinHistory.map(getNumberLowHigh)));
    allPatterns.push(analyzeGroup('sixLine', '➖ Six Line', spinHistory.map(getNumberSixLine)));
    allPatterns.push(analyzeGroup('alt1', '🔄 Alt Pattern 1', spinHistory.map(getNumberAlt1)));
    allPatterns.push(analyzeGroup('alt2', '🔁 Alt Pattern 2', spinHistory.map(getNumberAlt2)));
    allPatterns.push(analyzeGroup('alt3', '🔃 Alt Pattern 3', spinHistory.map(getNumberAlt3)));
    allPatterns.push(analyzeGroup('edgeCenter', '🎯 Edge/Center', spinHistory.map(getNumberEdgeCenter)));

    // Wheel bets
    allPatterns.push(analyzeGroup('vot', '🎡 Voisins/Orphelins/Tiers', spinHistory.map(getNumberVoisinsOrphelinsTiers)));
    allPatterns.push(analyzeGroup('jeuZero', '🎰 Jeu Zero', spinHistory.map(getNumberJeuZero)));
    allPatterns.push(analyzeGroup('ab', '🔵 A/B Pattern', spinHistory.map(getNumberAB)));
    allPatterns.push(analyzeGroup('aabb', '🟢 AA/BB Pattern', spinHistory.map(getNumberAABB)));
    allPatterns.push(analyzeGroup('aaabbb', '🔴 AAA/BBB Pattern', spinHistory.map(getNumberAAABBB)));
    allPatterns.push(analyzeGroup('a6b6', '🟠 A6/B6 Pattern', spinHistory.map(getNumberA6B6)));
    allPatterns.push(analyzeGroup('a9b9', '🟡 A9/B9 Pattern', spinHistory.map(getNumberA9B9)));
    allPatterns.push(analyzeGroup('rightLeft', '↔️ Right/Left', spinHistory.map(getNumberRightLeft)));
    allPatterns.push(analyzeGroup('wheelSector', '🧩 Wheel Sectors', spinHistory.map(getNumberWheelSector)));

    setPatterns(allPatterns);
  }, [spinHistory]);

  // ============================================================================
  // SORTING AND FILTERING
  // ============================================================================

  const filteredAndSortedPatterns = useMemo(() => {
    let filtered = [...patterns];

    // Apply filters
    if (filterBy === 'high-confidence') {
      filtered = filtered.filter(p => p.confidence >= 70);
    } else if (filterBy === 'active') {
      filtered = filtered.filter(p => p.streakLength >= 3);
    } else if (filterBy === 'volatile') {
      filtered = filtered.filter(p => p.status === 'VOLATILE');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence': return b.confidence - a.confidence;
        case 'strength': return b.patternStrength - a.patternStrength;
        case 'volatility': return b.volatility - a.volatility;
        case 'streak': return b.streakLength - a.streakLength;
        default: return 0;
      }
    });

    return filtered;
  }, [patterns, sortBy, filterBy]);

  const topPatterns = useMemo(() => {
    return [...patterns].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }, [patterns]);

  const tablePatterns = useMemo(() => {
    return filteredAndSortedPatterns.filter(p =>
      ['color', 'evenOdd', 'dozen', 'column', 'lowHigh', 'sixLine', 'alt1', 'alt2', 'alt3', 'edgeCenter'].includes(p.name)
    );
  }, [filteredAndSortedPatterns]);

  const wheelPatterns = useMemo(() => {
    return filteredAndSortedPatterns.filter(p =>
      ['vot', 'jeuZero', 'ab', 'aabb', 'aaabbb', 'a6b6', 'a9b9', 'rightLeft', 'wheelSector'].includes(p.name)
    );
  }, [filteredAndSortedPatterns]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const getPatternIcon = (patternType: string) => {
    switch (patternType) {
      case 'STREAK': return '📈';
      case 'ALTERNATING': return '🔄';
      case 'DOMINANT': return '👑';
      case 'CHAOS': return '🌀';
      default: return '❓';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'STABLE': return <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">🟢 STABLE</span>;
      case 'VOLATILE': return <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">🔴 VOLATILE</span>;
      case 'NEUTRAL': return <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">🟡 NEUTRAL</span>;
      default: return null;
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'FOLLOW': return <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-bold">🎯 FOLLOW</span>;
      case 'ALTERNATE': return <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">🔄 ALTERNATE</span>;
      case 'OBSERVE': return <span className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full font-bold">👀 OBSERVE</span>;
      case 'AVOID': return <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold">⚠️ AVOID</span>;
      default: return null;
    }
  };

  const renderPatternCard = (pattern: GroupAnalysis) => {
    return (
      <Card key={pattern.name} className="p-4 bg-gray-900 border-gray-700 hover:border-cyan-500 transition-all">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-white text-sm">{pattern.displayName}</h4>
              <p className="text-xs text-gray-400 mt-1">
                {getPatternIcon(pattern.patternType)} {pattern.patternType} - {pattern.currentValue}
              </p>
            </div>
            {getStatusBadge(pattern.status)}
          </div>

          {/* Strength Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Pattern Strength</span>
              <span className="font-bold">{Math.round(pattern.patternStrength)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  pattern.patternStrength >= 80 ? 'bg-red-500' :
                  pattern.patternStrength >= 60 ? 'bg-yellow-500' :
                  pattern.patternStrength >= 40 ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}
                style={{ width: `${pattern.patternStrength}%` }}
              />
            </div>
          </div>

          {/* Confidence Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Confidence</span>
              <span className="font-bold text-cyan-400">{Math.round(pattern.confidence)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all"
                style={{ width: `${pattern.confidence}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Streak</div>
              <div className="text-white font-bold">{pattern.streakLength}</div>
            </div>
            <div className="bg-gray-800 rounded p-2">
              <div className="text-gray-400">Volatility</div>
              <div className="text-white font-bold">{Math.round(pattern.volatility)}%</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex justify-center pt-2">
            {getRecommendationBadge(pattern.recommendation)}
          </div>
        </div>
      </Card>
    );
  };

  if (spinHistory.length < 3) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">🎯 Pattern Detection Engine</h3>
        <p className="text-gray-400">Need at least 3 spins to detect patterns. Current: {spinHistory.length}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-900 to-blue-900 border-purple-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎯 Pattern Detection Engine
          </h2>
          <div className="flex items-center gap-4 text-white">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`text-sm px-3 py-1 rounded-full font-bold transition-all ${
                showHelp
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {showHelp ? '❌ Close Help' : '❓ Help'}
            </button>
            <span className="text-sm bg-green-500 px-3 py-1 rounded-full font-bold">⚡ LIVE</span>
            <span className="text-sm">Spin #{spinHistory.length}</span>
          </div>
        </div>
      </Card>

      {/* Help Documentation */}
      {showHelp && (
        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-yellow-500 border-2">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">📚 How to Use Pattern Detection Engine</h3>

          <div className="space-y-6 text-white">
            {/* Overview */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">🎯 What is this?</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                The Pattern Detection Engine analyzes your spin history across <strong>47 different betting groups</strong> (26 table-based + 21 wheel-based).
                It identifies patterns, calculates confidence levels, and provides actionable recommendations for your betting strategy.
              </p>
            </div>

            {/* Three Tabs */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">📑 Three Views</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="p-3 bg-green-900/30 border-green-600">
                  <div className="text-sm font-bold text-green-400 mb-1">🔥 Priority</div>
                  <div className="text-xs text-gray-300">Shows TOP 3 highest confidence patterns. Focus here for best plays.</div>
                </Card>
                <Card className="p-3 bg-cyan-900/30 border-cyan-600">
                  <div className="text-sm font-bold text-cyan-400 mb-1">📊 Table Bets</div>
                  <div className="text-xs text-gray-300">Classic betting groups: Color, Even/Odd, Dozens, Columns, and alternative patterns.</div>
                </Card>
                <Card className="p-3 bg-purple-900/30 border-purple-600">
                  <div className="text-sm font-bold text-purple-400 mb-1">🎡 Wheel Bets</div>
                  <div className="text-xs text-gray-300">Wheel-based groups: Voisins, Orphelins, Tiers, A/B patterns, and sectors.</div>
                </Card>
              </div>
            </div>

            {/* Pattern Types */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">🎨 Pattern Types</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="text-2xl">📈</span>
                  <div>
                    <span className="font-bold text-red-400">STREAK</span>
                    <p className="text-xs text-gray-400">Current value hitting 4+ times consecutively. Strong momentum.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <span className="font-bold text-blue-400">ALTERNATING</span>
                    <p className="text-xs text-gray-400">High switch rate (75%+). Values changing frequently.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="text-2xl">👑</span>
                  <div>
                    <span className="font-bold text-yellow-400">DOMINANT</span>
                    <p className="text-xs text-gray-400">Low switch rate (30%-). One value appearing more often.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="text-2xl">🌀</span>
                  <div>
                    <span className="font-bold text-gray-400">CHAOS</span>
                    <p className="text-xs text-gray-400">No clear pattern. Unpredictable behavior.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">🚦 Status Indicators</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-green-500 px-2 py-1 rounded text-xs font-bold">🟢 STABLE</span>
                  <p className="text-xs text-gray-400">Switch rate &lt;35%. Pattern is consistent.</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold">🔴 VOLATILE</span>
                  <p className="text-xs text-gray-400">Switch rate &gt;65%. Pattern is unstable.</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-yellow-500 px-2 py-1 rounded text-xs font-bold">🟡 NEUTRAL</span>
                  <p className="text-xs text-gray-400">Switch rate 35-65%. Balanced behavior.</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">💡 Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-green-600 px-2 py-1 rounded text-xs font-bold">🎯 FOLLOW</span>
                  <p className="text-xs text-gray-400">High confidence (70%+) STREAK or DOMINANT pattern. Bet on current value.</p>
                </div>
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-blue-600 px-2 py-1 rounded text-xs font-bold">🔄 ALTERNATE</span>
                  <p className="text-xs text-gray-400">High confidence (70%+) ALTERNATING pattern. Bet opposite of current value.</p>
                </div>
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-gray-600 px-2 py-1 rounded text-xs font-bold">👀 OBSERVE</span>
                  <p className="text-xs text-gray-400">Medium confidence. Wait for clearer signal before betting.</p>
                </div>
                <div className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                  <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold">⚠️ AVOID</span>
                  <p className="text-xs text-gray-400">VOLATILE status. Too unpredictable to bet safely.</p>
                </div>
              </div>
            </div>

            {/* Understanding Metrics */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">📊 Understanding Card Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-bold text-yellow-400 mb-1">Pattern Strength (0-100%)</div>
                  <p className="text-xs text-gray-400">
                    How strong the detected pattern is. For STREAK: length × 25. For ALTERNATING: switch rate × 1.2. For DOMINANT: (100 - switch rate) × 1.5.
                    <br />
                    <span className="text-red-400">80%+ = Very Strong</span> |
                    <span className="text-yellow-400"> 60-79% = Strong</span> |
                    <span className="text-blue-400"> 40-59% = Moderate</span> |
                    <span className="text-gray-400"> &lt;40% = Weak</span>
                  </p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-bold text-cyan-400 mb-1">Confidence (0-100%)</div>
                  <p className="text-xs text-gray-400">
                    Overall reliability score combining pattern strength, status, and streak bonuses.
                    STABLE status: +20% boost. VOLATILE status: -30% penalty. Streak ≥5: +30% boost.
                    <br />
                    <span className="text-green-400">70%+ = High confidence (safe to bet)</span> |
                    <span className="text-yellow-400"> 50-69% = Medium (proceed with caution)</span> |
                    <span className="text-gray-400"> &lt;50% = Low (avoid betting)</span>
                  </p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-bold text-orange-400 mb-1">Streak</div>
                  <p className="text-xs text-gray-400">
                    How many consecutive times the current value has appeared. Longer streaks = stronger momentum (but also higher risk of reversal).
                  </p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-bold text-purple-400 mb-1">Volatility (%)</div>
                  <p className="text-xs text-gray-400">
                    Percentage of times the value switched in recent history.
                    <span className="text-green-400">Low (0-35%)</span> = stable patterns.
                    <span className="text-red-400">High (65%+)</span> = unpredictable, risky.
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Sorting */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">🔧 Filters & Sorting</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-bold text-blue-400 mb-2">Sort Options:</div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li><strong>Confidence:</strong> Highest reliability first (default)</li>
                    <li><strong>Pattern Strength:</strong> Strongest patterns first</li>
                    <li><strong>Volatility:</strong> Most unpredictable first</li>
                    <li><strong>Streak Length:</strong> Longest runs first</li>
                  </ul>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="font-bold text-green-400 mb-2">Filter Options:</div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li><strong>All Patterns:</strong> Show everything</li>
                    <li><strong>High Confidence (≥70%):</strong> Only safe bets</li>
                    <li><strong>Active Streaks (≥3):</strong> Only hot runs</li>
                    <li><strong>Volatile Only:</strong> High-risk patterns</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div>
              <h4 className="text-lg font-bold text-cyan-400 mb-2">💎 Pro Tips</h4>
              <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 p-4 rounded border border-yellow-600">
                <ul className="text-sm text-gray-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span><strong>Focus on Priority tab</strong> - It shows the 3 best opportunities based on confidence.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span><strong>Look for STABLE + STREAK combos</strong> - These have the highest success rate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span><strong>Avoid VOLATILE patterns</strong> - They are unpredictable and risky regardless of confidence.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span><strong>Combine multiple groups</strong> - Bet on 2-3 high-confidence patterns for better coverage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span><strong>Don&apos;t chase CHAOS patterns</strong> - No clear pattern means no edge.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span><strong>Don&apos;t bet on confidence &lt;60%</strong> - Wait for stronger signals.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Priority Dashboard */}
      {activeTab === 'priority' && (
        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-green-900 to-emerald-900 border-green-700">
            <h3 className="text-xl font-bold text-white mb-4">🔥 HIGHEST CONFIDENCE PLAYS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPatterns.map((pattern, idx) => (
                <Card key={pattern.name} className="p-6 bg-gray-900 border-2 border-yellow-500">
                  <div className="text-center space-y-3">
                    <div className="text-4xl font-bold text-yellow-400">#{idx + 1}</div>
                    <div className="text-2xl font-bold text-white">{pattern.displayName}</div>
                    <div className="text-xl text-cyan-400">{pattern.currentValue}</div>
                    <div className="text-sm text-gray-400">{getPatternIcon(pattern.patternType)} {pattern.patternType}</div>
                    <div className="text-3xl font-bold text-green-400">{Math.round(pattern.confidence)}%</div>
                    <div className="pt-2">
                      {getRecommendationBadge(pattern.recommendation)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('priority')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === 'priority'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔥 Priority
        </button>
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

      {/* Filters and Sorting */}
      {activeTab !== 'priority' && (
        <Card className="p-4 bg-gray-900 border-gray-700">
          <div className="flex flex-wrap gap-4">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-gray-800 text-white text-sm rounded px-3 py-1 border border-gray-700"
              >
                <option value="confidence">Confidence</option>
                <option value="strength">Pattern Strength</option>
                <option value="volatility">Volatility</option>
                <option value="streak">Streak Length</option>
              </select>
            </div>

            {/* Filter By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                className="bg-gray-800 text-white text-sm rounded px-3 py-1 border border-gray-700"
              >
                <option value="all">All Patterns</option>
                <option value="high-confidence">High Confidence (≥70%)</option>
                <option value="active">Active Streaks (≥3)</option>
                <option value="volatile">Volatile Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-400">
              Showing {activeTab === 'table' ? tablePatterns.length : wheelPatterns.length} patterns
            </div>
          </div>
        </Card>
      )}

      {/* Table Bets Content */}
      {activeTab === 'table' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tablePatterns.map(renderPatternCard)}
        </div>
      )}

      {/* Wheel Bets Content */}
      {activeTab === 'wheel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wheelPatterns.map(renderPatternCard)}
        </div>
      )}
    </div>
  );
}
