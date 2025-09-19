'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type session = { id: string; name: string; created_at: string }

export default function TestPage() {
  const [sessions, setSessions] = useState<session[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) setError(error.message)
    setSessions((data ?? []) as session[])
  }

  async function addsession() {
    setAdding(true)
    setError(null)
    const { error } = await supabase.from('sessions').insert({ name: 'My first session' })
    if (error) setError(error.message)
    await load()
    setAdding(false)
  }

  useEffect(() => { void load() }, [])

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Supabase Test</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={addsession}
          disabled={adding}
          className="rounded bg-black text-white px-3 py-2 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add session'}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>

      <ul className="mt-4 space-y-2">
        {sessions.map(s => (
          <li key={s.id} className="rounded border p-3">
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-slate-500">
              {new Date(s.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}