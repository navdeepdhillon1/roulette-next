'use client'

import React from 'react'
import { createPortal } from 'react-dom'

interface GroupConfig {
  name: string
  groups: {
    label: string
    numbers: number[]
    color: string
  }[]
}

interface TableLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  groupType: 'dozen' | 'column' | 'color' | 'evenOdd' | 'lowHigh' | 'alt1' | 'alt2' | 'alt3' | 'edgeCenter' | 'six' | null
}

const GROUP_CONFIGS: Record<string, GroupConfig> = {
  dozen: {
    name: 'Dozens',
    groups: [
      { label: '1st Dozen (1-12)', numbers: [1,2,3,4,5,6,7,8,9,10,11,12], color: '#DC2626' },
      { label: '2nd Dozen (13-24)', numbers: [13,14,15,16,17,18,19,20,21,22,23,24], color: '#0891B2' },
      { label: '3rd Dozen (25-36)', numbers: [25,26,27,28,29,30,31,32,33,34,35,36], color: '#16A34A' }
    ]
  },
  column: {
    name: 'Columns',
    groups: [
      { label: '1st Column', numbers: [1,4,7,10,13,16,19,22,25,28,31,34], color: '#EA580C' },
      { label: '2nd Column', numbers: [2,5,8,11,14,17,20,23,26,29,32,35], color: '#0D9488' },
      { label: '3rd Column', numbers: [3,6,9,12,15,18,21,24,27,30,33,36], color: '#84CC16' }
    ]
  },
  color: {
    name: 'Red/Black',
    groups: [
      { label: 'Red', numbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36], color: '#DC2626' },
      { label: 'Black', numbers: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35], color: '#374151' }
    ]
  },
  evenOdd: {
    name: 'Even/Odd',
    groups: [
      { label: 'Even', numbers: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36], color: '#9333EA' },
      { label: 'Odd', numbers: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35], color: '#0891B2' }
    ]
  },
  lowHigh: {
    name: 'Low/High',
    groups: [
      { label: 'Low (1-18)', numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18], color: '#B45309' },
      { label: 'High (19-36)', numbers: [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36], color: '#4B5563' }
    ]
  },
  alt1: {
    name: '1st Alternate Streets (A/B)',
    groups: [
      { label: 'A - Streets 1,3,5,7,9,11', numbers: [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33], color: '#6366F1' },
      { label: 'B - Streets 2,4,6,8,10,12', numbers: [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36], color: '#EC4899' }
    ]
  },
  alt2: {
    name: '2nd Alternate Streets (AA/BB)',
    groups: [
      { label: 'AA - Street pairs 1-2,5-6,9-10', numbers: [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30], color: '#84CC16' },
      { label: 'BB - Street pairs 3-4,7-8,11-12', numbers: [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36], color: '#9333EA' }
    ]
  },
  alt3: {
    name: '3rd Alternate Streets (AAA/BBB)',
    groups: [
      { label: 'AAA - Streets 1-3,7-9', numbers: [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27], color: '#3B82F6' },
      { label: 'BBB - Streets 4-6,10-12', numbers: [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36], color: '#EAB308' }
    ]
  },
  edgeCenter: {
    name: 'Edge/Center',
    groups: [
      { label: 'Edge - Streets 1-3,10-12', numbers: [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36], color: '#9333EA' },
      { label: 'Center - Streets 4-9', numbers: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27], color: '#EA580C' }
    ]
  },
  six: {
    name: 'Six Groups',
    groups: [
      { label: '1st Six (1-6)', numbers: [1,2,3,4,5,6], color: '#B91C1C' },
      { label: '2nd Six (7-12)', numbers: [7,8,9,10,11,12], color: '#1D4ED8' },
      { label: '3rd Six (13-18)', numbers: [13,14,15,16,17,18], color: '#15803D' },
      { label: '4th Six (19-24)', numbers: [19,20,21,22,23,24], color: '#15803D' },
      { label: '5th Six (25-30)', numbers: [25,26,27,28,29,30], color: '#1D4ED8' },
      { label: '6th Six (31-36)', numbers: [31,32,33,34,35,36], color: '#B91C1C' }
    ]
  }
}

// Standard roulette table layout (European style)
// Rows go from bottom to top: 3, 2, 1
// Columns go from left to right: 1-34, 2-35, 3-36
const TABLE_LAYOUT = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], // Top row
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], // Middle row
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]  // Bottom row
]

export default function TableLayoutModal({ isOpen, onClose, groupType }: TableLayoutModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !groupType || !mounted) return null

  const config = GROUP_CONFIGS[groupType]
  if (!config) return null

  // Helper function to get the color for a specific number
  const getNumberColor = (num: number): string => {
    const group = config.groups.find(g => g.numbers.includes(num))
    return group?.color || '#1F2937' // Default gray if not in any group
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-2xl font-bold text-white">{config.name}</h2>
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
            <div className="flex flex-wrap gap-4">
              {config.groups.map((group, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border-2 border-white/20"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-gray-300 font-medium">{group.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Roulette Table Layout */}
          <div className="bg-gray-900 rounded-lg p-6 border-2 border-gray-700">
            <div className="flex items-center justify-center gap-2">
              {/* Zero */}
              <div className="flex flex-col mr-2">
                <div className="w-16 h-[204px] flex items-center justify-center bg-green-600 border-2 border-white/30 rounded text-white font-bold text-2xl">
                  0
                </div>
              </div>

              {/* Main number grid */}
              <div className="flex flex-col gap-1">
                {TABLE_LAYOUT.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-1">
                    {row.map((num) => {
                      const bgColor = getNumberColor(num)
                      return (
                        <div
                          key={num}
                          className="w-14 h-14 flex items-center justify-center border-2 border-white/30 rounded font-bold text-lg text-white shadow-lg"
                          style={{ backgroundColor: bgColor }}
                        >
                          {num}
                        </div>
                      )
                    })}
                  </div>
                ))}
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
    </div>,
    document.body
  )
}
