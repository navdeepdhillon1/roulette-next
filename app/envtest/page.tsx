'use client'

export default function EnvTest() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Env Test</h1>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p>Key starts with: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)}...</p>
    </main>
  )
}