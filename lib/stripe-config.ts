// Stripe Price IDs for subscription plans (LIVE MODE)
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: 'price_1SLRqFDkp2x7MJ09zMyQak64',
    annual: 'price_1SLRzCDkp2x7MJ09NZWjZrMp',
  },
  elite: {
    monthly: 'price_1SLS1LDkp2x7MJ09kNwk7KT9',
    annual: 'price_1SLS2QDkp2x7MJ091dHGEvJT',
  },
} as const

// Price ID to tier mapping
export const PRICE_ID_TO_TIER: Record<string, 'pro' | 'elite'> = {
  // Pro
  'price_1SLRqFDkp2x7MJ09zMyQak64': 'pro',
  'price_1SLRzCDkp2x7MJ09NZWjZrMp': 'pro',
  // Elite
  'price_1SLS1LDkp2x7MJ09kNwk7KT9': 'elite',
  'price_1SLS2QDkp2x7MJ091dHGEvJT': 'elite',
}

export type SubscriptionTier = 'free' | 'pro' | 'elite'
export type BillingInterval = 'monthly' | 'annual'
