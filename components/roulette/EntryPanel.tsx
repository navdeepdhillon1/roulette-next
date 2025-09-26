import React from 'react'

interface EntryPanelProps {
  inputNumber: string
  setInputNumber: (v: string) => void
  addNumber: () => void
  loading?: boolean
}

export default function EntryPanel({ inputNumber, setInputNumber, addNumber, loading = false }: EntryPanelProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Enter Winning Number</h2>
      <div className="flex gap-4">
        <input
          type="number"
          min="0"
          max="36"
          value={inputNumber}
          onChange={(e) => setInputNumber(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addNumber()}
          className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter number (0-36)"
          disabled={loading}
        />
        <button
          onClick={addNumber}
          disabled={loading || !inputNumber}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Adding...' : 'Add Number'}
        </button>
      </div>
    </div>
  )
}
