import React from 'react';
import NumberHeatStrip from '@/components/NumberHeatStrip';  // Changed from './NumberHeatStrip'
import NumberStatsTable from '@/components/NumberStatsTable';  // Changed from './NumberStatsTable'
import { getAllNumberStats } from '@/lib/numberStatsCalculations';

interface NumbersStatsTabProps {
  history: number[];
}

const NumbersStatsTab: React.FC<NumbersStatsTabProps> = ({ history }) => {
  // Calculate summary stats
  const allStats = getAllNumberStats(history);

  // Find hottest (highest hit count in L36)
  const hottest = allStats.reduce((max, stat) =>
    stat.hitCount > max.hitCount ? stat : max
  , allStats[0]);

  // Find coldest (longest absence)
  const coldest = allStats.reduce((max, stat) =>
    stat.absence > max.absence ? stat : max
  , allStats[0]);

  // Find most due (highest absence among numbers that have hit at least once)
  const mostDue = allStats
    .filter(stat => stat.hitCount > 0)
    .reduce((max, stat) =>
      stat.absence > max.absence ? stat : max
    , allStats[0]);

  return (
    <div className="space-y-4">
      {/* Quick Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-red-900/30 rounded p-2">
          <div className="text-gray-400">Hottest</div>
          <div className="font-bold text-white">{history.length > 0 ? hottest.number : '-'}</div>
        </div>
        <div className="bg-blue-900/30 rounded p-2">
          <div className="text-gray-400">Coldest</div>
          <div className="font-bold text-white">{history.length > 0 ? coldest.number : '-'}</div>
        </div>
        <div className="bg-yellow-900/30 rounded p-2">
          <div className="text-gray-400">Most Due</div>
          <div className="font-bold text-white">{history.length > 0 ? mostDue.number : '-'}</div>
        </div>
        <div className="bg-green-900/30 rounded p-2">
          <div className="text-gray-400">Just Hit</div>
          <div className="font-bold text-white">{history && history.length > 0 ? history[0] : '-'}</div>
        </div>
      </div>

      {/* Visual heat map at top */}
      <NumberHeatStrip history={history || []} />
      
      {/* Smart filtered tables below */}
      <NumberStatsTable history={history || []} />
    </div>
  );
};

// IMPORTANT: Default export
export default NumbersStatsTab;