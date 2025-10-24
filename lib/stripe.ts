import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
// Environment variables are only available at runtime in Vercel
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
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

// For backwards compatibility, export as stripe
// This returns the full Stripe instance
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe]
  }
})
