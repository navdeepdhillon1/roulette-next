// components/CloudSyncIndicator.tsx
// Visual indicator for cloud storage sync status (Elite tier)

'use client'

interface CloudSyncIndicatorProps {
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  hasEliteAccess: boolean
}

export default function CloudSyncIndicator({ syncStatus, hasEliteAccess }: CloudSyncIndicatorProps) {
  if (!hasEliteAccess) return null

  const statusConfig = {
    idle: {
      icon: '☁️',
      text: 'Cloud Ready',
      color: 'text-gray-400',
      bg: 'bg-gray-800/50',
      border: 'border-gray-600',
    },
    syncing: {
      icon: '🔄',
      text: 'Syncing...',
      color: 'text-blue-400',
      bg: 'bg-blue-900/30',
      border: 'border-blue-500',
      animate: 'animate-spin',
    },
    synced: {
      icon: '✅',
      text: 'Saved to Cloud',
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-500',
    },
    error: {
      icon: '⚠️',
      text: 'Sync Error',
      color: 'text-red-400',
      bg: 'bg-red-900/30',
      border: 'border-red-500',
    },
  }

  const config = statusConfig[syncStatus]

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg} ${config.border}`}
    >
      <span className={config.animate || ''}>{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>{config.text}</span>
    </div>
  )
}
