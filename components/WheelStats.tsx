'use client'
import React, { useMemo } from 'react'
import { WHEEL_GROUPS } from '@/lib/roulette-logic'
import type { Spin } from '@/lib/types'

// Helper to avoid TS literal-union includes() argument mismatch
const inGroup = (arr: readonly number[], n: number) => arr.includes(n)

interface WheelStatsTableProps {
  spins: Spin[]
}

interface GroupStat {
  name: string
  numbers: readonly number[]
  hits: { l9: number; l18: number; l27: number; l36: number }
  absenceNow: number
  absenceMax: number
  consecutiveNow: number
  consecutiveMax: number
  percentage: number
  expected: number
  lastSeen: number
  status: 'HOT' | 'WARM' | 'NORM' | 'COOL' | 'COLD'
}

export default function WheelStats({ spins }: WheelStatsTableProps) {
  
  const stats = useMemo(() => {
    const groupStats: GroupStat[] = []
    
    // Define all wheel groups for statistics (21 groups, excluding duplicate Voisin)
    const groups = [
      { name: 'Voisins', numbers: WHEEL_GROUPS.voisins },
      { name: 'Orphelins', numbers: WHEEL_GROUPS.orphelins },
      { name: 'Tiers', numbers: WHEEL_GROUPS.tiers },
      { name: 'Jeu Zero', numbers: WHEEL_GROUPS.jeu_zero },
      { name: 'Non-Voisin', numbers: WHEEL_GROUPS.non_voisin },
      { name: 'A', numbers: WHEEL_GROUPS.a },
      { name: 'B', numbers: WHEEL_GROUPS.b },
      { name: 'AA', numbers: WHEEL_GROUPS.aa },
      { name: 'BB', numbers: WHEEL_GROUPS.bb },
      { name: 'AAA', numbers: WHEEL_GROUPS.aaa },
      { name: 'BBB', numbers: WHEEL_GROUPS.bbb },
      { name: 'A6', numbers: WHEEL_GROUPS.a6 },
      { name: 'B6', numbers: WHEEL_GROUPS.b6 },
      { name: 'A9', numbers: WHEEL_GROUPS.a9 },
      { name: 'B9', numbers: WHEEL_GROUPS.b9 },
      { name: 'Right', numbers: WHEEL_GROUPS.right },
      { name: 'Left', numbers: WHEEL_GROUPS.left },
      { name: '1st Quarter', numbers: WHEEL_GROUPS.first_9 },
      { name: '2nd Quarter', numbers: WHEEL_GROUPS.second_9 },
      { name: '3rd Quarter', numbers: WHEEL_GROUPS.third_9 },
      { name: '4th Quarter', numbers: WHEEL_GROUPS.fourth_9 }
    ]
    
    groups.forEach(group => {
      const spinNumbers = spins.map(s => s.number)
      
      // Calculate hits for different windows
      const calculateHits = (window: number) => {
        const relevantSpins = spinNumbers.slice(0, window)
        return relevantSpins.filter(num => inGroup(group.numbers, num)).length
      }
      
      const hits = {
        l9: calculateHits(9),
        l18: calculateHits(18),
        l27: calculateHits(27),
        l36: calculateHits(36)
      }
      
      // Calculate absence (spins since last hit)
      let absenceNow = 0
      for (let i = 0; i < spinNumbers.length; i++) {
        if (inGroup(group.numbers, spinNumbers[i])) break
        absenceNow++
      }
      
      // Calculate max absence
      let maxAbsence = 0
      let currentAbsence = 0
      for (const num of spinNumbers) {
        if (inGroup(group.numbers, num)) {
          maxAbsence = Math.max(maxAbsence, currentAbsence)
          currentAbsence = 0
        } else {
          currentAbsence++
        }
      }
      maxAbsence = Math.max(maxAbsence, currentAbsence)
      
      // Calculate consecutive hits
      let consecutiveNow = 0
      for (const num of spinNumbers) {
        if (inGroup(group.numbers, num)) {
          consecutiveNow++
        } else {
          break
        }
      }
      
      // Calculate max consecutive
      let maxConsecutive = 0
      let currentConsecutive = 0
      for (const num of spinNumbers) {
        if (inGroup(group.numbers, num)) {
          currentConsecutive++
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
        } else {
          currentConsecutive = 0
        }
      }
      
      // Calculate percentages
      const percentage = spins.length > 0 
        ? (hits.l36 / Math.min(spins.length, 36)) * 100 
        : 0
      const expected = (group.numbers.length / 37) * 100
      
      // Determine status
      let status: GroupStat['status'] = 'NORM'
      const deviation = percentage - expected
      if (deviation > 10) status = 'HOT'
      else if (deviation > 5) status = 'WARM'
      else if (deviation < -10) status = 'COLD'
      else if (deviation < -5) status = 'COOL'
      
      // Find last seen
      const lastSeen = spinNumbers.findIndex(num => inGroup(group.numbers, num))
      
      groupStats.push({
        name: group.name,
        numbers: group.numbers,
        hits,
        absenceNow,
        absenceMax: maxAbsence,
        consecutiveNow,
        consecutiveMax: maxConsecutive,
        percentage,
        expected,
        lastSeen: lastSeen === -1 ? spinNumbers.length : lastSeen,
        status
      })
    })
    
    return groupStats
  }, [spins])
  
  const getStatusColor = (status: GroupStat['status']) => {
    switch (status) {
      case 'HOT': return 'bg-red-600/30 text-red-400'
      case 'WARM': return 'bg-orange-600/30 text-orange-400'
      case 'NORM': return 'bg-green-600/30 text-green-400'
      case 'COOL': return 'bg-blue-600/30 text-blue-400'
      case 'COLD': return 'bg-cyan-600/30 text-cyan-400'
    }
  }
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Wheel Group Statistics</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th rowSpan={2} className="px-2 py-1 text-left sticky left-0 bg-gray-800">Group</th>
              <th rowSpan={2} className="px-2 py-1 text-center">Size</th>
              <th colSpan={4} className="px-2 py-1 text-center border-l border-gray-700">Hit Count</th>
              <th colSpan={2} className="px-2 py-1 text-center border-l border-gray-700">Absence</th>
              <th colSpan={2} className="px-2 py-1 text-center border-l border-gray-700">Consecutive</th>
              <th colSpan={2} className="px-2 py-1 text-center border-l border-gray-700">Percentage</th>
              <th rowSpan={2} className="px-2 py-1 text-center border-l border-gray-700">Last</th>
              <th rowSpan={2} className="px-2 py-1 text-center border-l border-gray-700">Status</th>
            </tr>
            <tr className="border-b border-gray-700 text-gray-500 text-[10px]">
              <th className="px-1 py-1 text-center">L9</th>
              <th className="px-1 py-1 text-center">L18</th>
              <th className="px-1 py-1 text-center">L27</th>
              <th className="px-1 py-1 text-center">L36</th>
              <th className="px-1 py-1 text-center">Now</th>
              <th className="px-1 py-1 text-center">Max</th>
              <th className="px-1 py-1 text-center">Now</th>
              <th className="px-1 py-1 text-center">Max</th>
              <th className="px-1 py-1 text-center">Act</th>
              <th className="px-1 py-1 text-center">Exp</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, idx) => (
              <tr key={idx} className="border-t border-gray-700 hover:bg-gray-700/30">
                <td className="px-2 py-1 font-bold text-yellow-400 sticky left-0 bg-gray-800">
                  {stat.name}
                </td>
                <td className="px-2 py-1 text-center text-gray-300">
                  {stat.numbers.length}
                </td>
                <td className="px-1 py-1 text-center">{stat.hits.l9}</td>
                <td className="px-1 py-1 text-center">{stat.hits.l18}</td>
                <td className="px-1 py-1 text-center">{stat.hits.l27}</td>
                <td className="px-1 py-1 text-center font-semibold">{stat.hits.l36}</td>
                <td className="px-1 py-1 text-center border-l border-gray-700">
                  {stat.absenceNow}
                </td>
                <td className="px-1 py-1 text-center text-gray-400">
                  {stat.absenceMax}
                </td>
                <td className="px-1 py-1 text-center border-l border-gray-700">
                  {stat.consecutiveNow}
                </td>
                <td className="px-1 py-1 text-center text-gray-400">
                  {stat.consecutiveMax}
                </td>
                <td className="px-1 py-1 text-center border-l border-gray-700 font-semibold">
                  {stat.percentage.toFixed(1)}%
                </td>
                <td className="px-1 py-1 text-center text-gray-400">
                  {stat.expected.toFixed(1)}%
                </td>
                <td className="px-1 py-1 text-center border-l border-gray-700">
                  {stat.lastSeen === 0 ? '✓' : stat.lastSeen}
                </td>
                <td className="px-1 py-1 text-center border-l border-gray-700">
                  <span className={`px-1 py-0.5 rounded text-[10px] font-bold ${getStatusColor(stat.status)}`}>
                    {stat.status}
                  </span>
                </td>
              </tr>
            ))}
            {spins.length === 0 && (
              <tr className="border-t border-gray-700">
                <td className="px-2 py-4 text-center text-gray-500" colSpan={13}>
                  Add spins to see statistics
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Statistics Summary */}
      {spins.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Total Spins:</span>
              <span className="ml-2 font-bold text-white">{spins.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Hot Groups:</span>
              <span className="ml-2 font-bold text-red-400">
                {stats.filter(s => s.status === 'HOT').length}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Cold Groups:</span>
              <span className="ml-2 font-bold text-cyan-400">
                {stats.filter(s => s.status === 'COLD').length}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max Absence:</span>
              <span className="ml-2 font-bold text-white">
                {Math.max(...stats.map(s => s.absenceNow))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}