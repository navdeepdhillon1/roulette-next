'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, XCircle, Coffee, TrendingUp } from 'lucide-react';
import type { BetCard } from '../types/bettingAssistant';

interface CardCelebrationProps {
  card: BetCard;
  onContinue: () => void;
  onTakeBreak: () => void;
  consecutiveFailures?: number;
}

export function CardSuccessCelebration({ card, onContinue, onTakeBreak }: CardCelebrationProps) {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    setTimeout(() => setConfetti(false), 3000);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      {confetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '⭐', '✨', '🎊', '🏆'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl border-4 border-green-400 p-8 max-w-lg w-full shadow-2xl transform scale-100 animate-pulse-once">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-bounce">🏆</div>
          
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">
              CARD #{card.cardNumber} COMPLETE!
            </h2>
            <div className="text-green-300 text-lg">
              Excellent work!
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Target:</span>
              <span className="text-xl font-bold text-white">${card.target}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Achieved:</span>
              <span className="text-2xl font-bold text-green-400">+${card.currentTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Bets Used:</span>
              <span className="text-xl font-bold text-white">{card.betsUsed} / {card.maxBets}</span>
            </div>
          </div>

          <div className="bg-green-800/30 rounded-lg p-4">
            <p className="text-sm text-green-200">
              ✨ Great discipline! You completed the card efficiently and stayed on target.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onTakeBreak}
              className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Coffee size={20} />
              Take 5 Min Break
            </button>
            <button
              onClick={onContinue}
              className="py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <TrendingUp size={20} />
              Continue
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Next card will be unlocked when you continue
          </p>
        </div>
      </div>
    </div>
  );
}

export function CardFailureModal({ card, onContinue, consecutiveFailures = 0 }: Omit<CardCelebrationProps, 'onTakeBreak'> & { consecutiveFailures?: number }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gradient-to-br from-red-900 to-orange-900 rounded-2xl border-4 border-red-400 p-8 max-w-lg w-full shadow-2xl">
        <div className="text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Card #{card.cardNumber} Incomplete
            </h2>
            <div className="text-red-300">
              All 15 bets used
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Target:</span>
              <span className="text-xl font-bold text-white">${card.target}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Final Result:</span>
              <span className="text-2xl font-bold text-red-400">${card.currentTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Shortfall:</span>
              <span className="text-xl font-bold text-orange-400">
                ${card.target - card.currentTotal}
              </span>
            </div>
          </div>

          {/* Learning Moment */}
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-left">
            <div className="font-bold text-blue-300 mb-2">💡 What Happened?</div>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Win rate was below needed threshold</li>
              <li>• Consider sticking to even-money bets</li>
              <li>• Bet sizing may need adjustment</li>
              <li>• Next card is fresh start!</li>
            </ul>
          </div>

          {/* Consecutive Failures Warning */}
          {consecutiveFailures > 0 && (
            <div className={`rounded-lg border-2 p-4 ${
              consecutiveFailures === 1 ? 'bg-yellow-900/20 border-yellow-500' :
              consecutiveFailures === 2 ? 'bg-orange-900/20 border-orange-500' :
              'bg-red-900/20 border-red-500'
            }`}>
              <div className="font-bold text-white mb-1">
                Consecutive Failures: {consecutiveFailures}
              </div>
              <div className="text-sm text-gray-300">
                {consecutiveFailures === 1 && 'First failure - stay focused for next card'}
                {consecutiveFailures === 2 && 'Second failure - mandatory 10-min break required'}
                {consecutiveFailures >= 3 && 'Third failure - 24-hour break enforced'}
              </div>
            </div>
          )}

          <button
            onClick={onContinue}
            disabled={consecutiveFailures >= 3}
            className={`w-full py-4 rounded-xl font-bold transition-all ${
              consecutiveFailures >= 3
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105'
            }`}
          >
            {consecutiveFailures >= 3 ? '🛑 Session Paused (24 Hours)' : '➡️ Continue to Next Card'}
          </button>

          {consecutiveFailures >= 3 && (
            <p className="text-xs text-red-300">
              Three consecutive failures detected. Please take a break and return tomorrow.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Break Timer Modal
export function BreakTimerModal({ duration = 300, onComplete }: { duration?: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl border-2 border-blue-400 p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="text-5xl">☕</div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Taking a Break
            </h2>
            <p className="text-blue-300">
              Use this time to reset and refocus
            </p>
          </div>

          <div className="bg-black/40 rounded-xl p-8">
            <div className="text-6xl font-bold text-white font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-blue-800/30 rounded-lg p-4 text-left">
            <div className="font-bold text-blue-300 mb-2">Break Activities:</div>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>✓ Take 3 deep breaths</li>
              <li>✓ Stand up and stretch</li>
              <li>✓ Drink some water</li>
              <li>✓ Walk around briefly</li>
              <li>✓ Clear your mind</li>
            </ul>
          </div>

          <button
            onClick={onComplete}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
          >
            Skip Break (Not Recommended)
          </button>
        </div>
      </div>
    </div>
  );
}