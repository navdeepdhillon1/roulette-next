// components/NumberHeatStrip.tsx
import React from 'react';
import { getNumberStats, getHeatColor } from '@/lib/numberStatsCalculations';

interface NumberHeatStripProps {
  history: number[];
}

const NumberHeatStrip: React.FC<NumberHeatStripProps> = ({ history }) => {
    return (
      <div className="bg-gray-900 rounded-lg p-3 mb-4">
        <h3 className="text-sm font-semibold mb-2">All Numbers Heat Map</h3>
        
        {/* The heat strip */}
        <div className="flex gap-0.5 overflow-x-auto pb-2">
          {[0, ...Array.from({length: 36}, (_, i) => i + 1)].map(num => {
            const stats = getNumberStats(num, history);
            return (
              <div
                key={num}
                className={`
                  relative flex-shrink-0 w-8 h-12 rounded text-xs
                  flex items-center justify-center font-bold
                  cursor-pointer transition-all hover:scale-110
                  ${getHeatColor(stats)}
                  ${stats.absence > 50 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                `}
                title={`Last hit: ${stats.absence} spins ago | Hits: ${stats.hitCount}`}
              >
                {num}
                {stats.justHit && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded" /> Hot
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded" /> Cold
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-600 rounded" /> Overdue
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full" /> Just Hit
          </span>
        </div>
      </div>
    );
  };

export default NumberHeatStrip;