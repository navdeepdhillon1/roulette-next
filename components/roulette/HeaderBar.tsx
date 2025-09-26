import React from 'react'

interface HeaderBarProps {
  sessionIdShort: string
  totalSpins: number
  balance: number
  onNewSession: () => void
}

export default function HeaderBar({ sessionIdShort, totalSpins, balance, onNewSession }: HeaderBarProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
      <div className="flex gap-6">
        <div>
          <span className="text-gray-400 text-sm">Session ID</span>
          <p className="font-mono text-sm">{sessionIdShort}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Total Spins</span>
          <p className="text-xl font-bold">{totalSpins}</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="text-right">
          <span className="text-gray-400 text-sm">Balance</span>
          <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
        </div>
        <button
          onClick={onNewSession}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          New Session
        </button>
      </div>
    </div>
  )
}
