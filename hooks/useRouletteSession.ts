import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, Spin } from '@/lib/types'
import { getNumberProperties } from '@/lib/roulette-logic'

export function useRouletteSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [spins, setSpins] = useState<Spin[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initializeSession()
  }, [])

  useEffect(() => {
    if (session) {
      loadSpins()
    }
  }, [session])

  const initializeSession = async () => {
    setLoading(true)
    try {
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .single()

      if (existingSession) {
        setSession(existingSession)
      } else {
        const { data: newSession } = await supabase
          .from('sessions')
          .insert({ is_active: true })
          .select()
          .single()

        if (newSession) {
          setSession(newSession)
          await supabase.rpc('set_active_session', { session_uuid: newSession.id })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadSpins = async () => {
    if (!session) return
    const { data } = await supabase
      .from('spins')
      .select('*')
      .eq('session_id', session.id)
      .order('spin_number', { ascending: false })
      .limit(100)
    if (data) setSpins(data)
  }

  const addSpin = async (num: number): Promise<Spin | null> => {
    if (!session || isNaN(num) || num < 0 || num > 36) return null
    setLoading(true)
    try {
      const properties = getNumberProperties(num)
      const nextSpinNumber = spins.length > 0 ? spins[0].spin_number + 1 : 1
      const spinData: Omit<Spin, 'id' | 'created_at'> = {
        ...properties,
        session_id: session.id,
        spin_number: nextSpinNumber
      }
      const { data } = await supabase
        .from('spins')
        .insert(spinData)
        .select()
        .single()
      if (data) {
        setSpins([data, ...spins])
        setSession(prev => prev ? { ...prev, total_spins: prev.total_spins + 1 } : prev)
        return data
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  const resetSession = async () => {
    const { data: newSession } = await supabase
      .from('sessions')
      .insert({ is_active: true })
      .select()
      .single()
    if (newSession) {
      await supabase.rpc('set_active_session', { session_uuid: newSession.id })
      setSession(newSession)
      setSpins([])
    }
  }

  return {
    session,
    spins,
    loading,
    addSpin,
    resetSession,
    reload: loadSpins,
  }
}


