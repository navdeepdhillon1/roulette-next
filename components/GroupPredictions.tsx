// GroupPredictions.tsx - Improved version
import React, { useState, useEffect } from 'react';
import { calculateConvergence, type ConvergenceResult } from '../lib/convergenceEngine';

interface GroupScore {
  name: string;
  type: 'binary' | 'dozen' | 'column' | 'six' | 'thirds' | 'splits';
  numbers: number[];
  score: number;
  hitRate: number;
  recentHits: number;
  expectedHits: number;
  deviation: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  trend: 'rising' | 'falling' | 'stable';
}

interface GroupPredictionsProps {
  history: number[];
}

const GroupPredictions: React.FC<GroupPredictionsProps> = ({ history }) => {
  const [topGroups, setTopGroups] = useState<GroupScore[]>([]);
  
  // COMPREHENSIVE Group definitions - ALL possible betting groups
  const ALL_BETTING_GROUPS = {
    // Binary groups (18 numbers each)
    'Red': { 
      type: 'binary' as const, 
      numbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
    },
    'Black': { 
      type: 'binary' as const, 
      numbers: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]
    },
    'Even': { 
      type: 'binary' as const, 
      numbers: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]
    },
    'Odd': { 
      type: 'binary' as const, 
      numbers: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]
    },
    'Low': { 
      type: 'binary' as const, 
      numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]
    },
    'High': { 
      type: 'binary' as const, 
      numbers: [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]
    },
    
    // Dozen groups (12 numbers each)
    'Dozen 1': { 
      type: 'dozen' as const, 
      numbers: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    'Dozen 2': { 
      type: 'dozen' as const, 
      numbers: [13,14,15,16,17,18,19,20,21,22,23,24]
    },
    'Dozen 3': { 
      type: 'dozen' as const, 
      numbers: [25,26,27,28,29,30,31,32,33,34,35,36]
    },
    
    // Column groups (12 numbers each)
    'Column 1': { 
      type: 'column' as const, 
      numbers: [1,4,7,10,13,16,19,22,25,28,31,34]
    },
    'Column 2': { 
      type: 'column' as const, 
      numbers: [2,5,8,11,14,17,20,23,26,29,32,35]
    },
    'Column 3': { 
      type: 'column' as const, 
      numbers: [3,6,9,12,15,18,21,24,27,30,33,36]
    },
    
    // Six-line groups (6 numbers each)
    '1-6': { 
      type: 'six' as const, 
      numbers: [1,2,3,4,5,6]
    },
    '7-12': { 
      type: 'six' as const, 
      numbers: [7,8,9,10,11,12]
    },
    '13-18': { 
      type: 'six' as const, 
      numbers: [13,14,15,16,17,18]
    },
    '19-24': { 
      type: 'six' as const, 
      numbers: [19,20,21,22,23,24]
    },
    '25-30': { 
      type: 'six' as const, 
      numbers: [25,26,27,28,29,30]
    },
    '31-36': { 
      type: 'six' as const, 
      numbers: [31,32,33,34,35,36]
    },
    
    // Third sections (12 numbers each)
    'First Third': {
      type: 'thirds' as const,
      numbers: [3,6,9,12,15,18,21,24,27,30,33,36]  // All numbers divisible by 3
    },
    'Second Third': {
      type: 'thirds' as const,
      numbers: [2,5,8,11,14,17,20,23,26,29,32,35]  // All numbers that give remainder 2 when divided by 3
    },
    'Third Third': {
      type: 'thirds' as const,
      numbers: [1,4,7,10,13,16,19,22,25,28,31,34]  // All numbers that give remainder 1 when divided by 3
    },
    
    // Split groups (9 numbers each)
    'Split 1-18 Odd': {
      type: 'splits' as const,
      numbers: [1,3,5,7,9,11,13,15,17]
    },
    'Split 1-18 Even': {
      type: 'splits' as const,
      numbers: [2,4,6,8,10,12,14,16,18]
    },
    'Split 19-36 Odd': {
      type: 'splits' as const,
      numbers: [19,21,23,25,27,29,31,33,35]
    },
    'Split 19-36 Even': {
      type: 'splits' as const,
      numbers: [20,22,24,26,28,30,32,34,36]
    }
  };
  
  useEffect(() => {
    if (!history || history.length < 10) {
      setTopGroups([]);
      return;
    }
    
    try {
      // Get convergence analysis
      const convergenceResult = calculateConvergence(history);
      
      // Use convergence scores if available, otherwise calculate based on hit rates
      const hasConvergenceScores = convergenceResult?.scores && convergenceResult.scores instanceof Map;
      
      // Calculate score for each group
      const groupScores: GroupScore[] = [];
      
      // Analyze different time windows
      const windows = {
        recent: history.slice(-18),
        medium: history.slice(-36),
        long: history.slice(-54)
      };
      
      for (const [groupName, groupData] of Object.entries(ALL_BETTING_GROUPS)) {
        // Calculate convergence score if available
        let convergenceScore = 0;
        if (hasConvergenceScores) {
          groupData.numbers.forEach(num => {
            const score = convergenceResult.scores!.get(num) || 0;
            convergenceScore += score;
          });
          convergenceScore = convergenceScore / groupData.numbers.length; // Normalize
        }
        
        // Calculate performance metrics
        const recentHits = windows.recent.filter(n => groupData.numbers.includes(n)).length;
        const mediumHits = windows.medium.filter(n => groupData.numbers.includes(n)).length;
        const longHits = windows.long.filter(n => groupData.numbers.includes(n)).length;
        
        const expectedRecent = (groupData.numbers.length / 37) * 18;
        const expectedMedium = (groupData.numbers.length / 37) * 36;
        const expectedLong = (groupData.numbers.length / 37) * 54;
        
        // Calculate deviation from expected
        const recentDeviation = (recentHits - expectedRecent) / Math.sqrt(expectedRecent);
        const mediumDeviation = (mediumHits - expectedMedium) / Math.sqrt(expectedMedium);
        
        // Determine trend
        const recentRate = recentHits / 18;
        const mediumRate = mediumHits / 36;
        let trend: 'rising' | 'falling' | 'stable' = 'stable';
        if (recentRate > mediumRate * 1.2) trend = 'rising';
        else if (recentRate < mediumRate * 0.8) trend = 'falling';
        
        // Calculate final score (combination of convergence and performance)
        const performanceScore = recentDeviation * 0.5 + mediumDeviation * 0.3;
        const finalScore = hasConvergenceScores 
          ? (convergenceScore * 0.7 + performanceScore * 0.3)
          : performanceScore;
        
        // Determine confidence based on multiple factors
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        
        // HIGH: Strong convergence + significant deviation + rising trend
        if (finalScore > 1.5 && recentDeviation > 1.5 && trend === 'rising') {
          confidence = 'HIGH';
        }
        // MEDIUM: Decent score OR good deviation OR convergence signal
        else if (finalScore > 0.8 || recentDeviation > 1.0 || convergenceScore > 1.0) {
          confidence = 'MEDIUM';
        }
        // LOW: Everything else (we'll filter these out)
        
        groupScores.push({
          name: groupName,
          type: groupData.type,
          numbers: groupData.numbers,
          score: finalScore,
          hitRate: recentHits / expectedRecent,
          recentHits,
          expectedHits: Math.round(expectedRecent * 10) / 10,
          deviation: recentDeviation,
          confidence,
          trend
        });
      }
      
      // Sort by score and filter out LOW confidence
      const filteredGroups = groupScores
        .filter(g => g.confidence !== 'LOW')
        .sort((a, b) => b.score - a.score);
      
      setTopGroups(filteredGroups);
      
    } catch (error) {
      console.error('Error calculating group predictions:', error);
      setTopGroups([]);
    }
    
  }, [history]);
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'binary': return 'from-blue-600 to-blue-800';
      case 'dozen': return 'from-purple-600 to-purple-800';
      case 'column': return 'from-green-600 to-green-800';
      case 'six': return 'from-orange-600 to-orange-800';
      case 'thirds': return 'from-pink-600 to-pink-800';
      case 'splits': return 'from-indigo-600 to-indigo-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'rising': return '📈';
      case 'falling': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg p-3">
        <h2 className="text-lg font-bold text-white">
          🎯 True Convergence Groups
        </h2>
        {history.length >= 10 && topGroups.length > 0 && (
          <p className="text-indigo-200 text-xs mt-1">
            {topGroups.length} groups showing convergence patterns
          </p>
        )}
      </div>
      
      {/* Only show if we have data */}
      {history.length < 10 ? (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center text-gray-400 text-sm">
          Need at least 10 spins for group convergence analysis
        </div>
      ) : topGroups.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center text-gray-400 text-sm">
          No significant group patterns detected yet
        </div>
      ) : (
        <div className="grid gap-2">
          {topGroups.slice(0, 6).map((group, index) => (
            <div
              key={group.name}
              className={`bg-gradient-to-r ${getTypeColor(group.type)} rounded-lg p-3 bg-opacity-70 transform transition-all hover:scale-102`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-white text-lg font-bold">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {group.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        group.confidence === 'HIGH' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-black'
                      }`}>
                        {group.confidence}
                      </span>
                      <span className="text-xl" title={`Trend: ${group.trend}`}>
                        {getTrendIcon(group.trend)}
                      </span>
                    </div>
                    
                    <div className="flex gap-4 text-xs text-gray-200 mt-1">
                      <span>
                        Score: <span className="font-bold text-white">
                          {group.score.toFixed(2)}
                        </span>
                      </span>
                      <span>
                        Hits: <span className={`font-bold ${
                          group.recentHits > group.expectedHits ? 'text-green-300' : 'text-yellow-300'
                        }`}>
                          {group.recentHits}/{Math.round(group.expectedHits)}
                        </span>
                      </span>
                      <span>
                        σ: <span className="font-bold text-white">
                          {group.deviation > 0 ? '+' : ''}{group.deviation.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Visual heat indicator */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-6 rounded-sm transition-all ${
                          i < Math.ceil(group.hitRate * 3) 
                            ? 'bg-orange-400 shadow-glow' 
                            : 'bg-gray-600 opacity-30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-300 mt-1">
                    {group.hitRate > 1.5 ? '🔥' : group.hitRate > 1.2 ? '♨️' : '📊'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Summary Stats */}
      {topGroups.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-3 text-xs text-gray-400">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-gray-500">Strongest:</span>
              <span className="ml-1 text-white font-semibold">{topGroups[0]?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Rising:</span>
              <span className="ml-1 text-green-400">
                {topGroups.filter(g => g.trend === 'rising').length} groups
              </span>
            </div>
            <div>
              <span className="text-gray-500">High Conf:</span>
              <span className="ml-1 text-yellow-400">
                {topGroups.filter(g => g.confidence === 'HIGH').length} groups
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPredictions;