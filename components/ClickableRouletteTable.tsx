'use client'

import React from 'react'
import { RED_NUMBERS } from '@/lib/roulette-logic'

interface ClickableRouletteTableProps {
  onNumberClick: (number: number) => void
  recentSpins?: number[]
}

// Standard roulette table layout (European style)
const TABLE_LAYOUT = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], // Top row
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], // Middle row
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]  // Bottom row
]

export default function ClickableRouletteTable({ onNumberClick, recentSpins = [] }: ClickableRouletteTableProps) {
  const isRecentSpin = (num: number) => recentSpins[0] === num

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
      <div className="flex items-center justify-center gap-2">
        {/* Zero */}
        <button
          onClick={() => onNumberClick(0)}
          className={`
            w-12 h-[140px] flex items-center justify-center bg-green-600 hover:bg-green-700
            border-2 border-white/30 rounded text-white font-bold text-xl transition-all
            ${isRecentSpin(0) ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
          `}
        >
          0
        </button>

        {/* Main number grid */}
        <div className="flex flex-col gap-0.5">
          {TABLE_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-0.5">
              {row.map((num) => {
                const isRed = RED_NUMBERS.includes(num)
                const bgColor = isRed ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800 border-gray-600'

                return (
                  <button
                    key={num}
                    onClick={() => onNumberClick(num)}
                    className={`
                      w-11 h-11 flex items-center justify-center border-2 border-white/30
                      rounded font-bold text-sm text-white transition-all
                      ${bgColor}
                      ${isRecentSpin(num) ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                    `}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
