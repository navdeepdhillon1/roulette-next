import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap, Award, AlertTriangle, BarChart3 } from 'lucide-react';
import CompletePerformanceTab from './CompletePerformanceTab';
import DealerStats from './DealerStats';

interface BetCard {
  id: string;
  cardNumber: number;
  target: number;
  maxBets: number;
  bets: any[];
  status: 'locked' | 'active' | 'completed' | 'failed';
  currentTotal: number;
  betsUsed: number;
  startTime: Date | null;
}

interface SessionConfig {
  bankroll: number;
  stopProfit: number;
  stopLoss: number;
  cardTargetAmount: number;
  totalCards: number;
  bettingSystem: {
    id: string;
    name: string;
    baseBet: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface SessionState {
  id: string;
  config: SessionConfig;
  cards: BetCard[];
  currentCardIndex: number;
  currentBankroll: number;
  totalWagered: number;
  totalReturned: number;
}

interface Props {
  session: SessionState;
}

export default function BettingAssistantPerformance({ session }: Props) {
  const [selectedView, setSelectedView] = useState<'overview' | 'cards' | 'system' | 'dealers'>('overview');

  // Safety check
  if (!session || !session.cards || !session.config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Session Data</h2>
          <p className="text-gray-400">Start a betting session to see performance metrics.</p>
        </div>
      </div>
    );
  }

  // Calculate overall stats with safety checks
  const completedCards = session.cards?.filter(c => c.status === 'completed') || [];
  const failedCards = session.cards?.filter(c => c.status === 'failed') || [];
  const activeCard = session.cards?.find(c => c.status === 'active');
  
  const totalSpins = session.cards?.reduce((sum, card) => sum + (card.bets?.length || 0), 0) || 0;
  const netProfit = (session.currentBankroll || 0) - (session.config?.bankroll || 0);
  const roi = (session.totalWagered || 0) > 0 ? ((netProfit / session.totalWagered) * 100) : 0;
  const winRate = totalSpins > 0 
    ? ((session.cards?.reduce((sum, card) => 
        sum + (card.bets?.filter(b => b.totalPnL > 0)?.length || 0), 0) || 0) / totalSpins * 100)
    : 0;

  // Betting system performance
  const avgBetSize = totalSpins > 0 ? (session.totalWagered || 0) / totalSpins : 0;
  const allBets = session.cards?.flatMap(c => c.bets || []) || [];
  const largestWin = allBets.length > 0 ? Math.max(...allBets.map(b => b.totalPnL || 0), 0) : 0;
  const largestLoss = allBets.length > 0 ? Math.min(...allBets.map(b => b.totalPnL || 0), 0) : 0;

  // Card statistics
  const cardsNotLocked = session.cards?.filter(c => c.status !== 'locked') || [];
  const cardSuccessRate = cardsNotLocked.length > 0
    ? (completedCards.length / cardsNotLocked.length * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">📊 Performance Dashboard</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-gray-400">Session ID: {session.id.slice(-8)}</p>
            {session.config?.casinoName && (
              <>
                <span className="text-gray-600">•</span>
                <p className="text-cyan-400 font-semibold">🎰 {session.config.casinoName}</p>
              </>
            )}
            {session.config?.dealerName && (
              <>
                <span className="text-gray-600">•</span>
                <p className="text-green-400 font-semibold">👤 {session.config.dealerName}</p>
              </>
            )}
            {session.config?.tableNumber && (
              <>
                <span className="text-gray-600">•</span>
                <p className="text-purple-400 font-semibold">🎲 Table {session.config.tableNumber}</p>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800/50 rounded-xl p-2 mb-6 flex gap-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
              selectedView === 'overview'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            📈 Overview
          </button>
          <button
            onClick={() => setSelectedView('cards')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
              selectedView === 'cards'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            🎴 Card Analysis
          </button>
          <button
            onClick={() => setSelectedView('system')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
              selectedView === 'system'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            ⚙️ System Stats
          </button>
          <button
            onClick={() => setSelectedView('dealers')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
              selectedView === 'dealers'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            🎰 Dealer Stats
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className={`rounded-xl p-6 border-2 ${
                netProfit >= 0 
                  ? 'bg-green-900/30 border-green-500' 
                  : 'bg-red-900/30 border-red-500'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                  <span className="text-sm text-gray-400">Net Profit</span>
                </div>
                <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Starting: ${session.config.bankroll} → Current: ${session.currentBankroll.toFixed(2)}
                </div>
              </div>

              <div className="bg-blue-900/30 border-2 border-blue-500 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="text-blue-400" />
                  <span className="text-sm text-gray-400">ROI</span>
                </div>
                <div className={`text-4xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Wagered: ${session.totalWagered.toFixed(2)}
                </div>
              </div>

              <div className="bg-purple-900/30 border-2 border-purple-500 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-purple-400" />
                  <span className="text-sm text-gray-400">Win Rate</span>
                </div>
                <div className="text-4xl font-bold text-purple-400">
                  {winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {session.cards?.reduce((sum, c) => sum + (c.bets?.filter(b => b.totalPnL > 0)?.length || 0), 0) || 0} wins / {totalSpins} spins
                </div>
              </div>

              <div className="bg-orange-900/30 border-2 border-orange-500 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-orange-400" />
                  <span className="text-sm text-gray-400">Cards</span>
                </div>
                <div className="text-4xl font-bold text-orange-400">
                  {completedCards.length}/{session.config?.totalCards || session.cards?.length || 0}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Success: {cardSuccessRate.toFixed(0)}% • Failed: {failedCards.length}
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="text-yellow-400" />
                  Session Configuration
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Betting System:</span>
                    <span className="font-bold text-white">{session.config?.bettingSystem?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Bet:</span>
                    <span className="font-bold text-white">${session.config?.bettingSystem?.baseBet || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className={`font-bold px-2 py-1 rounded text-xs ${
                      session.config?.bettingSystem?.riskLevel === 'low' ? 'bg-green-600' :
                      session.config?.bettingSystem?.riskLevel === 'medium' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {session.config?.bettingSystem?.riskLevel?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Card Target:</span>
                    <span className="font-bold text-white">${session.config?.cardTargetAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stop Loss:</span>
                    <span className="font-bold text-red-400">${session.config?.stopLoss || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stop Profit:</span>
                    <span className="font-bold text-green-400">${session.config?.stopProfit || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" />
                  Betting Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Spins:</span>
                    <span className="font-bold text-white">{totalSpins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Bet Size:</span>
                    <span className="font-bold text-white">${avgBetSize.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Largest Win:</span>
                    <span className="font-bold text-green-400">+${largestWin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Largest Loss:</span>
                    <span className="font-bold text-red-400">${largestLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Wagered:</span>
                    <span className="font-bold text-blue-400">${session.totalWagered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Returned:</span>
                    <span className="font-bold text-cyan-400">${session.totalReturned.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {((netProfit <= -(session.config?.stopLoss || 0) * 0.8) || (netProfit >= (session.config?.stopProfit || 0) * 0.8)) && (
              <div className={`rounded-xl p-4 border-2 flex items-start gap-3 ${
                netProfit <= -(session.config?.stopLoss || 0) * 0.8
                  ? 'bg-red-900/30 border-red-500'
                  : 'bg-green-900/30 border-green-500'
              }`}>
                <AlertTriangle className={netProfit <= -(session.config?.stopLoss || 0) * 0.8 ? 'text-red-400' : 'text-green-400'} size={24} />
                <div>
                  <h4 className={`font-bold mb-1 ${netProfit <= -(session.config?.stopLoss || 0) * 0.8 ? 'text-red-300' : 'text-green-300'}`}>
                    {netProfit <= -(session.config?.stopLoss || 0) * 0.8 ? '⚠️ Approaching Stop Loss' : '🎉 Approaching Profit Target'}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {netProfit <= -(session.config?.stopLoss || 0) * 0.8
                      ? `You're at ${Math.abs(netProfit).toFixed(2)} loss. Stop loss is set at ${session.config?.stopLoss || 0}.`
                      : `You're at +${netProfit.toFixed(2)} profit. Target is ${session.config?.stopProfit || 0}.`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
       {/* CARDS TAB - NEW ANALYTICS */}
{selectedView === 'cards' && (
  <CompletePerformanceTab session={session} />
)}
    

        {/* SYSTEM STATS TAB */}
        {selectedView === 'system' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Betting System Analysis</h2>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {session.config?.bettingSystem?.name || 'Betting System'} Performance
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">System Type</div>
                  <div className="text-lg font-bold text-white">{session.config?.bettingSystem?.name || 'N/A'}</div>
                  <div className={`text-xs mt-2 px-2 py-1 rounded font-bold inline-block ${
                    session.config?.bettingSystem?.riskLevel === 'low' ? 'bg-green-600' :
                    session.config?.bettingSystem?.riskLevel === 'medium' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {session.config?.bettingSystem?.riskLevel?.toUpperCase() || 'N/A'} RISK
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Base Bet</div>
                  <div className="text-2xl font-bold text-yellow-400">${session.config?.bettingSystem?.baseBet || 0}</div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">System ROI</div>
                  <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-bold text-blue-300 mb-3">System Effectiveness</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Spins Played:</span>
                    <span className="font-bold text-white">{totalSpins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Winning Spins:</span>
                    <span className="font-bold text-green-400">
                      {session.cards?.reduce((sum, c) => sum + (c.bets?.filter(b => b.totalPnL > 0)?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losing Spins:</span>
                    <span className="font-bold text-red-400">
                      {session.cards?.reduce((sum, c) => sum + (c.bets?.filter(b => b.totalPnL < 0)?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Break-Even Spins:</span>
                    <span className="font-bold text-gray-400">
                      {session.cards?.reduce((sum, c) => sum + (c.bets?.filter(b => b.totalPnL === 0)?.length || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {session.config?.bettingSystem?.riskLevel === 'high' && netProfit < 0 && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-red-300 mb-2">⚠️ High Risk System Warning</h4>
                    <p className="text-sm text-red-200">
                      You're using a high-risk betting system ({session.config?.bettingSystem?.name || 'Unknown'}) and currently down ${Math.abs(netProfit).toFixed(2)}. 
                      High-risk systems can lead to rapid bankroll depletion. Consider switching to a lower-risk system or taking a break.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEALER STATS TAB */}
        {selectedView === 'dealers' && (
          <DealerStats />
        )}
      </div>
    </div>
  );
}