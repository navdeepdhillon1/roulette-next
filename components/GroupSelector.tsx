// components/GroupSelector.tsx
'use client'

import React, { useState, useEffect } from 'react'
import type { SelectedGroup, CustomGroup } from '@/types/bettingAssistant'
import { RED_NUMBERS } from '@/lib/roulette-logic'
import TableLayoutModal from './roulette/TableLayoutModal'
import WheelLayoutModal from './WheelLayoutModal'
import { supabase } from '@/lib/supabase'
import { loadCustomGroups, saveCustomGroups } from '@/lib/customGroupsStorage'

interface GroupSelectorProps {
  selectedGroups: SelectedGroup[]
  onGroupsChange: (groups: SelectedGroup[]) => void
  maxGroups?: number
}

// Available table groups
const TABLE_GROUPS = [
  { id: 'color', name: 'Color (Red/Black)' },
  { id: 'even-odd', name: 'Even/Odd' },
  { id: 'column', name: 'Column' },
  { id: 'dozen', name: 'Dozen' },
  { id: 'low-high', name: 'Low/High' },
  { id: 'alt1', name: 'Alt1 (A/B)' },
  { id: 'alt2', name: 'Alt2 (AA/BB)' },
  { id: 'alt3', name: 'Alt3 (AAA/BBB)' },
  { id: 'ec', name: 'E/C' },
  { id: 'six', name: 'Six Groups' },
]

// Available wheel groups
const WHEEL_GROUPS = [
  { id: 'vois-orph-tier', name: 'Vois/Orph/Tier' },
  { id: 'voisins-nonvoisins', name: 'Voisins/Non-Voisins' },
  { id: 'wheel-quarters', name: 'Wheel Quarters (9s)' },
  { id: 'ab-split', name: 'A/B Split' },
  { id: 'aabb-split', name: 'AA/BB Split' },
  { id: 'aaabbb-split', name: 'AAA/BBB Split' },
  { id: 'a6b6-split', name: 'A6/B6 Split' },
  { id: 'a9b9-split', name: 'A9/B9 Split' },
  { id: 'right-left', name: 'Right/Left' },
]

// Helper function to map group ID to TableLayoutModal groupType
function mapToTableGroupType(id: string): 'dozen' | 'column' | 'color' | 'evenOdd' | 'lowHigh' | 'alt1' | 'alt2' | 'alt3' | 'edgeCenter' | 'six' | null {
  const mapping: Record<string, 'dozen' | 'column' | 'color' | 'evenOdd' | 'lowHigh' | 'alt1' | 'alt2' | 'alt3' | 'edgeCenter' | 'six'> = {
    'color': 'color',
    'even-odd': 'evenOdd',
    'column': 'column',
    'dozen': 'dozen',
    'low-high': 'lowHigh',
    'alt1': 'alt1',
    'alt2': 'alt2',
    'alt3': 'alt3',
    'ec': 'edgeCenter',
    'six': 'six'
  }
  return mapping[id] || null
}

// Helper function to get numbers for each group
function getGroupNumbers(type: 'table' | 'wheel', id: string): number[] {
  if (type === 'table') {
    switch (id) {
      case 'color': return RED_NUMBERS // Just showing red as example, would show both
      case 'even-odd': return Array.from({length: 18}, (_, i) => (i + 1) * 2) // Even numbers
      case 'low-high': return Array.from({length: 18}, (_, i) => i + 1) // Low numbers
      case 'column': return [1,4,7,10,13,16,19,22,25,28,31,34] // 1st column
      case 'dozen': return Array.from({length: 12}, (_, i) => i + 1) // 1st dozen
      case 'alt1': return [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33]
      case 'alt2': return [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30]
      case 'alt3': return [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27]
      case 'ec': return [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36] // Edge
      case 'six': return Array.from({length: 6}, (_, i) => i + 1) // 1st six
      default: return []
    }
  }

  if (type === 'wheel') {
    switch (id) {
      case 'vois-orph-tier': return [
        // Voisins
        22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25,
        // Orphelins
        17,34,6,1,20,14,31,9,
        // Tiers
        27,13,36,11,30,8,23,10,5,24,16,33
      ]
      case 'voisins-nonvoisins': return [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25] // Voisins part
      case 'wheel-quarters': return [32,15,19,4,21,2,25,17,34] // 1st quarter
      case 'ab-split': return [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3]
      case 'aabb-split': return [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35]
      case 'aaabbb-split': return [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12]
      case 'a6b6-split': return [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29]
      case 'a9b9-split': return [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9]
      case 'right-left': return [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10]
      default: return []
    }
  }

  return []
}

