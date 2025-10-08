'use client';

import Navigation from '@/components/Navigation';
import RouletteSystem from '@/components/RouletteSystem';

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <RouletteSystem />
    </div>
  );
}