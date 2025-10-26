import React from 'react'

interface WheelLayoutProps {
  spinHistory: { number: number }[]
  onNumberAdded: (number: number) => void
}

// European wheel order
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]

// Red numbers
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

export default function WheelLayout({ spinHistory, onNumberAdded }: WheelLayoutProps) {
  const getHitCount = (num: number) => {
    return spinHistory.slice(0, 36).filter(s => s.number === num).length
  }

  const isHot = (num: number) => getHitCount(num) >= 3
  const isCold = (num: number) => getHitCount(num) === 0

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
      {/* Racetrack layout - Train style */}
      <div className="space-y-1">
        {/* Top row - first 18 numbers */}
        <div className="grid grid-cols-18 gap-1">
          {WHEEL_ORDER.slice(0, 18).map((num) => {
            const heat = getHitCount(num)
            const opacity = heat === 0 ? 'opacity-60' : ''
            return (
              <button
                key={num}
                onClick={() => onNumberAdded(num)}
                className={`h-10 w-full ${
                  num === 0 ? 'bg-green-600 hover:bg-green-500' :
                  RED_NUMBERS.includes(num) ? 'bg-red-600 hover:bg-red-500' :
                  'bg-gray-900 hover:bg-gray-800 border border-gray-600'
                } text-white rounded text-[10px] font-bold relative ${opacity} ${
                  heat >= 3 ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                }`}
              >
                {num}
                {heat > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[8px] ${
                    heat >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
                  } text-black px-1 rounded-full font-bold`}>
                    {heat}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Middle row - just 2 numbers at the ends */}
        <div className="grid grid-cols-18 gap-1">
          <button
            onClick={() => onNumberAdded(WHEEL_ORDER[36])}
            className={`h-10 ${
              RED_NUMBERS.includes(WHEEL_ORDER[36]) ? 'bg-red-600 hover:bg-red-500' :
              'bg-gray-900 hover:bg-gray-800 border border-gray-600'
            } text-white rounded text-[10px] font-bold relative ${
              getHitCount(WHEEL_ORDER[36]) === 0 ? 'opacity-60' : ''
            } ${getHitCount(WHEEL_ORDER[36]) >= 3 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
          >
            {WHEEL_ORDER[36]}
            {getHitCount(WHEEL_ORDER[36]) > 0 && (
              <span className={`absolute -top-1 -right-1 text-[8px] ${
                getHitCount(WHEEL_ORDER[36]) >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
              } text-black px-1 rounded-full font-bold`}>
                {getHitCount(WHEEL_ORDER[36])}
              </span>
            )}
          </button>
          <div className="col-span-16"></div>
          <button
            onClick={() => onNumberAdded(WHEEL_ORDER[18])}
            className={`h-10 ${
              RED_NUMBERS.includes(WHEEL_ORDER[18]) ? 'bg-red-600 hover:bg-red-500' :
              'bg-gray-900 hover:bg-gray-800 border border-gray-600'
            } text-white rounded text-[10px] font-bold relative ${
              getHitCount(WHEEL_ORDER[18]) === 0 ? 'opacity-60' : ''
            } ${getHitCount(WHEEL_ORDER[18]) >= 3 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
          >
            {WHEEL_ORDER[18]}
            {getHitCount(WHEEL_ORDER[18]) > 0 && (
              <span className={`absolute -top-1 -right-1 text-[8px] ${
                getHitCount(WHEEL_ORDER[18]) >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
              } text-black px-1 rounded-full font-bold`}>
                {getHitCount(WHEEL_ORDER[18])}
              </span>
            )}
          </button>
        </div>

        {/* Bottom row - remaining numbers (reversed) */}
        <div className="grid grid-cols-17 gap-1">
          {WHEEL_ORDER.slice(19, 36).reverse().map((num) => {
            const heat = getHitCount(num)
            const opacity = heat === 0 ? 'opacity-60' : ''
            return (
              <button
                key={num}
                onClick={() => onNumberAdded(num)}
                className={`h-10 w-full ${
                  RED_NUMBERS.includes(num) ? 'bg-red-600 hover:bg-red-500' :
                  'bg-gray-900 hover:bg-gray-800 border border-gray-600'
                } text-white rounded text-[10px] font-bold relative ${opacity} ${
                  heat >= 3 ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                }`}
              >
                {num}
                {heat > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[8px] ${
                    heat >= 3 ? 'bg-yellow-400' : 'bg-orange-400'
                  } text-black px-1 rounded-full font-bold`}>
                    {heat}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
