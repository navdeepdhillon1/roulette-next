// components/SessionSetup.tsx
'use client'

import React, { useState } from 'react'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import type { SessionConfig, BettingSystemConfig, CustomSystemRules, BetAction } from '../types/bettingAssistant'

interface SessionSetupProps {
  onStartSession: (config: SessionConfig) => void
}

const BETTING_SYSTEMS = [
  {
    id: 'flat',
    name: 'Flat Betting',
    description: 'Same bet every time - the safest approach',
    riskLevel: 'low' as const,
    emoji: '📊',
    pros: ['Easiest to manage', 'Lowest risk', 'Predictable'],
    cons: ['No streak capitalization', 'Slow profit growth'],
  },
  {
    id: 'paroli',
    name: 'Paroli',
    description: 'Double after wins, reset after losses',
    riskLevel: 'low' as const,
    emoji: '📈',
    pros: ['Low risk', 'Capitalizes on streaks', 'Losses limited'],
    cons: ['One loss resets progress', 'Needs winning streaks'],
  },
  {
    id: 'dalembert',
    name: "D'Alembert",
    description: '+1 unit after loss, -1 after win',
    riskLevel: 'medium' as const,
    emoji: '⚖️',
    pros: ['Balanced approach', 'Slower progression', 'Gradual recovery'],
    cons: ['Still chases losses', 'Needs more wins than losses'],
  },
  {
    id: 'reverse-dalembert',
    name: 'Reverse D\'Alembert',
    description: '+1 unit after win, -1 after loss',
    riskLevel: 'medium' as const,
    emoji: '🔄',
    pros: ['Rides winning streaks', 'Reduces during cold streaks'],
    cons: ['Needs winning streaks', 'Alternating results limit gains'],
  },
  {
    id: 'martingale',
    name: 'Martingale',
    description: 'Double after every loss - HIGH RISK',
    riskLevel: 'high' as const,
    emoji: '⚠️',
    pros: ['One win recovers all losses', 'Simple to understand'],
    cons: ['EXTREMELY DANGEROUS', 'Can wipe bankroll', 'Exponential growth'],
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    description: 'Follow Fibonacci sequence',
    riskLevel: 'high' as const,
    emoji: '🌀',
    pros: ['Slower than Martingale', 'Mathematical sequence'],
    cons: ['Still high risk', 'Complex tracking', 'Long streaks dangerous'],
  }
]

