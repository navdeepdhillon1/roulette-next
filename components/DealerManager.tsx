// components/DealerManager.tsx
// Dealer management UI for Elite tier users

'use client'

import { useState, useEffect } from 'react'
import {
  createDealer,
  listDealersByCasino,
  updateDealer,
  deleteDealer,
  type DealerData,
} from '@/lib/bettingAssistantStorage'

interface Dealer extends DealerData {
  id: string
  total_spins: number
  win_rate: number
  total_profit: number
  created_at: string
}

interface DealerManagerProps {
  userId: string
  casinoId: string
  casinoName: string
  onSelectDealer?: (dealerId: string) => void
  selectedDealerId?: string
}

export default function DealerManager({
  userId,
  casinoId,
  casinoName,
  onSelectDealer,
  selectedDealerId,
}: DealerManagerProps) {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'profit'>('name')

  // Form state
  const [formData, setFormData] = useState<DealerData>({
    name: '',
    nickname: '',
    gender: undefined,
    appearance: '',
    typical_shift: '',
    notes: '',
    rating: undefined,
  })

  useEffect(() => {
    loadDealers()
  }, [casinoId, sortBy])

  const loadDealers = async () => {
    setLoading(true)
    const result = await listDealersByCasino(casinoId, { sortBy })
    if ('dealers' in result) {
      setDealers(result.dealers)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Update existing dealer
      const result = await updateDealer(editingId, formData)
      if ('success' in result) {
        await loadDealers()
        resetForm()
      }
    } else {
      // Create new dealer
      const result = await createDealer(userId, casinoId, formData)
      if ('dealerId' in result) {
        await loadDealers()
        resetForm()
      }
    }
  }

  const handleEdit = (dealer: Dealer) => {
    setFormData({
      name: dealer.name,
      nickname: dealer.nickname || '',
      gender: dealer.gender,
      appearance: dealer.appearance || '',
      typical_shift: dealer.typical_shift || '',
      notes: dealer.notes || '',
      rating: dealer.rating,
    })
    setEditingId(dealer.id)
    setShowForm(true)
  }

  const handleDelete = async (dealerId: string) => {
    if (!confirm('Delete this dealer? Associated session data will remain but be unlinked.'))
      return

    const result = await deleteDealer(dealerId)
    if ('success' in result) {
      await loadDealers()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      gender: undefined,
      appearance: '',
      typical_shift: '',
      notes: '',
      rating: undefined,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-500'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dealers at {casinoName}</h2>
          <p className="text-sm text-gray-400">Track dealer performance and identify patterns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Dealer'}
        </button>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('name')}
          className={`px-3 py-1 text-sm rounded ${
            sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Sort by Name
        </button>
        <button
          onClick={() => setSortBy('rating')}
          className={`px-3 py-1 text-sm rounded ${
            sortBy === 'rating' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Sort by Rating
        </button>
        <button
          onClick={() => setSortBy('profit')}
          className={`px-3 py-1 text-sm rounded ${
            sortBy === 'profit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Sort by Profit
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900/30 border border-gray-700 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Dealer Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Nickname</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Fast John, Lucky Maria"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Gender</label>
              <select
                value={formData.gender || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value
                      ? (e.target.value as 'male' | 'female' | 'other')
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Typical Shift</label>
              <input
                type="text"
                value={formData.typical_shift}
                onChange={(e) => setFormData({ ...formData, typical_shift: e.target.value })}
                placeholder="Nights, Weekends, Mon-Fri"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Appearance</label>
            <input
              type="text"
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              placeholder="Blonde hair, blue shirt"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder="Very fast dealer, friendly, chatty, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Rating (1-5 stars)</label>
            <select
              value={formData.rating || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rating: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">No rating</option>
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Update Dealer' : 'Add Dealer'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Dealer List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading dealers...</div>
      ) : dealers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No dealers found. Add your first dealer to start tracking!
        </div>
      ) : (
        <div className="grid gap-3">
          {dealers.map((dealer) => (
            <div
              key={dealer.id}
              className={`bg-gray-800/70 border rounded-lg p-4 hover:shadow-lg hover:bg-gray-800 transition-all ${
                selectedDealerId === dealer.id ? 'border-blue-500 border-2' : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">{dealer.name}</h3>
                    {dealer.nickname && (
                      <span className="text-sm text-gray-400 italic">"{dealer.nickname}"</span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-sm">
                    {renderStars(dealer.rating)}
                  </div>

                  <div className="mt-2 text-sm text-gray-300 space-y-1">
                    {dealer.gender && (
                      <div className="capitalize">
                        {dealer.gender === 'male' ? '👨' : dealer.gender === 'female' ? '👩' : '🧑'}{' '}
                        {dealer.gender}
                      </div>
                    )}
                    {dealer.appearance && <div>👤 {dealer.appearance}</div>}
                    {dealer.typical_shift && <div>🕐 {dealer.typical_shift}</div>}
                    {dealer.notes && <div className="text-gray-400 italic">{dealer.notes}</div>}
                  </div>

                  <div className="mt-3 flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Spins:</span>{' '}
                      <span className="font-semibold text-white">{dealer.total_spins}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Win Rate:</span>{' '}
                      <span className="font-semibold text-white">
                        {dealer.win_rate ? `${dealer.win_rate.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Profit:</span>{' '}
                      <span
                        className={`font-semibold ${
                          dealer.total_profit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        ${dealer.total_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {onSelectDealer && (
                    <button
                      onClick={() => onSelectDealer(dealer.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(dealer)}
                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dealer.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
