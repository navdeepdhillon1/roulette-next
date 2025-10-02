import React from 'react';
import { Card } from '@/components/ui/card';

export default function StreakAnalysisTable({ spinHistory }: { spinHistory: number[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">📈 Streak Analysis</h3>
      <p className="text-gray-400">Multi-factor streak analysis coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">
        Spins analyzed: {spinHistory.length}
      </p>
    </Card>
  );
}