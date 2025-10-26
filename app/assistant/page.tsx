'use client';

import BettingAssistant from '../../components/BettingAssistant';

export default function AssistantPage() {
  // TESTING MODE: Bypassing tier check (subscription not in DB yet)
  return (
    <div className="min-h-screen">
      <BettingAssistant />
    </div>
  );
}