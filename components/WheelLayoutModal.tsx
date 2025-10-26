'use client'

import React from 'react'
import { WHEEL_ORDER, WHEEL_GROUPS } from '@/lib/roulette-logic'

interface GroupConfig {
  name: string
  groups: {
    label: string
    numbers: number[]
    color: string
  }[]
}

interface WheelLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  groupType: 'specials1' | 'specials2' | 'voisins' | 'orphelins' | 'tiers' | 'jeu_zero' | 'non_voisin' | 'a' | 'b' | 'aa' | 'bb' | 'aaa' | 'bbb' | 'a6' | 'b6' | 'a9' | 'b9' | 'right' | 'left' | 'first_9' | 'second_9' | 'third_9' | 'fourth_9' | 'vois-orph-tier' | 'voisins-nonvoisins' | 'wheel-quarters' | 'ab-split' | 'aabb-split' | 'aaabbb-split' | 'a6b6-split' | 'a9b9-split' | 'right-left' | null
}

const GROUP_CONFIGS: Record<string, GroupConfig> = {
  specials1: {
    name: 'Specials 1',
    groups: [
      { label: 'Voisins (17 numbers)', numbers: WHEEL_GROUPS.voisins, color: '#DC2626' },
      { label: 'Orphelins (8 numbers)', numbers: WHEEL_GROUPS.orphelins, color: '#16A34A' },
      { label: 'Tiers (12 numbers)', numbers: WHEEL_GROUPS.tiers, color: '#2563EB' }
    ]
  },
  specials2: {
    name: 'Specials 2',
    groups: [
      { label: 'Voisins (17 numbers)', numbers: WHEEL_GROUPS.voisins, color: '#DC2626' },
      { label: 'Non-Voisin (20 numbers)', numbers: WHEEL_GROUPS.non_voisin, color: '#16A34A' }
    ]
  },
  voisins: {
    name: 'Voisins du Zero',
    groups: [
      { label: 'Voisins (17 numbers)', numbers: WHEEL_GROUPS.voisins, color: '#DC2626' }
    ]
  },
  orphelins: {
    name: 'Orphelins',
    groups: [
      { label: 'Orphelins (8 numbers)', numbers: WHEEL_GROUPS.orphelins, color: '#0891B2' }
    ]
  },
  tiers: {
    name: 'Tiers du Cylindre',
    groups: [
      { label: 'Tiers (12 numbers)', numbers: WHEEL_GROUPS.tiers, color: '#16A34A' }
    ]
  },
  jeu_zero: {
    name: 'Jeu Zero',
    groups: [
      { label: 'Jeu Zero (7 numbers)', numbers: WHEEL_GROUPS.jeu_zero, color: '#9333EA' }
    ]
  },
  non_voisin: {
    name: 'Non-Voisin',
    groups: [
      { label: 'Non-Voisin (20 numbers)', numbers: WHEEL_GROUPS.non_voisin, color: '#EA580C' }
    ]
  },
  a: {
    name: 'A/B Groups',
    groups: [
      { label: 'A - Alternating singles', numbers: WHEEL_GROUPS.a, color: '#6366F1' },
      { label: 'B - Alternating singles', numbers: WHEEL_GROUPS.b, color: '#EC4899' }
    ]
  },
  aa: {
    name: 'AA/BB Groups',
    groups: [
      { label: 'AA - Alternating pairs', numbers: WHEEL_GROUPS.aa, color: '#84CC16' },
      { label: 'BB - Alternating pairs', numbers: WHEEL_GROUPS.bb, color: '#9333EA' }
    ]
  },
  aaa: {
    name: 'AAA/BBB Groups',
    groups: [
      { label: 'AAA - Alternating triplets', numbers: WHEEL_GROUPS.aaa, color: '#3B82F6' },
      { label: 'BBB - Alternating triplets', numbers: WHEEL_GROUPS.bbb, color: '#EAB308' }
    ]
  },
  a6: {
    name: 'A6/B6 Groups',
    groups: [
      { label: 'A6 - Six-based split', numbers: WHEEL_GROUPS.a6, color: '#10B981' },
      { label: 'B6 - Six-based split', numbers: WHEEL_GROUPS.b6, color: '#F59E0B' }
    ]
  },
  a9: {
    name: 'A9/B9 Groups',
    groups: [
      { label: 'A9 - Nine-based split', numbers: WHEEL_GROUPS.a9, color: '#06B6D4' },
      { label: 'B9 - Nine-based split', numbers: WHEEL_GROUPS.b9, color: '#F43F5E' }
    ]
  },
  right: {
    name: 'Right/Left Wheel',
    groups: [
      { label: 'Right - Right half of wheel', numbers: WHEEL_GROUPS.right, color: '#8B5CF6' },
      { label: 'Left - Left half of wheel', numbers: WHEEL_GROUPS.left, color: '#EF4444' }
    ]
  },
  first_9: {
    name: 'Wheel Quadrants (9s)',
    groups: [
      { label: '1st Nine', numbers: WHEEL_GROUPS.first_9, color: '#DC2626' },
      { label: '2nd Nine', numbers: WHEEL_GROUPS.second_9, color: '#0891B2' },
      { label: '3rd Nine', numbers: WHEEL_GROUPS.third_9, color: '#16A34A' },
      { label: '4th Nine', numbers: WHEEL_GROUPS.fourth_9, color: '#9333EA' }
    ]
  },
  // GroupSelector types (with hyphenated names)
  'vois-orph-tier': {
    name: 'Voisins / Orphelins / Tiers',
    groups: [
      { label: 'Voisins (17 numbers)', numbers: WHEEL_GROUPS.voisins, color: '#3B82F6' },
      { label: 'Orphelins (8 numbers)', numbers: WHEEL_GROUPS.orphelins, color: '#EAB308' },
      { label: 'Tiers (12 numbers)', numbers: WHEEL_GROUPS.tiers, color: '#10B981' }
    ]
  },
  'voisins-nonvoisins': {
    name: 'Voisins / Non-Voisins',
    groups: [
      { label: 'Voisins (25 numbers)', numbers: WHEEL_GROUPS.voisins, color: '#3B82F6' },
      { label: 'Non-Voisins (12 numbers)', numbers: WHEEL_GROUPS.non_voisin, color: '#EF4444' }
    ]
  },
  'wheel-quarters': {
    name: 'Wheel Quarters (9s)',
    groups: [
      { label: '1st 9', numbers: WHEEL_GROUPS.first_9, color: '#DC2626' },
      { label: '2nd 9', numbers: WHEEL_GROUPS.second_9, color: '#0891B2' },
      { label: '3rd 9', numbers: WHEEL_GROUPS.third_9, color: '#16A34A' },
      { label: '4th 9', numbers: WHEEL_GROUPS.fourth_9, color: '#9333EA' }
    ]
  },
  'ab-split': {
    name: 'A/B Split',
    groups: [
      { label: 'A', numbers: WHEEL_GROUPS.a, color: '#6366F1' },
      { label: 'B', numbers: WHEEL_GROUPS.b, color: '#EC4899' }
    ]
  },
  'aabb-split': {
    name: 'AA/BB Split',
    groups: [
      { label: 'AA', numbers: WHEEL_GROUPS.aa, color: '#84CC16' },
      { label: 'BB', numbers: WHEEL_GROUPS.bb, color: '#9333EA' }
    ]
  },
  'aaabbb-split': {
    name: 'AAA/BBB Split',
    groups: [
      { label: 'AAA', numbers: WHEEL_GROUPS.aaa, color: '#3B82F6' },
      { label: 'BBB', numbers: WHEEL_GROUPS.bbb, color: '#EAB308' }
    ]
  },
  'a6b6-split': {
    name: 'A6/B6 Split',
    groups: [
      { label: 'A6', numbers: WHEEL_GROUPS.a6, color: '#F59E0B' },
      { label: 'B6', numbers: WHEEL_GROUPS.b6, color: '#8B5CF6' }
    ]
  },
  'a9b9-split': {
    name: 'A9/B9 Split',
    groups: [
      { label: 'A9', numbers: WHEEL_GROUPS.a9, color: '#06B6D4' },
      { label: 'B9', numbers: WHEEL_GROUPS.b9, color: '#F97316' }
    ]
  },
  'right-left': {
    name: 'Right/Left Split',
    groups: [
      { label: 'Right', numbers: WHEEL_GROUPS.right, color: '#14B8A6' },
      { label: 'Left', numbers: WHEEL_GROUPS.left, color: '#A855F7' }
    ]
  }
}

