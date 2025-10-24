import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug: Log what we have (only in development/first load)
if (typeof window !== 'undefined' && !window.__supabaseDebugLogged) {
  console.log('[Supabase Debug] URL exists:', !!supabaseUrl, supabaseUrl.substring(0, 20) + '...')
  console.log('[Supabase Debug] Key exists:', !!supabaseAnonKey, supabaseAnonKey ? 'YES' : 'NO')
  window.__supabaseDebugLogged = true
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})