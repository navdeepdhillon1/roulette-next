'use client'
import React from 'react'
import { RED_NUMBERS, WHEEL_GROUPS } from '@/lib/roulette-logic'
import type { Spin } from '@/lib/types'

// Helper to avoid TS literal-union includes() argument mismatch
const inGroup = (arr: readonly number[], n: number) => arr.includes(n)

interface WheelHistoryTableProps {
  spins: Spin[]
  selectedNumber: number | null
}

export default function WheelHistoryTable({ spins, selectedNumber }: WheelHistoryTableProps) {
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Spin History & Groups</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="px-1 py-2 text-center">Num</th>
              <th className="px-1 py-2 text-center">Specials 1</th>
              <th className="px-1 py-2 text-center">Specials 2</th>
              <th className="px-1 py-2 text-center">A/B</th>
              <th className="px-1 py-2 text-center">AA/BB</th>
              <th className="px-1 py-2 text-center">AAA/BBB</th>
              <th className="px-1 py-2 text-center">Alternate 6's</th>
              <th className="px-1 py-2 text-center">Alternate 9's</th>
              <th className="px-1 py-2 text-center">Right/Left</th>
              <th className="px-1 py-2 text-center">Quarters</th>
            </tr>
          </thead>
          <tbody>
            {spins.map((spin, idx) => {
              const num = spin.number
              
              // Check group memberships
              const isVoisins = inGroup(WHEEL_GROUPS.voisins, num)
              const isOrphelins = inGroup(WHEEL_GROUPS.orphelins, num)
              const isTiers = inGroup(WHEEL_GROUPS.tiers, num)
              const isJeuZero = inGroup(WHEEL_GROUPS.jeu_zero, num)
              const isNonVoisin = inGroup(WHEEL_GROUPS.non_voisin, num)
              
              const isA = num > 0 && inGroup(WHEEL_GROUPS.a, num)
              const isB = num > 0 && inGroup(WHEEL_GROUPS.b, num)
              const isAA = num > 0 && inGroup(WHEEL_GROUPS.aa, num)
              const isBB = num > 0 && inGroup(WHEEL_GROUPS.bb, num)
              const isAAA = num > 0 && inGroup(WHEEL_GROUPS.aaa, num)
              const isBBB = num > 0 && inGroup(WHEEL_GROUPS.bbb, num)
              const isA6 = num > 0 && inGroup(WHEEL_GROUPS.a6, num)
              const isB6 = num > 0 && inGroup(WHEEL_GROUPS.b6, num)
              const isA9 = num > 0 && inGroup(WHEEL_GROUPS.a9, num)
              const isB9 = num > 0 && inGroup(WHEEL_GROUPS.b9, num)
              const isRight = num > 0 && inGroup(WHEEL_GROUPS.right, num)
              const isLeft = inGroup(WHEEL_GROUPS.left, num)
              const is1stQ = num > 0 && inGroup(WHEEL_GROUPS.first_9, num)
              const is2ndQ = num > 0 && inGroup(WHEEL_GROUPS.second_9, num)
              const is3rdQ = num > 0 && inGroup(WHEEL_GROUPS.third_9, num)
              const is4thQ = num > 0 && inGroup(WHEEL_GROUPS.fourth_9, num)
              
              // Determine group values
              let specials1 = '-'
              if (isVoisins) specials1 = 'Voisin'
              else if (isOrphelins) specials1 = 'Orphein'
              else if (isTiers) specials1 = 'Tier'
              else if (isJeuZero) specials1 = 'Jeu Zero'
              
              let specials2 = '-'
              if (isVoisins) specials2 = 'Voisin'
              else if (isNonVoisin) specials2 = 'Non-Voisin'
              
              let quarter = '-'
              if (is1stQ) quarter = '1st Q'
              else if (is2ndQ) quarter = '2nd Q'
              else if (is3rdQ) quarter = '3rd Q'
              else if (is4thQ) quarter = '4th Q'
              
              return (
                <tr key={idx} className={`border-t border-gray-700 transition-all ${
                  selectedNumber === num ? 'bg-yellow-400/20 ring-2 ring-yellow-400/50' : 'hover:bg-gray-700/30'
                }`}>
                  <td className="px-1 py-2 text-center font-bold">
                    <span className={`px-2 py-1 rounded ${
                      num === 0 ? 'bg-green-600' : 
                      inGroup(RED_NUMBERS, num) ? 'bg-red-600' : 
                      'bg-black border border-gray-600'
                    } text-white ${selectedNumber === num ? 'ring-2 ring-yellow-400' : ''}`}>
                      {num}
                    </span>
                  </td>
                  <td className="px-1 py-2 text-center">
                    {specials1 === 'Voisin' && (
                      <span className="px-1 py-0.5 bg-purple-600/30 text-purple-400 rounded text-xs">
                        {specials1}
                      </span>
                    )}
                    {specials1 === 'Orphein' && (
                      <span className="px-1 py-0.5 bg-indigo-600/30 text-indigo-400 rounded text-xs">
                        {specials1}
                      </span>
                    )}
                    {specials1 === 'Tier' && (
                      <span className="px-1 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">
                        {specials1}
                      </span>
                    )}
                    {specials1 === 'Jeu Zero' && (
                      <span className="px-1 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">
                        {specials1}
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {specials2 === 'Voisin' && (
                      <span className="px-1 py-0.5 bg-purple-600/30 text-purple-400 rounded text-xs">
                        {specials2}
                      </span>
                    )}
                    {specials2 === 'Non-Voisin' && (
                      <span className="px-1 py-0.5 bg-orange-600/30 text-orange-400 rounded text-xs">
                        {specials2}
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {isA && <span className="px-1 py-0.5 bg-red-600/30 text-red-400 rounded text-xs">A</span>}
                    {isB && <span className="px-1 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">B</span>}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {isAA && <span className="px-1 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">AA</span>}
                    {isBB && <span className="px-1 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">BB</span>}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {isAAA && <span className="px-1 py-0.5 bg-pink-600/30 text-pink-400 rounded text-xs">AAA</span>}
                    {isBBB && <span className="px-1 py-0.5 bg-cyan-600/30 text-cyan-400 rounded text-xs">BBB</span>}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {isA6 && <span className="px-1 py-0.5 bg-amber-600/30 text-amber-400 rounded text-xs">A6</span>}
                    {isB6 && <span className="px-1 py-0.5 bg-teal-600/30 text-teal-400 rounded text-xs">B6</span>}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {isA9 && <span className="px-1 py-0.5 bg-lime-600/30 text-lime-400 rounded text-xs">A9</span>}
                    {isB9 && <span className="px-1 py-0.5 bg-indigo-600/30 text-indigo-400 rounded text-xs">B9</span>}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {isRight && <span className="px-1 py-0.5 bg-rose-600/30 text-rose-400 rounded text-xs">Right</span>}
                    {isLeft && <span className="px-1 py-0.5 bg-violet-600/30 text-violet-400 rounded text-xs">Left</span>}
                  </td>
                  <td className="px-1 py-2 text-center">
                    {quarter === '1st Q' && (
                      <span className="px-1 py-0.5 bg-red-600/30 text-red-400 rounded text-xs">
                        {quarter}
                      </span>
                    )}
                    {quarter === '2nd Q' && (
                      <span className="px-1 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                        {quarter}
                      </span>
                    )}
                    {quarter === '3rd Q' && (
                      <span className="px-1 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">
                        {quarter}
                      </span>
                    )}
                    {quarter === '4th Q' && (
                      <span className="px-1 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs">
                        {quarter}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {spins.length === 0 && (
              <tr className="border-t border-gray-700">
                <td className="px-2 py-4 text-center text-gray-500" colSpan={10}>
                  No spins recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}