import React from 'react'

// Define the Session type
interface Session {
  id: string
  is_active: boolean
  balance: number
  starting_balance: number
  total_profit_loss: number
  total_spins: number
  total_bets: number
  winning_bets: number
  losing_bets: number
  created_at: string
  updated_at: string
}

// Define the UserProfile type
interface UserProfile {
  id?: string
  email?: string
  isPremium: boolean
  displayName?: string
}

// Define the props interface
interface HeaderBarProps {
  session: Session | null
  spinsCount: number
  onStartSession: () => void
  onAssistantClick: () => void
  isAssistantActive: boolean
  userProfile: UserProfile
  storageMode: 'local' | 'cloud'
}

// The actual HeaderBar component
const HeaderBar: React.FC<HeaderBarProps> = ({
  session,
  spinsCount,
  onStartSession,
  onAssistantClick,
  isAssistantActive,
  userProfile,
  storageMode
}) => {
  // Format session ID for display (show first 8 chars if it's long)
  const formatSessionId = (id: string) => {
    if (id.startsWith('local-')) {
      // For local sessions, show a shorter format
      return `Local-${id.slice(-6)}`
    }
    // For cloud sessions, show first 8 characters
    return id.length > 12 ? `${id.slice(0, 8)}...` : id
  }

  return (
    <div className="bg-black/60 backdrop-blur border border-yellow-400/20 rounded-xl px-6 py-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          {session && (
            <>
              <div>
                <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Session</span>
                <p className="text-lg font-bold text-yellow-400">{formatSessionId(session.id)}</p>
              </div>
              <div className="h-8 w-px bg-yellow-400/20"></div>
              <div>
                <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Spins</span>
                <p className="text-lg font-bold">{spinsCount}</p>
              </div>
              <div className="h-8 w-px bg-yellow-400/20"></div>
              <div>
                <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Status</span>
                <p className="text-lg font-bold text-green-400">Active</p>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {storageMode === 'cloud' && userProfile.displayName && (
            <>
              <div className="text-right">
                <span className="text-yellow-400/60 text-xs uppercase tracking-wider">User</span>
                <p className="text-sm font-medium">{userProfile.displayName}</p>
              </div>
              <div className="h-8 w-px bg-yellow-400/20"></div>
            </>
          )}
          
          <button
            onClick={() => {
              console.log('HeaderBar: Assistant button clicked')
              onAssistantClick()
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isAssistantActive 
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' 
                : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
            }`}
          >
            🎯 Assistant
          </button>
          
          <button
            onClick={() => {
              if (session && confirm('End current session? This will save your progress.')) {
                console.log('HeaderBar: Ending session')
                window.location.reload()
              }
            }}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-all border border-red-600/30"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeaderBar