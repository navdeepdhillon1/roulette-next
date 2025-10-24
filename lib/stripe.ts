import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
// Environment variables are only available at runtime in Vercel
let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  })

  return stripeInstance
}

// Export the stripe instance - getter pattern
export const stripe = {
  get customers() {
    return getStripeInstance().customers
  },
  get checkout() {
    return getStripeInstance().checkout
  },
  get subscriptions() {
    return getStripeInstance().subscriptions
  },
  get webhooks() {
    return getStripeInstance().webhooks
  },
}
