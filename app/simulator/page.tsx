'use client';

import Navigation from '@/components/Navigation';
import Simulator from '@/components/Simulator';

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <Simulator />
    </div>
  );
}