export default function GroupSelector({
  selectedGroups,
  onGroupsChange,
  maxGroups = 10
}: GroupSelectorProps) {
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([])
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customNumbers, setCustomNumbers] = useState('')
  const [viewingGroup, setViewingGroup] = useState<{type: 'table' | 'wheel' | 'custom', id: string, name: string, numbers: number[]} | null>(null)
  const [viewingTableGroup, setViewingTableGroup] = useState<'dozen' | 'column' | 'color' | 'evenOdd' | 'lowHigh' | 'alt1' | 'alt2' | 'alt3' | 'edgeCenter' | 'six' | null>(null)
  const [viewingWheelGroup, setViewingWheelGroup] = useState<'vois-orph-tier' | 'voisins-nonvoisins' | 'wheel-quarters' | 'ab-split' | 'aabb-split' | 'aaabbb-split' | 'a6b6-split' | 'a9b9-split' | 'right-left' | null>(null)

  // Load custom groups on mount
  useEffect(() => {
    const loadSavedGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const loaded = await loadCustomGroups(user?.id)
      setCustomGroups(loaded)
    }
    loadSavedGroups()
  }, [])

  // Save custom groups whenever they change
  useEffect(() => {
    const saveGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      await saveCustomGroups(customGroups, user?.id)
    }
    if (customGroups.length > 0 || localStorage.getItem('roulette_custom_groups')) {
      saveGroups()
    }
  }, [customGroups])

  const isGroupSelected = (type: 'table' | 'wheel' | 'custom', id: string) => {
    return selectedGroups.some(g => g.type === type && g.id === id)
  }

  const toggleGroup = (type: 'table' | 'wheel' | 'custom', id: string, name: string, customGroup?: CustomGroup) => {
    const isSelected = isGroupSelected(type, id)

    if (isSelected) {
      // Remove group
      onGroupsChange(selectedGroups.filter(g => !(g.type === type && g.id === id)))
    } else {
      // Add group if under max
      if (selectedGroups.length >= maxGroups) {
        alert(`Maximum ${maxGroups} groups can be selected`)
        return
      }
      onGroupsChange([...selectedGroups, { type, id, name, customGroup }])
    }
  }

  const handleSaveCustomGroup = () => {
    if (!customName.trim()) {
      alert('Please enter a group name')
      return
    }

    // Parse numbers from input
    const numbers = customNumbers
      .split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n <= 36)

    if (numbers.length === 0) {
      alert('Please enter valid numbers (0-36) separated by commas')
      return
    }

    if (editingGroupId) {
      // Update existing group
      setCustomGroups(customGroups.map(g =>
        g.id === editingGroupId
          ? { ...g, name: customName.trim(), numbers }
          : g
      ))

      // Update in selectedGroups if it's selected
      if (isGroupSelected('custom', editingGroupId)) {
        onGroupsChange(selectedGroups.map(g =>
          g.type === 'custom' && g.id === editingGroupId
            ? { ...g, name: customName.trim(), customGroup: { id: editingGroupId, name: customName.trim(), numbers } }
            : g
        ))
      }
    } else {
      // Add new group
      const customGroup: CustomGroup = {
        id: `custom-${Date.now()}`,
        name: customName.trim(),
        numbers,
      }

      setCustomGroups([...customGroups, customGroup])

      // Auto-select the new custom group
      if (selectedGroups.length < maxGroups) {
        toggleGroup('custom', customGroup.id, customGroup.name, customGroup)
      }
    }

    // Reset form
    setCustomName('')
    setCustomNumbers('')
    setIsAddingCustom(false)
    setEditingGroupId(null)
  }

  const handleEditGroup = (group: CustomGroup) => {
    setCustomName(group.name)
    setCustomNumbers(group.numbers.join(', '))
    setEditingGroupId(group.id)
    setIsAddingCustom(true)
  }

  const handleDeleteGroup = () => {
    if (!editingGroupId) return

    if (confirm('Are you sure you want to delete this custom group?')) {
      setCustomGroups(customGroups.filter(g => g.id !== editingGroupId))

      // Remove from selectedGroups if it's selected
      if (isGroupSelected('custom', editingGroupId)) {
        onGroupsChange(selectedGroups.filter(g => !(g.type === 'custom' && g.id === editingGroupId)))
      }

      // Reset form
      setCustomName('')
      setCustomNumbers('')
      setIsAddingCustom(false)
      setEditingGroupId(null)
    }
  }

  const handleCancelEdit = () => {
    setCustomName('')
    setCustomNumbers('')
    setIsAddingCustom(false)
    setEditingGroupId(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          Select Groups to Track
        </h3>
        <div className="text-sm font-medium">
          <span className={`${selectedGroups.length >= maxGroups ? 'text-red-400' : 'text-cyan-400'}`}>
            {selectedGroups.length}
          </span>
          <span className="text-gray-400">/{maxGroups} selected</span>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Table Groups */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="font-bold text-cyan-400 mb-3">Table Groups</h4>
          <div className="space-y-2">
            {TABLE_GROUPS.map(group => (
              <div
                key={group.id}
                className="flex items-center justify-between hover:bg-gray-700/50 p-2 rounded transition-colors"
              >
                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isGroupSelected('table', group.id)}
                    onChange={() => toggleGroup('table', group.id, group.name)}
                    className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-200">{group.name}</span>
                </label>
                <button
                  onClick={() => setViewingTableGroup(mapToTableGroupType(group.id))}
                  className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="View numbers"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Wheel Groups */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="font-bold text-purple-400 mb-3">Wheel Groups</h4>
          <div className="space-y-2">
            {WHEEL_GROUPS.map(group => (
              <div
                key={group.id}
                className="flex items-center justify-between hover:bg-gray-700/50 p-2 rounded transition-colors"
              >
                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isGroupSelected('wheel', group.id)}
                    onChange={() => toggleGroup('wheel', group.id, group.name)}
                    className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-200">{group.name}</span>
                </label>
                <button
                  onClick={() => {
                    setViewingWheelGroup(group.id as any)
                  }}
                  className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                  title="View numbers"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Groups */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="font-bold text-yellow-400 mb-3">Custom Groups</h4>
          <div className="space-y-2 mb-3">
            {customGroups.map(group => (
              <div
                key={group.id}
                className="flex items-center justify-between hover:bg-gray-700/50 p-2 rounded transition-colors"
              >
                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isGroupSelected('custom', group.id)}
                    onChange={() => toggleGroup('custom', group.id, group.name, group)}
                    className="w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-200">{group.name}</div>
                    <div className="text-xs text-gray-400">({group.numbers.join(', ')})</div>
                  </div>
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                    title="Edit group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewingGroup({type: 'custom', id: group.id, name: group.name, numbers: group.numbers})}
                    className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                    title="View numbers"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Group Form */}
          {isAddingCustom ? (
            <div className="space-y-2 p-3 bg-gray-700/50 rounded">
              <input
                type="text"
                placeholder="Group name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-yellow-500"
              />
              <input
                type="text"
                placeholder="Numbers (e.g., 7, 14, 21, 28)"
                value={customNumbers}
                onChange={(e) => setCustomNumbers(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-yellow-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCustomGroup}
                  className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
                >
                  {editingGroupId ? 'Save' : 'Add'}
                </button>
                {editingGroupId && (
                  <button
                    onClick={handleDeleteGroup}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="w-full px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 text-sm font-medium rounded transition-colors"
            >
              + Add Custom Group
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      {selectedGroups.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          Select groups to track in your "My Groups" layout
        </div>
      )}

      {/* Simple Number Grid Modal - for wheel and custom groups */}
      {viewingGroup && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingGroup(null)}
        >
          <div
            className="bg-gray-800 rounded-lg border border-gray-600 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-600 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{viewingGroup.name}</h3>
              <button
                onClick={() => setViewingGroup(null)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Numbers Grid */}
            <div className="p-6">
              <div className="grid grid-cols-6 gap-2">
                {viewingGroup.numbers.sort((a, b) => a - b).map((num) => {
                  const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num)
                  const bgColor = num === 0 ? 'bg-green-600' : isRed ? 'bg-red-600' : 'bg-gray-900 border border-gray-600'
                  return (
                    <div
                      key={num}
                      className={`${bgColor} rounded-md p-3 text-center font-bold text-white hover:opacity-80 transition-opacity`}
                    >
                      {num}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center text-gray-400 text-sm">
                Total: {viewingGroup.numbers.length} numbers
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Table Layout Modal - for table groups */}
      <TableLayoutModal
        isOpen={viewingTableGroup !== null}
        onClose={() => setViewingTableGroup(null)}
        groupType={viewingTableGroup}
      />

      {/* Visual Wheel Layout Modal - for wheel groups */}
      <WheelLayoutModal
        isOpen={viewingWheelGroup !== null}
        onClose={() => setViewingWheelGroup(null)}
        groupType={viewingWheelGroup}
      />
    </div>
  )
}
