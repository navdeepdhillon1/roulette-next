'use client';

import BettingAssistant from '../../components/BettingAssistant';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AssistantPage() {
  return (
    <ProtectedRoute requiredTier="elite" featureName="Betting Assistant">
      <div className="min-h-screen">
        <BettingAssistant />
      </div>
    </ProtectedRoute>
  );
}