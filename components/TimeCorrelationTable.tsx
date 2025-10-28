import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';

interface IntervalData {
  intervalLabel: string;
  spinRange: string;
  groupHits: Map<string, number>;
  totalSpins: number;
  dominantGroup: string;
  dominantPct: number;
  status: 'hot' | 'warm' | 'cold';
}

interface GroupTimeData {
  group: string;
  intervals: number[];
  avgHitRate: number;
  peakInterval: number;
  consistency: number;
  trend: 'rising' | 'falling' | 'stable';
}

type TabView = 'table' | 'wheel';

export default function TimeCorrelationTable({ spinHistory }: { spinHistory: number[] }) {
  const [activeTab, setActiveTab] = useState<TabView>('table');

  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  // ============================================================================
  // TABLE-BASED GROUP FUNCTIONS
  // ============================================================================

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
    return 'OTHER';
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
    return num === 0 ? 'ZERO' : 'OTHER';
  };

  // ============================================================================
  // INTERVAL ANALYSIS
  // ============================================================================

  const analyzeIntervals = (values: string[], intervalSize = 10): IntervalData[] => {
    if (values.length === 0) return [];

    const intervals: IntervalData[] = [];
    const numIntervals = Math.ceil(values.length / intervalSize);

    for (let i = 0; i < numIntervals; i++) {
      const start = i * intervalSize;
      const end = Math.min(start + intervalSize, values.length);
      const intervalValues = values.slice(start, end);

      const groupHits = new Map<string, number>();
      intervalValues.forEach(val => {
        if (val !== 'ZERO' && val !== 'OTHER') {
          groupHits.set(val, (groupHits.get(val) || 0) + 1);
        }
      });

      let dominantGroup = '';
      let dominantCount = 0;
      groupHits.forEach((count, group) => {
        if (count > dominantCount) {
          dominantCount = count;
          dominantGroup = group;
        }
      });

      const dominantPct = intervalValues.length > 0 ? (dominantCount / intervalValues.length) * 100 : 0;

      let status: 'hot' | 'warm' | 'cold' = 'cold';
      if (dominantPct >= 70) status = 'hot';
      else if (dominantPct >= 55) status = 'warm';

      intervals.push({
        intervalLabel: `#${i + 1}`,
        spinRange: `${start + 1}-${end}`,
        groupHits,
        totalSpins: intervalValues.length,
        dominantGroup,
        dominantPct,
        status
      });
    }

    return intervals;
  };

  const analyzeGroupTrends = (values: string[], intervalSize = 10): GroupTimeData[] => {
    if (values.length === 0) return [];

    const uniqueGroups = Array.from(new Set(values)).filter(v => v !== 'ZERO' && v !== 'OTHER');
    const numIntervals = Math.ceil(values.length / intervalSize);
    const groupData: GroupTimeData[] = [];

    uniqueGroups.forEach(group => {
      const intervals: number[] = [];

      for (let i = 0; i < numIntervals; i++) {
        const start = i * intervalSize;
        const end = Math.min(start + intervalSize, values.length);
        const intervalValues = values.slice(start, end);

        const hitCount = intervalValues.filter(v => v === group).length;
        const hitRate = intervalValues.length > 0 ? (hitCount / intervalValues.length) * 100 : 0;
        intervals.push(hitRate);
      }

      const avgHitRate = intervals.length > 0 ? intervals.reduce((sum, rate) => sum + rate, 0) / intervals.length : 0;
      const peakInterval = intervals.indexOf(Math.max(...intervals));

      const mean = avgHitRate;
      const variance = intervals.length > 0 ? intervals.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / intervals.length : 0;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - stdDev * 2);

      const mid = Math.floor(intervals.length / 2);
      const firstHalf = mid > 0 ? intervals.slice(0, mid).reduce((sum, r) => sum + r, 0) / mid : 0;
      const secondHalf = intervals.length - mid > 0 ? intervals.slice(mid).reduce((sum, r) => sum + r, 0) / (intervals.length - mid) : 0;

      let trend: 'rising' | 'falling' | 'stable' = 'stable';
      if (secondHalf > firstHalf + 10) trend = 'rising';
      else if (secondHalf < firstHalf - 10) trend = 'falling';

      groupData.push({
        group,
        intervals,
        avgHitRate,
        peakInterval,
        consistency,
        trend
      });
    });

    return groupData.sort((a, b) => b.avgHitRate - a.avgHitRate);
  };

  // ============================================================================
  // CALCULATE ALL CORRELATIONS
  // ============================================================================

  const correlationData = useMemo(() => {
    if (spinHistory.length < 10) {
      return {
        // Table bets
        color: { intervals: [], trends: [] },
        evenOdd: { intervals: [], trends: [] },
        dozen: { intervals: [], trends: [] },
        column: { intervals: [], trends: [] },
        lowHigh: { intervals: [], trends: [] },
        sixLine: { intervals: [], trends: [] },
        alt1: { intervals: [], trends: [] },
        alt2: { intervals: [], trends: [] },
        alt3: { intervals: [], trends: [] },
        edgeCenter: { intervals: [], trends: [] },
        // Wheel bets
        vot: { intervals: [], trends: [] },
        jeuZero: { intervals: [], trends: [] },
        ab: { intervals: [], trends: [] },
        aabb: { intervals: [], trends: [] },
        aaabbb: { intervals: [], trends: [] },
        a6b6: { intervals: [], trends: [] },
        a9b9: { intervals: [], trends: [] },
        rightLeft: { intervals: [], trends: [] },
        wheelSector: { intervals: [], trends: [] }
      };
    }

    return {
      // Table bets
      color: {
        intervals: analyzeIntervals(spinHistory.map(getNumberColor), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberColor), 10)
      },
      evenOdd: {
        intervals: analyzeIntervals(spinHistory.map(getNumberEvenOdd), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberEvenOdd), 10)
      },
      dozen: {
        intervals: analyzeIntervals(spinHistory.map(getNumberDozen), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberDozen), 10)
      },
      column: {
        intervals: analyzeIntervals(spinHistory.map(getNumberColumn), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberColumn), 10)
      },
      lowHigh: {
        intervals: analyzeIntervals(spinHistory.map(getNumberLowHigh), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberLowHigh), 10)
      },
      sixLine: {
        intervals: analyzeIntervals(spinHistory.map(getNumberSixLine), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberSixLine), 10)
      },
      alt1: {
        intervals: analyzeIntervals(spinHistory.map(getNumberAlt1), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberAlt1), 10)
      },
      alt2: {
        intervals: analyzeIntervals(spinHistory.map(getNumberAlt2), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberAlt2), 10)
      },
      alt3: {
        intervals: analyzeIntervals(spinHistory.map(getNumberAlt3), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberAlt3), 10)
      },
      edgeCenter: {
        intervals: analyzeIntervals(spinHistory.map(getNumberEdgeCenter), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberEdgeCenter), 10)
      },
      // Wheel bets
      vot: {
        intervals: analyzeIntervals(spinHistory.map(getNumberVoisinsOrphelinsTiers), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberVoisinsOrphelinsTiers), 10)
      },
      jeuZero: {
        intervals: analyzeIntervals(spinHistory.map(getNumberJeuZero), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberJeuZero), 10)
      },
      ab: {
        intervals: analyzeIntervals(spinHistory.map(getNumberAB), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberAB), 10)
      },
      aabb: {
        intervals: analyzeIntervals(spinHistory.map(getNumberAABB), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberAABB), 10)
      },
      aaabbb: {
        intervals: analyzeIntervals(spinHistory.map(getNumberAAABBB), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberAAABBB), 10)
      },
      a6b6: {
        intervals: analyzeIntervals(spinHistory.map(getNumberA6B6), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberA6B6), 10)
      },
      a9b9: {
        intervals: analyzeIntervals(spinHistory.map(getNumberA9B9), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberA9B9), 10)
      },
      rightLeft: {
        intervals: analyzeIntervals(spinHistory.map(getNumberRightLeft), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberRightLeft), 10)
      },
      wheelSector: {
        intervals: analyzeIntervals(spinHistory.map(getNumberWheelSector), 10),
        trends: analyzeGroupTrends(spinHistory.map(getNumberWheelSector), 10)
      }
    };
  }, [spinHistory]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderIntervalTable = (intervals: IntervalData[], groupTrends: GroupTimeData[], title: string, emoji: string) => {
    if (intervals.length === 0) return null;

    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">{emoji}</span> {title}
        </h3>
        <div className="space-y-4">
          {/* Intervals Overview */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Interval Performance</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-600 text-gray-400">
                    <th className="px-2 py-2 text-left">Interval</th>
                    <th className="px-2 py-2 text-left">Spins</th>
                    <th className="px-2 py-2 text-left">Dominant</th>
                    <th className="px-2 py-2 text-center">%</th>
                    <th className="px-2 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {intervals.map((interval, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50">
                      <td className="px-2 py-2 font-mono text-cyan-400">{interval.intervalLabel}</td>
                      <td className="px-2 py-2 text-gray-400">{interval.spinRange}</td>
                      <td className="px-2 py-2 font-bold text-white">{interval.dominantGroup || '-'}</td>
                      <td className="px-2 py-2 text-center text-yellow-400">{interval.dominantPct.toFixed(0)}%</td>
                      <td className="px-2 py-2 text-center">
                        {interval.status === 'hot' && <span className="text-red-400">🔥 Hot</span>}
                        {interval.status === 'warm' && <span className="text-orange-400">⚡ Warm</span>}
                        {interval.status === 'cold' && <span className="text-gray-400">❄️ Cold</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Group Trends */}
          {groupTrends.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Group Trends Across Time</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-600 text-gray-400">
                        <th className="px-2 py-2 text-left">Group</th>
                        <th className="px-2 py-2 text-center">Avg %</th>
                        <th className="px-2 py-2 text-center">Peak Interval</th>
                        <th className="px-2 py-2 text-center">Consistency</th>
                        <th className="px-2 py-2 text-center">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTrends.map((trend, idx) => (
                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50">
                          <td className="px-2 py-2 font-bold text-white">{trend.group}</td>
                          <td className="px-2 py-2 text-center text-cyan-400">{trend.avgHitRate.toFixed(1)}%</td>
                          <td className="px-2 py-2 text-center text-yellow-400">#{trend.peakInterval + 1}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={
                              trend.consistency >= 70 ? 'text-green-400' :
                              trend.consistency >= 50 ? 'text-yellow-400' :
                              'text-gray-400'
                            }>
                              {trend.consistency.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {trend.trend === 'rising' && <span className="text-green-400">📈 Rising</span>}
                            {trend.trend === 'falling' && <span className="text-red-400">📉 Falling</span>}
                            {trend.trend === 'stable' && <span className="text-gray-400">➡️ Stable</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Heat Map */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Hit Rate Heat Map</h4>
                <div className="space-y-1">
                  {groupTrends.map((trend, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-16 text-xs font-bold text-white">{trend.group}</div>
                      <div className="flex-1 flex gap-0.5">
                        {trend.intervals.map((rate, intervalIdx) => (
                          <div
                            key={intervalIdx}
                            className="flex-1 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: rate >= 60 ? '#ef4444' :
                                             rate >= 50 ? '#f97316' :
                                             rate >= 40 ? '#eab308' :
                                             rate >= 30 ? '#22c55e' : '#6b7280',
                              color: 'white'
                            }}
                            title={`Interval ${intervalIdx + 1}: ${rate.toFixed(1)}%`}
                          >
                            {rate.toFixed(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6b7280' }}></div>
                    <span>&lt;30%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                    <span>30-40%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
                    <span>40-50%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
                    <span>50-60%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                    <span>≥60%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  if (spinHistory.length === 0) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">⏰ Time Correlation Analysis</h3>
        <p className="text-gray-400">No spin data yet. Start adding spins to see time-based patterns.</p>
      </Card>
    );
  }

  if (spinHistory.length < 10) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">⏰ Time Correlation Analysis</h3>
        <p className="text-gray-400">Need at least 10 spins for interval analysis. Current: {spinHistory.length}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
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

      {/* Table Bets Content */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          {renderIntervalTable(correlationData.color.intervals, correlationData.color.trends, 'Color Correlation', '🎨')}
          {renderIntervalTable(correlationData.evenOdd.intervals, correlationData.evenOdd.trends, 'Even/Odd Correlation', '🔢')}
          {renderIntervalTable(correlationData.dozen.intervals, correlationData.dozen.trends, 'Dozen Correlation', '📊')}
          {renderIntervalTable(correlationData.column.intervals, correlationData.column.trends, 'Column Correlation', '📋')}
          {renderIntervalTable(correlationData.lowHigh.intervals, correlationData.lowHigh.trends, 'Low/High Correlation', '⬆️')}
          {renderIntervalTable(correlationData.sixLine.intervals, correlationData.sixLine.trends, 'Six Line Correlation', '➖')}
          {renderIntervalTable(correlationData.alt1.intervals, correlationData.alt1.trends, 'Alt Pattern 1', '🔄')}
          {renderIntervalTable(correlationData.alt2.intervals, correlationData.alt2.trends, 'Alt Pattern 2', '🔁')}
          {renderIntervalTable(correlationData.alt3.intervals, correlationData.alt3.trends, 'Alt Pattern 3', '🔃')}
          {renderIntervalTable(correlationData.edgeCenter.intervals, correlationData.edgeCenter.trends, 'Edge/Center', '🎯')}
        </div>
      )}

      {/* Wheel Bets Content */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          {renderIntervalTable(correlationData.vot.intervals, correlationData.vot.trends, 'Voisins/Orphelins/Tiers', '🎡')}
          {renderIntervalTable(correlationData.jeuZero.intervals, correlationData.jeuZero.trends, 'Jeu Zero', '🎰')}
          {renderIntervalTable(correlationData.ab.intervals, correlationData.ab.trends, 'A/B Pattern', '🔵')}
          {renderIntervalTable(correlationData.aabb.intervals, correlationData.aabb.trends, 'AA/BB Pattern', '🟢')}
          {renderIntervalTable(correlationData.aaabbb.intervals, correlationData.aaabbb.trends, 'AAA/BBB Pattern', '🔴')}
          {renderIntervalTable(correlationData.a6b6.intervals, correlationData.a6b6.trends, 'A6/B6 Pattern', '🟠')}
          {renderIntervalTable(correlationData.a9b9.intervals, correlationData.a9b9.trends, 'A9/B9 Pattern', '🟡')}
          {renderIntervalTable(correlationData.rightLeft.intervals, correlationData.rightLeft.trends, 'Right/Left', '↔️')}
          {renderIntervalTable(correlationData.wheelSector.intervals, correlationData.wheelSector.trends, 'Wheel Sectors', '🧩')}
        </div>
      )}

      {/* Legend */}
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-red-400">🔥</span>
            <span className="text-gray-300">Hot (≥70% dominance)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">⚡</span>
            <span className="text-gray-300">Warm (55-70% dominance)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">❄️</span>
            <span className="text-gray-300">Cold (&lt;55% dominance)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">📈</span>
            <span className="text-gray-300">Rising Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">📉</span>
            <span className="text-gray-300">Falling Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">➡️</span>
            <span className="text-gray-300">Stable Trend</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
