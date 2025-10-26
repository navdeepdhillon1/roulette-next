// components/SessionLocationSelector.tsx
// Simplified casino/dealer selector for session setup

'use client'

import { useState, useEffect } from 'react'
import { listCasinos, listDealersByCasino } from '@/lib/bettingAssistantStorage'
import CasinoManager from './CasinoManager'
import DealerManager from './DealerManager'

interface Casino {
  id: string
  name: string
  type: 'online' | 'physical'
  location?: string
  favorite?: boolean
}

interface Dealer {
  id: string
  name: string
  nickname?: string
  rating?: number
}

interface SessionLocationSelectorProps {
  userId: string
  onSelect: (data: {
    casinoId: string | null
    casinoName: string | null
    dealerId: string | null
    dealerName: string | null
    tableNumber: string | null
  }) => void
  initialCasinoId?: string | null
  initialDealerId?: string | null
}

export default function SessionLocationSelector({
  userId,
  onSelect,
  initialCasinoId = null,
  initialDealerId = null,
}: SessionLocationSelectorProps) {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [selectedCasinoId, setSelectedCasinoId] = useState<string | null>(initialCasinoId)
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(initialDealerId)
  const [tableNumber, setTableNumber] = useState('')
  const [skipTracking, setSkipTracking] = useState(true)
  const [showCasinoManager, setShowCasinoManager] = useState(false)
  const [showDealerManager, setShowDealerManager] = useState(false)

  useEffect(() => {
    loadCasinos()
  }, [])

  useEffect(() => {
    if (selectedCasinoId) {
      loadDealers(selectedCasinoId)
    } else {
      setDealers([])
      setSelectedDealerId(null)
    }
  }, [selectedCasinoId])

  useEffect(() => {
    if (skipTracking) {
      onSelect({
        casinoId: null,
        casinoName: null,
        dealerId: null,
        dealerName: null,
        tableNumber: null,
      })
    } else {
      const selectedCasino = casinos.find((c) => c.id === selectedCasinoId)
      const selectedDealer = dealers.find((d) => d.id === selectedDealerId)
      onSelect({
        casinoId: selectedCasinoId,
        casinoName: selectedCasino?.name || null,
        dealerId: selectedDealerId,
        dealerName: selectedDealer?.name || null,
        tableNumber: tableNumber || null,
      })
    }
  }, [skipTracking, selectedCasinoId, selectedDealerId, tableNumber])

  const loadCasinos = async () => {
    const result = await listCasinos(userId)
    if ('casinos' in result) {
      setCasinos(result.casinos)
    }
  }

  const loadDealers = async (casinoId: string) => {
    const result = await listDealersByCasino(casinoId)
    if ('dealers' in result) {
      setDealers(result.dealers)
    }
  }

  if (skipTracking) {
    return (
      <div className="bg-black/30 p-4 rounded-lg border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-cyan-200">Location Tracking (Optional)</h3>
            <p className="text-sm text-cyan-300/60">
              Track casino and dealer performance for better insights
            </p>
          </div>
          <button
            onClick={() => setSkipTracking(false)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium transition-all"
          >
            Enable Tracking
          </button>
        </div>
        <div className="flex items-start gap-2 bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-3">
          <span className="text-cyan-400 text-lg">🔒</span>
          <p className="text-xs text-cyan-300/70 leading-relaxed">
            <strong className="text-cyan-200">Privacy First:</strong> Your casino and dealer information is stored privately and is never shared with anyone. This data is for your personal reference only to help you track performance and make better decisions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/30 p-4 rounded-lg space-y-4 border border-cyan-500/20">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-cyan-200">Session Location</h3>
        <button
          onClick={() => setSkipTracking(true)}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-all"
        >
          Skip tracking
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-3">
        <span className="text-cyan-400 text-base">🔒</span>
        <p className="text-xs text-cyan-300/70 leading-relaxed">
          <strong className="text-cyan-200">Privacy:</strong> Your casino and dealer information is private and never shared. This is for your personal tracking only.
        </p>
      </div>

      {/* Casino Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-cyan-200">
            Casino{' '}
            <span className="text-cyan-400/60 font-normal">(optional)</span>
          </label>
          <button
            onClick={() => setShowCasinoManager(!showCasinoManager)}
            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-all"
          >
            {showCasinoManager ? '✕ Close' : '+ Manage Casinos'}
          </button>
        </div>

        {showCasinoManager ? (
          <div className="mb-4 border-2 border-cyan-500/30 rounded-lg p-4 bg-black/40">
            <CasinoManager
              userId={userId}
              onSelectCasino={(id) => {
                setSelectedCasinoId(id)
                setShowCasinoManager(false)
                loadCasinos()
              }}
              selectedCasinoId={selectedCasinoId}
            />
          </div>
        ) : (
          <select
            value={selectedCasinoId || ''}
            onChange={(e) => setSelectedCasinoId(e.target.value || null)}
            className="w-full px-3 py-2 border border-cyan-500/30 rounded-lg bg-gray-800 text-white"
          >
              <option value="">No casino selected</option>
              {casinos
                .filter((c) => c.favorite)
                .map((casino) => (
                  <option key={casino.id} value={casino.id}>
                    ⭐ {casino.name} ({casino.type})
                  </option>
                ))}
              {casinos
                .filter((c) => !c.favorite)
                .map((casino) => (
                  <option key={casino.id} value={casino.id}>
                    {casino.name} ({casino.type})
                  </option>
                ))}
          </select>
        )}
      </div>

      {/* Table Number (if casino selected) */}
      {selectedCasinoId && (
        <div>
          <label className="block text-sm font-medium mb-2 text-cyan-200">Table Number (optional)</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g., Table 5, VIP 2"
            className="w-full px-3 py-2 border border-cyan-500/30 rounded-lg bg-gray-800 text-white placeholder-gray-500"
          />
        </div>
      )}

      {/* Dealer Selection (if casino selected) */}
      {selectedCasinoId && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-cyan-200">
              Dealer{' '}
              <span className="text-cyan-400/60 font-normal">(optional)</span>
            </label>
            <button
              onClick={() => setShowDealerManager(!showDealerManager)}
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-all"
            >
              {showDealerManager ? '✕ Close' : '+ Manage Dealers'}
            </button>
          </div>

          {showDealerManager ? (
            <div className="mb-4 border-2 border-cyan-500/30 rounded-lg p-4 bg-black/40">
              <DealerManager
                userId={userId}
                casinoId={selectedCasinoId}
                onSelectDealer={(id) => {
                  setSelectedDealerId(id)
                  setShowDealerManager(false)
                  loadDealers(selectedCasinoId)
                }}
                selectedDealerId={selectedDealerId}
              />
            </div>
          ) : dealers.length === 0 ? (
            <div className="text-sm text-cyan-300/60 italic px-3 py-2 bg-black/20 border border-cyan-500/20 rounded-lg">
              No dealers added for this casino yet
            </div>
          ) : (
            <select
                value={selectedDealerId || ''}
                onChange={(e) => setSelectedDealerId(e.target.value || null)}
                className="w-full px-3 py-2 border border-cyan-500/30 rounded-lg bg-gray-800 text-white"
              >
                <option value="">No dealer selected</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}
                    {dealer.nickname && ` "${dealer.nickname}"`}
                    {dealer.rating && ` (${dealer.rating}★)`}
                  </option>
                ))}
            </select>
          )}
        </div>
      )}

      {/* Summary */}
      {selectedCasinoId && (
        <div className="bg-cyan-900/20 p-3 rounded text-sm border border-cyan-500/30">
          <div className="font-medium text-cyan-200">Session will be tracked at:</div>
          <div className="text-cyan-300">
            {casinos.find((c) => c.id === selectedCasinoId)?.name}
            {tableNumber && ` - ${tableNumber}`}
            {selectedDealerId && (
              <div>Dealer: {dealers.find((d) => d.id === selectedDealerId)?.name}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
