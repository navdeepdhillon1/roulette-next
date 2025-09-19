export interface Session {
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
  ended_at?: string
}

export interface Spin {
  id?: number
  session_id: string
  spin_number: number
  number: number
  color: string
  even_odd: string
  low_high: string
  dozen: string
  column_num: number
  section?: string
  dealer_id?: string
  table_id?: string
  wheel_speed?: number
  ball_speed?: number
  created_at?: string
}

export interface Anomaly {
  id?: number
  session_id?: string
  anomaly_type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  pattern_data?: Record<string, unknown>  // <- FIXED: Changed from 'any'
  detected_at?: string
  resolved?: boolean
  resolved_at?: string
  notes?: string
}

export interface Bet {
  id?: number
  session_id: string
  spin_id?: number
  bet_type: string
  bet_value: string
  numbers: number[]
  amount: number
  payout_ratio: number
  potential_payout?: number
  status?: 'pending' | 'won' | 'lost' | 'pushed' | 'cancelled'
  created_at?: string
  settled_at?: string
}

export interface BetResult {
  id?: number
  bet_id: number
  spin_id: number
  winning_number: number
  won: boolean
  payout: number
  profit_loss: number
  created_at?: string
}