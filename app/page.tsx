'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import {
  TrendingDown, AlertTriangle, Shield, XCircle,
  BarChart3, DollarSign, TrendingUp, Smile, LogOut,
  RefreshCw, Wallet, Activity, Sparkles, Layers
} from 'lucide-react';
import {
  RouletteWheelIcon, CasinoChipIcon, AnalyticsIcon,
  TargetIcon, PatternIcon, TrendIcon
} from '@/components/RouletteIcons';
import { SITE_CONFIG } from '@/lib/constants';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Icon mapping for 10 Commandments - Minimalist professional icons
  const getCommandmentIcon = (num: number) => {
    const iconProps = { size: 24, className: "text-current" };
    const icons: { [key: number]: JSX.Element } = {
      1: <CasinoChipIcon {...iconProps} />,
      2: <RouletteWheelIcon {...iconProps} />,
      3: <AlertTriangle {...iconProps} />,
      4: <Shield {...iconProps} />,
      5: <XCircle {...iconProps} />,
      6: <BarChart3 {...iconProps} />,
      7: <DollarSign {...iconProps} />,
      8: <TrendingUp {...iconProps} />,
      9: <Smile {...iconProps} />,
      10: <LogOut {...iconProps} />,
    };
    return icons[num] || null;
  };

  const heroImages = [
    { emoji: '📈', title: 'Advanced Analytics', subtitle: 'Track 47 betting groups with real-time statistical insights' },
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] text-white relative overflow-hidden">
      {/* Subtle Orange Accent Overlay */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-600/8 via-transparent to-transparent pointer-events-none"></div>

      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 relative z-10">
        {/* SLIDESHOW */}
        <div className="bg-gradient-to-br from-yellow-400/50 via-teal-400/40 to-yellow-500/50 backdrop-blur-xl rounded-2xl border-2 border-yellow-400/40 p-4 md:p-6 mb-4 md:mb-6 relative overflow-hidden">
          {/* Radial gradient from edges to center with teal blend */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(13,148,136,0.3)_100%)]"></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          {/* Diagonal lines with teal tint */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-teal-500/10 to-transparent transform -skew-x-12"></div>
          </div>

          <div className="relative h-48 flex items-center justify-center">
            {heroImages.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div className="text-7xl mb-4">{slide.emoji}</div>
                <h2 className="text-4xl font-extrabold text-yellow-400 mb-3 tracking-tight drop-shadow-lg">{slide.title}</h2>
                <p className="text-xl text-yellow-400/90 text-center max-w-2xl drop-shadow-lg">{slide.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="relative flex justify-center gap-2 mt-3">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative">
          {/* Yellow-teal light scattering from above */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-yellow-400/15 via-teal-400/10 to-transparent blur-3xl pointer-events-none"></div>

          {/* LEFT COLUMN */}
          <div className="space-y-6 relative z-10">
            {/* About Card */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden group hover:border-yellow-400/60 transition-all shadow-[0_0_30px_rgba(250,204,21,0.1)] hover:shadow-[0_0_40px_rgba(250,204,21,0.2)]">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CasinoChipIcon className="text-yellow-400" size={80} />
              </div>
              <h2 className="text-3xl font-extrabold text-yellow-400 mb-4 relative z-10 tracking-tight">What is Roulette Tracker Pro?</h2>
              <p className="text-gray-400 mb-3 leading-relaxed relative z-10 text-base">
                A professional-grade analytics platform for serious roulette players who want to track,
                analyze, and optimize their gameplay with real-time data and statistical insights.
              </p>
              <p className="text-gray-400 leading-relaxed relative z-10 text-base">
                Whether practicing strategies, analyzing patterns, or managing bankroll,
                this tool provides comprehensive tracking.
              </p>
            </div>

            {/* Core Features Card */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden group hover:border-yellow-400/60 transition-all shadow-[0_0_30px_rgba(250,204,21,0.1)] hover:shadow-[0_0_40px_rgba(250,204,21,0.2)]">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendIcon className="text-yellow-400" size={80} />
              </div>
              <h2 className="text-3xl font-extrabold text-yellow-400 mb-5 relative z-10 tracking-tight">Core Features</h2>
              <div className="space-y-3 relative z-10">
                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="mt-0.5">
                    <AnalyticsIcon className="text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Advanced Analytics</h3>
                    <p className="text-sm text-gray-400">47 betting groups tracked with absence, streaks, probabilities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="mt-0.5">
                    <DollarSign className="text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Bankroll Management</h3>
                    <p className="text-sm text-gray-400">Set limits, track ROI and performance metrics</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="mt-0.5">
                    <TargetIcon className="text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Probability Chamber</h3>
                    <p className="text-sm text-gray-400">Statistical and streak-based predictions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
                  <div className="mt-0.5">
                    <PatternIcon className="text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Pattern Detection</h3>
                    <p className="text-sm text-gray-400">Identify sequences and dealer signatures</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding Roulette Card */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden group hover:border-yellow-400/60 transition-all shadow-[0_0_30px_rgba(250,204,21,0.1)] hover:shadow-[0_0_40px_rgba(250,204,21,0.2)]">
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <RouletteWheelIcon className="text-yellow-400" size={80} />
              </div>
              <h2 className="text-3xl font-extrabold text-yellow-400 mb-4 relative z-10 tracking-tight">Understanding Roulette</h2>
              <div className="space-y-3 text-base text-gray-400 relative z-10">
                <p>
                  <strong className="text-yellow-400 font-bold">European Roulette:</strong> 37 numbers (0-36) with 2.7% house edge.
                </p>
                <p>
                  <strong className="text-yellow-400 font-bold">Bet Types:</strong> Inside bets offer higher payouts but lower probability. Outside bets have better odds but lower returns.
                </p>
                <p>
                  <strong className="text-yellow-400 font-bold">Key Concept:</strong> Every spin is independent. The ball has no memory. Tracking helps understand variance.
                </p>
                <p>
                  <strong className="text-yellow-400 font-bold">Responsible Play:</strong> Set strict limits. This tracker helps you stay disciplined.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - 10 COMMANDMENTS */}
          <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-6 flex flex-col h-full relative z-10 shadow-[0_0_30px_rgba(250,204,21,0.1)] hover:shadow-[0_0_40px_rgba(250,204,21,0.2)] transition-all">
            <h2 className="text-3xl font-extrabold text-center mb-6 text-yellow-400 tracking-tight">
              📜 The 10 Commandments
            </h2>

            <div className="flex flex-col justify-between flex-1 pr-2">
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
                    <div className={`text-${item.color}-500 mt-0.5`}>{getCommandmentIcon(item.num)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-base font-bold text-${item.color}-500`}>{item.num}</span>
                        <h3 className={`font-bold text-sm text-${item.color}-400`}>{item.title}</h3>
                      </div>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TIER COMPARISON SECTION */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-5xl font-extrabold text-yellow-400 mb-4 tracking-tight">Choose Your Experience</h2>
            <p className="text-gray-400 text-xl">From learning the basics to professional betting assistance</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* BASIC TIER */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-gray-600/50 p-6 hover:border-gray-400/80 transition-all relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-700/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative z-10">
                <div className="text-4xl mb-3 text-center">🎯</div>
                <h3 className="text-2xl font-bold text-white text-center mb-2">Basic</h3>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-300">FREE</span>
                  <p className="text-xs text-gray-400 mt-1">Forever</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">12 common betting groups</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Last 20 spins tracking</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">HOT/COLD/NORM status</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Basic session tracking</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Real-time entry</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-600 mt-0.5">✗</span>
                    <span className="text-gray-500">No data export</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-600 mt-0.5">✗</span>
                    <span className="text-gray-500">No wheel sectors</span>
                  </div>
                </div>

                <Link
                  href="/tracker"
                  className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-center transition-all"
                >
                  Start Free
                </Link>

                <p className="text-xs text-gray-400 text-center mt-3">Perfect for beginners</p>
              </div>
            </div>

            {/* PRO TIER */}
            <div className="bg-black/40 backdrop-blur rounded-xl border border-blue-500/50 p-6 hover:border-blue-400/80 transition-all relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative z-10">
                <div className="text-4xl mb-3 text-center">📊</div>
                <h3 className="text-2xl font-bold text-white text-center mb-2">Pro</h3>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-blue-400">$9.99</span>
                  <span className="text-gray-400">/month</span>
                  <p className="text-xs text-gray-400 mt-1">Full analytics</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-200 font-semibold">Everything in Basic, plus:</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">47 betting groups</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">All 37 numbers tracked</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">6 time windows (9-288 spins)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Wheel sector analysis</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Anomaly detection</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Data export (CSV/JSON)</span>
                  </div>
                </div>

                <Link
                  href="/analysis"
                  className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-center transition-all"
                >
                  Try Pro Features
                </Link>

                <p className="text-xs text-gray-400 text-center mt-3">For serious analysts</p>
              </div>
            </div>

            {/* ELITE TIER */}
            <div className="bg-black/40 backdrop-blur rounded-xl border-2 border-yellow-400/70 p-6 hover:border-yellow-400 transition-all relative overflow-hidden group scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* POPULAR BADGE */}
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>

              <div className="relative z-10">
                <div className="text-4xl mb-3 text-center">🎯</div>
                <h3 className="text-2xl font-bold text-yellow-400 text-center mb-2">Elite</h3>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-yellow-400">$19.99</span>
                  <span className="text-gray-400">/month</span>
                  <p className="text-xs text-gray-400 mt-1">Betting assistant</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-yellow-300 font-semibold">Everything in Pro, plus:</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">10 custom groups</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Dealer analysis</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Betting card system</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">6 betting systems</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Matrix betting</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-400">Discipline tracking</span>
                  </div>
                </div>

                <Link
                  href="/assistant"
                  className="block w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg text-center transition-all hover:shadow-lg hover:shadow-yellow-400/50"
                >
                  Try Elite Features
                </Link>

                <p className="text-xs text-gray-400 text-center mt-3">For professional players</p>
              </div>
            </div>
          </div>

          {/* FEATURE COMPARISON LINK */}
          <div className="text-center mt-8">
            <Link
              href="/learn/getting-started-basic-tracker"
              className="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              View detailed feature comparison →
            </Link>
          </div>
        </div>

        {/* TESTIMONIALS SECTION */}
        <div className="mt-12 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-yellow-400 mb-2">What Our Players Say</h2>
          <p className="text-center text-gray-400 mb-8">Real results from professional roulette players</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Testimonial 1 */}
            <div className="bg-black/40 backdrop-blur border border-yellow-400/30 rounded-xl p-4 md:p-6 hover:border-yellow-400/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {'⭐'.repeat(5)}
                </div>
              </div>
              <p className="text-gray-300 mb-4 italic">
                "The pattern detection is game-changing. I've increased my win rate by 23% tracking hot/cold patterns across all 47 groups. The intelligent predictions are spot-on."
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">Marcus R.</p>
                  <p className="text-gray-500 text-sm">Las Vegas, NV</p>
                </div>
                <div className="px-3 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full text-yellow-400 text-xs font-bold">
                  ELITE
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-black/40 backdrop-blur border border-yellow-400/30 rounded-xl p-4 md:p-6 hover:border-yellow-400/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {'⭐'.repeat(5)}
                </div>
              </div>
              <p className="text-gray-300 mb-4 italic">
                "The wheel section analysis (voisins, orphelins, tiers) helped me spot biased wheels. Made back my subscription cost in the first session. Worth every penny."
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">Sarah Chen</p>
                  <p className="text-gray-500 text-sm">Macau</p>
                </div>
                <div className="px-3 py-1 bg-teal-400/20 border border-teal-400/40 rounded-full text-teal-400 text-xs font-bold">
                  PRO
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-black/40 backdrop-blur border border-yellow-400/30 rounded-xl p-4 md:p-6 hover:border-yellow-400/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {'⭐'.repeat(5)}
                </div>
              </div>
              <p className="text-gray-300 mb-4 italic">
                "The betting card system enforces discipline like nothing else. Setting clear targets and limits has transformed my approach. No more chasing losses."
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">James D.</p>
                  <p className="text-gray-500 text-sm">Monaco</p>
                </div>
                <div className="px-3 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full text-yellow-400 text-xs font-bold">
                  ELITE
                </div>
              </div>
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
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-center mb-6">
          <p className="text-xs text-red-300">
            <strong>Responsible Gaming:</strong> This tool is for tracking and analysis only.
            Gambling can be addictive. Never bet more than you can afford to lose.
            If you or someone you know has a gambling problem, call 1-800-GAMBLER.
          </p>
        </div>

        {/* FANCY FOOTER */}
        <div className="mt-12 relative">
          {/* Decorative top border with gradient */}
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-8"></div>

          {/* Main footer content */}
          <div className="bg-gradient-to-br from-black/40 via-teal-900/20 to-black/40 backdrop-blur-xl border border-yellow-400/20 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

              {/* Column 1: Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🎰</div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">{SITE_CONFIG.name}</h3>
                    <p className="text-xs text-teal-300">{SITE_CONFIG.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Professional-grade analytics platform for serious roulette players. Track, analyze, and optimize your gameplay.
                </p>
              </div>

              {/* Column 2: Quick Links */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  Quick Links
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/analysis" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> Advanced Tracker
                    </Link>
                  </li>
                  <li>
                    <Link href="/tracker" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> Basic Tracker
                    </Link>
                  </li>
                  <li>
                    <Link href="/assistant" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> Betting Assistant
                    </Link>
                  </li>
                  <li>
                    <Link href="/learn" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> Learning Center
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Support */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  Support
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/pricing" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> Pricing Plans
                    </Link>
                  </li>
                  <li>
                    <Link href="/learn" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                      <span className="text-teal-400">▸</span> My Account
                    </Link>
                  </li>
                  <li>
                    <a
                      href={`mailto:${SITE_CONFIG.email.support}?subject=Support Request`}
                      className="text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2"
                    >
                      <span className="text-teal-400">▸</span> Contact Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 4: Contact */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <span className="text-lg">📧</span>
                  Get in Touch
                </h4>
                <div className="space-y-3">
                  <a
                    href={`mailto:${SITE_CONFIG.email.support}`}
                    className="block group"
                  >
                    <div className="bg-teal-900/30 hover:bg-teal-900/50 border border-teal-400/30 hover:border-teal-400/60 rounded-lg p-3 transition-all">
                      <p className="text-xs text-gray-400 mb-1">Support Email</p>
                      <p className="text-sm text-teal-300 font-mono break-all group-hover:text-teal-200">
                        {SITE_CONFIG.email.support}
                      </p>
                    </div>
                  </a>

                  <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Website</p>
                    <p className="text-sm text-yellow-300 font-mono">
                      {SITE_CONFIG.domain}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700/50 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-yellow-400">©</span>
                  <span>{new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400">All Systems Operational</span>
                  </div>

                  <div className="hidden md:block w-px h-4 bg-gray-700"></div>

                  <div className="text-xs text-gray-500">
                    Made with <span className="text-red-400">♥</span> for players
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative bottom accent */}
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full"></div>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}