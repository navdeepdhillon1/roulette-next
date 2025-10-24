import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

// Server-side Supabase client (uses environment variables from server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', tier: 'free', status: 'inactive' },
        { status: 401 }
      )
    }

    // Query subscription from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('[API Subscription] Database error:', error)
      // Return free tier if no subscription found
      return NextResponse.json({
        tier: 'free',
        status: 'inactive',
        user_id: user.id,
      })
    }

    return NextResponse.json({
      tier: subscription?.tier || 'free',
      status: subscription?.status || 'inactive',
      current_period_end: subscription?.current_period_end,
      user_id: user.id,
    })
  } catch (error) {
    console.error('[API Subscription] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', tier: 'free', status: 'inactive' },
      { status: 500 }
    )
  }
}
