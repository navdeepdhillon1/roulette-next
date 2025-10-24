import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Test endpoint to debug subscription check
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('[Test] Env vars check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl?.substring(0, 20)
    })

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try to query subscriptions without auth
    const { data: allSubs, error: allError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    console.log('[Test] All subscriptions query:', {
      count: allSubs?.length,
      error: allError?.message
    })

    // Get auth header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({
        step: 'no_token',
        message: 'No auth token provided',
        envVarsLoaded: true,
        allSubsCount: allSubs?.length || 0,
      })
    }

    // Verify token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    console.log('[Test] User from token:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: userError?.message
    })

    if (!user || userError) {
      return NextResponse.json({
        step: 'invalid_token',
        error: userError?.message,
        hasUser: !!user,
      })
    }

    // Query user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('[Test] Subscription query:', {
      found: !!subscription,
      tier: subscription?.tier,
      status: subscription?.status,
      error: subError?.message
    })

    return NextResponse.json({
      step: 'success',
      user: {
        id: user.id,
        email: user.email,
      },
      subscription: subscription || null,
      error: subError?.message || null,
    })

  } catch (error: any) {
    console.error('[Test] Error:', error)
    return NextResponse.json({
      step: 'exception',
      error: error.message,
    }, { status: 500 })
  }
}
