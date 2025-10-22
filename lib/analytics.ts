// lib/analytics.ts
// Google Analytics 4 tracking utilities

// You'll need to replace this with your actual GA4 Measurement ID
// Get it from: https://analytics.google.com/
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'

// Check if we're in production and GA is configured
export const isAnalyticsEnabled = () => {
  return typeof window !== 'undefined' &&
         GA_MEASUREMENT_ID &&
         GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX' &&
         window.gtag !== undefined
}

// Page view tracking
export const pageview = (url: string) => {
  if (!isAnalyticsEnabled()) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

// Generic event tracking
type GtagEvent = {
  action: string
  category: string
  label?: string
  value?: number
}

export const event = ({ action, category, label, value }: GtagEvent) => {
  if (!isAnalyticsEnabled()) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// ============================================
// CUSTOM TRACKING EVENTS FOR YOUR APP
// ============================================

// User actions
export const trackSignup = (method: string = 'email') => {
  event({
    action: 'sign_up',
    category: 'User',
    label: method,
  })
}

export const trackLogin = (method: string = 'email') => {
  event({
    action: 'login',
    category: 'User',
    label: method,
  })
}

// Feature usage
export const trackFeatureUse = (featureName: string) => {
  event({
    action: 'use_feature',
    category: 'Features',
    label: featureName,
  })
}

export const trackTrackerSession = (type: 'basic' | 'advanced') => {
  event({
    action: 'start_tracking_session',
    category: 'Tracker',
    label: type,
  })
}

export const trackSpinAdded = (toolType: 'basic' | 'advanced' | 'assistant') => {
  event({
    action: 'add_spin',
    category: 'Engagement',
    label: toolType,
  })
}

export const trackBettingAssistantUse = (action: string) => {
  event({
    action: 'betting_assistant_action',
    category: 'Betting Assistant',
    label: action,
  })
}

export const trackAnalysisView = (viewType: string) => {
  event({
    action: 'view_analysis',
    category: 'Advanced Tracker',
    label: viewType,
  })
}

// Export actions
export const trackExport = (exportType: 'csv' | 'json', toolName: string) => {
  event({
    action: 'export_data',
    category: 'Export',
    label: `${toolName}_${exportType}`,
  })
}

// Blog/Learning
export const trackArticleView = (articleSlug: string) => {
  event({
    action: 'view_article',
    category: 'Learning',
    label: articleSlug,
  })
}

export const trackArticleComplete = (articleSlug: string, readTime: string) => {
  event({
    action: 'complete_article',
    category: 'Learning',
    label: articleSlug,
    value: parseInt(readTime), // minutes
  })
}

// Conversion/Monetization
export const trackUpgradeClick = (fromTier: string, toTier: string) => {
  event({
    action: 'click_upgrade',
    category: 'Conversion',
    label: `${fromTier}_to_${toTier}`,
  })
}

export const trackPricingView = () => {
  event({
    action: 'view_pricing',
    category: 'Conversion',
  })
}

export const trackCheckoutStart = (tier: string, price: number) => {
  event({
    action: 'begin_checkout',
    category: 'Conversion',
    label: tier,
    value: price,
  })
}

export const trackPurchaseComplete = (tier: string, price: number, transactionId?: string) => {
  if (!isAnalyticsEnabled()) return

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: price,
    currency: 'USD',
    items: [{
      item_id: tier,
      item_name: `${tier} Subscription`,
      price: price,
      quantity: 1,
    }]
  })
}

// Engagement metrics
export const trackTimeOnTool = (toolName: string, seconds: number) => {
  event({
    action: 'time_spent',
    category: 'Engagement',
    label: toolName,
    value: Math.round(seconds),
  })
}

export const trackSessionLength = (spins: number, minutes: number) => {
  event({
    action: 'session_length',
    category: 'Engagement',
    label: `${spins}_spins`,
    value: Math.round(minutes),
  })
}

// Navigation
export const trackNavigationClick = (destination: string) => {
  event({
    action: 'navigate',
    category: 'Navigation',
    label: destination,
  })
}

// Error tracking
export const trackError = (errorType: string, errorMessage: string) => {
  event({
    action: 'error',
    category: 'Error',
    label: `${errorType}: ${errorMessage}`,
  })
}

// Demo/Tutorial
export const trackDemoStart = (featureName: string) => {
  event({
    action: 'start_demo',
    category: 'Onboarding',
    label: featureName,
  })
}

export const trackTutorialComplete = (tutorialName: string) => {
  event({
    action: 'complete_tutorial',
    category: 'Onboarding',
    label: tutorialName,
  })
}

// Social/Sharing
export const trackShare = (platform: string, content: string) => {
  event({
    action: 'share',
    category: 'Social',
    label: `${platform}_${content}`,
  })
}

// Performance tracking helper
export const trackPerformanceMetric = (metric: string, value: number) => {
  event({
    action: 'performance_metric',
    category: 'Performance',
    label: metric,
    value: Math.round(value),
  })
}

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void
    dataLayer: any[]
  }
}
