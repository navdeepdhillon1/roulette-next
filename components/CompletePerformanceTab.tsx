import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Flame, Snowflake, Target, BarChart3, Brain, Shield, AlertTriangle, Award, DollarSign } from 'lucide-react';

interface Props {
  session: any;
}

// Style Analyzer Function
const analyzePlayerStyle = (bets: any[]) => {
  if (bets.length === 0) return null;

  const totalBets = bets.length;
  const avgBetSize = bets.reduce((sum, b) => sum + (b.betAmount || 0), 0) / totalBets;
  const totalWagered = bets.reduce((sum, b) => sum + (b.betAmount || 0), 0);
  const totalProfit = bets.reduce((sum, b) => sum + (b.totalPnL || 0), 0);
  
  // Group frequency analysis
  const groupFreq: Record<string, number> = {};
  const groupProfit: Record<string, number> = {};
  
  bets.forEach(bet => {
    if (bet.bets && typeof bet.bets === 'object') {
      Object.keys(bet.bets).forEach(group => {
        groupFreq[group] = (groupFreq[group] || 0) + 1;
        const groupPnL = bet.results?.[group] || 0;
        groupProfit[group] = (groupProfit[group] || 0) + groupPnL;
      });
    }
  });

  // Calculate metrics
  const avgGroupsPerBet = bets.reduce((sum, b) => {
    return sum + (b.bets ? Object.keys(b.bets).length : 0);
  }, 0) / totalBets;
  
  const winRate = (bets.filter(b => (b.totalPnL || 0) > 0).length / totalBets) * 100;
  const riskScore = Math.min(100, (avgBetSize / 50) * 100);
  
  // Determine betting style
  let primaryStyle = '';
  let secondaryStyle = '';
  
  if (avgGroupsPerBet >= 3) {
    primaryStyle = 'Diversified Coverage';
    secondaryStyle = 'You spread risk across multiple groups';
  } else if (avgGroupsPerBet <= 1.5) {
    primaryStyle = 'Focused Sniper';
    secondaryStyle = 'You concentrate on specific groups';
  } else {
    primaryStyle = 'Balanced Approach';
    secondaryStyle = 'You mix focused and spread betting';
  }
  
  // Risk profile
  let riskProfile = '';
  if (riskScore < 30) riskProfile = 'Conservative';
  else if (riskScore < 50) riskProfile = 'Moderate';
  else if (riskScore < 70) riskProfile = 'Aggressive';
  else riskProfile = 'High Roller';
  
  // Consistency check
  const betVariance = bets.reduce((sum, b) => sum + Math.pow((b.betAmount || 0) - avgBetSize, 2), 0) / totalBets;
  const consistency = Math.max(0, 100 - Math.sqrt(betVariance) * 2);
  
  // Red flags
  const redFlags: string[] = [];
  const lastFiveBets = bets.slice(-5);
  const increasingBets = lastFiveBets.every((b, i) => i === 0 || (b.betAmount || 0) >= (lastFiveBets[i-1].betAmount || 0));
  if (increasingBets && lastFiveBets.length === 5) {
    redFlags.push('⚠️ Escalating bet sizes detected - possible loss chasing');
  }
  if (riskScore > 80) {
    redFlags.push('🚨 Very high risk profile - consider reducing bet sizes');
  }
  
  // Top groups
  const topGroups = Object.entries(groupFreq)
  .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
    .slice(0, 5)
    .map(([group, count]) => ({
      group,
      frequency: count,
      percentage: (count / totalBets) * 100,
      profit: groupProfit[group] || 0
    }));

  return {
    primaryStyle,
    secondaryStyle,
    riskProfile,
    riskScore: Math.round(riskScore),
    consistency: Math.round(consistency),
    avgGroupsPerBet: avgGroupsPerBet.toFixed(1),
    winRate: winRate.toFixed(1),
    totalWagered,
    totalProfit,
    roi: totalWagered > 0 ? ((totalProfit / totalWagered) * 100).toFixed(1) : '0.0',
    topGroups,
    redFlags
  };
};

