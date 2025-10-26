// components/CasinoManager.tsx
// Casino management UI for Elite tier users

'use client'

import { useState, useEffect } from 'react'
import {
  createCasino,
  listCasinos,
  updateCasino,
  deleteCasino,
  type CasinoData,
} from '@/lib/bettingAssistantStorage'

interface Casino extends CasinoData {
  id: string
  total_sessions: number
  total_profit: number
  created_at: string
}

interface CasinoManagerProps {
  userId: string
  onSelectCasino?: (casinoId: string) => void
  selectedCasinoId?: string
}

export default function CasinoManager({
  userId,
  onSelectCasino,
  selectedCasinoId,
}: CasinoManagerProps) {
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'online' | 'physical'>('all')

  // Form state
  const [formData, setFormData] = useState<CasinoData>({
    name: '',
    type: 'online',
    location: '',
    address: '',
    website: '',
    platform: '',
    notes: '',
    favorite: false,
  })

  useEffect(() => {
    loadCasinos()
  }, [filterType])

  const loadCasinos = async () => {
    setLoading(true)
    const result = await listCasinos(
      userId,
      filterType === 'all' ? undefined : { type: filterType }
    )
    if ('casinos' in result) {
      setCasinos(result.casinos)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Update existing casino
      const result = await updateCasino(editingId, formData)
      if ('success' in result) {
        await loadCasinos()
        resetForm()
      } else if ('error' in result) {
        console.error('❌ Failed to update casino:', result.error)
        alert(`Failed to update casino: ${result.error}`)
      }
    } else {
      // Create new casino
      console.log('🎰 Creating casino with data:', { userId, formData })
      const result = await createCasino(userId, formData)
      console.log('🎰 Create casino result:', result)

      if ('casinoId' in result) {
        console.log('✅ Casino created successfully:', result.casinoId)
        await loadCasinos()
        resetForm()
      } else if ('error' in result) {
        console.error('❌ Failed to create casino:', result.error)
        alert(`Failed to create casino: ${result.error}`)
      }
    }
  }

  const handleEdit = (casino: Casino) => {
    setFormData({
      name: casino.name,
      type: casino.type,
      location: casino.location || '',
      address: casino.address || '',
      website: casino.website || '',
      platform: casino.platform || '',
      notes: casino.notes || '',
      favorite: casino.favorite || false,
    })
    setEditingId(casino.id)
    setShowForm(true)
  }

  const handleDelete = async (casinoId: string) => {
    if (
      !confirm(
        'Delete this casino? This will also delete all associated dealers and sessions.'
      )
    )
      return

    const result = await deleteCasino(casinoId)
    if ('success' in result) {
      await loadCasinos()
    }
  }

  const toggleFavorite = async (casino: Casino) => {
    await updateCasino(casino.id, { favorite: !casino.favorite })
    await loadCasinos()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'online',
      location: '',
      address: '',
      website: '',
      platform: '',
      notes: '',
      favorite: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Casinos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Casino'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 font-medium ${
            filterType === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({casinos.length})
        </button>
        <button
          onClick={() => setFilterType('online')}
          className={`px-4 py-2 font-medium ${
            filterType === 'online'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Online
        </button>
        <button
          onClick={() => setFilterType('physical')}
          className={`px-4 py-2 font-medium ${
            filterType === 'physical'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Physical
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Casino Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'online' | 'physical' })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="online">Online</option>
                <option value="physical">Physical</option>
              </select>
            </div>
          </div>

          {formData.type === 'physical' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Las Vegas, NV"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Casino Blvd"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://casino.com"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="Evolution Gaming"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Personal observations, tips, etc."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="favorite"
              checked={formData.favorite}
              onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="favorite" className="text-sm font-medium">
              Mark as Favorite
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Update Casino' : 'Add Casino'}
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

      {/* Casino List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading casinos...</div>
      ) : casinos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No casinos found. Add your first casino to get started!
        </div>
      ) : (
        <div className="grid gap-4">
          {casinos.map((casino) => (
            <div
              key={casino.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                selectedCasinoId === casino.id ? 'border-blue-500 border-2' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{casino.name}</h3>
                    {casino.favorite && <span className="text-yellow-500">⭐</span>}
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        casino.type === 'online'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {casino.type}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    {casino.type === 'physical' ? (
                      <>
                        {casino.location && <div>📍 {casino.location}</div>}
                        {casino.address && <div>{casino.address}</div>}
                      </>
                    ) : (
                      <>
                        {casino.website && (
                          <div>
                            🌐{' '}
                            <a
                              href={casino.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {casino.website}
                            </a>
                          </div>
                        )}
                        {casino.platform && <div>🎮 {casino.platform}</div>}
                      </>
                    )}
                    {casino.notes && <div className="text-gray-500 italic">{casino.notes}</div>}
                  </div>

                  <div className="mt-3 flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Sessions:</span>{' '}
                      <span className="font-semibold">{casino.total_sessions}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Profit:</span>{' '}
                      <span
                        className={`font-semibold ${
                          casino.total_profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${casino.total_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(casino)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title={casino.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {casino.favorite ? '⭐' : '☆'}
                  </button>
                  {onSelectCasino && (
                    <button
                      onClick={() => onSelectCasino(casino.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(casino)}
                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(casino.id)}
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
