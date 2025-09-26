import React from 'react'
import { NUMBERS } from '@/lib/roulette-logic'

interface HeatmapGridProps {
  spins: { number: number }[]
  setInputNumber: (v: string) => void
}

export default function HeatmapGrid({ spins, setInputNumber }: HeatmapGridProps) {
  return (
    <div className="p-3 bg-black/30 rounded">
      <div className="grid grid-cols-12 gap-1 mb-1">
        <div 
          onClick={() => setInputNumber('0')}
          className="col-span-12 bg-green-600 text-white text-center py-2 rounded text-lg font-bold cursor-pointer hover:opacity-80 relative"
        >
          0
          <span className="absolute top-0 right-1 text-xs bg-black/50 px-1 rounded">
            {spins.slice(0, 36).filter(s => s.number === 0).length}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {[3,6,9,12,15,18,21,24,27,30,33,36].map(n => {
          const hitCount = spins.slice(0, 36).filter(s => s.number === n).length
          const heatColor = hitCount === 0 ? 'opacity-50' : hitCount >= 3 ? 'ring-2 ring-yellow-400' : ''
          return (
            <div 
              key={n} 
              onClick={() => setInputNumber(n.toString())}
              className={`${NUMBERS.RED.includes(n) ? 'bg-red-600' : 'bg-black'} text-white text-center py-2 rounded text-sm font-bold cursor-pointer hover:opacity-80 relative ${heatColor}`}
            >
              {n}
              {hitCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded-full font-bold">
                  {hitCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-12 gap-1 mt-1">
        {[2,5,8,11,14,17,20,23,26,29,32,35].map(n => {
          const hitCount = spins.slice(0, 36).filter(s => s.number === n).length
          const heatColor = hitCount === 0 ? 'opacity-50' : hitCount >= 3 ? 'ring-2 ring-yellow-400' : ''
          return (
            <div 
              key={n}
              onClick={() => setInputNumber(n.toString())}
              className={`${NUMBERS.RED.includes(n) ? 'bg-red-600' : 'bg-black'} text-white text-center py-2 rounded text-sm font-bold cursor-pointer hover:opacity-80 relative ${heatColor}`}
            >
              {n}
              {hitCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded-full font-bold">
                  {hitCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-12 gap-1 mt-1">
        {[1,4,7,10,13,16,19,22,25,28,31,34].map(n => {
          const hitCount = spins.slice(0, 36).filter(s => s.number === n).length
          const heatColor = hitCount === 0 ? 'opacity-50' : hitCount >= 3 ? 'ring-2 ring-yellow-400' : ''
          return (
            <div 
              key={n}
              onClick={() => setInputNumber(n.toString())}
              className={`${NUMBERS.RED.includes(n) ? 'bg-red-600' : 'bg-black'} text-white text-center py-2 rounded text-sm font-bold cursor-pointer hover:opacity-80 relative ${heatColor}`}
            >
              {n}
              {hitCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded-full font-bold">
                  {hitCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-600 text-xs flex gap-4">
        <span className="text-gray-400">Cold (0 hits): Faded</span>
        <span className="text-yellow-400">Hot (3+ hits): Yellow ring</span>
        <span className="text-white">Hit count shown in corner</span>
      </div>
    </div>
  )
}


