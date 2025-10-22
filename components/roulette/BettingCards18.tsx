import React from 'react'

interface BettingCards18Props {
  manualBets: Record<string, string>
  setManualBets: (b: Record<string, string>) => void
  playerUnit: number
  betHistory: Array<{ spin: number | null; bets: Record<string, string>; results: Record<string, number>; totalPnL: number; timestamp: Date }>
  setBetHistory: (h: BettingCards18Props['betHistory']) => void
  pendingBets: Record<string, boolean>
  setPendingBets: (p: Record<string, boolean>) => void
  betResults: Record<string, { status: 'win' | 'loss', amount: string } | null>
}

export default function BettingCards18({ manualBets, setManualBets, playerUnit, betHistory, setBetHistory, pendingBets, setPendingBets, betResults }: BettingCards18Props) {
  const groups = [
    { key: 'red', label: 'Red', color: 'bg-red-600' },
    { key: 'black', label: 'Black', color: 'bg-gray-900' },
    { key: 'even', label: 'Even', color: 'bg-blue-600' },
    { key: 'odd', label: 'Odd', color: 'bg-orange-600' },
    { key: 'low', label: 'Low (1-18)', color: 'bg-purple-600' },
    { key: 'high', label: 'High (19-36)', color: 'bg-pink-600' },
    { key: 'alt1_1', label: 'A', color: 'bg-indigo-600' },
    { key: 'alt1_2', label: 'B', color: 'bg-teal-600' },
    { key: 'alt2_1', label: 'AA', color: 'bg-green-600' },
    { key: 'alt2_2', label: 'BB', color: 'bg-yellow-600' },
    { key: 'alt3_1', label: 'AAA', color: 'bg-cyan-600' },
    { key: 'alt3_2', label: 'BBB', color: 'bg-rose-600' },
    { key: 'edge', label: 'Edge', color: 'bg-violet-600' },
    { key: 'center', label: 'Center', color: 'bg-amber-600' }
  ] as const

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h4 className="text-center font-bold mb-3 text-green-400">18&apos;s (1:1)</h4>
      <div className="grid grid-cols-2 gap-2">
        {groups.map(group => {
          const hasBet = manualBets[group.key] && manualBets[group.key] !== ''
          const result = betResults[group.key]

          // Determine button state and color
          let buttonClass = group.color
          let displayText = group.label

          if (result?.status === 'win') {
            // Win state: green background - use stored amount from betResults
            buttonClass = 'bg-green-600 text-white font-bold animate-pulse'
            displayText = `${group.label} +${result.amount}`
          } else if (result?.status === 'loss') {
            // Loss state: red background - use stored amount from betResults
            buttonClass = 'bg-red-900 text-white font-bold animate-pulse'
            displayText = `${group.label} -${result.amount}`
          } else if (hasBet) {
            // Pending state: yellow background
            buttonClass = 'bg-yellow-500 text-black font-bold'
            displayText = `${group.label} (${manualBets[group.key]})`
          }

          return (
            <div key={group.key} className="flex items-center gap-1">
              <button
                onClick={() => {
                  const currentValue = manualBets[group.key]
                  const newValue = currentValue ? '' : playerUnit.toString()
                  const updatedBets = { ...manualBets, [group.key]: newValue }
                  setManualBets(updatedBets)
                }}
                className={`flex-1 px-1 py-1 rounded text-xs ${buttonClass} hover:opacity-80 transition-all`}
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
                className="w-12 px-1 py-1 bg-black/50 border border-gray-600 rounded text-xs text-center"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
