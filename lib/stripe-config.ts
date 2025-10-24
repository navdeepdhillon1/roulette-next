// Stripe Price IDs for subscription plans (TEST MODE)
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: 'price_1SLbAyDTwvVaO48oYGicnCCR',
    annual: 'price_1SLbCxDTwvVaO48oVcKQ3Jhj',
  },
  elite: {
    monthly: 'price_1SLbDlDTwvVaO48o5or3R8A9',
    annual: 'price_1SLbENDTwvVaO48ovsGfH0q4',
  },
} as const

// Price ID to tier mapping
export const PRICE_ID_TO_TIER: Record<string, 'pro' | 'elite'> = {
  // Pro
  'price_1SLbAyDTwvVaO48oYGicnCCR': 'pro',
  'price_1SLbCxDTwvVaO48oVcKQ3Jhj': 'pro',
  // Elite
  'price_1SLbDlDTwvVaO48o5or3R8A9': 'elite',
  'price_1SLbENDTwvVaO48ovsGfH0q4': 'elite',
}

export type SubscriptionTier = 'free' | 'pro' | 'elite'
export type BillingInterval = 'monthly' | 'annual'
