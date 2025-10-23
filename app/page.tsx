'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroImages = [
    { emoji: '📈', title: 'Advanced Analytics', subtitle: 'Track 57 betting groups with real-time statistical insights' },
    { emoji: '🎯', title: 'Hot & Cold Analysis', subtitle: 'Identify trending numbers and patterns instantly' },
    { emoji: '💰', title: 'Manage Bankroll', subtitle: 'Set targets, stop losses, and track performance in real-time' },
    { emoji: '🔮', title: 'Predict Smart', subtitle: 'Data-driven betting insights across all groups' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] text-white">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* SLIDESHOW */}
        <div className="bg-black/40 backdrop-blur rounded-2xl border-2 border-yellow-400/30 p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-red-500/10 to-yellow-400/10 blur-3xl"></div>
          
          <div className="relative h-48 flex items-center justify-center">
            {heroImages.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className="text-7xl mb-3">{slide.emoji}</div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-2">{slide.title}</h2>
                <p className="text-lg text-gray-300 text-center max-w-2xl">{slide.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="relative flex justify-center gap-2 mt-3">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-yellow-400' : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* About Card */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden group hover:border-yellow-400/60 transition-all">
              <div className="absolute top-4 right-4 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">🎰</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 relative z-10">What is Roulette Tracker Pro?</h2>
              <p className="text-gray-300 mb-3 leading-relaxed relative z-10">
                A professional-grade analytics platform for serious roulette players who want to track, 
                analyze, and optimize their gameplay with real-time data and statistical insights.
              </p>
              <p className="text-gray-300 leading-relaxed relative z-10">
                Whether practicing strategies, analyzing patterns, or managing bankroll, 
                this tool provides comprehensive tracking.
              </p>
            </div>

            {/* Core Features Card */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden group hover:border-yellow-400/60 transition-all">
              <div className="absolute top-4 right-4 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">⚡</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 relative z-10">Core Features</h2>
              <div className="space-y-3 relative z-10">
                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="text-2xl">📊</div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Advanced Analytics</h3>
                    <p className="text-xs text-gray-300">57 betting groups tracked with absence, streaks, probabilities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="text-2xl">💰</div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Bankroll Management</h3>
                    <p className="text-xs text-gray-300">Set limits, track ROI and performance metrics</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="text-2xl">🔮</div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Probability Chamber</h3>
                    <p className="text-xs text-gray-300">Statistical and streak-based predictions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Pattern Detection</h3>
                    <p className="text-xs text-gray-300">Identify sequences and dealer signatures</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding Roulette Card */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden group hover:border-yellow-400/60 transition-all">
              <div className="absolute top-4 right-4 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">🎲</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 relative z-10">Understanding Roulette</h2>
              <div className="space-y-2 text-sm text-gray-300 relative z-10">
                <p>
                  <strong className="text-yellow-400">European Roulette:</strong> 37 numbers (0-36) with 2.7% house edge.
                </p>
                <p>
                  <strong className="text-yellow-400">Bet Types:</strong> Inside bets offer higher payouts but lower probability. Outside bets have better odds but lower returns.
                </p>
                <p>
                  <strong className="text-yellow-400">Key Concept:</strong> Every spin is independent. The ball has no memory. Tracking helps understand variance.
                </p>
                <p>
                  <strong className="text-yellow-400">Responsible Play:</strong> Set strict limits. This tracker helps you stay disciplined.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - 10 COMMANDMENTS */}
          <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 sticky top-24 h-fit">
            <h2 className="text-2xl font-bold text-center mb-5 text-yellow-400">
              📜 The 10 Commandments
            </h2>
            
            <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
              {[
                { num: 1, title: 'The House Always Wins', desc: 'European: 2.7% edge. American: 5.26%. No system beats math.', color: 'red' },
                { num: 2, title: 'Every Spin Is Independent', desc: "Past results don't affect future outcomes. No memory.", color: 'blue' },
                { num: 3, title: "Gambler's Fallacy Is Real", desc: '"Red is due" after 10 blacks? Wrong. Still 48.6%.', color: 'green' },
                { num: 4, title: 'Set Limits Before Playing', desc: 'Decide bankroll, target, stop loss BEFORE first spin.', color: 'purple' },
                { num: 5, title: 'Never Chase Losses', desc: 'Martingale works short-term, catastrophic at table limits.', color: 'yellow' },
                { num: 6, title: 'Track Everything', desc: 'Data reveals patterns in dealer signatures and wheel bias.', color: 'pink' },
                { num: 7, title: 'Understand the Payouts', desc: 'Straight: 35:1, Dozen: 2:1, Even Money: 1:1', color: 'orange' },
                { num: 8, title: 'Variance Is Your Enemy', desc: 'Short-term luck feels real. Long-term math inevitable.', color: 'teal' },
                { num: 9, title: 'Entertainment First', desc: 'Treat gambling as entertainment cost, not investment.', color: 'indigo' },
                { num: 10, title: 'Know When to Walk Away', desc: 'Hit target? Stop. Hit loss limit? Stop. Discipline beats greed.', color: 'red' },
              ].map((item) => (
                <div key={item.num} className={`bg-gray-800/50 rounded-lg p-2.5 border border-${item.color}-500/30 hover:border-${item.color}-500 transition-all hover:scale-[1.02]`}>
                  <div className="flex items-start gap-2.5">
                    <div className="text-xl">{['🏛️','🎲','🧠','⚖️','🚫','📝','💵','📉','🎭','🚪'][item.num - 1]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-base font-bold text-${item.color}-500`}>{item.num}</span>
                        <h3 className={`font-bold text-xs text-${item.color}-400`}>{item.title}</h3>
                      </div>
                      <p className="text-xs text-gray-300">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div className="text-center mb-6 space-y-4">
          <div className="flex gap-4 justify-center">
            <Link
              href="/analysis"
              className="px-12 py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-xl text-xl shadow-2xl hover:shadow-yellow-400/50 transition-all transform hover:scale-105"
            >
              📊 Start Analysis
            </Link>
          </div>

          <p className="text-gray-400 text-sm">
            🔓 Practice Mode - All data saved locally in your browser
          </p>
        </div>

        {/* DISCLAIMER */}
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-300">
            <strong>Responsible Gaming:</strong> This tool is for tracking and analysis only. 
            Gambling can be addictive. Never bet more than you can afford to lose. 
            If you or someone you know has a gambling problem, call 1-800-GAMBLER.
          </p>
        </div>
      </div>
    </div>
  );
}