// components/NumberStatsTable.tsx
import React, { useState } from 'react';
import { getAllNumberStats, type NumberStat } from '@/lib/numberStatsCalculations';
import NumbersTableSection from '@/components/NumbersTableSection';

interface NumberStatsTableProps {
  history: number[];
}

const NumberStatsTable: React.FC<NumberStatsTableProps> = ({ history }) => {
    const allNumberStats = getAllNumberStats(history);
    
    // Smart filtering for important numbers
    const actionNumbers = [
      ...allNumberStats.filter(n => n.temperature === 'HOT').slice(0, 3),
      ...allNumberStats.filter(n => n.temperature === 'COLD').slice(0, 3),
      ...allNumberStats.filter(n => n.absence > 40).slice(0, 2),
    ];
    
    const watchList = allNumberStats.filter(n => 
      (n.deviation > 5 && n.deviation < 10) ||
      (n.absence > 25 && n.absence < 40)
    ).slice(0, 5);
  
    const [showAll, setShowAll] = useState(false);
  
    return (
      <div className="space-y-4">
        {/* ACTION NUMBERS - Always visible */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-red-400">
            🎯 Action Numbers (High Priority)
          </h3>
          <NumbersTableSection numbers={actionNumbers} highlight={true} />
        </div>
  
        {/* WATCH LIST - Always visible */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-yellow-400">
            👀 Watch List (Developing Patterns)
          </h3>
          <NumbersTableSection numbers={watchList} />
        </div>
  
        {/* ALL NUMBERS - Expandable */}
        <div className="bg-gray-800 rounded-lg p-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-between w-full text-sm font-semibold mb-2 text-gray-300 hover:text-white transition-colors"
          >
            <span>📊 All Numbers (Complete Table)</span>
            <span>{showAll ? '▼' : '▶'}</span>
          </button>
          {showAll && <NumbersTableSection numbers={allNumberStats} />}
        </div>
      </div>
    );
  };

export default NumberStatsTable;