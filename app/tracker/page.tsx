'use client';

import Navigation from '@/components/Navigation';
import BasicTracker from '@/components/BasicTracker';  // <-- Changed this line!

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <BasicTracker />
    </div>
  );
}