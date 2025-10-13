'use client';

import Navigation from '@/components/Navigation';
import RouletteSystem from '@/components/RouletteSystem';

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27]">
      <Navigation />
      <RouletteSystem />
    </div>
  );
}