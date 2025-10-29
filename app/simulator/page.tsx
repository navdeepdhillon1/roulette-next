/**
 * ARCHIVED FEATURE - Simulator Page
 *
 * This feature has been removed from navigation as of Jan 2025 because:
 * 1. Visual quality issues (elliptical wheel, asymmetrical layout)
 * 2. Doesn't align with core value proposition (real-time tracking/analysis)
 * 3. Attracts wrong audience (casual players vs. serious strategists)
 * 4. Commodity feature that doesn't differentiate the product
 *
 * The page still exists at /simulator but is not linked anywhere.
 * Code preserved in case we want to repurpose as "Strategy Testing Lab" later.
 *
 * Strategic pivot: Focus on Learning Center (blog) as traffic driver instead.
 */

'use client';

import Navigation from '@/components/Navigation';
import Simulator from '@/components/Simulator';

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] text-white relative overflow-hidden">
      {/* Subtle yellow accent overlay */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-yellow-600/8 via-transparent to-transparent pointer-events-none"></div>

      <Navigation />
      <Simulator />
    </div>
  );
}