// Alias mappings for different group names
const GROUP_ALIASES: Record<string, string> = {
  b: 'a',
  bb: 'aa',
  bbb: 'aaa',
  b6: 'a6',
  b9: 'a9',
  left: 'right',
  second_9: 'first_9',
  third_9: 'first_9',
  fourth_9: 'first_9'
}

export default function WheelLayoutModal({ isOpen, onClose, groupType }: WheelLayoutModalProps) {
  if (!isOpen || !groupType) return null

  // Map aliases to their base config
  const configKey = GROUP_ALIASES[groupType] || groupType
  const config = GROUP_CONFIGS[configKey]
  if (!config) return null

  // Helper function to get the color for a specific number
  const getNumberColor = (num: number): string => {
    const group = config.groups.find(g => g.numbers.includes(num))
    return group?.color || '#1F2937' // Default gray if not in any group
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start pointer-events-none">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-1/2 ml-4 max-h-[90vh] overflow-y-auto pointer-events-auto border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
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

          {/* Roulette Wheel Layout */}
          <div className="bg-gray-900 rounded-lg p-8 border-2 border-gray-700">
            <div className="relative w-full mx-auto" style={{ height: '500px', width: '500px' }}>
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-500 z-10">
                <span className="text-white font-bold text-sm">WHEEL</span>
              </div>

              {/* Numbers arranged in a circle */}
              {WHEEL_ORDER.map((num, index) => {
                const angle = (index * 360) / WHEEL_ORDER.length - 90 // Start from top
                const radius = 200 // Distance from center in pixels
                const centerX = 250 // Half of container width
                const centerY = 250 // Half of container height
                const x = centerX + radius * Math.cos((angle * Math.PI) / 180)
                const y = centerY + radius * Math.sin((angle * Math.PI) / 180)
                const bgColor = getNumberColor(num)

                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`
                    }}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-white/30 font-bold text-sm text-white shadow-lg"
                      style={{ backgroundColor: bgColor }}
                    >
                      {num}
                    </div>
                  </div>
                )
              })}
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
