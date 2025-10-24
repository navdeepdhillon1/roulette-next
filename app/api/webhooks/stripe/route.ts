import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { PRICE_ID_TO_TIER } from '@/lib/stripe-config'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Disable body parsing so we can verify the webhook signature
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get Stripe instance
  const stripe = getStripe()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const userId = session.metadata?.user_id

          if (!userId) {
            console.error('No user_id in session metadata')
            break
          }

          // Get the subscription details
          const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscriptionDetails.items.data[0].price.id
          const tier = PRICE_ID_TO_TIER[priceId] || 'free'

          // Update or create subscription record
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            tier: tier,
            status: subscriptionDetails.status,
            current_period_start: new Date(subscriptionDetails.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscriptionDetails.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscriptionDetails.cancel_at_period_end,
          })

          console.log(`Subscription created for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0].price.id
        const tier = PRICE_ID_TO_TIER[priceId] || 'free'

        await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            tier: tier,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`Subscription updated: ${subscription.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            tier: 'free',
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`Subscription canceled: ${subscription.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
