import React from 'react'

interface BettingCards6Props {
  manualBets: Record<string, string>
  setManualBets: (b: Record<string, string>) => void
  playerUnit: number
  betHistory: Array<{ spin: number | null; bets: Record<string, string>; results: Record<string, number>; totalPnL: number; timestamp: Date }>
  setBetHistory: (h: BettingCards6Props['betHistory']) => void
  pendingBets: Record<string, boolean>
  setPendingBets: (p: Record<string, boolean>) => void
  betResults: Record<string, { status: 'win' | 'loss', amount: string } | null>
}

export default function BettingCards6({ manualBets, setManualBets, playerUnit, betHistory, setBetHistory, pendingBets, setPendingBets, betResults }: BettingCards6Props) {
  const groups = [
    { key: 'six1', label: '1st 6' },
    { key: 'six2', label: '2nd 6' },
    { key: 'six3', label: '3rd 6' },
    { key: 'six4', label: '4th 6' },
    { key: 'six5', label: '5th 6' },
    { key: 'six6', label: '6th 6' }
  ] as const

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h4 className="text-center font-bold mb-3 text-cyan-400">6&apos;s (5:1)</h4>
      <div className="space-y-2">
        {groups.map(group => {
          const hasBet = manualBets[group.key] && manualBets[group.key] !== ''
          const result = betResults[group.key]

          // Determine button state and color
          let buttonClass = 'bg-cyan-600/20 border border-cyan-500/30'
          let displayText = group.label

          if (result?.status === 'win') {
            // Win state: green background - use stored amount from betResults
            buttonClass = 'bg-green-600 text-white font-bold border-0 animate-pulse'
            displayText = `${group.label} +${result.amount}`
          } else if (result?.status === 'loss') {
            // Loss state: red background - use stored amount from betResults
            buttonClass = 'bg-red-900 text-white font-bold border-0 animate-pulse'
            displayText = `${group.label} -${result.amount}`
          } else if (hasBet) {
            // Pending state: yellow background
            buttonClass = 'bg-yellow-500 text-black font-bold border-0'
            displayText = `${group.label} (${manualBets[group.key]})`
          }

          return (
            <div key={group.key} className="flex items-center gap-2">
              <button
                onClick={() => {
                  const currentValue = manualBets[group.key]
                  const newValue = currentValue ? '' : playerUnit.toString()
                  const updatedBets = { ...manualBets, [group.key]: newValue }
                  setManualBets(updatedBets)
                }}
                className={`flex-1 px-2 py-1 ${buttonClass} rounded text-xs hover:opacity-80 transition-all`}
              >
                {displayText}
              </button>
              <input
                type="number"
                value={manualBets[group.key] || ''}
                onChange={(e) => {
                  const updatedBets = { ...manualBets, [group.key]: e.target.value }
                  setManualBets(updatedBets)
                }}
                placeholder="10"
                className="w-16 px-1 py-1 bg-black/50 border border-gray-600 rounded text-xs text-center"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}


