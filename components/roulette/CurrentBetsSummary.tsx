import React from 'react'

interface CurrentBetsSummaryProps {
  manualBets: Record<string, string>
}

export default function CurrentBetsSummary({ manualBets }: CurrentBetsSummaryProps) {
  const activeCount = Object.values(manualBets).filter(v => v).length
  const totalStake = Object.values(manualBets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Current Bets & Stake</h3>
        <div className="flex gap-6 items-center">
          <div className="text-sm">
            <span className="text-gray-400">Active: </span>
            <span className="text-white font-bold">{activeCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-400">Total: </span>
            <span className="text-yellow-400 font-bold text-lg">${totalStake.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {activeCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(manualBets).filter(([_, value]) => value).map(([key, value]) => (
              <div key={key} className="px-2 py-1 bg-black/40 rounded text-xs">
                <span className="text-gray-400">{
                  key === 'alt1_1' ? 'A' :
                  key === 'alt1_2' ? 'B' :
                  key === 'alt2_1' ? 'AA' :
                  key === 'alt2_2' ? 'BB' :
                  key === 'alt3_1' ? 'AAA' :
                  key === 'alt3_2' ? 'BBB' :
                  key === 'six1' ? '1st 6' :
                  key === 'six2' ? '2nd 6' :
                  key === 'six3' ? '3rd 6' :
                  key === 'six4' ? '4th 6' :
                  key === 'six5' ? '5th 6' :
                  key === 'six6' ? '6th 6' :
                  key === 'dozen1' ? '1st Doz' :
                  key === 'dozen2' ? '2nd Doz' :
                  key === 'dozen3' ? '3rd Doz' :
                  key === 'col1' ? 'Col 1' :
                  key === 'col2' ? 'Col 2' :
                  key === 'col3' ? 'Col 3' :
                  key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')
                }:</span>
                <span className="text-green-400 font-bold ml-1">${value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
