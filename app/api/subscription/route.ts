import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client (uses environment variables from server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  try {
    // Get auth token from Authorization header (sent by client)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.log('[API Subscription] No authorization token provided')
      return NextResponse.json(
        { error: 'Unauthorized', tier: 'free', status: 'inactive' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    console.log('[API Subscription] User check:', {
      hasUser: !!user,
      userId: user?.id,
      error: userError
    })

    if (!user || userError) {
      console.log('[API Subscription] Invalid token or user not found')
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
