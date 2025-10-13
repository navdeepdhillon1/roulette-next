import React from 'react';
import { FloatingCardWrapper } from './FloatingCardWrapper';
import { OpenCard } from '../contexts/CardManagerContext';

interface FloatingAdvisorCardProps {
  card: OpenCard;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onBringToFront: () => void;
}

export const FloatingAdvisorCard: React.FC<FloatingAdvisorCardProps> = ({
  card,
  onClose,
  onMinimize,
  onMaximize,
  onPositionChange,
  onBringToFront,
}) => {
  return (
    <FloatingCardWrapper
      id={card.id}
      title="🎯 Betting Advisor"
      titleColor="from-purple-600 via-pink-600 to-purple-600"
      position={card.position}
      isMinimized={card.isMinimized}
      isMaximized={card.isMaximized}
      zIndex={card.zIndex}
      onClose={onClose}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      onPositionChange={onPositionChange}
      onBringToFront={onBringToFront}
    >
      <div className="space-y-4">
        {/* Recommendation Header */}
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🎯</div>
            <div>
              <h4 className="text-lg font-bold text-purple-300">Current Recommendation</h4>
              <p className="text-sm text-gray-400">Based on recent patterns</p>
            </div>
          </div>
          <div className="bg-black/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 font-bold text-xl">Bet on: Red</span>
              <span className="px-3 py-1 bg-green-600 rounded-full text-xs font-bold">HIGH CONFIDENCE</span>
            </div>
            <div className="text-gray-300 text-sm">
              <p>• Red has been absent for 7 spins (above average)</p>
              <p>• Black currently on 4-spin streak</p>
              <p>• Statistical reversion likely</p>
            </div>
          </div>
        </div>

        {/* Betting Strategy */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span>💰</span> Suggested Betting Strategy
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Primary Bet:</span>
              <span className="text-white font-bold">$10 on Red</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Backup Bet:</span>
              <span className="text-white font-bold">$5 on Odd</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Expected Value:</span>
              <span className="text-green-400 font-bold">+$2.50</span>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-orange-400 mb-3 flex items-center gap-2">
            <span>⚠️</span> Risk Analysis
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-900 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <span className="text-sm text-gray-300">70% Win Rate</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Risk Level: <span className="text-yellow-400">Moderate</span></p>
              <p>• Confidence Score: <span className="text-green-400">8.5/10</span></p>
              <p>• Max Loss Scenario: <span className="text-red-400">-$15</span></p>
            </div>
          </div>
        </div>

        {/* Alternative Suggestions */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-blue-400 mb-3 flex items-center gap-2">
            <span>🔄</span> Alternative Bets
          </h4>
          <div className="space-y-2 text-sm">
            {[
              { bet: '2nd Dozen (13-24)', confidence: 'Medium', reason: 'Low hit frequency' },
              { bet: 'Column 3', confidence: 'Low', reason: 'Recent streak' },
              { bet: 'High (19-36)', confidence: 'Medium', reason: 'Balanced distribution' },
            ].map((alt, idx) => (
              <div key={idx} className="p-2 bg-gray-900/50 rounded flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold">{alt.bet}</div>
                  <div className="text-gray-400 text-xs">{alt.reason}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  alt.confidence === 'Medium' ? 'bg-yellow-600/30 text-yellow-400' : 'bg-gray-600/30 text-gray-400'
                }`}>
                  {alt.confidence}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-sm transition-all">
            Apply Recommendation
          </button>
          <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm transition-all">
            Show More Options
          </button>
        </div>
      </div>
    </FloatingCardWrapper>
  );
};