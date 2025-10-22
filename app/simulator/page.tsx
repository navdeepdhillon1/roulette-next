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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <Simulator />
    </div>
  );
}