import React from 'react';
import { FloatingCardWrapper } from './FloatingCardWrapper';
import { OpenCard } from '../contexts/CardManagerContext';

interface FloatingProbabilityCardProps {
  card: OpenCard;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onBringToFront: () => void;
}

export const FloatingProbabilityCard: React.FC<FloatingProbabilityCardProps> = ({
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
      title="📊 Probability Analysis"
      titleColor="from-cyan-600 via-blue-600 to-cyan-600"
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
        {/* Next Spin Predictions */}
        <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-lg p-4 border border-cyan-500/30">
          <h4 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
            <span>🎲</span> Next Spin Predictions
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 rounded-lg p-3 text-center border border-red-500/30">
              <div className="text-red-400 font-bold text-2xl mb-1">48.6%</div>
              <div className="text-gray-300 text-sm font-semibold">Red</div>
              <div className="text-gray-500 text-xs mt-1">18/37 numbers</div>
            </div>
            <div className="bg-black/40 rounded-lg p-3 text-center border border-gray-500/30">
              <div className="text-gray-300 font-bold text-2xl mb-1">48.6%</div>
              <div className="text-gray-300 text-sm font-semibold">Black</div>
              <div className="text-gray-500 text-xs mt-1">18/37 numbers</div>
            </div>
          </div>
          <div className="bg-black/40 rounded-lg p-3 text-center border border-green-500/30 mt-3">
            <div className="text-green-400 font-bold text-2xl mb-1">2.7%</div>
            <div className="text-gray-300 text-sm font-semibold">Zero</div>
            <div className="text-gray-500 text-xs mt-1">House advantage</div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span>⚡</span> Confidence Level
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Statistical Confidence</span>
                <span className="text-yellow-400 font-bold">85%</span>
              </div>
              <div className="bg-gray-900 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-black/30 rounded p-2">
              Based on 50+ spins of data with strong pattern consistency
            </div>
          </div>
        </div>

        {/* Statistical Analysis */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-purple-400 mb-3 flex items-center gap-2">
            <span>📈</span> Statistical Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Z-Score (Red)</span>
              <span className="text-white font-bold">+1.8</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Z-Score (Black)</span>
              <span className="text-white font-bold">-1.5</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Volatility Index</span>
              <span className="text-orange-400 font-bold">High (7.2)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span className="text-gray-300 text-sm">Current Streak</span>
              <span className="text-red-400 font-bold">Red x3</span>
            </div>
          </div>
        </div>

        {/* Probability Distribution */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-green-400 mb-3 flex items-center gap-2">
            <span>📊</span> Probability Distribution
          </h4>
          <div className="space-y-2 text-sm">
            {[
              { category: 'Even/Odd', even: 48.6, odd: 48.6 },
              { category: 'Low/High', even: 48.6, odd: 48.6 },
              { category: '1st/2nd/3rd Dozen', even: 32.4, odd: 32.4 },
            ].map((dist, idx) => (
              <div key={idx} className="p-2 bg-gray-900/50 rounded">
                <div className="text-gray-300 font-semibold mb-2">{dist.category}</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="bg-blue-600/30 rounded h-6 flex items-center justify-center text-xs font-bold">
                      {dist.even}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-orange-600/30 rounded h-6 flex items-center justify-center text-xs font-bold">
                      {dist.odd}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot/Cold Analysis */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-md font-bold text-orange-400 mb-3 flex items-center gap-2">
            <span>🔥</span> Hot & Cold Numbers
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-red-400 font-semibold mb-2">🔥 Hot Numbers</div>
              <div className="flex flex-wrap gap-1">
                {[17, 23, 5, 32, 19].map(num => (
                  <div key={num} className="w-8 h-8 bg-red-600/80 rounded flex items-center justify-center text-xs font-bold">
                    {num}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-400 font-semibold mb-2">❄️ Cold Numbers</div>
              <div className="flex flex-wrap gap-1">
                {[8, 14, 27, 31, 2].map(num => (
                  <div key={num} className="w-8 h-8 bg-blue-600/40 rounded flex items-center justify-center text-xs font-bold">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-bold text-sm transition-all">
            Detailed Report
          </button>
          <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm transition-all">
            Export Data
          </button>
        </div>
      </div>
    </FloatingCardWrapper>
  );
};