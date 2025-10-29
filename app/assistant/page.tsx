'use client';

import BettingAssistant from '../../components/BettingAssistant';

export default function AssistantPage() {
  // TESTING MODE: Bypassing tier check (subscription not in DB yet)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] text-white relative overflow-hidden">
      {/* Subtle yellow accent overlay */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-yellow-600/8 via-transparent to-transparent pointer-events-none"></div>

      <BettingAssistant />
    </div>
  );
}