// Custom System Builder Component
function CustomSystemBuilder({ baseBet, onComplete, onCancel }: { 
  baseBet: number; 
  onComplete: (config: BettingSystemConfig) => void; 
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1)
  const [customRules, setCustomRules] = useState<CustomSystemRules>({
    onWin: 'same',
    onFirstLoss: 'same',
    onSecondLoss: 'same',
    onThirdLoss: 'same',
    maxMultiplier: 8,
    resetAfterWin: false,
    pauseAfterLosses: null
  })

  const applyAction = (action: BetAction, currentBet: number, baseAmount: number): number => {
    if (action === 'same') return currentBet
    if (action === 'double') return currentBet * 2
    if (action === 'reset') return baseAmount
    if (action === 'pause') return currentBet
    if (typeof action === 'object') {
      if (action.type === 'increase') return currentBet + action.amount
      if (action.type === 'multiply') return currentBet * action.factor
    }
    return currentBet
  }

  const calculateRiskLevel = (): 'low' | 'medium' | 'high' => {
    let riskScore = 0
    if (customRules.onWin === 'double') riskScore += 1
    if (customRules.onFirstLoss === 'double') riskScore += 3
    if (customRules.onSecondLoss === 'double') riskScore += 4
    if (customRules.onThirdLoss === 'double') riskScore += 5
    if (customRules.maxMultiplier >= 16) riskScore += 3
    if (!customRules.pauseAfterLosses) riskScore += 2
    
    if (riskScore >= 10) return 'high'
    if (riskScore >= 5) return 'medium'
    return 'low'
  }

  const generateSystemName = (): string => {
    const parts = []
    if (customRules.onWin === 'double') parts.push('Win-Up')
    if (customRules.onFirstLoss === 'double' || customRules.onSecondLoss === 'double') parts.push('Loss-Up')
    if (customRules.resetAfterWin) parts.push('Reset')
    if (parts.length === 0) parts.push('Custom')
    return parts.join(' ') + ' System'
  }

  const previewProgression = () => {
    const baseAmount = baseBet
    let bet = baseAmount
    const steps = []
    
    bet = applyAction(customRules.onWin, bet, baseAmount)
    steps.push({ scenario: 'After 1 Win', bet })
    
    bet = baseAmount
    bet = applyAction(customRules.onFirstLoss, bet, baseAmount)
    steps.push({ scenario: 'After 1 Loss', bet })
    
    bet = applyAction(customRules.onSecondLoss, bet, baseAmount)
    steps.push({ scenario: 'After 2 Losses', bet })
    
    bet = applyAction(customRules.onThirdLoss, bet, baseAmount)
    steps.push({ scenario: 'After 3 Losses', bet })
    
    return steps
  }

  const handleComplete = () => {
    const config: BettingSystemConfig = {
      id: 'custom',
      name: generateSystemName(),
      description: 'Your custom betting system',
      riskLevel: calculateRiskLevel(),
      emoji: '✨',
      baseBet: baseBet,
      currentBet: baseBet,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      isCustom: true,
      customRules
    }
    onComplete(config)
  }

  const renderQuestion = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Question 1: What happens after a WIN? 🎉</h3>
            <div className="space-y-3">
              {[
                { value: 'same', label: 'Keep same bet', desc: 'Consistent - stay at current amount' },
                { value: 'double', label: 'Double the bet', desc: 'Aggressive - ride the winning streak' },
                { value: 'reset', label: 'Reset to base bet', desc: 'Conservative - lock in profit' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setCustomRules({...customRules, onWin: option.value as BetAction})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    customRules.onWin === option.value 
                      ? 'bg-green-600 border-green-400 scale-[1.02]' 
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-white mb-1">{option.label}</div>
                  <div className="text-sm text-gray-300">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Question 2: What happens after 1st LOSS? ❌</h3>
            <div className="space-y-3">
              {[
                { value: 'same', label: 'Keep same bet', desc: 'Safe - maintain position' },
                { value: 'double', label: 'Double the bet', desc: 'Martingale style - recover loss' },
                { value: 'reset', label: 'Reset to base bet', desc: 'Ultra-safe - minimize damage' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setCustomRules({...customRules, onFirstLoss: option.value as BetAction})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    customRules.onFirstLoss === option.value 
                      ? 'bg-orange-600 border-orange-400 scale-[1.02]' 
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-white mb-1">{option.label}</div>
                  <div className="text-sm text-gray-300">{option.desc}</div>
                  {option.value === 'double' && (
                    <div className="text-xs text-yellow-400 mt-2">⚠️ Starting to get risky</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Question 3: What happens after 2nd CONSECUTIVE LOSS? ❌❌</h3>
            <div className="space-y-3">
              {[
                { value: 'same', label: 'Keep current bet', desc: 'Hold the line' },
                { value: 'double', label: 'Double the bet', desc: 'Deep Martingale - getting dangerous' },
                { value: 'reset', label: 'Reset to base bet', desc: 'Cut losses - start fresh' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setCustomRules({...customRules, onSecondLoss: option.value as BetAction})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    customRules.onSecondLoss === option.value 
                      ? 'bg-red-600 border-red-400 scale-[1.02]' 
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-white mb-1">{option.label}</div>
                  <div className="text-sm text-gray-300">{option.desc}</div>
                  {option.value === 'double' && (
                    <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertTriangle size={12} /> Very risky territory
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Question 4: What happens after 3rd CONSECUTIVE LOSS? ❌❌❌</h3>
            <div className="space-y-3">
              {[
                { value: 'same', label: 'Keep current bet', desc: 'Stay the course' },
                { value: 'double', label: 'Double the bet', desc: 'All-in Martingale - EXTREMELY RISKY' },
                { value: 'reset', label: 'Reset to base bet', desc: 'Accept losses - start over' },
                { value: 'pause', label: 'Stop betting', desc: 'Emergency brake - pause card' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setCustomRules({...customRules, onThirdLoss: option.value as BetAction})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    customRules.onThirdLoss === option.value 
                      ? 'bg-red-700 border-red-500 scale-[1.02]' 
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-white mb-1">{option.label}</div>
                  <div className="text-sm text-gray-300">{option.desc}</div>
                  {option.value === 'double' && (
                    <div className="text-xs text-red-300 mt-2 flex items-center gap-1 font-bold">
                      <AlertTriangle size={12} /> DANGER ZONE - Can wipe bankroll
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Question 5: Safety Settings 🛡️</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block font-semibold">Maximum Bet Multiplier</label>
                <div className="grid grid-cols-4 gap-2">
                  {[4, 8, 16, 32].map(mult => (
                    <button
                      key={mult}
                      onClick={() => setCustomRules({...customRules, maxMultiplier: mult})}
                      className={`p-3 rounded-lg font-bold ${
                        customRules.maxMultiplier === mult 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Cap bet at {customRules.maxMultiplier}x base (${baseBet * customRules.maxMultiplier})
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block font-semibold">Reset to base after winning?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomRules({...customRules, resetAfterWin: true})}
                    className={`p-3 rounded-lg font-bold ${
                      customRules.resetAfterWin ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Yes (Safer)
                  </button>
                  <button
                    onClick={() => setCustomRules({...customRules, resetAfterWin: false})}
                    className={`p-3 rounded-lg font-bold ${
                      !customRules.resetAfterWin ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    No (Progressive)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block font-semibold">Auto-pause after consecutive losses?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[null, 3, 5, 7].map(limit => (
                    <button
                      key={limit || 'never'}
                      onClick={() => setCustomRules({...customRules, pauseAfterLosses: limit})}
                      className={`p-3 rounded-lg font-bold ${
                        customRules.pauseAfterLosses === limit 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {limit ? `${limit} losses` : 'Never'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 6:
        const riskLevel = calculateRiskLevel()
        const systemName = generateSystemName()
        const progression = previewProgression()
        
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-4">📋 Your Custom System</h3>
            
            <div className={`p-4 rounded-xl border-2 ${
              riskLevel === 'low' ? 'bg-green-900/30 border-green-500' :
              riskLevel === 'medium' ? 'bg-yellow-900/30 border-yellow-500' :
              'bg-red-900/30 border-red-500'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xl font-bold text-white">{systemName}</h4>
                <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                  riskLevel === 'low' ? 'bg-green-600' :
                  riskLevel === 'medium' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {riskLevel.toUpperCase()} RISK
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">After Win:</span>
                  <span className="text-white font-bold">
                    {customRules.onWin === 'same' ? 'Keep same' : 
                     customRules.onWin === 'double' ? 'Double' : 'Reset to base'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">After 1st Loss:</span>
                  <span className="text-white font-bold">
                    {customRules.onFirstLoss === 'same' ? 'Keep same' : 
                     customRules.onFirstLoss === 'double' ? 'Double' : 'Reset to base'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">After 2nd Loss:</span>
                  <span className="text-white font-bold">
                    {customRules.onSecondLoss === 'same' ? 'Keep same' : 
                     customRules.onSecondLoss === 'double' ? 'Double' : 'Reset to base'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">After 3rd Loss:</span>
                  <span className="text-white font-bold">
                    {customRules.onThirdLoss === 'same' ? 'Keep same' : 
                     customRules.onThirdLoss === 'double' ? 'Double' : 
                     customRules.onThirdLoss === 'reset' ? 'Reset to base' : 'PAUSE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4">
              <h4 className="font-bold text-white mb-3">🔮 Progression Preview (Base: ${baseBet})</h4>
              <div className="space-y-2">
                {progression.map((step, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-300">{step.scenario}:</span>
                    <span className={`font-bold ${
                      step.bet > baseBet * 4 ? 'text-red-400' :
                      step.bet > baseBet * 2 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      ${step.bet} ({(step.bet / baseBet).toFixed(1)}x)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {riskLevel === 'high' && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-red-300 mb-2">⚠️ HIGH RISK WARNING</h4>
                    <p className="text-sm text-red-200">
                      This system can result in large losses. Use strict stop-loss limits and only risk money you can afford to lose.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-2xl border-2 border-purple-500/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <h2 className="text-3xl font-bold text-white mb-2">🛠️ Build Your System</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(s => (
              <div key={s} className={`flex-1 h-2 rounded-full ${
                s < step ? 'bg-white' : s === step ? 'bg-white/70' : 'bg-white/20'
              }`} />
            ))}
          </div>
          <p className="text-white/80 text-sm mt-2">Step {step} of 6</p>
        </div>

        <div className="p-6">
          {renderQuestion()}
        </div>

        <div className="p-6 bg-gray-800/50 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
          >
            Cancel
          </button>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-bold"
            >
              ← Back
            </button>
          )}
          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold"
            >
              ✅ Use This System
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function createBettingSystemConfig(systemId: string, baseBet: number, customConfig?: BettingSystemConfig): BettingSystemConfig {
  if (customConfig) return customConfig
  
  if (systemId === 'custom' && !customConfig) {
    systemId = 'flat'
  }
  
  const system = BETTING_SYSTEMS.find(s => s.id === systemId)!
  return {
    id: systemId,
    name: system.name,
    description: system.description,
    riskLevel: system.riskLevel,
    emoji: system.emoji,
    baseBet,
    currentBet: baseBet,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    sequenceIndex: 0
  }
}

export default function SessionSetup({ onStartSession }: SessionSetupProps) {
  const [bankroll, setBankroll] = useState(1000)
  const [stopProfit, setStopProfit] = useState(200)
  const [stopLoss, setStopLoss] = useState(300)
  const [cardPercent, setCardPercent] = useState(5)
  const [totalCards, setTotalCards] = useState(20)
  const [betMode, setBetMode] = useState<'table' | 'wheel'>('table')
  const [betCategory, setBetCategory] = useState<'common' | 'special'>('common')
  const [selectedSystem, setSelectedSystem] = useState('flat')
  const [baseBet, setBaseBet] = useState(10)
  const [showSystemDetails, setShowSystemDetails] = useState<string | null>(null)
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  const [customSystemConfig, setCustomSystemConfig] = useState<BettingSystemConfig | null>(null)

  const cardTarget = Math.floor((bankroll * cardPercent) / 100)
  const isValidSetup = cardPercent > 0 && cardPercent <= 10 && bankroll > 0 && stopLoss > 0 && stopProfit > 0

  const handleStart = () => {
    if (!isValidSetup) {
      alert('Please check your settings:\n- Card % must be between 1-10%\n- All amounts must be positive')
      return
    }
    
    const config: SessionConfig = {
      bankroll,
      stopProfit,
      stopLoss,
      timeLimit: 120,
      cardTargetAmount: cardTarget,
      totalCards,
      maxBetsPerCard: 15,
      betMode,
      betCategory,
      bettingSystem: customSystemConfig || createBettingSystemConfig(selectedSystem, baseBet),
    }
    onStartSession(config)
  }

  const handleCustomSystemComplete = (config: BettingSystemConfig) => {
    setCustomSystemConfig(config)
    setSelectedSystem('custom')
    setShowCustomBuilder(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-600/20 border border-purple-500/40 rounded-full px-4 py-1 text-xs font-bold text-purple-300">
            v1.2.1 🔒 Feature Locked
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-yellow-400 mb-4 text-center">🎯 Session Setup</h1>
        
        <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 font-semibold">Setup Progress</span>
            <span className="text-sm text-yellow-400 font-bold">4 Steps to Complete</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur rounded-xl border border-yellow-400/30 p-8 space-y-8">
          
          {/* STEP 1: BET TYPE */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border-2 border-blue-500/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xl">1</div>
              <h2 className="text-2xl font-bold text-blue-300">Choose Bet Type</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button onClick={() => setBetMode('table')} className={`p-6 rounded-xl border-2 ${betMode === 'table' ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600'}`}>
                <div className="text-4xl mb-2">🎰</div>
                <div className="text-xl font-bold text-white">Table</div>
              </button>
              <button onClick={() => setBetMode('wheel')} className={`p-6 rounded-xl border-2 ${betMode === 'wheel' ? 'bg-purple-600 border-purple-400' : 'bg-gray-700 border-gray-600'}`}>
                <div className="text-4xl mb-2">⚙️</div>
                <div className="text-xl font-bold text-white">Wheel</div>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setBetCategory('common')} className={`p-5 rounded-xl border-2 ${betCategory === 'common' ? 'bg-green-600 border-green-400' : 'bg-gray-700 border-gray-600'}`}>
                <div className="text-3xl mb-2">✅</div>
                <div className="text-lg font-bold text-white">Common</div>
              </button>
              <button onClick={() => setBetCategory('special')} className={`p-5 rounded-xl border-2 ${betCategory === 'special' ? 'bg-orange-600 border-orange-400' : 'bg-gray-700 border-gray-600'}`}>
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-lg font-bold text-white">Special</div>
              </button>
            </div>
          </div>

          {/* STEP 2: BETTING SYSTEM */}
          <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl p-6 border-2 border-orange-500/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xl">2</div>
              <h2 className="text-2xl font-bold text-orange-300">Select Betting System</h2>
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-gray-300 mb-2 block font-semibold">Base Bet Amount</label>
              <input
                type="number"
                value={baseBet}
                onChange={(e) => setBaseBet(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg text-xl font-bold text-center"
              />
            </div>

            <div className="space-y-3">
              {BETTING_SYSTEMS.map((system) => (
                <div key={system.id}>
                  <button
                    onClick={() => setSelectedSystem(system.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left ${selectedSystem === system.id ? 'bg-orange-600 border-orange-400 scale-[1.02]' : 'bg-gray-700 border-gray-600'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-3xl">{system.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{system.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              system.riskLevel === 'low' ? 'bg-green-600' :
                              system.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {system.riskLevel.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{system.description}</p>
                        </div>
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowSystemDetails(showSystemDetails === system.id ? null : system.id)
                        }}
                        className="text-xs text-blue-400 underline ml-2"
                      >
                        {showSystemDetails === system.id ? 'Hide' : 'Details'}
                      </span>
                    </div>
                  </button>

                  {showSystemDetails === system.id && (
                    <div className="mt-2 ml-4 p-4 bg-black/40 rounded-lg border border-gray-600">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold text-green-400 mb-2">✅ Pros:</p>
                          <ul className="space-y-1 text-gray-300">
                            {system.pros.map((pro, i) => <li key={i}>• {pro}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-bold text-red-400 mb-2">⚠️ Cons:</p>
                          <ul className="space-y-1 text-gray-300">
                            {system.cons.map((con, i) => <li key={i}>• {con}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <button
                onClick={() => setShowCustomBuilder(true)}
                className="w-full p-6 rounded-xl border-2 border-purple-500 bg-gradient-to-r from-purple-900/40 to-pink-900/40 hover:from-purple-900/60 hover:to-pink-900/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🛠️</span>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-bold text-purple-300">Build Custom System</h3>
                    <p className="text-sm text-purple-200/80">Create your own progression rules</p>
                  </div>
                  <ArrowRight className="text-purple-300" size={24} />
                </div>
              </button>
              
              {customSystemConfig && (
                <div className={`p-4 rounded-xl border-2 ${
                  selectedSystem === 'custom' 
                    ? 'bg-purple-600 border-purple-400 scale-[1.02]' 
                    : 'bg-gray-700 border-gray-600'
                } cursor-pointer`}
                  onClick={() => setSelectedSystem('custom')}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">✨</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{customSystemConfig.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          customSystemConfig.riskLevel === 'low' ? 'bg-green-600' :
                          customSystemConfig.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {customSystemConfig.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{customSystemConfig.description}</p>
                      {customSystemConfig.customRules && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className="text-gray-400">
                            <span className="text-green-400">Win:</span> {
                              customSystemConfig.customRules.onWin === 'same' ? 'Keep same' :
                              customSystemConfig.customRules.onWin === 'double' ? 'Double' :
                              customSystemConfig.customRules.onWin === 'reset' ? 'Reset' : 'Custom'
                            } • 
                            <span className="text-orange-400 ml-1">Loss:</span> {
                              customSystemConfig.customRules.onFirstLoss === 'same' ? 'Keep same' :
                              customSystemConfig.customRules.onFirstLoss === 'double' ? 'Double' :
                              customSystemConfig.customRules.onFirstLoss === 'reset' ? 'Reset' : 'Custom'
                            }
                          </div>
                          <div className="text-gray-400">
                            Max: {customSystemConfig.customRules.maxMultiplier}x • 
                            {customSystemConfig.customRules.resetAfterWin && ' Reset after win'}
                            {customSystemConfig.customRules.pauseAfterLosses && ` • Pause after ${customSystemConfig.customRules.pauseAfterLosses} losses`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: SESSION SETTINGS */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border-2 border-green-500/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-xl">3</div>
              <h2 className="text-2xl font-bold text-green-300">Configure Session</h2>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
                💰 Bankroll & Limits
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Starting Bankroll</label>
                  <input 
                    type="number" 
                    value={bankroll} 
                    onChange={(e) => setBankroll(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-center font-bold" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Stop Loss Limit</label>
                  <input 
                    type="number" 
                    value={stopLoss} 
                    onChange={(e) => setStopLoss(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-center font-bold" 
                  />
                  <p className="text-[10px] text-red-400 mt-1">End if down by this</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Profit Target</label>
                  <input 
                    type="number" 
                    value={stopProfit} 
                    onChange={(e) => setStopProfit(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-center font-bold" 
                  />
                  <p className="text-[10px] text-green-400 mt-1">End if up by this</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
                🎴 Card Configuration
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Card Value (% of Bankroll)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={cardPercent} 
                      onChange={(e) => setCardPercent(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className={`text-2xl font-bold ${cardPercent > 10 ? 'text-red-400' : 'text-green-400'}`}>
                      {cardPercent}%
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[3, 5, 7, 10].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setCardPercent(pct)}
                        className={`flex-1 px-2 py-1 rounded text-xs font-bold ${
                          cardPercent === pct ? 'bg-green-600' : 'bg-gray-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  {cardPercent > 10 && (
                    <p className="text-xs text-red-400 mt-2">⚠️ Maximum 10% per card recommended</p>
                  )}
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Number of Cards</label>
                  <input 
                    type="number" 
                    min="5"
                    max="50"
                    value={totalCards} 
                    onChange={(e) => setTotalCards(Math.min(50, Math.max(5, Number(e.target.value))))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-center font-bold mb-2" 
                  />
                  <div className="flex gap-1">
                    {[10, 20, 30].map(num => (
                      <button
                        key={num}
                        onClick={() => setTotalCards(num)}
                        className={`flex-1 px-2 py-1 rounded text-xs font-bold ${
                          totalCards === num ? 'bg-green-600' : 'bg-gray-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mt-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Card Target</p>
                    <p className="text-lg font-bold text-green-400">${cardTarget}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Max Possible Win</p>
                    <p className="text-lg font-bold text-yellow-400">${cardTarget * totalCards}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Cards Available</p>
                    <p className="text-lg font-bold text-blue-400">{totalCards}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Each card worth {cardPercent}% of ${bankroll} = ${cardTarget}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4: START SESSION */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-xl">4</div>
              <h2 className="text-2xl font-bold text-yellow-300">Ready to Begin</h2>
            </div>
            <button onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg font-bold text-xl hover:scale-105 transition-transform shadow-2xl">
              🚀 Start Session
            </button>
          </div>
        </div>
        
        {showCustomBuilder && (
          <CustomSystemBuilder
            baseBet={baseBet}
            onComplete={handleCustomSystemComplete}
            onCancel={() => setShowCustomBuilder(false)}
          />
        )}
      </div>
    </div>
  )
}