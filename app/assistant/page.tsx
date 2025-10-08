'use client';

import Navigation from '@/components/Navigation';

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            🎯 Betting Assistant
          </h1>
          <p className="text-gray-400 text-xl">Coming Soon - AI-Powered Betting Strategy Helper</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Strategy Analysis</h3>
            <p className="text-gray-300 text-sm">
              Analyze your betting patterns and get personalized recommendations for improving your approach.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Bankroll Manager</h3>
            <p className="text-gray-300 text-sm">
              Set betting limits, track your bankroll in real-time, and get alerts when approaching your limits.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-yellow-400/30 p-6">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">AI Suggestions</h3>
            <p className="text-gray-300 text-sm">
              Get data-driven betting suggestions based on current trends, hot/cold numbers, and statistical analysis.
            </p>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-400/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">Feature Under Development</h2>
          <p className="text-gray-300 mb-6">
            The Betting Assistant is currently being built. It will integrate seamlessly with the Advanced Analysis 
            system to provide intelligent betting recommendations.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/simulator"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
            >
              Try Practice Simulator
            </a>
            <a 
              href="/analysis"
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition-all"
            >
              Use Advanced Analysis
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}