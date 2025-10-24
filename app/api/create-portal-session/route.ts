import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get the user's subscription to find their Stripe customer ID
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)

    if (subError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const stripeCustomerId = subscriptions[0].stripe_customer_id

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 404 })
    }

    // Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.euroroulette-tracker.com'}/account`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Error creating portal session:', error)

    // Check if it's a Stripe error about portal configuration
    if (error?.message?.includes('customer portal') || error?.message?.includes('not active')) {
      return NextResponse.json(
        { error: 'Stripe Customer Portal is not configured. Please set it up in your Stripe Dashboard.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
