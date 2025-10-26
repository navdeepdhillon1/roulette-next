'use client'

import React from 'react'

interface WheelLayoutModalProps {
  isOpen: boolean
  onClose: () => void
}

// European wheel order
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]

// Red numbers
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

// Define the three groups
const GROUPS = {
  voisins: {
    name: 'Voisins',
    numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
    color: '#3B82F6' // Blue
  },
  orphelins: {
    name: 'Orphelins',
    numbers: [17, 34, 6, 1, 20, 14, 31, 9],
    color: '#EAB308' // Yellow
  },
  tiers: {
    name: 'Tiers',
    numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
    color: '#10B981' // Green
  }
}

export default function WheelLayoutModal({ isOpen, onClose }: WheelLayoutModalProps) {
  if (!isOpen) return null

  // Get the group color for a number
  const getNumberColor = (num: number): string => {
    if (GROUPS.voisins.numbers.includes(num)) return GROUPS.voisins.color
    if (GROUPS.orphelins.numbers.includes(num)) return GROUPS.orphelins.color
    if (GROUPS.tiers.numbers.includes(num)) return GROUPS.tiers.color
    return '#1F2937' // Default gray
  }

  // Get background color for wheel number (considering red/black)
  const getBackgroundColor = (num: number): string => {
    if (num === 0) return '#059669' // Green for zero
    return RED_NUMBERS.includes(num) ? '#DC2626' : '#1F2937' // Red or black
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-2xl font-bold text-white">Voisins / Orphelins / Tiers</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Legend */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-white/20"
                  style={{ backgroundColor: GROUPS.voisins.color }}
                />
                <span className="text-gray-300 font-medium">{GROUPS.voisins.name} ({GROUPS.voisins.numbers.length} numbers)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-white/20"
                  style={{ backgroundColor: GROUPS.orphelins.color }}
                />
                <span className="text-gray-300 font-medium">{GROUPS.orphelins.name} ({GROUPS.orphelins.numbers.length} numbers)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-white/20"
                  style={{ backgroundColor: GROUPS.tiers.color }}
                />
                <span className="text-gray-300 font-medium">{GROUPS.tiers.name} ({GROUPS.tiers.numbers.length} numbers)</span>
              </div>
            </div>
          </div>

          {/* Wheel Layout - Racetrack Style */}
          <div className="bg-gray-900 rounded-lg p-6 border-2 border-gray-700">
            <div className="space-y-1">
              {/* Top row - first 18 numbers */}
              <div className="grid grid-cols-18 gap-1">
                {WHEEL_ORDER.slice(0, 18).map((num) => {
                  const groupColor = getNumberColor(num)
                  const bgColor = getBackgroundColor(num)
                  return (
                    <div
                      key={num}
                      className="h-12 w-full rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                      style={{
                        backgroundColor: bgColor,
                        boxShadow: groupColor !== '#1F2937' ? `0 0 0 3px ${groupColor}` : 'none'
                      }}
                    >
                      {num}
                    </div>
                  )
                })}
              </div>

              {/* Middle row - just 2 numbers at the ends */}
              <div className="grid grid-cols-18 gap-1">
                <div
                  className="h-12 rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                  style={{
                    backgroundColor: getBackgroundColor(WHEEL_ORDER[36]),
                    boxShadow: getNumberColor(WHEEL_ORDER[36]) !== '#1F2937' ? `0 0 0 3px ${getNumberColor(WHEEL_ORDER[36])}` : 'none'
                  }}
                >
                  {WHEEL_ORDER[36]}
                </div>
                <div className="col-span-16"></div>
                <div
                  className="h-12 rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                  style={{
                    backgroundColor: getBackgroundColor(WHEEL_ORDER[18]),
                    boxShadow: getNumberColor(WHEEL_ORDER[18]) !== '#1F2937' ? `0 0 0 3px ${getNumberColor(WHEEL_ORDER[18])}` : 'none'
                  }}
                >
                  {WHEEL_ORDER[18]}
                </div>
              </div>

              {/* Bottom row - remaining numbers (reversed) */}
              <div className="grid grid-cols-17 gap-1">
                {WHEEL_ORDER.slice(19, 36).reverse().map((num) => {
                  const groupColor = getNumberColor(num)
                  const bgColor = getBackgroundColor(num)
                  return (
                    <div
                      key={num}
                      className="h-12 w-full rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                      style={{
                        backgroundColor: bgColor,
                        boxShadow: groupColor !== '#1F2937' ? `0 0 0 3px ${groupColor}` : 'none'
                      }}
                    >
                      {num}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
