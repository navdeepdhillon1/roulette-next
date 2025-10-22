import React from 'react'

interface BettingCards12Props {
  manualBets: Record<string, string>
  setManualBets: (b: Record<string, string>) => void
  playerUnit: number
  betHistory: Array<{ spin: number | null; bets: Record<string, string>; results: Record<string, number>; totalPnL: number; timestamp: Date }>
  setBetHistory: (h: BettingCards12Props['betHistory']) => void
  pendingBets: Record<string, boolean>
  setPendingBets: (p: Record<string, boolean>) => void
  betResults: Record<string, { status: 'win' | 'loss', amount: string } | null>
}

export default function BettingCards12({ manualBets, setManualBets, playerUnit, betHistory, setBetHistory, pendingBets, setPendingBets, betResults }: BettingCards12Props) {
  const groups = [
    { key: 'dozen1', label: '1st Dozen' },
    { key: 'dozen2', label: '2nd Dozen' },
    { key: 'dozen3', label: '3rd Dozen' },
    { key: 'col1', label: 'Column 1' },
    { key: 'col2', label: 'Column 2' },
    { key: 'col3', label: 'Column 3' }
  ] as const

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h4 className="text-center font-bold mb-3 text-yellow-400">12&apos;s (2:1)</h4>
      <div className="space-y-2">
        {groups.map(group => {
          const hasBet = manualBets[group.key] && manualBets[group.key] !== ''
          const result = betResults[group.key]

          // Determine button state and color
          let buttonClass = 'bg-yellow-600/20 border border-yellow-500/30'
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