export default function CompletePerformanceTab({ session }: Props) {
  const [activeSection, setActiveSection] = useState<'overview' | 'style' | 'visualizations'>('overview');
  const [vizView, setVizView] = useState<'evolution' | 'heatmap' | 'profitability' | 'patterns'>('evolution');
  
  // Get all bets from all cards
  const allBets = useMemo(() => 
    session.cards?.flatMap((card: any) => card.bets || []) || []
  , [session.cards]);
  
  const analysis = useMemo(() => analyzePlayerStyle(allBets), [allBets]);
  
  // Cumulative P/L for profit line
  const cumulativePnL = useMemo(() => {
    let running = 0;
    return allBets.map((bet: any, idx: number) => {
      running += bet.totalPnL || 0;
      return { bet: idx + 1, total: running };
    });
  }, [allBets]);

  // Group frequency
  const groupFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    allBets.forEach((bet: any) => {
      if (bet.bets && typeof bet.bets === 'object') {
        Object.keys(bet.bets).forEach(key => {
          freq[key] = (freq[key] || 0) + 1;
        });
      }
    });
    return Object.entries(freq).sort(([, a], [, b]) => b - a);
  }, [allBets]);

  // Risk over time
  const riskOverTime = useMemo(() => {
    const window = 10;
    const risks: number[] = [];
    for (let i = 0; i < allBets.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowBets = allBets.slice(start, i + 1);
      const avgBet = windowBets.reduce((sum: number, b: any) => sum + (b.betAmount || 0), 0) / windowBets.length;
      risks.push(avgBet);
    }
    return risks;
  }, [allBets]);

  // Win streaks
  const streaks = useMemo(() => {
    const result: Array<{ start: number; length: number; type: 'win' | 'loss' }> = [];
    if (allBets.length === 0) return result;
    
    let current = { 
      start: 1, 
      length: 0, 
      type: ((allBets[0]?.totalPnL || 0) > 0 ? 'win' : 'loss') as 'win' | 'loss'
    };
    
    allBets.forEach((bet: any, i: number) => {
      const isWin = (bet.totalPnL || 0) > 0;
      const currentType = isWin ? 'win' : 'loss';
      
      if (currentType === current.type) {
        current.length++;
      } else {
        if (current.length > 2) result.push({ ...current });
        current = { start: i + 1, length: 1, type: currentType };
      }
    });
    
    if (current.length > 2) result.push({ ...current });
    return result;
  }, [allBets]);

  if (!analysis) {
    return (
      <div className="text-white p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
        <p className="text-gray-400">Place some bets to see your analytics!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Section Navigation */}
      <div className="bg-gray-800/50 rounded-xl p-2 flex gap-2">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all ${
            activeSection === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          📈 Overview
        </button>
        <button
          onClick={() => setActiveSection('style')}
          className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all ${
            activeSection === 'style'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          🧠 Style Analysis
        </button>
        <button
          onClick={() => setActiveSection('visualizations')}
          className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all ${
            activeSection === 'visualizations'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          📊 Advanced Charts
        </button>
      </div>

      {/* COMPONENT 1: Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl border border-blue-500/30 p-6">
              <div className="text-blue-400 text-sm mb-2">Total Bets</div>
              <div className="text-3xl font-bold text-white">{allBets.length}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl border border-green-500/30 p-6">
              <div className="text-green-400 text-sm mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-white">{analysis.winRate}%</div>
            </div>
            
            <div className={`bg-gradient-to-br ${
              parseFloat(analysis.roi) >= 0 
                ? 'from-emerald-900/50 to-emerald-800/30 border-emerald-500/30' 
                : 'from-red-900/50 to-red-800/30 border-red-500/30'
            } rounded-xl border p-6`}>
              <div className={`${parseFloat(analysis.roi) >= 0 ? 'text-emerald-400' : 'text-red-400'} text-sm mb-2`}>
                ROI
              </div>
              <div className="text-3xl font-bold text-white">
                {parseFloat(analysis.roi) >= 0 ? '+' : ''}{analysis.roi}%
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl border border-purple-500/30 p-6">
              <div className="text-purple-400 text-sm mb-2">Total Profit</div>
              <div className={`text-3xl font-bold ${analysis.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analysis.totalProfit >= 0 ? '+' : ''}${analysis.totalProfit.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <div className="text-gray-400 text-sm mb-1">Avg Bet Size</div>
              <div className="text-xl font-bold text-white">
                ${allBets.length > 0 ? (analysis.totalWagered / allBets.length).toFixed(0) : '0'}
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <div className="text-gray-400 text-sm mb-1">Total Wagered</div>
              <div className="text-xl font-bold text-white">
                ${analysis.totalWagered.toFixed(0)}
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <div className="text-gray-400 text-sm mb-1">Avg Groups/Bet</div>
              <div className="text-xl font-bold text-white">
                {analysis.avgGroupsPerBet}
              </div>
            </div>
          </div>

          {/* Top Groups Performance */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Top Betting Groups</h2>
            <div className="space-y-3">
              {analysis.topGroups.map((group, idx) => (
                <div key={group.group} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-cyan-400">#{idx + 1}</div>
                    <div>
                      <div className="font-bold text-white text-lg">{group.group}</div>
                      <div className="text-sm text-gray-400">
                        {group.frequency} bets • {group.percentage.toFixed(0)}% frequency
                      </div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${group.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {group.profit >= 0 ? '+' : ''}${group.profit.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPONENT 2: Style Analysis */}
      {activeSection === 'style' && (
        <div className="space-y-6">
          
          {/* Betting Profile Card */}
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/30 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Brain className="text-purple-400" size={32} />
                  Your Betting Profile
                </h2>
                <p className="text-gray-300">AI-powered analysis of your playing style</p>
              </div>
              <div className="bg-purple-500/20 rounded-lg px-4 py-2">
                <div className="text-sm text-purple-300">Based on {allBets.length} bets</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-6">
                <div className="text-purple-400 text-sm mb-2">Primary Style</div>
                <div className="text-2xl font-bold text-white mb-2">{analysis.primaryStyle}</div>
                <div className="text-gray-400 text-sm">{analysis.secondaryStyle}</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-6">
                <div className="text-orange-400 text-sm mb-2">Risk Profile</div>
                <div className="text-2xl font-bold text-white mb-2">{analysis.riskProfile}</div>
                <div className="text-gray-400 text-sm">Risk Score: {analysis.riskScore}/100</div>
              </div>
            </div>

            {/* Consistency Meter */}
            <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-cyan-400 text-sm">Betting Consistency</div>
                <div className="text-xl font-bold text-white">{analysis.consistency}/100</div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all"
                  style={{ width: `${analysis.consistency}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {analysis.consistency >= 70 ? 'Highly disciplined' : 
                 analysis.consistency >= 50 ? 'Moderately consistent' : 
                 'Erratic betting patterns'}
              </div>
            </div>

            {/* Red Flags */}
            {analysis.redFlags.length > 0 && (
              <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle size={24} />
                  Warning Signals Detected
                </h3>
                <div className="space-y-2">
                  {analysis.redFlags.map((flag, idx) => (
                    <div key={idx} className="text-gray-200 text-sm bg-red-950/50 rounded p-3">
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Behavioral Insights */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🎭 Behavioral Insights</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-900/30 border-l-4 border-blue-500 rounded-lg p-4">
                <h3 className="font-bold text-blue-300 mb-2">📊 Coverage Strategy</h3>
                <p className="text-sm text-gray-300">
                  You average {analysis.avgGroupsPerBet} betting groups per spin, showing a {
                    parseFloat(analysis.avgGroupsPerBet) >= 3 ? 'diversified' : 
                    parseFloat(analysis.avgGroupsPerBet) <= 1.5 ? 'focused' : 'balanced'
                  } approach to risk management.
                </p>
              </div>

              <div className="bg-green-900/30 border-l-4 border-green-500 rounded-lg p-4">
                <h3 className="font-bold text-green-300 mb-2">💰 Profitability</h3>
                <p className="text-sm text-gray-300">
                  Your ROI of {analysis.roi}% indicates {
                    parseFloat(analysis.roi) >= 10 ? 'strong performance' :
                    parseFloat(analysis.roi) >= 0 ? 'positive results' :
                    parseFloat(analysis.roi) >= -10 ? 'slight losses' :
                    'significant losses'
                  } over your session. {
                    parseFloat(analysis.roi) < 0 ? 'Consider adjusting your strategy.' : 'Keep up the good work!'
                  }
                </p>
              </div>

              <div className="bg-purple-900/30 border-l-4 border-purple-500 rounded-lg p-4">
                <h3 className="font-bold text-purple-300 mb-2">🎯 Group Preferences</h3>
                <p className="text-sm text-gray-300">
                  Your most profitable group is <span className="font-bold text-purple-200">
                    {analysis.topGroups[0]?.group || 'N/A'}
                  </span> with ${analysis.topGroups[0]?.profit.toFixed(0) || '0'} profit across {analysis.topGroups[0]?.frequency || 0} bets.
                </p>
              </div>

              <div className={`${
                analysis.riskScore >= 70 ? 'bg-red-900/30 border-red-500' : 
                analysis.riskScore >= 50 ? 'bg-yellow-900/30 border-yellow-500' : 
                'bg-green-900/30 border-green-500'
              } border-l-4 rounded-lg p-4`}>
                <h3 className={`font-bold mb-2 ${
                  analysis.riskScore >= 70 ? 'text-red-300' : 
                  analysis.riskScore >= 50 ? 'text-yellow-300' : 
                  'text-green-300'
                }`}>
                  🛡️ Risk Management
                </h3>
                <p className="text-sm text-gray-300">
                  Your {analysis.riskProfile.toLowerCase()} risk profile (score: {analysis.riskScore}/100) suggests {
                    analysis.riskScore >= 70 ? 'high exposure. Consider reducing bet sizes to protect your bankroll.' :
                    analysis.riskScore >= 50 ? 'moderate risk. You balance ambition with caution.' :
                    'conservative play. You prioritize bankroll preservation over aggressive gains.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENT 3: Advanced Visualizations */}
      {activeSection === 'visualizations' && (
        <div className="space-y-6">
          
          {/* Viz Sub-Navigation */}
          <div className="bg-gray-800/50 rounded-xl p-2 flex gap-2">
            <button
              onClick={() => setVizView('evolution')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                vizView === 'evolution'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              📈 Evolution
            </button>
            <button
              onClick={() => setVizView('heatmap')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                vizView === 'heatmap'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              🔥 Heatmap
            </button>
            <button
              onClick={() => setVizView('profitability')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                vizView === 'profitability'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              💰 P/L Timeline
            </button>
            <button
              onClick={() => setVizView('patterns')}
              className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                vizView === 'patterns'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              🎯 Patterns
            </button>
          </div>

          {/* Evolution View */}
          {vizView === 'evolution' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" />
                  Risk Evolution Over Time
                </h2>
                
                <div className="relative h-64 bg-gray-900/50 rounded-lg p-4">
                  {riskOverTime.length > 0 ? (
                    <svg width="100%" height="100%" className="overflow-visible">
                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={`${100 - y}%`}
                          x2="100%"
                          y2={`${100 - y}%`}
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="1"
                        />
                      ))}
                      
                      <polyline
                        points={riskOverTime.map((risk: number, i: number) =>
                          `${(i / (riskOverTime.length - 1)) * 100},${100 - (risk * 1.5)}`
                        ).join(' ')}
                        fill="none"
                        stroke="url(#riskGradient)"
                        strokeWidth="3"
                      />
                      
                      <defs>
                        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No data yet - place more bets!
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 text-xs text-gray-400">High Risk</div>
                  <div className="absolute bottom-2 left-2 text-xs text-gray-400">Low Risk</div>
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">Bet #{allBets.length}</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">🎲 Streak Analysis</h2>
                
                <div className="relative h-24 bg-gray-900/50 rounded-lg">
                {streaks.length > 0 ? streaks.map((streak: any, i: number) => {
                    const left = ((streak.start - 1) / allBets.length) * 100;
                    const width = (streak.length / allBets.length) * 100;
                    
                    return (
                      <div
                        key={i}
                        className={`absolute top-1/2 -translate-y-1/2 h-12 rounded ${
                          streak.type === 'win' ? 'bg-green-500' : 'bg-red-500'
                        } flex items-center justify-center text-xs font-bold text-white hover:scale-105 transition-transform cursor-pointer`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${streak.type === 'win' ? 'Win' : 'Loss'} streak: ${streak.length} spins`}
                      >
                        {streak.length}
                      </div>
                    );
                  }) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No significant streaks detected
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Win Streaks (3+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Loss Streaks (3+)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Heatmap View */}
          {vizView === 'heatmap' && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="text-orange-400" />
                Group Frequency Heatmap
              </h2>
              
              {groupFrequency.length > 0 ? (
                <div className="grid grid-cols-6 gap-3">
                  {groupFrequency.map(([group, freq], idx) => {
                    const intensity = freq / groupFrequency[0][1];
                    const color = intensity > 0.7 ? 'from-red-600 to-orange-500' :
                                  intensity > 0.4 ? 'from-orange-500 to-yellow-500' :
                                  'from-yellow-500 to-green-500';
                    
                    return (
                      <div
                        key={group}
                        className={`bg-gradient-to-br ${color} rounded-xl p-4 text-center transform hover:scale-105 transition-all cursor-pointer shadow-lg`}
                        style={{ opacity: 0.3 + (intensity * 0.7) }}
                      >
                        <div className="text-xs text-white/80 mb-1">#{idx + 1}</div>
                        <div className="text-lg font-bold text-white mb-1">{group}</div>
                        <div className="text-sm text-white/90">{freq}×</div>
                        <div className="text-xs text-white/70 mt-1">
                          {((freq / allBets.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  No betting groups data yet
                </div>
              )}
            </div>
          )}

          {/* Profitability View */}
          {vizView === 'profitability' && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-400" />
                Cumulative P/L Timeline
              </h2>
              
              <div className="relative h-96 bg-gray-900/50 rounded-lg p-4">
                {cumulativePnL.length > 0 ? (
                  <svg width="100%" height="100%" className="overflow-visible">
                    <line
                      x1="0"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    
                    <polyline
                      points={cumulativePnL.map((point: any, i: number) => {
                        const x = (i / (cumulativePnL.length - 1)) * 100;
                        const y = 50 - (point.total / 200);
                        return `${x},${Math.max(0, Math.min(100, y))}`;
                      }).join(' ')}
                      fill="none"
                      stroke="url(#profitGradient)"
                      strokeWidth="3"
                    />
                    
                    <defs>
                      <linearGradient id="profitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No P/L data yet
                  </div>
                )}
                
                <div className="absolute top-2 left-2 text-xs text-green-400">+Profit</div>
                <div className="absolute bottom-2 left-2 text-xs text-red-400">-Loss</div>
                <div className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-gray-400">$0</div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="bg-green-900/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-green-400 mb-1">Peak Profit</div>
                  <div className="text-2xl font-bold text-green-300">
                  +${Math.max(...cumulativePnL.map((p: any) => p.total), 0).toFixed(0)}
                  </div>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-red-400 mb-1">Max Drawdown</div>
                  <div className="text-2xl font-bold text-red-300">
                  ${Math.min(...cumulativePnL.map((p: any) => p.total), 0).toFixed(0)}
                  </div>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-400 mb-1">Current P/L</div>
                  <div className={`text-2xl font-bold ${
                    cumulativePnL[cumulativePnL.length - 1]?.total >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {cumulativePnL[cumulativePnL.length - 1]?.total >= 0 ? '+' : ''}
                    ${cumulativePnL[cumulativePnL.length - 1]?.total.toFixed(0) || '0'}
                  </div>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-purple-400 mb-1">Volatility</div>
                  <div className="text-2xl font-bold text-purple-300">
  {(() => {
    const values = cumulativePnL.map((p: any) => p.total);
    if (values.length === 0) return '0';
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return String(Math.sqrt(variance).toFixed(0));
  })()}
</div>
                </div>
              </div>
            </div>
          )}

          {/* Patterns View */}
          {vizView === 'patterns' && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="text-purple-400" />
                Detected Patterns
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-900/30 border-l-4 border-blue-500 rounded-lg p-4">
                  <h3 className="font-bold text-blue-300 mb-2">✓ Betting Behavior</h3>
                  <p className="text-sm text-gray-300">
                    Your {analysis.primaryStyle.toLowerCase()} strategy shows {
                      analysis.consistency >= 70 ? 'high discipline' : 'room for improvement'
                    }.
                  </p>
                </div>

                <div className="bg-green-900/30 border-l-4 border-green-500 rounded-lg p-4">
                  <h3 className="font-bold text-green-300 mb-2">✓ Group Preference</h3>
                  <p className="text-sm text-gray-300">
                    You favor {analysis.topGroups[0]?.group || 'various groups'}, betting on it {analysis.topGroups[0]?.frequency || 0} times ({analysis.topGroups[0]?.percentage.toFixed(0) || '0'}% of spins).
                  </p>
                </div>

                <div className="bg-purple-900/30 border-l-4 border-purple-500 rounded-lg p-4">
                  <h3 className="font-bold text-purple-300 mb-2">✓ Risk Tolerance</h3>
                  <p className="text-sm text-gray-300">
                    Your {analysis.riskProfile.toLowerCase()} risk profile (score: {analysis.riskScore}/100) indicates {
                      analysis.riskScore >= 70 ? 'aggressive play with potential for high variance' :
                      analysis.riskScore >= 50 ? 'balanced risk-reward approach' :
                      'conservative bankroll management'
                    }.
                  </p>
                </div>

                {parseFloat(analysis.roi) < -10 && (
                  <div className="bg-yellow-900/30 border-l-4 border-yellow-500 rounded-lg p-4">
                    <h3 className="font-bold text-yellow-300 mb-2">⚠️ Performance Alert</h3>
                    <p className="text-sm text-gray-300">
                      Current ROI of {analysis.roi}% suggests strategy adjustment needed. Consider reviewing your group selection or bet sizing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}