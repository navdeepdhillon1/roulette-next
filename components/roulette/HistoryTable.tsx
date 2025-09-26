import React from 'react'
import type { Spin } from '@/lib/types'

interface HistoryTableProps {
  spins: Spin[]
}

export default function HistoryTable({ spins }: HistoryTableProps) {
  if (spins.length === 0) {
    return <p className="text-gray-400 text-center py-8">No spins recorded yet</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <th className="p-2 text-center font-semibold">Number</th>
            <th className="p-2 text-center font-semibold">Color</th>
            <th className="p-2 text-center font-semibold">Even/Odd</th>
            <th className="p-2 text-center font-semibold">Low/High</th>
            <th className="p-2 text-center font-semibold">Column</th>
            <th className="p-2 text-center font-semibold">Dozen</th>
            <th className="p-2 text-center font-semibold">Alt1</th>
            <th className="p-2 text-center font-semibold">Alt2</th>
            <th className="p-2 text-center font-semibold">Alt3</th>
            <th className="p-2 text-center font-semibold">E/C</th>
            <th className="p-2 text-center font-semibold">Six</th>
          </tr>
        </thead>
        <tbody>
          {spins.map((spin, index) => {
            const num = spin.number
            const alt1 = num === 0 ? '-' : [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B'
            const alt2 = num === 0 ? '-' : [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB'
            const alt3 = num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB'
            const edgeCenter = num === 0 ? '-' : [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num) ? 'E' : 'C'
            const sixGroup = num === 0 ? '-' : num <= 6 ? '1st' : num <= 12 ? '2nd' : num <= 18 ? '3rd' : num <= 24 ? '4th' : num <= 30 ? '5th' : '6th'

            return (
              <tr key={spin.id || index} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                <td className="p-2 text-center">
                  <div className={`
                    inline-flex items-center justify-center w-10 h-10 rounded-full font-bold
                    ${spin.color === 'red' ? 'bg-red-600' : 
                      spin.color === 'black' ? 'bg-gray-900 border border-gray-600' : 
                      'bg-green-600'}
                  `}>
                    {num}
                  </div>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${spin.color === 'red' ? 'bg-red-600/30 text-red-400' :
                      spin.color === 'black' ? 'bg-gray-600/30 text-gray-300' :
                      'bg-green-600/30 text-green-400'}
                  `}>
                    {spin.color === 'red' ? 'R' : spin.color === 'black' ? 'B' : 'G'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${spin.even_odd === 'even' ? 'bg-purple-600/30 text-purple-400' :
                      spin.even_odd === 'odd' ? 'bg-cyan-600/30 text-cyan-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {spin.even_odd === 'even' ? 'E' : spin.even_odd === 'odd' ? 'O' : '-'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${spin.low_high === 'low' ? 'bg-amber-700/30 text-amber-400' :
                      spin.low_high === 'high' ? 'bg-gray-600/30 text-gray-300' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {spin.low_high === 'low' ? 'L' : spin.low_high === 'high' ? 'H' : '-'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${spin.column_num === 1 ? 'bg-orange-600/30 text-orange-400' :
                      spin.column_num === 2 ? 'bg-teal-600/30 text-teal-400' :
                      spin.column_num === 3 ? 'bg-lime-600/30 text-lime-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {spin.column_num > 0 ? `${spin.column_num}st` : '-'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${spin.dozen === 'first' ? 'bg-red-700/30 text-red-400' :
                      spin.dozen === 'second' ? 'bg-cyan-700/30 text-cyan-400' :
                      spin.dozen === 'third' ? 'bg-green-700/30 text-green-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {spin.dozen === 'first' ? '1st' : spin.dozen === 'second' ? '2nd' : spin.dozen === 'third' ? '3rd' : '-'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${alt1 === 'A' ? 'bg-indigo-600/30 text-indigo-400' :
                      alt1 === 'B' ? 'bg-pink-600/30 text-pink-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {alt1}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${alt2 === 'AA' ? 'bg-lime-700/30 text-lime-400' :
                      alt2 === 'BB' ? 'bg-purple-700/30 text-purple-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {alt2}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${alt3 === 'AAA' ? 'bg-blue-600/30 text-blue-400' :
                      alt3 === 'BBB' ? 'bg-yellow-700/30 text-yellow-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {alt3}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${edgeCenter === 'E' ? 'bg-purple-600/30 text-purple-400' :
                      edgeCenter === 'C' ? 'bg-orange-600/30 text-orange-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {edgeCenter}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${sixGroup === '1st' || sixGroup === '6th' ? 'bg-red-700/30 text-red-400' :
                      sixGroup === '2nd' || sixGroup === '5th' ? 'bg-blue-700/30 text-blue-400' :
                      sixGroup === '3rd' || sixGroup === '4th' ? 'bg-green-700/30 text-green-400' :
                      'bg-gray-600/30 text-gray-400'}
                  `}>
                    {sixGroup}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
