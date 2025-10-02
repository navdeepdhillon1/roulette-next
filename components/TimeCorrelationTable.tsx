import React from 'react';
import { Card } from '@/components/ui/card';

export default function TimeCorrelationTable({ spinHistory }: { spinHistory: number[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">⏰ Time Correlation Analysis</h3>
      <p className="text-gray-400">Time correlation analysis coming soon...</p>
      <p className="text-sm text-gray-500 mt-2">
        Spins analyzed: {spinHistory.length}
      </p>
    </Card>
  );
}