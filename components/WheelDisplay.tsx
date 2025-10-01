'use client'
import React from 'react'
import { WHEEL_ORDER, RED_NUMBERS } from '@/lib/roulette-logic'

interface WheelDisplayProps {
  spins: number[]
  selectedNumber: number | null
  setSelectedNumber: (num: number | null) => void
  inputNumber: string
  setInputNumber: (value: string) => void
  addNumber: () => void
  hitCounts?: Record<number, number>
}

export default function WheelDisplay({
  spins,
  selectedNumber,
  setSelectedNumber,
  inputNumber,
  setInputNumber,
  addNumber,
  hitCounts = {}
}: WheelDisplayProps) {
  
  const handleWheelNumberClick = (num: number) => {
    setInputNumber(num.toString())
    setSelectedNumber(num)
  }

  const getWheelAngle = (number: number) => {
    const index = WHEEL_ORDER.indexOf(number)
    return (index * 360 / 37) - 90
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">European Roulette Wheel</h3>
      
      {/* SVG Wheel */}
      <div className="flex justify-center mb-4">
        <svg width="500" height="500" viewBox="0 0 500 500">
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="goldGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
            <radialGradient id="centerGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Outer decorative ring */}
          <circle cx="250" cy="250" r="240" fill="url(#goldGradient)" opacity="0.3"/>
          <circle cx="250" cy="250" r="235" fill="#1a1a1a" stroke="#b8860b" strokeWidth="2"/>
          <circle cx="250" cy="250" r="220" fill="#0d0d0d" stroke="#ffd700" strokeWidth="3" filter="url(#shadow)"/>
          
          {/* Main wheel circle */}
          <circle cx="250" cy="250" r="210" fill="#1a1a1a" stroke="#b8860b" strokeWidth="1"/>
          
          {/* Wheel segments */}
          {WHEEL_ORDER.map((num, idx) => {
            const angle = (idx * 360 / 37)
            const angleRad = (angle * Math.PI) / 180
            const nextAngleRad = ((angle + 360/37) * Math.PI) / 180
            
            const x1 = 250 + 210 * Math.cos(angleRad - Math.PI/2)
            const y1 = 250 + 210 * Math.sin(angleRad - Math.PI/2)
            const x2 = 250 + 85 * Math.cos(angleRad - Math.PI/2)
            const y2 = 250 + 85 * Math.sin(angleRad - Math.PI/2)
            const x3 = 250 + 85 * Math.cos(nextAngleRad - Math.PI/2)
            const y3 = 250 + 85 * Math.sin(nextAngleRad - Math.PI/2)
            const x4 = 250 + 210 * Math.cos(nextAngleRad - Math.PI/2)
            const y4 = 250 + 210 * Math.sin(nextAngleRad - Math.PI/2)
            
            const textRadius = 165
            const textAngle = angle + (360/37/2)
            const textX = 250 + textRadius * Math.cos(textAngle * Math.PI / 180 - Math.PI/2)
            const textY = 250 + textRadius * Math.sin(textAngle * Math.PI / 180 - Math.PI/2)
            
            const freqRadius = 195
            const freqX = 250 + freqRadius * Math.cos(textAngle * Math.PI / 180 - Math.PI/2)
            const freqY = 250 + freqRadius * Math.sin(textAngle * Math.PI / 180 - Math.PI/2)
            
            const frequency = hitCounts[num] || 0
            const isHot = frequency >= 2
            const isSelected = selectedNumber === num
            
            let fillColor = '#111111'
            if (num === 0) fillColor = '#0d7a3e'
            else if (RED_NUMBERS.includes(num)) fillColor = '#b91c1c'
            
            if (isSelected) {
              if (num === 0) fillColor = '#16a34a'
              else if (RED_NUMBERS.includes(num)) fillColor = '#dc2626'
              else fillColor = '#333333'
            }
            
            return (
              <g key={idx}>
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2} A 85 85 0 0 1 ${x3} ${y3} L ${x4} ${y4} A 210 210 0 0 0 ${x1} ${y1}`}
                  fill={fillColor}
                  stroke={isSelected ? '#ffd700' : isHot ? '#ffd700' : '#444'}
                  strokeWidth={isSelected ? '3' : isHot ? '2' : '0.5'}
                  className="cursor-pointer transition-all hover:brightness-125"
                  onClick={() => handleWheelNumberClick(num)}
                  filter={isSelected || isHot ? "url(#shadow)" : ""}
                />
                
                <text
                  x={textX}
                  y={textY}
                  fill={isSelected ? '#ffd700' : 'white'}
                  fontSize="15"
                  fontWeight={isSelected ? "900" : "600"}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none"
                  style={{ textShadow: isSelected ? '2px 2px 4px rgba(0,0,0,1)' : '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {num}
                </text>
                
                {frequency > 0 && (
                  <text
                    x={freqX}
                    y={freqY}
                    fill="#ffd700"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                    style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}
                  >
                    {frequency}
                  </text>
                )}
              </g>
            )
          })}
          
          {/* Center design */}
          <circle cx="250" cy="250" r="85" fill="url(#centerGradient)" stroke="#b8860b" strokeWidth="2" filter="url(#shadow)"/>
          <circle cx="250" cy="250" r="75" fill="#2a2a2a" stroke="#ffd700" strokeWidth="1"/>
          <circle cx="250" cy="250" r="65" fill="none" stroke="#b8860b" strokeWidth="0.5" strokeDasharray="2,2"/>
          
          <text x="250" y="240" fill="#ffd700" fontSize="12" fontWeight="300" textAnchor="middle" dominantBaseline="middle" letterSpacing="2">
            EUROPEAN
          </text>
          <text x="250" y="260" fill="#ffd700" fontSize="12" fontWeight="300" textAnchor="middle" dominantBaseline="middle" letterSpacing="2">
            ROULETTE
          </text>
          
          {/* Winning number pointer */}
          {spins.length > 0 && (
            <g transform={`rotate(${getWheelAngle(spins[0])}, 250, 250)`}>
              <path
                d="M 250 40 L 245 25 L 255 25 Z"
                fill="#ffd700"
                stroke="#b8860b"
                strokeWidth="1"
                filter="url(#shadow)"
              />
              <circle cx="250" cy="35" r="3" fill="#ffd700" />
            </g>
          )}
          
          {/* Fixed top indicator */}
          <path
            d="M 250 15 L 240 30 L 260 30 Z"
            fill="#ffd700"
            stroke="#b8860b"
            strokeWidth="2"
            filter="url(#shadow)"
          />
        </svg>
      </div>

      {/* Add Number Input Section */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <span className="text-sm font-bold text-yellow-400">Add Number:</span>
        <input
          type="number"
          min="0"
          max="36"
          value={inputNumber}
          onChange={(e) => setInputNumber(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addNumber()}
          placeholder="0-36"
          className={`w-20 px-2 py-1.5 bg-black/50 border-2 rounded text-center text-sm font-bold transition-all ${
            selectedNumber !== null ? 'border-yellow-400 text-yellow-400' : 'border-gray-600 text-white'
          }`}
        />
        <button
          onClick={addNumber}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-bold text-white transition-all"
        >
          ADD
        </button>
        {selectedNumber !== null && (
          <button
            onClick={() => {
              setSelectedNumber(null)
              setInputNumber('')
            }}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm font-bold text-white transition-all"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  )
}