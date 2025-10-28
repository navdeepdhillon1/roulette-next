import React, { useMemo } from 'react';
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

export default function TimeCorrelationTable({ spinHistory }: { spinHistory: number[] }) {
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

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

  // Analyze intervals for a specific classification
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
        groupHits.set(val, (groupHits.get(val) || 0) + 1);
      });

      let dominantGroup = '';
      let dominantCount = 0;
      groupHits.forEach((count, group) => {
        if (count > dominantCount) {
          dominantCount = count;
          dominantGroup = group;
        }
      });

      const dominantPct = (dominantCount / intervalValues.length) * 100;

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

  // Track performance of each group across intervals
  const analyzeGroupTrends = (values: string[], intervalSize = 10): GroupTimeData[] => {
    if (values.length === 0) return [];

    const uniqueGroups = Array.from(new Set(values));
    const numIntervals = Math.ceil(values.length / intervalSize);
    const groupData: GroupTimeData[] = [];

    uniqueGroups.forEach(group => {
      const intervals: number[] = [];

      for (let i = 0; i < numIntervals; i++) {
        const start = i * intervalSize;
        const end = Math.min(start + intervalSize, values.length);
        const intervalValues = values.slice(start, end);

        const hitCount = intervalValues.filter(v => v === group).length;
        const hitRate = (hitCount / intervalValues.length) * 100;
        intervals.push(hitRate);
      }

      const avgHitRate = intervals.reduce((sum, rate) => sum + rate, 0) / intervals.length;
      const peakInterval = intervals.indexOf(Math.max(...intervals));

      // Calculate consistency (lower std dev = more consistent)
      const mean = avgHitRate;
      const variance = intervals.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - stdDev * 2);

      // Determine trend (compare first half vs second half)
      const mid = Math.floor(intervals.length / 2);
      const firstHalf = intervals.slice(0, mid).reduce((sum, r) => sum + r, 0) / mid;
      const secondHalf = intervals.slice(mid).reduce((sum, r) => sum + r, 0) / (intervals.length - mid);

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

  const correlationData = useMemo(() => {
    if (spinHistory.length < 10) {
      return {
        colorIntervals: [],
        colorTrends: [],
        evenOddIntervals: [],
        evenOddTrends: [],
        dozenIntervals: [],
        dozenTrends: []
      };
    }

    const colors = spinHistory.map(getNumberColor);
    const evenOdds = spinHistory.map(getNumberEvenOdd);
    const dozens = spinHistory.map(getNumberDozen);

    return {
      colorIntervals: analyzeIntervals(colors, 10),
      colorTrends: analyzeGroupTrends(colors, 10),
      evenOddIntervals: analyzeIntervals(evenOdds, 10),
      evenOddTrends: analyzeGroupTrends(evenOdds, 10),
      dozenIntervals: analyzeIntervals(dozens, 10),
      dozenTrends: analyzeGroupTrends(dozens, 10)
    };
  }, [spinHistory]);

  const renderIntervalTable = (intervals: IntervalData[], groupTrends: GroupTimeData[]) => {
    if (intervals.length === 0) return <p className="text-gray-400 text-sm">Need at least 10 spins for interval analysis</p>;

    return (
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
                    <td className="px-2 py-2 font-bold text-white">{interval.dominantGroup}</td>
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
      </div>
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

  return (
    <div className="space-y-6">
      {/* Color Correlation */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">🎨</span> Color Correlation Over Time
        </h3>
        {renderIntervalTable(correlationData.colorIntervals, correlationData.colorTrends)}
      </Card>

      {/* Even/Odd Correlation */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">🔢</span> Even/Odd Correlation Over Time
        </h3>
        {renderIntervalTable(correlationData.evenOddIntervals, correlationData.evenOddTrends)}
      </Card>

      {/* Dozen Correlation */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <span className="text-2xl">📊</span> Dozen Correlation Over Time
        </h3>
        {renderIntervalTable(correlationData.dozenIntervals, correlationData.dozenTrends)}
      </Card>

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
