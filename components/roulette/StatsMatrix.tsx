import React from 'react'

interface GroupRow {
  id: string
  name: string
  color: string
  l9: number
  l18: number
  l27: number
  l36: number
  absenceNow: number
  absenceMax: number
  consecutiveNow: number
  consecutiveMax: number
  lastSpin: number
  percentage: number
  expected: number
  deviation: number
  status: 'HOT' | 'COLD' | 'ALERT' | 'NORM'
}

interface StatsMatrixProps {
  groupStats: GroupRow[] | null
  spinsCount: number
}

export default function StatsMatrix({ groupStats, spinsCount }: StatsMatrixProps) {
  if (!groupStats) return null
  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-2">
        <h3 className="text-base font-bold">Complete Statistical Analysis & Tracking</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-800">
            <tr>
              <th rowSpan={2} className="text-left py-1 px-2 font-semibold text-gray-300 border-r border-gray-600">Group</th>
              <th colSpan={4} className="text-center py-1 px-1 font-semibold text-green-400 border-r border-gray-600">Hit Count</th>
              <th colSpan={2} className="text-center py-1 px-1 font-semibold text-purple-400 border-r border-gray-600">Absence</th>
              <th colSpan={2} className="text-center py-1 px-1 font-semibold text-green-400 border-r border-gray-600">Consec</th>
              <th rowSpan={2} className="text-center py-1 px-1 font-semibold text-blue-400 border-r border-gray-600">Last<br/>Spin</th>
              <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-yellow-400 border-r border-gray-600">%</th>
              <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-gray-400 border-r border-gray-600">Exp%</th>
              <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-cyan-400 border-r border-gray-600">Dev</th>
              <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-gray-300">Status</th>
            </tr>
            <tr className="border-t border-gray-600">
              <th className="text-center py-1 px-1 text-gray-400">L9</th>
              <th className="text-center py-1 px-1 text-gray-400">L18</th>
              <th className="text-center py-1 px-1 text-gray-400">L27</th>
              <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">L36</th>
              <th className="text-center py-1 px-1 text-gray-400">Now</th>
              <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">Max</th>
              <th className="text-center py-1 px-1 text-gray-400">Now</th>
              <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {groupStats.map(group => (
              <tr key={group.id} className="hover:bg-gray-600/50 transition-colors">
                <td className={`py-1 px-2 font-medium ${group.color} border-r border-gray-600`}>{group.name}</td>
                <td className="text-center py-1 px-1">{group.l9}</td>
                <td className="text-center py-1 px-1">{group.l18}</td>
                <td className="text-center py-1 px-1">{group.l27}</td>
                <td className="text-center py-1 px-1 border-r border-gray-600">{group.l36}</td>
                <td className={`text-center py-1 px-1 ${group.absenceNow > 3 ? 'text-orange-400 animate-pulse font-bold' : 'text-gray-300'}`}>{group.absenceNow}</td>
                <td className="text-center py-1 px-1 border-r border-gray-600">{group.absenceMax}</td>
                <td className={`text-center py-1 px-1 ${group.consecutiveNow > 3 ? 'text-green-400 animate-pulse font-bold' : group.consecutiveNow > 0 ? 'text-green-400' : 'text-gray-400'}`}>{group.consecutiveNow}</td>
                <td className="text-center py-1 px-1 border-r border-gray-600">{group.consecutiveMax}</td>
                <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">{group.lastSpin}</td>
                <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">{group.percentage.toFixed(1)}</td>
                <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">{group.expected.toFixed(1)}</td>
                <td className="text-center py-1 px-2 border-r border-gray-600"><span className={group.deviation > 0 ? 'text-green-400' : 'text-red-400'}>{group.deviation > 0 ? '+' : ''}{group.deviation.toFixed(1)}</span></td>
                <td className="text-center py-1 px-2">
                  {group.status === 'HOT' ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">HOT</span>
                  ) : group.status === 'COLD' ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">COLD</span>
                  ) : group.status === 'ALERT' ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/50 text-red-400">ALERT</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">NORM</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Total Spins</div>
          <div className="text-xl font-bold text-white">{spinsCount}</div>
          <div className="text-xs text-gray-500">Current session</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Max Absence</div>
          <div className="text-xl font-bold text-red-400">18</div>
          <div className="text-xs text-gray-500">Green (0)</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Critical Alert</div>
          <div className="text-xl font-bold text-orange-400">3rd Doz</div>
          <div className="text-xs text-gray-500">12 spins missing</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Hot Groups</div>
          <div className="text-xl font-bold text-green-400">3</div>
          <div className="text-xs text-gray-500">Above expected</div>
        </div>
      </div>
    </div>
  )
}


