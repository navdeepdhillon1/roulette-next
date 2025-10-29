// Site-wide constants

export const SITE_CONFIG = {
  name: 'EuroRoulette Tracker',
  tagline: 'Professional Edition',
  domain: 'euroroulette-tracker.com',
  url: 'https://euroroulette-tracker.com',

  // Contact Information
  email: {
    support: 'support@euroroulette-tracker.com',
    billing: 'billing@euroroulette-tracker.com',
    hello: 'hello@euroroulette-tracker.com',
  },

  // Social Media (add when ready)
  social: {
    twitter: '',
    instagram: '',
    youtube: '',
  },

  // Legal
  copyright: `© ${new Date().getFullYear()} EuroRoulette Tracker. All rights reserved.`,

  // Features
  features: {
    bettingGroups: 47,
    maxTrackedNumbers: 37,
  },

  // Support Resources
  support: {
    helpCenter: '/learn',
    pricing: '/pricing',
    gamblingHelpline: '1-800-GAMBLER',
  },
}

// Email template helpers
export const formatSupportEmail = (subject?: string) => {
  const emailSubject = subject ? `?subject=${encodeURIComponent(subject)}` : ''
  return `mailto:${SITE_CONFIG.email.support}${emailSubject}`
}

export const formatBillingEmail = (subject?: string) => {
  const emailSubject = subject ? `?subject=${encodeURIComponent(subject)}` : ''
  return `mailto:${SITE_CONFIG.email.billing}${emailSubject}`
}
