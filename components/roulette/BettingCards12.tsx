import React from 'react'

interface BettingCards12Props {
  manualBets: Record<string, string>
  setManualBets: (b: Record<string, string>) => void
  playerUnit: number
  betHistory: Array<{ spin: number | null; bets: Record<string, string>; results: Record<string, number>; totalPnL: number; timestamp: Date }>
  setBetHistory: (h: BettingCards12Props['betHistory']) => void
}

export default function BettingCards12({ manualBets, setManualBets, playerUnit, betHistory, setBetHistory }: BettingCards12Props) {
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
              className={`flex-1 px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-xs hover:bg-yellow-600/30 transition-all ${manualBets[group.key] ? 'ring-2 ring-yellow-400' : ''}`}
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
