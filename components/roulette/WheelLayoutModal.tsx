'use client'

import React from 'react'

type WheelGroupType = 'vois-orph-tier' | 'voisins-nonvoisins' | 'wheel-quarters' | 'ab-split' | 'aabb-split' | 'aaabbb-split' | 'a6b6-split' | 'a9b9-split' | 'right-left'

interface WheelLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  groupType?: WheelGroupType | null
}

// European wheel order
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]

// Define all wheel group configurations
const GROUP_CONFIGS: Record<WheelGroupType, { title: string, groups: Array<{ name: string, numbers: number[], color: string }> }> = {
  'vois-orph-tier': {
    title: 'Voisins / Orphelins / Tiers',
    groups: [
      { name: 'Voisins', numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25], color: '#3B82F6' },
      { name: 'Orphelins', numbers: [17,34,6,1,20,14,31,9], color: '#EAB308' },
      { name: 'Tiers', numbers: [27,13,36,11,30,8,23,10,5,24,16,33], color: '#10B981' }
    ]
  },
  'voisins-nonvoisins': {
    title: 'Voisins / Non-Voisins',
    groups: [
      { name: 'Voisins', numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25,17,34,6,1,20,14,31,9], color: '#3B82F6' },
      { name: 'Non-Voisins', numbers: [27,13,36,11,30,8,23,10,5,24,16,33], color: '#EF4444' }
    ]
  },
  'wheel-quarters': {
    title: 'Wheel Quarters (9s)',
    groups: [
      { name: '1st 9', numbers: [32,15,19,4,21,2,25,17,34], color: '#DC2626' },
      { name: '2nd 9', numbers: [6,27,13,36,11,30,8,23,10], color: '#0891B2' },
      { name: '3rd 9', numbers: [5,24,16,33,1,20,14,31,9], color: '#16A34A' },
      { name: '4th 9', numbers: [22,18,29,7,28,12,35,3,26], color: '#9333EA' }
    ]
  },
  'ab-split': {
    title: 'A/B Split',
    groups: [
      { name: 'A', numbers: [0,15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26], color: '#6366F1' },
      { name: 'B', numbers: [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3], color: '#EC4899' }
    ]
  },
  'aabb-split': {
    title: 'AA/BB Split',
    groups: [
      { name: 'AA', numbers: [0,32,19,21,25,27,36,30,23,5,16,1,14,9,18,7,12,3], color: '#84CC16' },
      { name: 'BB', numbers: [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26], color: '#9333EA' }
    ]
  },
  'aaabbb-split': {
    title: 'AAA/BBB Split',
    groups: [
      { name: 'AAA', numbers: [0,32,15,4,21,2,34,6,27,36,11,30,10,5,24,33,1,20,9,22,18,7,28,12,26], color: '#3B82F6' },
      { name: 'BBB', numbers: [19,25,17,13,8,23,16,14,31,29,35,3], color: '#EAB308' }
    ]
  },
  'a6b6-split': {
    title: 'A6/B6 Split',
    groups: [
      { name: 'A6', numbers: [0,32,15,19,4,21,27,13,36,11,30,8,16,33,1,20,14,31,28,12,35,3,26], color: '#F59E0B' },
      { name: 'B6', numbers: [2,25,17,34,6,23,10,5,24,9,22,18,29,7], color: '#8B5CF6' }
    ]
  },
  'a9b9-split': {
    title: 'A9/B9 Split',
    groups: [
      { name: 'A9', numbers: [0,32,15,19,4,21,2,25,17,5,24,16,33,1,20,14,31,9], color: '#06B6D4' },
      { name: 'B9', numbers: [34,6,27,13,36,11,30,8,23,10,22,18,29,7,28,12,35,3,26], color: '#F97316' }
    ]
  },
  'right-left': {
    title: 'Right/Left Split',
    groups: [
      { name: 'Right', numbers: [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10], color: '#14B8A6' },
      { name: 'Left', numbers: [5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26], color: '#A855F7' }
    ]
  }
}

export default function WheelLayoutModal({ isOpen, onClose, groupType = 'vois-orph-tier' }: WheelLayoutModalProps) {
  if (!isOpen || !groupType) return null

  const config = GROUP_CONFIGS[groupType]
  if (!config) return null

  // Get the group color for a number (this will be the background)
  const getNumberColor = (num: number): string => {
    const group = config.groups.find(g => g.numbers.includes(num))
    return group?.color || '#1F2937' // Default gray
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-2xl font-bold text-white">{config.title}</h2>
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
              {config.groups.map((group, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border-2 border-white/20"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-gray-300 font-medium">{group.name} ({group.numbers.length} numbers)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wheel Layout - Racetrack Style */}
          <div className="bg-gray-900 rounded-lg p-6 border-2 border-gray-700">
            <div className="space-y-1">
              {/* Top row - first 18 numbers */}
              <div className="grid grid-cols-18 gap-1">
                {WHEEL_ORDER.slice(0, 18).map((num) => {
                  const bgColor = getNumberColor(num)
                  return (
                    <div
                      key={num}
                      className="h-12 w-full rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                      style={{ backgroundColor: bgColor }}
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
                  style={{ backgroundColor: getNumberColor(WHEEL_ORDER[36]) }}
                >
                  {WHEEL_ORDER[36]}
                </div>
                <div className="col-span-16"></div>
                <div
                  className="h-12 rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                  style={{ backgroundColor: getNumberColor(WHEEL_ORDER[18]) }}
                >
                  {WHEEL_ORDER[18]}
                </div>
              </div>

              {/* Bottom row - remaining numbers (reversed) */}
              <div className="grid grid-cols-17 gap-1">
                {WHEEL_ORDER.slice(19, 36).reverse().map((num) => {
                  const bgColor = getNumberColor(num)
                  return (
                    <div
                      key={num}
                      className="h-12 w-full rounded text-white font-bold text-xs flex items-center justify-center relative border-2 border-white/30"
                      style={{ backgroundColor: bgColor }}
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
