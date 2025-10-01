'use client'
import React, { useState, useEffect } from 'react'
import { useGameState } from '@/stores/gameState'
import { makeDecisionWithSkips } from '@/lib/decideBet'
import type { CardStep, SkipStrategy } from '@/stores/gameState'

// Helper to compute current skip streak from the end of steps
function getCurrentSkipStreak(steps: CardStep[]): number {
  let count = 0
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].userAction.action === 'skip') count++
    else break
  }
  return count
}

export default function ActiveRedBlackCard() {
  const gameState = useGameState()
  const { activeCard, spins, bankroll, addSpin, closeActiveCard, updateActiveCard } = gameState
  
  const [inputNumber, setInputNumber] = useState('')
  const [resultNumber, setResultNumber] = useState('')
  const [currentDecision, setCurrentDecision] = useState<any>(null)
  const [pendingStep, setPendingStep] = useState<CardStep | null>(null)
  
  const skipStrategy: SkipStrategy = {
    maxConsecutiveLosses: 3,
    maxVolatility: 0.75,
    minConfidence: 0.40,
    minSurvival: 0.50,
    smartSkip: true,
    skipAfterBigWin: true,
    skipOnPatternBreak: true,
    resetProgressionOnSkip: false,
    requireConfirmationAfterSkip: true
  }


  // Generate decision when spins change
  useEffect(() => {
    if (activeCard && spins.length >= 5) {
      const decision = makeDecisionWithSkips(spins, activeCard, skipStrategy)
      setCurrentDecision(decision)
      
      // Create pending step
      const progressionIndex = activeCard.steps.filter(s => s.userAction.action === 'bet').length
      const stake = activeCard.settings.baseUnit * (activeCard.settings.progression[progressionIndex] || 1)
      
      const newStep: CardStep = {
        stepNumber: activeCard.totalSteps + 1,
        betNumber: null,
        spinNumber: null,
        suggested: {
          action: decision.decision === "BET" ? "bet" : "skip",
          side: decision.betOn,
          stake: decision.decision === "BET" ? stake : null,
          confidence: decision.confidence,
          reasons: decision.reasons
        },
        userAction: {
          action: "pending",
          side: null,
          stake: null,
          timestamp: Date.now()
        },
        outcome: "skipped",
        pl: 0,
        runningTotal: activeCard.steps.reduce((sum: number, s: CardStep) => sum + s.pl, 0),
        bankrollAfter: bankroll,
        followedSuggestion: false,
        progressionIndex,
        skipStreak: getCurrentSkipStreak(activeCard.steps)
      }
      
      setPendingStep(newStep)
    }
  }, [spins, activeCard, bankroll])

  if (!activeCard) {
    return <div className="text-gray-400">No active card</div>
  }
  const handleAction = (action: 'follow' | 'opposite' | 'skip') => {
    if (!pendingStep || !currentDecision) return
    
    let finalSide = pendingStep.suggested.side
    let finalStake = pendingStep.suggested.stake
    
    if (action === 'opposite' && finalSide) {
      finalSide = finalSide === 'A' ? 'B' : 'A'
    } else if (action === 'skip') {
      finalSide = null
      finalStake = null
    }
    
    const placedBet: CardStep = {
      ...pendingStep,
      betNumber: action !== 'skip' ? (activeCard.actualBets + 1) : null,
      userAction: {
        action: action === 'skip' ? 'skip' : 'bet',
        side: finalSide,
        stake: finalStake,
        timestamp: Date.now()
      },
      outcome: 'pending',  // Mark as pending until result
      pl: 0,  // No P/L yet
      followedSuggestion: action === 'follow'
    }
    
    updateActiveCard(placedBet)
    setPendingStep(null)

    // Check completion conditions
    if (activeCard.actualBets >= 9 && action !== 'skip') {
      setTimeout(() => closeActiveCard('lost', 'Max bets reached'), 100)
    } else if (activeCard.totalSteps >= 14) {
      setTimeout(() => closeActiveCard('manual', 'Max steps reached'), 100)
    }
  }
  const handleQuickSpin = (color: 'red' | 'black' | 'green') => {
    const number = color === 'red' ? 32 : color === 'black' ? 15 : 0
    addSpin(number)
    
    // Update the last pending bet with the result
    const lastStep = activeCard.steps[activeCard.steps.length - 1]
    if (lastStep && lastStep.outcome === 'pending') {
      const won = (lastStep.userAction.side === 'A' && color === 'red') || 
                  (lastStep.userAction.side === 'B' && color === 'black')
      
      const stakeVal = lastStep.userAction.stake ?? 0
      const updatedStep: CardStep = {
        ...lastStep,
        outcome: won ? 'win' : 'loss',
        pl: won ? stakeVal : -stakeVal,
        spinNumber: number
      }
      
      // You'd need an updateLastStep function in your store
      gameState.updateLastStep(updatedStep)
    }
    
    setInputNumber('')
  
}

const handleResult = (number: number) => {
    if (isNaN(number) || number < 0 || number > 36) return
    
    // Add to spin history
    addSpin(number)
    
    // Update the last pending bet with the actual result
    const card = gameState.activeCard
    if (card && card.steps.length > 0) {
      const lastStep = card.steps[card.steps.length - 1]
      
      if (lastStep && lastStep.outcome === 'pending') {
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number)
        const won = (lastStep.userAction.side === 'A' && isRed) || 
                    (lastStep.userAction.side === 'B' && !isRed && number !== 0)
        
        const stake = lastStep.userAction.stake ?? 0
        const updatedStep: CardStep = {
          ...lastStep,
          outcome: won ? 'win' : 'loss',
          pl: won ? stake : -stake,
          spinNumber: number,
          runningTotal: card.steps.slice(0, -1).reduce((sum: number, s: CardStep) => sum + s.pl, 0) + (won ? stake : -stake)
        }
        
        gameState.updateLastStep(updatedStep)
      }
    }
    
    setInputNumber('')
  }

  // Calculate discipline
  const discipline = activeCard.steps.length > 0 
    ? Math.round((activeCard.steps.filter(s => s.followedSuggestion).length / activeCard.steps.length) * 100)
    : 100

  return (
    <div className="space-y-4">
      {/* Card Header */}
      <div className="bg-gray-800 rounded-lg border border-yellow-400/30 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-yellow-400">RED vs BLACK Strategy Card</h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-sm">
              Target: +${activeCard.settings.perCardTarget}
            </span>
            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm">
              Bankroll: ${bankroll}
            </span>
            <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-sm">
              Discipline: {discipline}%
            </span>
          </div>
        </div>
        
        {/* Progress Bars */}
        <div className="space-y-2">
  <div>
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>Bets Progress</span>
      <span>{activeCard.steps.filter(s => s.userAction.action === 'bet').length}/10</span>
    </div>
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all"
        style={{ width: `${(activeCard.steps.filter(s => s.userAction.action === 'bet').length / 10) * 100}%` }}
      />
    </div>
  </div>
  
  <div>
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>Steps Used (including skips)</span>
      <span>{activeCard.steps.length}/15</span>
    </div>
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all"
        style={{ width: `${(activeCard.steps.length / 15) * 100}%` }}
      />
    </div>
  </div>
        </div>
      </div>

{/* Recent Numbers and Add Number Section */}
<div className="bg-gray-900 rounded-lg p-3 mt-3">
  <div className="flex items-center justify-between gap-4">
    {/* Last 15 Numbers */}
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-blue-400">Last 15:</span>
        <div className="flex gap-1 overflow-x-auto">
          {spins.slice(-15).reverse().map((spin, idx) => (
            <div 
              key={idx}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                ${spin.n === 0 ? 'bg-green-600' : 
                  [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(spin.n) ? 
                  'bg-red-600' : 'bg-black border border-gray-600'}`}
              title={`Spin ${spins.length - 14 + idx}: ${spin.n}`}
            >
              {spin.n}
            </div>
          ))}
          {spins.length === 0 && (
            <span className="text-gray-500 text-xs">No spins yet</span>
          )}
        </div>
      </div>
    </div>
    
    {/* Add Number Input */}
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        max="36"
        value={inputNumber}
        onChange={(e) => setInputNumber(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && inputNumber !== '') {
            const num = parseInt(inputNumber)
            if (num >= 0 && num <= 36) {
              addSpin(num)
              setInputNumber('')
            }
          }
        }}
        placeholder="0-36"
        className="w-16 px-2 py-1 bg-black/50 border border-gray-600 rounded text-center text-sm font-bold text-white"
      />
      <button
        onClick={() => {
          const num = parseInt(inputNumber)
          if (!isNaN(num) && num >= 0 && num <= 36) {
            addSpin(num)
            setInputNumber('')
          }
        }}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-bold"
      >
        ADD
      </button>
    </div>
  </div>
</div>
      {/* Current Decision Panel */}
      {pendingStep && currentDecision && spins.length >= 5 && (
        <div className="bg-gray-800 rounded-lg border border-yellow-400/30 p-4">
          <h4 className="text-lg font-bold text-yellow-400 mb-3">
            Step #{pendingStep.stepNumber} - Decision Required
          </h4>
          
          {/* Recommendation */}
          <div className="bg-gray-900 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">System Analysis:</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      currentDecision.confidence > 0.7 ? 'bg-green-500' :
                      currentDecision.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${currentDecision.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white">
                  {(currentDecision.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
            {/* Safety Strip */}
<div className="bg-gray-900/50 rounded p-2 mt-2">
  <div className="flex justify-between text-xs">
    <span className="text-gray-400">
      Survival: <span className={currentDecision.survivalProb >= 0.7 ? 'text-green-400' : 'text-red-400'}>
        {(currentDecision.survivalProb * 100).toFixed(0)}%
      </span>
    </span>
    <span className="text-gray-400">
      Headroom: <span className="text-white">
        {10 - activeCard.steps.filter(s => s.userAction.action === 'bet').length} bets
      </span>
    </span>
    <span className="text-gray-400">
      Next stake: <span className="text-white">${pendingStep.suggested.stake || 0}</span>
    </span>
    <span className="text-gray-400">
      Table max: <span className="text-white">$500</span>
    </span>
  </div>
</div>

            {currentDecision.decision === 'SKIP' || currentDecision.decision === 'SIT_OUT' ? (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-yellow-400 font-bold">RECOMMEND: SIT OUT</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {currentDecision.skipReasons?.map((reason: string, i: number) => (
                    <div key={i}>• {reason}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-600 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold">
                    BET ${pendingStep.suggested.stake} on {pendingStep.suggested.side === 'A' ? 'RED' : 'BLACK'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {currentDecision.side} strategy
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {currentDecision.reasons.slice(0, 2).map((reason: string, i: number) => (
                    <div key={i}>• {reason}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Risk Level */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Risk:</span>
              <span className={`text-xs px-2 py-1 rounded ${
                currentDecision.riskLevel === 'low' ? 'bg-green-600/20 text-green-400' :
                currentDecision.riskLevel === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                currentDecision.riskLevel === 'high' ? 'bg-orange-600/20 text-orange-400' :
                'bg-red-600/20 text-red-400'
              }`}>
                {currentDecision.riskLevel.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400">Market:</span>
              <span className="text-xs text-white">{currentDecision.marketCondition}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('follow')}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition-all"
              disabled={currentDecision.decision === 'SIT_OUT'}
            >
              Follow Advice
            </button>
            <button
              onClick={() => handleAction('opposite')}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition-all"
              disabled={currentDecision.decision === 'SIT_OUT'}
            >
              Bet Opposite
            </button>
            <button
              onClick={() => handleAction('skip')}
              className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 rounded font-bold transition-all"
            >
              Sit Out
            </button>
          </div>
        </div>
      )}

      {/* Not Enough Data Message */}
      {spins.length < 5 && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <p className="text-yellow-400 font-bold">Need More Data</p>
          <p className="text-sm text-gray-400 mt-1">
            Add {5 - spins.length} more spins to activate betting analysis
          </p>
        </div>
      )}
{/* Betting History Table */}
{activeCard.steps.length > 0 && (
  <div className="bg-gray-800 rounded-lg border border-yellow-400/30 p-4">
    <h4 className="text-lg font-bold text-yellow-400 mb-3">Betting History</h4>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-xs">
            <th className="px-2 py-1 text-left">Step</th>
            <th className="px-2 py-1 text-left">Bet#</th>
            <th className="px-2 py-1 text-left">Suggested</th>
            <th className="px-2 py-1 text-left">Action</th>
            <th className="px-2 py-1 text-left">Result</th>
            <th className="px-2 py-1 text-right">P/L</th>
            <th className="px-2 py-1 text-right">Total</th>
          </tr>
         </thead>
         <tbody>
  {activeCard.steps.map((step, idx) => (
            <tr key={idx} className="border-b border-gray-700/50">
              <td className="px-2 py-1">{step.stepNumber}</td>
              <td className="px-2 py-1">{step.betNumber || '-'}</td>
              <td className="px-2 py-1 text-xs">
                {step.suggested.action === 'skip' ? 
                  <span className="text-yellow-400">SKIP</span> :
                  <span>{step.suggested.side === 'A' ? 'RED' : 'BLACK'}</span>
                }
              </td>
              <td className="px-2 py-1 text-xs">
                {step.userAction.action === 'skip' ?
                  <span className="text-yellow-400">Skipped</span> :
                  <span>{step.userAction.side === 'A' ? 'RED' : 'BLACK'}</span>
                }
                {!step.followedSuggestion && 
                  <span className="text-red-400 ml-1">⚠️</span>
                }
              </td>
              <td className="px-2 py-1">
                {step.spinNumber !== null && step.spinNumber !== undefined ? (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white
                    ${step.spinNumber === 0 ? 'bg-green-600' : 
                      [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(step.spinNumber) ? 
                      'bg-red-600' : 'bg-black border border-gray-600'}`}>
                    {step.spinNumber}
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td className="px-2 py-1 text-right">
                {step.pl !== 0 ? (
                  <span className={step.pl > 0 ? 'text-green-400' : 'text-red-400'}>
                    {step.pl > 0 ? '+' : ''}${Math.abs(step.pl)}
                  </span>
                ) : '-'}
              </td>
              <td className="px-2 py-1 text-right font-bold">
                <span className={step.runningTotal >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {step.runningTotal >= 0 ? '+' : ''}${Math.abs(step.runningTotal)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

      {/* Result Entry Section */}
<div className="bg-gray-800 rounded-lg border border-yellow-400/30 p-4">
  <h4 className="text-sm font-bold text-gray-400 mb-2">Enter Winning Number:</h4>
  
  {/* Number Grid for Quick Entry */}
  <div className="grid grid-cols-12 gap-1 mb-3">
    <button
      onClick={() => handleResult(0)}
      className="col-span-12 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm"
    >
      0
    </button>
    {[...Array(36)].map((_, i) => {
      const num = i + 1
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num)
      return (
        <button
          key={num}
          onClick={() => handleResult(num)}
          className={`py-2 rounded text-xs font-bold ${
            isRed ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {num}
        </button>
      )
    })}
  </div>
  
  {/* Or Manual Entry */}
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-400">Or enter:</span>
    <input
      type="number"
      min="0"
      max="36"
      value={resultNumber}
      onChange={(e) => setResultNumber(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter') handleResult(parseInt(resultNumber))
      }}
      placeholder="0-36"
      className="w-16 px-2 py-1 bg-black/50 border border-gray-600 rounded text-center"
    />
    <button
      onClick={() => handleResult(parseInt(resultNumber))}
      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold"
    >
      ENTER RESULT
    </button>
  </div>
</div>
    </div>
  )
}