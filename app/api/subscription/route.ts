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

    // Query subscription from database - first try with status filter
    const { data: activeSubscription, error: activeError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    console.log('[API Subscription] Active subscription query:', {
      found: !!activeSubscription,
      tier: activeSubscription?.tier,
      status: activeSubscription?.status,
      error: activeError?.message
    })

    // If no active subscription, check ALL subscriptions for this user
    const { data: allSubscriptions, error: allError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    console.log('[API Subscription] All subscriptions for user:', {
      count: allSubscriptions?.length || 0,
      subscriptions: allSubscriptions,
      error: allError?.message
    })

    if (activeSubscription) {
      return NextResponse.json({
        tier: activeSubscription.tier || 'free',
        status: activeSubscription.status || 'inactive',
        current_period_end: activeSubscription.current_period_end,
        user_id: user.id,
      })
    }

    // No active subscription found
    return NextResponse.json({
      tier: 'free',
      status: 'inactive',
      user_id: user.id,
      debug: {
        activeError: activeError?.message,
        allSubsCount: allSubscriptions?.length || 0,
        allSubs: allSubscriptions,
      }
    })
  } catch (error) {
    console.error('[API Subscription] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', tier: 'free', status: 'inactive' },
      { status: 500 }
    )
  }
}
