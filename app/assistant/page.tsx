'use client';

import { useEffect } from 'react';
import BettingAssistant from '../../components/BettingAssistant';

export default function AssistantPage() {
  // TESTING MODE: Bypassing tier check (subscription not in DB yet)

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden bg-gray-900">
      <BettingAssistant />
    </div>
  );
}