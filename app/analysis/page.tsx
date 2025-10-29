'use client';

import Navigation from '@/components/Navigation';
import RouletteSystem from '@/components/RouletteSystem';
// import ProtectedRoute from '@/components/ProtectedRoute';

export default function AnalysisPage() {
  // TESTING MODE: Bypassing authentication for development/styling work
  return (
    // <ProtectedRoute requiredTier="pro" featureName="Advanced Tracker">
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] relative overflow-hidden">
        {/* Subtle yellow accent overlay */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-yellow-600/8 via-transparent to-transparent pointer-events-none"></div>

        <Navigation />
        <RouletteSystem />
      </div>
    // </ProtectedRoute>
  );
}