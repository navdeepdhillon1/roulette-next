// components/SessionSetup.tsx
// Force recompile - debugging Elite access
'use client'

import React, { useState } from 'react'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import type { SessionConfig, BettingSystemConfig, CustomSystemRules, BetAction, SequentialProgressionRules, SelectedGroup, Dealer } from '../types/bettingAssistant'
import SessionLocationSelector from './SessionLocationSelector'
import GroupSelector from './GroupSelector'

interface SessionSetupProps {
  onStartSession: (
    config: SessionConfig,
    locationData?: {
      casinoId: string | null
      casinoName?: string | null
      dealerId: string | null
      dealerName?: string | null
      tableNumber: string | null
      availableDealers?: Dealer[]
    }
  ) => void
  userId: string | null
  hasEliteAccess: boolean
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
  const [systemType, setSystemType] = useState<'outcome' | 'sequential' | null>(null)

  // OLD: Outcome-based system state
  const [customRules, setCustomRules] = useState<CustomSystemRules>({
    onWin: 'same',
    onFirstLoss: 'same',
    onSecondLoss: 'same',
    onThirdLoss: 'same',
    maxMultiplier: 8,
    resetAfterWin: false,
    pauseAfterLosses: null
  })

  // NEW: Sequential progression system state
  const [sequentialRules, setSequentialRules] = useState<SequentialProgressionRules>({
    sequence: [1, 1, 2, 2, 4, 4, 8, 8],
    onWin: 'reset',
    onLoss: 'moveForward1',
    resetAfterConsecutiveWins: 2,
    atSequenceEnd: 'stay',
    currentPosition: 0
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
    if (systemType === 'outcome') {
      // OLD: Outcome-based system
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
    } else if (systemType === 'sequential') {
      // NEW: Sequential progression system
      const config: BettingSystemConfig = {
        id: 'custom-sequential',
        name: 'Custom Sequential',
        description: 'Your custom sequential progression',
        riskLevel: 'medium', // Will calculate based on sequence
        emoji: '🔢',
        baseBet: baseBet,
        currentBet: baseBet,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        isCustom: true,
        sequentialRules
      }
      onComplete(config)
    }
  }

  const renderQuestion = () => {
    // Step 1: Choose system type
    if (step === 1) {
      return (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white mb-2 text-center">Choose Your System Type</h3>
          <p className="text-gray-300 text-center mb-6">Select how you want to build your custom betting system</p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSystemType('outcome')
                setStep(2)
              }}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                systemType === 'outcome'
                  ? 'bg-blue-600 border-blue-400'
                  : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2">Outcome-Based System</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Define actions based on consecutive wins and losses
                  </p>
                  <div className="text-xs text-gray-400">
                    • What to do after 1st, 2nd, 3rd win/loss<br/>
                    • Good for traditional systems (Martingale, Paroli, etc.)<br/>
                    • Safety limits and auto-pause options
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setSystemType('sequential')
                setStep(2)
              }}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                systemType === 'sequential'
                  ? 'bg-purple-600 border-purple-400'
                  : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔢</div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2">Sequential Progression System</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Create a custom sequence of bet multipliers
                  </p>
                  <div className="text-xs text-gray-400">
                    • Define your own progression sequence (e.g., 1, 1, 2, 2, 4, 4, 8, 8)<br/>
                    • Set movement rules (what happens on win/loss)<br/>
                    • Perfect for modified Martingale strategies
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )
    }

    // Outcome-based system steps (old system - unchanged)
    if (systemType === 'outcome') {
      switch(step) {
        case 2:
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

      case 3:
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

      case 4:
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

      case 5:
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

      case 6:
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

      case 7:
        const riskLevel = calculateRiskLevel()
        const systemName = generateSystemName()
        const progression = previewProgression()

        // Calculate worst-case scenario
        const maxPotentialBet = baseBet * customRules.maxMultiplier
        const lossesToReachMax = Math.log2(customRules.maxMultiplier)

        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-4">📋 Your Custom System</h3>

            {/* Safety Disclaimer */}
            <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-300 mb-2">Important: This is for Learning & Entertainment Only</h4>
                  <p className="text-sm text-yellow-100 mb-2">
                    No betting system can overcome the house edge. Custom systems help you:
                  </p>
                  <ul className="text-xs text-yellow-200 space-y-1 list-disc list-inside">
                    <li>Understand risk vs reward tradeoffs</li>
                    <li>Practice discipline with structured rules</li>
                    <li>Experiment with different progression strategies</li>
                    <li>Learn when systems fail (most of the time)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bankroll Warning if needed */}
            {maxPotentialBet > baseBet * 16 && (
              <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚨</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-300 mb-2">High Risk Warning!</h4>
                    <p className="text-sm text-red-100">
                      Your system can reach <span className="font-bold text-white">${maxPotentialBet}</span> per bet ({customRules.maxMultiplier}x multiplier).
                      After just <span className="font-bold text-white">{Math.ceil(lossesToReachMax)} consecutive losses</span>, you'll be betting maximum.
                    </p>
                    <p className="text-xs text-red-200 mt-2">
                      💡 Consider: Lower max multiplier (8x or 4x) or ensure your bankroll can handle ${maxPotentialBet * 5} minimum.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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

    // NEW: Sequential progression system steps
    if (systemType === 'sequential') {
      switch(step) {
        case 2:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Step 1: Choose or Create Your Sequence 🔢</h3>
              <p className="text-gray-300 text-sm mb-4">Select a preset sequence or create your own</p>

              <div className="space-y-3">
                {[
                  { name: 'Slow Martingale', seq: [1, 1, 2, 2, 4, 4, 8, 8], desc: 'Stay twice at each level' },
                  { name: 'Classic Martingale', seq: [1, 2, 4, 8, 16, 32], desc: 'Traditional doubling' },
                  { name: 'Fibonacci', seq: [1, 1, 2, 3, 5, 8, 13], desc: 'Mathematical sequence' },
                  { name: 'Conservative', seq: [1, 1, 1, 2, 2, 3], desc: 'Minimal risk progression' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSequentialRules({...sequentialRules, sequence: preset.seq})}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      JSON.stringify(sequentialRules.sequence) === JSON.stringify(preset.seq)
                        ? 'bg-purple-600 border-purple-400 scale-[1.02]'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white mb-1">{preset.name}</div>
                        <div className="text-xs text-gray-300 mb-2">{preset.desc}</div>
                        <div className="text-xs text-gray-400">
                          Sequence: {preset.seq.join(' → ')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )

        case 3:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Step 2: What Happens on a WIN? 🎉</h3>

              <div className="space-y-3">
                {[
                  { value: 'reset', label: 'Reset to start', desc: 'Go back to position 1 (safest)' },
                  { value: 'moveBack1', label: 'Move back 1 position', desc: 'Step back in sequence' },
                  { value: 'moveBack2', label: 'Move back 2 positions', desc: 'Jump back 2 steps' },
                  { value: 'stay', label: 'Stay at current position', desc: 'Don\'t change position' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSequentialRules({...sequentialRules, onWin: option.value as any})}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      sequentialRules.onWin === option.value
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

        case 4:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Step 3: What Happens on a LOSS? ❌</h3>

              <div className="space-y-3">
                {[
                  { value: 'moveForward1', label: 'Move forward 1 position', desc: 'Advance to next step (standard)' },
                  { value: 'moveForward2', label: 'Move forward 2 positions', desc: 'Skip ahead 2 steps (aggressive)' },
                  { value: 'stay', label: 'Stay at current position', desc: 'Don\'t advance' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSequentialRules({...sequentialRules, onLoss: option.value as any})}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      sequentialRules.onLoss === option.value
                        ? 'bg-red-600 border-red-400 scale-[1.02]'
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

        case 5:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Step 4: Safety Rules 🛡️</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block font-semibold">Auto-reset after consecutive wins?</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[null, 2, 3, 5, 7].map((wins) => (
                      <button
                        key={wins || 'never'}
                        onClick={() => setSequentialRules({...sequentialRules, resetAfterConsecutiveWins: wins || undefined})}
                        className={`p-3 rounded-lg font-bold ${
                          sequentialRules.resetAfterConsecutiveWins === wins
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {wins ? `${wins} wins` : 'Never'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Reset to start after this many consecutive wins
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block font-semibold">What to do at end of sequence?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'stay', label: 'Stay at Last', desc: 'Cap the risk' },
                      { value: 'reset', label: 'Reset to Start', desc: 'Start over' },
                      { value: 'pause', label: 'Pause Betting', desc: 'Stop automatically' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSequentialRules({...sequentialRules, atSequenceEnd: option.value as any})}
                        className={`p-3 rounded-lg text-left ${
                          sequentialRules.atSequenceEnd === option.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        <div className="font-bold text-sm">{option.label}</div>
                        <div className="text-xs opacity-80">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )

        case 6:
          // Calculate max bet from sequence
          const maxSeqBet = Math.max(...sequentialRules.sequence) * baseBet
          const minSeqBet = Math.min(...sequentialRules.sequence) * baseBet

          return (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4">📋 Your Sequential System</h3>

              {/* Safety Disclaimer */}
              <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-300 mb-2">Educational Purpose Only</h4>
                    <p className="text-sm text-yellow-100">
                      Sequential progressions are for learning risk management and testing discipline.
                      The house edge always wins long-term. Use this to understand how progression systems work, not to "beat" roulette.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bankroll Warning */}
              {maxSeqBet > baseBet * 8 && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚨</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-300 mb-2">Risk Analysis</h4>
                      <p className="text-sm text-red-100">
                        Your sequence ranges from <span className="font-bold text-white">${minSeqBet}</span> to <span className="font-bold text-white">${maxSeqBet}</span>.
                        {' '}Ensure your bankroll can handle at least <span className="font-bold text-white">${maxSeqBet * 10}</span> for safety.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-purple-900/30 border-2 border-purple-500 rounded-xl p-4">
                <h4 className="text-xl font-bold text-white mb-3">Sequence Preview</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sequentialRules.sequence.map((mult, idx) => (
                    <div key={idx} className="bg-purple-600 px-3 py-2 rounded-lg">
                      <div className="text-xs text-purple-200">Pos {idx + 1}</div>
                      <div className="text-lg font-bold text-white">{mult}x</div>
                      <div className="text-xs text-purple-200">${baseBet * mult}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">On Win:</span>
                    <span className="text-white font-bold">
                      {sequentialRules.onWin === 'reset' ? 'Reset to start' :
                       sequentialRules.onWin === 'moveBack1' ? 'Move back 1' :
                       sequentialRules.onWin === 'moveBack2' ? 'Move back 2' : 'Stay'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">On Loss:</span>
                    <span className="text-white font-bold">
                      {sequentialRules.onLoss === 'moveForward1' ? 'Move forward 1' :
                       sequentialRules.onLoss === 'moveForward2' ? 'Move forward 2' : 'Stay'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Auto-reset:</span>
                    <span className="text-white font-bold">
                      {sequentialRules.resetAfterConsecutiveWins ? `After ${sequentialRules.resetAfterConsecutiveWins} wins` : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">At sequence end:</span>
                    <span className="text-white font-bold">
                      {sequentialRules.atSequenceEnd === 'stay' ? 'Stay at last' :
                       sequentialRules.atSequenceEnd === 'reset' ? 'Reset to start' : 'Pause betting'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-4">
                <h4 className="font-bold text-white mb-3">Example Progression</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Start: ${baseBet} ({sequentialRules.sequence[0]}x)</div>
                  <div>Loss → ${baseBet * sequentialRules.sequence[1]} ({sequentialRules.sequence[1]}x)</div>
                  <div>Loss → ${baseBet * sequentialRules.sequence[2]} ({sequentialRules.sequence[2]}x)</div>
                  <div>Win → {sequentialRules.onWin === 'reset' ? `${baseBet} (reset)` : `Move back in sequence`}</div>
                </div>
              </div>
            </div>
          )
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-2xl border-2 border-purple-500/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <h2 className="text-3xl font-bold text-white mb-2">🛠️ Build Your System</h2>
          <div className="flex gap-2">
            {Array.from({ length: systemType === 'outcome' ? 7 : systemType === 'sequential' ? 6 : 1 }).map((_, i) => {
              const s = i + 1
              return (
                <div key={s} className={`flex-1 h-2 rounded-full ${
                  s < step ? 'bg-white' : s === step ? 'bg-white/70' : 'bg-white/20'
                }`} />
              )
            })}
          </div>
          <p className="text-white/80 text-sm mt-2">
            Step {step} of {systemType === 'outcome' ? 7 : systemType === 'sequential' ? 6 : 1}
          </p>
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
          {(() => {
            const maxStep = systemType === 'outcome' ? 7 : systemType === 'sequential' ? 6 : 1
            const isLastStep = step >= maxStep

            if (step === 1 || !isLastStep) {
              return null // On step 1, clicking a choice advances automatically
            }

            return (
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold"
              >
                ✅ Use This System
              </button>
            )
          })()}
          {step > 1 && step < (systemType === 'outcome' ? 7 : systemType === 'sequential' ? 6 : 1) && (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={20} />
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

export default function SessionSetup({ onStartSession, userId, hasEliteAccess }: SessionSetupProps) {
  const [bankroll, setBankroll] = useState(1000)
  const [stopProfit, setStopProfit] = useState(200)
  const [stopLoss, setStopLoss] = useState(300)
  const [useCards, setUseCards] = useState(true)
  const [cardPercent, setCardPercent] = useState(5)
  const [totalCards, setTotalCards] = useState(20)
  const [selectedSystem, setSelectedSystem] = useState('flat')
  const [baseBet, setBaseBet] = useState(10)
  const [showSystemDetails, setShowSystemDetails] = useState<string | null>(null)
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  const [customSystemConfig, setCustomSystemConfig] = useState<BettingSystemConfig | null>(null)
  const [showSectionHelp, setShowSectionHelp] = useState<{
    bankroll?: boolean
    cardConfig?: boolean
    customSystem?: boolean
    location?: boolean
    myGroups?: boolean
  }>({})

  // 🆕 Location data for Elite tier cloud storage
  const [locationData, setLocationData] = useState<{
    casinoId: string | null
    casinoName: string | null
    dealerId: string | null
    dealerName: string | null
    tableNumber: string | null
    availableDealers: Dealer[]
  }>({
    casinoId: null,
    casinoName: null,
    dealerId: null,
    dealerName: null,
    tableNumber: null,
    availableDealers: [],
  })

  // 🆕 Group selection for "My Groups" layout
  const [selectedGroups, setSelectedGroups] = useState<SelectedGroup[]>([])

  const cardTarget = Math.floor((bankroll * cardPercent) / 100)
  const isValidSetup = useCards
    ? (cardPercent > 0 && cardPercent <= 10 && bankroll > 0 && stopLoss > 0 && stopProfit > 0)
    : (bankroll > 0 && stopLoss > 0 && stopProfit > 0)

  const handleStart = () => {
    if (!isValidSetup) {
      const message = useCards
        ? 'Please check your settings:\n- Card % must be between 1-10%\n- All amounts must be positive'
        : 'Please check your settings:\n- All amounts must be positive'
      alert(message)
      return
    }

    const config: SessionConfig = {
      bankroll,
      stopProfit,
      stopLoss,
      timeLimit: 120,
      useCards,
      cardTargetAmount: cardTarget,
      totalCards,
      maxBetsPerCard: 15,
      bettingSystem: customSystemConfig || createBettingSystemConfig(selectedSystem, baseBet),
      selectedGroups: selectedGroups.length > 0 ? selectedGroups : undefined,
      historyLayout: selectedGroups.length > 0 ? 'my-groups' : 'table',
    }

    onStartSession(config, {
      casinoId: locationData.casinoId,
      casinoName: locationData.casinoName,
      dealerId: locationData.dealerId,
      dealerName: locationData.dealerName,
      tableNumber: locationData.tableNumber,
      availableDealers: locationData.availableDealers,
    })
  }

  const handleCustomSystemComplete = (config: BettingSystemConfig) => {
    setCustomSystemConfig(config)
    setSelectedSystem('custom')
    setShowCustomBuilder(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0B5345] to-[#0A0E27] p-4 relative overflow-hidden">
      {/* Subtle yellow accent overlay */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-yellow-600/8 via-transparent to-transparent pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-center mb-2">
          <div className="bg-purple-600/20 border border-purple-500/40 rounded-full px-3 py-0.5 text-xs font-bold text-purple-300">
            v1.2.1 🔒 Feature Locked
          </div>
        </div>

        <h1 className="text-3xl font-bold text-yellow-400 mb-3 text-center">🎯 Session Setup</h1>

        <div className="bg-black/40 backdrop-blur rounded-lg border border-yellow-400/30 p-2 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-semibold">Setup Progress</span>
            <span className="text-xs text-yellow-400 font-bold">3 Steps to Complete</span>
          </div>
          <div className="flex gap-1">
            <div className="flex-1 h-1.5 bg-orange-500 rounded-full"></div>
            <div className="flex-1 h-1.5 bg-cyan-500 rounded-full"></div>
            <div className="flex-1 h-1.5 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur rounded-lg border border-yellow-400/30 p-4 space-y-4">

          {/* STEP 1: BETTING SYSTEM */}
          <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg p-3 border border-orange-500/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm">1</div>
              <h2 className="text-lg font-bold text-orange-300">Select Betting System</h2>
            </div>

            <div className="space-y-2">
              {BETTING_SYSTEMS.map((system) => (
                <div key={system.id}>
                  <button
                    onClick={() => setSelectedSystem(system.id)}
                    className={`w-full p-2 rounded-lg border text-left ${selectedSystem === system.id ? 'bg-orange-600 border-orange-400' : 'bg-gray-700 border-gray-600'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-xl">{system.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="text-sm font-bold text-white">{system.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              system.riskLevel === 'low' ? 'bg-green-600' :
                              system.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {system.riskLevel.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">{system.description}</p>
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

              {/* Custom System Help Details */}
              <div className="mb-2 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-purple-300">🛠️ Custom Betting Systems</h4>
                  <button
                    onClick={() => setShowSectionHelp(prev => ({ ...prev, customSystem: !prev.customSystem }))}
                    className="text-xs text-blue-400 underline hover:text-blue-300"
                  >
                    {showSectionHelp.customSystem ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {showSectionHelp.customSystem && (
                  <div className="p-3 bg-black/40 rounded-lg border border-purple-500/30">
                    <p className="text-xs text-purple-300 font-bold mb-2">📚 What Are Custom Systems?</p>
                    <p className="text-xs text-gray-300 mb-3">
                      Custom systems let you design your own progression rules. Instead of using predefined systems like Martingale or Fibonacci, you control exactly what happens after wins and losses.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <p className="font-bold text-green-400 mb-2">✅ When to Use:</p>
                        <ul className="space-y-1 text-gray-300">
                          <li>• You have a proven strategy to test</li>
                          <li>• Pre-built systems don't fit your style</li>
                          <li>• You want specific risk control</li>
                          <li>• Experimenting with new ideas</li>
                          <li>• You understand progression risks</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-red-400 mb-2">⚠️ Important Warnings:</p>
                        <ul className="space-y-1 text-gray-300">
                          <li>• Test with small bets first</li>
                          <li>• Always set max multiplier cap</li>
                          <li>• Aggressive progressions = high risk</li>
                          <li>• Can drain bankroll quickly</li>
                          <li>• No system guarantees wins</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-2 bg-orange-900/30 rounded border border-orange-500/30 mb-3">
                      <p className="text-xs text-orange-300 font-bold mb-1">💡 Design Tips:</p>
                      <p className="text-xs text-gray-300">
                        <span className="text-white font-bold">Conservative:</span> Keep same bet on win, increase 1x on loss, max 4x
                        <br/><span className="text-white font-bold">Balanced:</span> Double on 2nd loss, reset on win, max 8x
                        <br/><span className="text-white font-bold">Aggressive:</span> Double on every loss, keep same on win, max 16x
                        <br/><span className="text-red-400 font-bold">⚠️ Very Risky:</span> Double on loss, double on win, max 32x (not recommended)
                      </p>
                    </div>

                    <div className="p-2 bg-blue-900/30 rounded border border-blue-500/30 mb-3">
                      <p className="text-xs text-blue-300 font-bold mb-1">🎯 Example Custom System:</p>
                      <p className="text-xs text-gray-300">
                        <span className="text-white font-bold">Goal:</span> Recover losses slowly while protecting wins
                        <br/><span className="text-white font-bold">On Win:</span> Reset to base bet (lock in profits)
                        <br/><span className="text-white font-bold">On 1st Loss:</span> Keep same (give it another chance)
                        <br/><span className="text-white font-bold">On 2nd Loss:</span> Double (start recovery)
                        <br/><span className="text-white font-bold">On 3rd Loss:</span> Double again (final push)
                        <br/><span className="text-white font-bold">Max Multiplier:</span> 8x (stop at 8× base bet)
                        <br/>→ <span className="text-green-400">Conservative recovery with controlled risk</span>
                      </p>
                    </div>

                    <div className="p-2 bg-red-900/30 rounded border border-red-500/30">
                      <p className="text-xs text-red-300 font-bold mb-1">🚨 Common Mistakes:</p>
                      <ul className="space-y-1 text-xs text-gray-300">
                        <li>• No max multiplier set → Unlimited risk</li>
                        <li>• Doubling on both wins AND losses → Exponential growth</li>
                        <li>• Too aggressive too quickly → Bankroll depletion</li>
                        <li>• Not testing with small amounts first</li>
                        <li>• Ignoring the max multiplier cap during session</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

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

          {/* STEP 2: LOCATION TRACKING (Elite Tier Only) */}
          {hasEliteAccess ? (
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-lg p-3 border border-cyan-500/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xs">2</div>
                  <h2 className="text-lg font-bold text-cyan-300">Session Location (Elite)</h2>
                </div>
                <button
                  onClick={() => setShowSectionHelp(prev => ({ ...prev, location: !prev.location }))}
                  className="text-xs text-blue-400 underline hover:text-blue-300"
                >
                  {showSectionHelp.location ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {showSectionHelp.location && (
                <div className="mb-3 p-3 bg-black/40 rounded-lg border border-cyan-500/30">
                  <p className="text-xs text-cyan-300 font-bold mb-2">📍 Why Track Casino & Dealer?</p>
                  <p className="text-xs text-gray-300 mb-3">
                    Tracking your location and dealer helps you identify patterns across different environments and analyze performance by venue and dealer.
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div>
                      <p className="font-bold text-green-400 mb-2">✅ Benefits:</p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Identify which casinos are profitable</li>
                        <li>• Track dealer patterns over time</li>
                        <li>• Cloud sync across devices (Elite)</li>
                        <li>• Historical performance analytics</li>
                        <li>• Compare venues side-by-side</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-orange-400 mb-2">💡 Use Cases:</p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• "I do better at Casino A"</li>
                        <li>• "Dealer 3 has more hot streaks"</li>
                        <li>• "Avoid table 7 on weekends"</li>
                        <li>• "Track performance across cities"</li>
                        <li>• "Build dealer-specific strategies"</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-2 bg-cyan-900/30 rounded border border-cyan-500/30">
                    <p className="text-xs text-cyan-300 font-bold mb-1">🔒 Elite Feature:</p>
                    <p className="text-xs text-gray-300">
                      Your session data is stored in the cloud and synced across all your devices. Review historical sessions, export detailed reports, and analyze trends over months or years.
                    </p>
                  </div>
                </div>
              )}

              <SessionLocationSelector
                userId={userId || '9d399518-2d1d-4eb7-a5df-21f649359643'}
                onSelect={setLocationData}
              />
            </div>
          ) : null}

          {/* STEP 3.5: SELECT GROUPS FOR MY GROUPS LAYOUT */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-3 border border-purple-500/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center font-bold text-xs">⭐</div>
                <h2 className="text-lg font-bold text-purple-300">My Groups (Optional)</h2>
              </div>
              <button
                onClick={() => setShowSectionHelp(prev => ({ ...prev, myGroups: !prev.myGroups }))}
                className="text-xs text-blue-400 underline hover:text-blue-300"
              >
                {showSectionHelp.myGroups ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {showSectionHelp.myGroups && (
              <div className="mb-3 p-3 bg-black/40 rounded-lg border border-purple-500/30">
                <p className="text-xs text-purple-300 font-bold mb-2">⭐ What Are My Groups?</p>
                <p className="text-xs text-gray-300 mb-3">
                  Create a custom betting matrix with only the groups you care about. Instead of seeing all 47 betting options, focus on your favorite 5-10 groups for faster betting and clearer analysis.
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <p className="font-bold text-green-400 mb-2">✅ Benefits:</p>
                    <ul className="space-y-1 text-gray-300">
                      <li>• Focus on proven profitable groups</li>
                      <li>• Faster bet placement (less scrolling)</li>
                      <li>• Cleaner analytics display</li>
                      <li>• Perfect for strategy testing</li>
                      <li>• Combine table + wheel groups</li>
                      <li>• Create custom betting patterns</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-orange-400 mb-2">💡 Strategy Examples:</p>
                    <ul className="space-y-1 text-gray-300">
                      <li>• Color trader: Red, Black, A, B</li>
                      <li>• Dozen hunter: Doz1, Doz2, Doz3</li>
                      <li>• Wheel specialist: Voisins, Tiers, Orphelins</li>
                      <li>• Mix master: Red, Dozen1, Voisins</li>
                      <li>• Sector player: Nine groups only</li>
                    </ul>
                  </div>
                </div>

                <div className="p-2 bg-blue-900/30 rounded border border-blue-500/30 mb-2">
                  <p className="text-xs text-blue-300 font-bold mb-1">🎯 How to Use:</p>
                  <p className="text-xs text-gray-300">
                    <span className="text-white font-bold">1.</span> Select up to 10 groups from Table, Wheel, or both
                    <br/><span className="text-white font-bold">2.</span> During session, switch to "⭐ My Groups" view
                    <br/><span className="text-white font-bold">3.</span> Place bets on your selected groups only
                    <br/><span className="text-white font-bold">4.</span> Track performance of your custom strategy
                  </p>
                </div>

                <div className="p-2 bg-purple-900/30 rounded border border-purple-500/30">
                  <p className="text-xs text-purple-300 font-bold mb-1">💎 Pro Tip:</p>
                  <p className="text-xs text-gray-300">
                    Start with 3-5 groups you know well. Test them for 10-20 sessions. If profitable, refine your group selection. If not, try different combinations. My Groups lets you experiment systematically!
                  </p>
                </div>
              </div>
            )}

            <GroupSelector
              selectedGroups={selectedGroups}
              onGroupsChange={setSelectedGroups}
              maxGroups={10}
            />
          </div>

          {/* STEP 3: SESSION SETTINGS */}
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-3 border border-green-500/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm">3</div>
              <h2 className="text-lg font-bold text-green-300">Configure Session</h2>
            </div>
            
            <div className="bg-black/30 rounded-lg p-2 mb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-green-300 flex items-center gap-1.5">
                  💰 Bankroll & Limits
                </h3>
                <button
                  onClick={() => setShowSectionHelp(prev => ({ ...prev, bankroll: !prev.bankroll }))}
                  className="text-xs text-blue-400 underline hover:text-blue-300"
                >
                  {showSectionHelp.bankroll ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {showSectionHelp.bankroll && (
                <div className="mb-3 p-3 bg-black/40 rounded-lg border border-green-500/30">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-green-400 mb-2">✅ Best Practices:</p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Only bet money you can afford to lose</li>
                        <li>• Stop Loss: 20-30% of bankroll</li>
                        <li>• Profit Target: 15-25% of bankroll</li>
                        <li>• Base Bet: 1-2% of bankroll</li>
                        <li>• Never chase losses past stop loss</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-red-400 mb-2">⚠️ Common Mistakes:</p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Base bet too large (5%+ of bankroll)</li>
                        <li>• No stop loss set (unlimited risk)</li>
                        <li>• Ignoring limits during hot streaks</li>
                        <li>• Chasing losses with bigger bets</li>
                        <li>• Not walking away at profit target</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-500/30">
                    <p className="text-xs text-blue-300 font-bold mb-1">📊 Example Setup:</p>
                    <p className="text-xs text-gray-300">
                      Bankroll: $1000 → Base Bet: $10 (1%) → Stop Loss: $300 (30%) → Profit: $200 (20%)
                      <br/>→ <span className="text-red-400">Walk away at $700</span> or <span className="text-green-400">celebrate at $1200</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-2">
                <label className="text-xs text-gray-400 mb-1 block">Base Bet Amount</label>
                <input
                  type="number"
                  value={baseBet}
                  onChange={(e) => setBaseBet(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-center font-bold"
                />
                <p className="text-[10px] text-gray-400 mt-1">Amount per bet (used by betting system)</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
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

            <div className="bg-black/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-green-300 flex items-center gap-1.5">
                  🎴 Card Configuration
                </h3>
                <button
                  onClick={() => setShowSectionHelp(prev => ({ ...prev, cardConfig: !prev.cardConfig }))}
                  className="text-xs text-blue-400 underline hover:text-blue-300"
                >
                  {showSectionHelp.cardConfig ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {showSectionHelp.cardConfig && (
                <div className="mb-3 p-3 bg-black/40 rounded-lg border border-blue-500/30">
                  <p className="text-xs text-blue-300 font-bold mb-2">📚 Understanding the Card System</p>
                  <p className="text-xs text-gray-300 mb-3">
                    The card system breaks your session into small, manageable targets. Each card is a mini-session with its own profit goal and bet limit. This enforces discipline and prevents emotional betting.
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div>
                      <p className="font-bold text-green-400 mb-2">✅ Benefits:</p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Clear profit targets (prevents greed)</li>
                        <li>• Bet limits prevent chasing losses</li>
                        <li>• Psychological breaks between cards</li>
                        <li>• Track discipline and strategy adherence</li>
                        <li>• Celebrate small wins along the way</li>
                        <li>• Easier to walk away after failures</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-orange-400 mb-2">💡 Strategy Tips:</p>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Conservative: 3-5% per card</li>
                        <li>• Balanced: 5-7% per card</li>
                        <li>• Aggressive: 7-10% per card</li>
                        <li>• More cards = more chances</li>
                        <li>• Start small, increase if winning</li>
                        <li>• Take breaks between failed cards</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-900/30 rounded border border-purple-500/30 mb-3">
                    <p className="text-xs text-purple-300 font-bold mb-1">🎯 How It Works:</p>
                    <p className="text-xs text-gray-300">
                      <span className="text-white font-bold">1.</span> Each card starts "locked" until previous card completes
                      <br/><span className="text-white font-bold">2.</span> Place bets by evaluating betting trends and patterns
                      <br/><span className="text-white font-bold">3.</span> Reach target → Card succeeds ✅ → Next card unlocks
                      <br/><span className="text-white font-bold">4.</span> Hit max bets before target → Card fails ❌ → Next card unlocks
                      <br/><span className="text-white font-bold">5.</span> Complete all cards or hit session limits
                    </p>
                  </div>

                  <div className="p-2 bg-green-900/30 rounded border border-green-500/30">
                    <p className="text-xs text-green-300 font-bold mb-1">📊 Example: Conservative Setup</p>
                    <p className="text-xs text-gray-300">
                      Bankroll: $1000 → Card Value: 5% ($50) → 20 Cards → Max Bets: 15 per card
                      <br/>→ If you complete 10 cards: <span className="text-green-400 font-bold">+$500 profit (50% ROI)</span>
                      <br/>→ If you fail 5, succeed 5: <span className="text-yellow-400 font-bold">Break even or small profit</span>
                      <br/>→ Protection: Can only lose $50 per card × 15 bets = max risk is controlled
                    </p>
                  </div>
                </div>
              )}

              {/* Card System Toggle */}
              <div className="mb-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-blue-300">Enable Card System</label>
                  <button
                    onClick={() => setUseCards(!useCards)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      useCards ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      useCards ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">
                  {useCards
                    ? 'Break your session into small card targets for better discipline and control'
                    : 'Bet freely with session limits only (bankroll, stop loss, profit target)'}
                </p>
              </div>

              {useCards && (
              <>
              <div className="grid grid-cols-2 gap-2 mb-2">
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
              </>
              )}
            </div>
          </div>

          {/* STEP 5: START SESSION */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-sm">5</div>
              <h2 className="text-lg font-bold text-yellow-300">Ready to Begin</h2>
            </div>
            <button onClick={handleStart}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
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