import React from 'react'

interface BettingCards6Props {
  manualBets: Record<string, string>
  setManualBets: (b: Record<string, string>) => void
  playerUnit: number
  betHistory: Array<{ spin: number | null; bets: Record<string, string>; results: Record<string, number>; totalPnL: number; timestamp: Date }>
  setBetHistory: (h: BettingCards6Props['betHistory']) => void
}

export default function BettingCards6({ manualBets, setManualBets, playerUnit, betHistory, setBetHistory }: BettingCards6Props) {
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
        {groups.map(group => (
          <div key={group.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentValue = manualBets[group.key]
                const newValue = currentValue ? '' : playerUnit.toString()
                const updatedBets = { ...manualBets, [group.key]: newValue }
                setManualBets(updatedBets)
                if (betHistory.length === 0 || betHistory[0].spin !== null) {
                  setBetHistory([{ spin: null, bets: updatedBets, results: {}, totalPnL: 0, timestamp: new Date() }, ...betHistory])
                } else {
                  const updatedHistory = [...betHistory]
                  updatedHistory[0].bets = updatedBets
                  setBetHistory(updatedHistory)
                }
              }}
              className={`flex-1 px-2 py-1 bg-cyan-600/20 border border-cyan-500/30 rounded text-xs hover:bg-cyan-600/30 transition-all ${manualBets[group.key] ? 'ring-2 ring-cyan-400' : ''}`}
            >
              {group.label}
            </button>
            <input
              type="number"
              value={manualBets[group.key] || ''}
              onChange={(e) => {
                const updatedBets = { ...manualBets, [group.key]: e.target.value }
                setManualBets(updatedBets)
                if (betHistory.length > 0 && betHistory[0].spin === null) {
                  const updatedHistory = [...betHistory]
                  updatedHistory[0].bets = updatedBets
                  setBetHistory(updatedHistory)
                } else if (e.target.value) {
                  setBetHistory([{ spin: null, bets: updatedBets, results: {}, totalPnL: 0, timestamp: new Date() }, ...betHistory])
                }
              }}
              placeholder="10"
              className="w-16 px-1 py-1 bg-black/50 border border-gray-600 rounded text-xs text-center"
            />
          </div>
        ))}
      </div>
    </div>
  )
}


