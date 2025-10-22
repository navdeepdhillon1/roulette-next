// EnhancedRaceCard.tsx - Redesigned race card with vertical bars, momentum graph, and multi-window analysis

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface GroupMetrics {
  hitRate: number;
  deviation: number;
  zScore: number;
  streak: number;
  absence: number;
  ewma: number;
  roi: number;
  volatility: number;
  alternations: number;
}

interface RaceResult {
  groups: GroupMetrics[];
  scores: number[];
  leader: number | 'TIE';
  badges: ('HOT' | 'COLD' | 'WATCH' | 'NEUTRAL')[];
  names: string[];
  colors: string[];
  volatilityLevels: ('STABLE' | 'MODERATE' | 'VOLATILE')[];
}

interface EnhancedRaceCardProps {
  result: RaceResult;
  title: string;
  payout: string;
  spins: number[];
  groupNumbers: number[][];
}

// European wheel order for position mapping
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export default function EnhancedRaceCard({ result, title, payout, spins, groupNumbers }: EnhancedRaceCardProps) {
  const { groups, scores, leader, badges, names, colors, volatilityLevels } = result;

  // Calculate multi-window metrics
  const windowAnalysis = useMemo(() => {
    const windows = [4, 9, 18, 36];
    // Since spins array is newest-first, take first 36 (not last 36)
    const recentSpins = spins.slice(0, 36);

    return names.map((name, idx) => {
      const groupNums = groupNumbers[idx];

      return windows.map(window => {
        // Take first N from recent spins (newest N)
        const windowSpins = recentSpins.slice(0, window);
        const hits = windowSpins.filter(n => groupNums.includes(n)).length;
        const hitRate = windowSpins.length > 0 ? (hits / windowSpins.length) * 100 : 0;
        const expected = (groupNums.length / 37) * 100;

        // Calculate Z-score for this window
        const n = windowSpins.length;
        const p = groupNums.length / 37;
        const expectedHits = n * p;
        const stdDev = Math.sqrt(n * p * (1 - p));
        const zScore = stdDev > 0 ? (hits - expectedHits) / stdDev : 0;

        // Calculate streak and absence for this window
        // Streak: count from index 0 (most recent) until we hit a miss
        let streak = 0;
        for (let i = 0; i < windowSpins.length; i++) {
          if (groupNums.includes(windowSpins[i])) {
            streak++;
          } else {
            break; // Stop at first miss
          }
        }

        // Absence: count from index 0 (most recent) until we hit a match
        let absence = 0;
        for (let i = 0; i < windowSpins.length; i++) {
          if (groupNums.includes(windowSpins[i])) {
            break; // Stop at first hit
          } else {
            absence++;
          }
        }

        // Calculate ROI for this window
        let roi = 0;
        for (const spin of windowSpins) {
          roi += groupNums.includes(spin) ? 1 : -1;
        }

        return { hits, hitRate, zScore, streak, absence, roi, window };
      });
    });
  }, [spins, groupNumbers, names]);

  // Calculate momentum graph data
  const momentumData = useMemo(() => {
    const recentSpins = spins.slice(0, 36);

    return names.map((name, idx) => {
      const groupNums = groupNumbers[idx];
      const runs: Array<{ run: number; position: number }> = [];
      let currentRun = 0;

      recentSpins.forEach((spin, i) => {
        if (groupNums.includes(spin)) {
          currentRun++;
        } else {
          if (currentRun > 0) {
            runs.push({ run: currentRun, position: i - currentRun });
            currentRun = 0;
          }
          currentRun--;
        }
      });

      // Add final run if exists
      if (currentRun !== 0) {
        runs.push({ run: currentRun, position: recentSpins.length - Math.abs(currentRun) });
      }

      return runs;
    });
  }, [spins, groupNumbers, names]);

  // Calculate wheel sector distribution
  const sectorAnalysis = useMemo(() => {
    const recentSpins = spins.slice(0, 36);
    const sectors = [
      { name: 'Sector 1 (Pos 0-9)', range: [0, 9], label: 'Voisins start' },
      { name: 'Sector 2 (Pos 10-18)', range: [10, 18], label: 'Tiers' },
      { name: 'Sector 3 (Pos 19-27)', range: [19, 27], label: 'Orphelins' },
      { name: 'Sector 4 (Pos 28-36)', range: [28, 36], label: 'Voisins end' },
    ];

    return names.map((name, idx) => {
      const groupNums = groupNumbers[idx];

      return sectors.map(sector => {
        const sectorNumbers = WHEEL_ORDER.slice(sector.range[0], sector.range[1] + 1);
        const hits = recentSpins.filter(n => groupNums.includes(n) && sectorNumbers.includes(n)).length;
        const totalHits = recentSpins.filter(n => groupNums.includes(n)).length;
        const percentage = totalHits > 0 ? (hits / totalHits) * 100 : 0;

        return {
          ...sector,
          hits,
          percentage,
          status: percentage > 35 ? 'HOT' : percentage < 15 ? 'COLD' : 'NORM'
        };
      });
    });
  }, [spins, groupNumbers, names]);

  // Calculate hit counts for vertical bars
  const hitCounts = useMemo(() => {
    const recentSpins = spins.slice(0, 36);
    return groupNumbers.map(nums => recentSpins.filter(n => nums.includes(n)).length);
  }, [spins, groupNumbers]);

  const maxHits = Math.max(...hitCounts, 1);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'HOT': return '🔥';
      case 'COLD': return '❄️';
      case 'WATCH': return '👁️';
      default: return '😐';
    }
  };

  const getVolatilityIcon = (level: string) => {
    switch (level) {
      case 'STABLE': return '🟢';
      case 'MODERATE': return '🟡';
      case 'VOLATILE': return '🔴';
      default: return '😐';
    }
  };

  // Detect momentum
  const getMomentumSignal = (groupIdx: number) => {
    const windows = windowAnalysis[groupIdx];
    const last4 = windows[0].hitRate;
    const last36 = windows[3].hitRate;
    const diff = last4 - last36;

    if (diff > 15) return { text: 'ACCELERATING', icon: '🚀', color: 'text-green-400' };
    if (diff < -15) return { text: 'COOLING OFF', icon: '❄️', color: 'text-blue-400' };
    return { text: 'STABLE', icon: '➡️', color: 'text-gray-400' };
  };

  // Standard wheel groups
  const VOISINS = [0, 2, 3, 4, 7, 12, 15, 18, 19, 21, 22, 25, 26, 28, 29, 32, 35];
  const ORPHELINS = [1, 6, 9, 14, 17, 20, 31, 34];
  const TIERS = [5, 8, 10, 11, 13, 16, 23, 24, 27, 30, 33, 36];

  // Calculate recent numbers info
  // Get last 18 spins with newest first (top row is most recent)
  // Since spins array is newest-first, just take first 18
  const recentNumbers = spins.slice(0, 18);
  const recentNumbersInfo = recentNumbers.map(num => {
    // Find wheel position
    const wheelPosition = WHEEL_ORDER.indexOf(num);

    // Determine sector (divide wheel into 4 equal sectors of ~9 positions each)
    let sector = '-';
    if (wheelPosition >= 0 && wheelPosition <= 9) sector = '1';
    else if (wheelPosition >= 10 && wheelPosition <= 18) sector = '2';
    else if (wheelPosition >= 19 && wheelPosition <= 27) sector = '3';
    else if (wheelPosition >= 28 && wheelPosition <= 36) sector = '4';

    // Determine standard wheel group
    let wheelGroup = '-';
    if (VOISINS.includes(num)) wheelGroup = 'Voisins';
    else if (ORPHELINS.includes(num)) wheelGroup = 'Orphelins';
    else if (TIERS.includes(num)) wheelGroup = 'Tiers';

    // Find betting group for color coding
    const groupIdx = groupNumbers.findIndex(group => group.includes(num));

    return {
      number: num,
      wheelGroup,
      position: wheelPosition >= 0 ? wheelPosition : '-',
      sector,
      colorGroupIdx: groupIdx,
      groupName: groupIdx >= 0 ? names[groupIdx] : null,
      groupNumber: groupIdx >= 0 ? groupIdx + 1 : '-' // Group number: 1, 2, 3, etc.
    };
  });

  // Generate alerts based on current card data
  const cardAlerts = useMemo(() => {
    const alerts: string[] = [];

    groups.forEach((group, idx) => {
      // Streak alerts (3 or more)
      if (group.streak >= 5) {
        alerts.push(`🔥 ${names[idx]} on FIRE with ${group.streak}-spin streak!`);
      } else if (group.streak >= 3) {
        alerts.push(`⚡ ${names[idx]} heating up: ${group.streak} consecutive hits`);
      }

      // Absence alerts (3 or more)
      if (group.absence >= 7) {
        alerts.push(`❄️ ${names[idx]} missing for ${group.absence} spins - watch for return`);
      } else if (group.absence >= 5) {
        alerts.push(`⚠️ ${names[idx]} absent ${group.absence} spins - building potential`);
      } else if (group.absence >= 3) {
        alerts.push(`👁️ ${names[idx]} cooling off: ${group.absence} spins without hit`);
      }

      // Leader alert
      if (leader === idx && scores[idx] >= 75) {
        alerts.push(`🏆 ${names[idx]} dominating with ${scores[idx]} score`);
      }

      // Z-Score extreme alerts
      if (group.zScore >= 2.0) {
        alerts.push(`📊 ${names[idx]} significantly HOT (Z: +${group.zScore.toFixed(1)}σ)`);
      } else if (group.zScore <= -2.0) {
        alerts.push(`📉 ${names[idx]} significantly COLD (Z: ${group.zScore.toFixed(1)}σ)`);
      }
    });

    // No alerts fallback
    if (alerts.length === 0) {
      alerts.push('📊 All groups performing within normal ranges');
    }

    return alerts.slice(0, 3); // Show max 3 alerts
  }, [groups, badges, names, leader, scores]);

  // Create ID from title for anchor navigation
  const cardId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return (
    <div id={cardId} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700/50 p-3 shadow-lg scroll-mt-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <div className="text-xs text-gray-400">{payout}</div>
      </div>

      {/* Main Stats Table */}
      <div className="mb-3 overflow-x-auto">
        <table className="w-full text-[9px] border-collapse" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-1 px-0.5 text-gray-300 font-semibold">Group</th>
              <th colSpan={2} className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Streak</th>
              <th colSpan={2} className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Absence</th>
              <th className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Last Seen</th>
              <th colSpan={4} className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Hit Count</th>
              <th colSpan={2} className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Percentage</th>
              <th className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Dev</th>
              <th className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Status</th>
            </tr>
            <tr className="border-b border-gray-700">
              <th className="py-0.5 px-0.5"></th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal border-l border-gray-700">Now</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">Max</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal border-l border-gray-700">Now</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">Max</th>
              <th className="text-center py-0.5 px-0.5 border-l border-gray-700"></th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal border-l border-gray-700">L9</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">L18</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">L27</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">L36</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal border-l border-gray-700">Act%</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">Exp%</th>
              <th className="text-center py-0.5 px-0.5 border-l border-gray-700"></th>
              <th className="text-center py-0.5 px-0.5 border-l border-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {names.map((name, idx) => {
              const group = groups[idx];
              const windows = windowAnalysis[idx];
              const isLeader = leader === idx;

              // Calculate current streak and absence (from most recent spin)
              const recentSpins36 = spins.slice(0, 36);

              // Current streak: count from position 0 until we hit a miss
              let currentStreak = 0;
              for (let i = 0; i < recentSpins36.length; i++) {
                if (groupNumbers[idx].includes(recentSpins36[i])) {
                  currentStreak++;
                } else {
                  break; // Stop at first miss
                }
              }

              // Current absence: count from position 0 until we hit a match
              let currentAbsence = 0;
              for (let i = 0; i < recentSpins36.length; i++) {
                if (groupNumbers[idx].includes(recentSpins36[i])) {
                  break; // Stop at first hit
                } else {
                  currentAbsence++;
                }
              }

              // Max streak and absence: scan through all spins
              let maxStreak = currentStreak;
              let maxAbsence = currentAbsence;
              let tempStreak = 0;
              let tempAbsence = 0;

              recentSpins36.forEach(spin => {
                if (groupNumbers[idx].includes(spin)) {
                  tempStreak++;
                  maxStreak = Math.max(maxStreak, tempStreak);
                  tempAbsence = 0;
                } else {
                  tempAbsence++;
                  maxAbsence = Math.max(maxAbsence, tempAbsence);
                  tempStreak = 0;
                }
              });

              // Find last seen (search from most recent)
              const lastSeenIdx = spins.findIndex(n => groupNumbers[idx].includes(n));
              const lastSeen = lastSeenIdx >= 0 ? lastSeenIdx : '-';

              // Calculate hit counts for L9, L18, L27, L36 (newest spins)
              const l9 = spins.slice(0, 9).filter(n => groupNumbers[idx].includes(n)).length;
              const l18 = spins.slice(0, 18).filter(n => groupNumbers[idx].includes(n)).length;
              const l27 = spins.slice(0, 27).filter(n => groupNumbers[idx].includes(n)).length;
              const l36 = hitCounts[idx];

              // Calculate percentages
              const actPercent = (l36 / 36) * 100;
              const expPercent = (groupNumbers[idx].length / 37) * 100;
              const deviation = actPercent - expPercent;

              const groupNumbersStr = groupNumbers[idx].sort((a, b) => a - b).join(', ');

              return (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-1 px-0.5 font-semibold" style={{ color: colors[idx] }}>
                    <span className="cursor-pointer underline decoration-dotted" title={`Numbers: ${groupNumbersStr}`}>
                      {name}
                    </span> {isLeader && '🏆'}
                  </td>
                  <td className={`text-center py-1 px-0.5 border-l border-gray-800 font-bold ${group.streak > 3 ? 'animate-pulse text-yellow-400' : 'text-gray-200'}`}>
                    {group.streak}
                  </td>
                  <td className="text-center py-1 px-0.5 text-gray-200">{maxStreak}</td>
                  <td className={`text-center py-1 px-0.5 border-l border-gray-800 font-bold ${group.absence > 3 ? 'animate-pulse text-orange-400' : 'text-gray-200'}`}>
                    {group.absence}
                  </td>
                  <td className="text-center py-1 px-0.5 text-gray-200">{maxAbsence}</td>
                  <td className="text-center py-1 px-0.5 border-l border-gray-800 text-gray-200">{lastSeen}</td>
                  <td className="text-center py-1 px-0.5 border-l border-gray-800 text-gray-200">{l9}</td>
                  <td className="text-center py-1 px-0.5 text-gray-200">{l18}</td>
                  <td className="text-center py-1 px-0.5 text-gray-200">{l27}</td>
                  <td className="text-center py-1 px-0.5 text-gray-200">{l36}</td>
                  <td className="text-center py-1 px-0.5 border-l border-gray-800 text-gray-200">{actPercent.toFixed(1)}</td>
                  <td className="text-center py-1 px-0.5 text-gray-200">{expPercent.toFixed(1)}</td>
                  <td className={`text-center py-1 px-0.5 border-l border-gray-800 font-semibold ${deviation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-0.5 border-l border-gray-800 text-gray-200">
                    <span className="text-xs">{badges[idx]}</span>
                  </td>
                </tr>
              );
            })}

            {/* Z-Score Row */}
            <tr className="border-b border-gray-800 bg-gray-800/30">
              <td className="py-1 px-0.5 font-semibold text-gray-300">Z-Score</td>
              {names.map((name, idx) => (
                <td key={idx} colSpan={13} className={`text-center py-1 px-0.5 font-semibold ${groups[idx].zScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {name}: {groups[idx].zScore > 0 ? '+' : ''}{groups[idx].zScore.toFixed(2)}σ
                </td>
              ))}
            </tr>

            {/* ROI Row */}
            <tr className="border-b border-gray-800 bg-gray-800/30">
              <td className="py-1 px-0.5 font-semibold text-gray-300">ROI</td>
              {names.map((name, idx) => (
                <td key={idx} colSpan={13} className={`text-center py-1 px-0.5 font-semibold ${groups[idx].roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {name}: {groups[idx].roi > 0 ? '+' : ''}{groups[idx].roi}u
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Alert Bar */}
      {cardAlerts.length > 0 && (
        <div className="mb-3 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-l-4 border-yellow-500 rounded-r-lg p-2">
          <div className="flex items-start gap-2">
            <div className="text-yellow-400 text-sm mt-0.5">⚡</div>
            <div className="flex-1 space-y-1">
              {cardAlerts.map((alert, idx) => (
                <div key={idx} className="text-xs text-yellow-100 font-medium">
                  {alert}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Numbers Table */}
      <div className="overflow-x-auto">
        <div className="text-xs font-semibold text-gray-400 mb-2">RECENT NUMBERS (Last 18)</div>
        <table className="w-full text-[9px] border-collapse" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-center py-1 px-0.5 text-gray-300 font-semibold">Number</th>
              <th className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Group</th>
              <th colSpan={3} className="text-center py-1 px-0.5 text-gray-300 font-semibold border-l border-gray-700">Wheel</th>
            </tr>
            <tr className="border-b border-gray-700">
              <th className="py-0.5 px-0.5"></th>
              <th className="py-0.5 px-0.5 border-l border-gray-700"></th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal border-l border-gray-700">Sector</th>
              <th className="text-center py-0.5 px-0.5 text-gray-400 font-normal">Position</th>
              <th className="text-left py-0.5 px-0.5 text-gray-400 font-normal">Group</th>
            </tr>
          </thead>
          <tbody>
            {recentNumbersInfo.map((info, idx) => {
              const groupColor = info.colorGroupIdx >= 0 ? colors[info.colorGroupIdx] : '#888';
              // Highlight most recent spin (first row)
              const isLatest = idx === 0;

              return (
                <tr key={idx} className={`border-b border-gray-800 ${isLatest ? 'bg-yellow-500/10' : ''}`}>
                  <td className="text-center py-1 px-0.5">
                    <div
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-white text-xs ${isLatest ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                      style={{ backgroundColor: groupColor }}
                      title={info.groupName || 'No group'}
                    >
                      {info.number}
                    </div>
                  </td>
                  <td
                    className="text-center py-1 px-0.5 border-l border-gray-800 font-bold text-sm"
                    style={{ color: groupColor }}
                  >
                    {info.groupNumber}
                  </td>
                  <td className="text-center py-1 px-0.5 border-l border-gray-800 text-gray-200">
                    {info.sector}
                  </td>
                  <td className="text-center py-1 px-0.5 text-gray-200">
                    {info.position}
                  </td>
                  <td className="text-left py-1 px-0.5 text-gray-200">
                    {info.wheelGroup}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
