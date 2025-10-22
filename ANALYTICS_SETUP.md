# Analytics Setup Guide

## ✅ What's Already Done

1. **Installed** Google Analytics types
2. **Created** analytics utility functions (`lib/analytics.ts`)
3. **Created** GoogleAnalytics component
4. **Added** GA to layout (automatic page view tracking)
5. **Added** event tracking to:
   - Navigation clicks
   - Blog article views
6. **Created** `.env.local.example` with all future environment variables

## 🚀 Next Steps to Activate Analytics

### Step 1: Create Google Analytics 4 Account

1. Go to https://analytics.google.com/
2. Click "Start measuring" or "Admin" (gear icon)
3. Create an account:
   - Account name: "Roulette Tracker Pro"
   - Account data sharing settings: Your choice
4. Create a property:
   - Property name: "Roulette Tracker Web"
   - Time zone: Your timezone
   - Currency: USD
5. Set up a data stream:
   - Choose "Web"
   - Website URL: Your domain (or localhost for testing)
   - Stream name: "Roulette Tracker Website"
6. **Copy your Measurement ID** - It looks like `G-XXXXXXXXXX`

### Step 2: Add Measurement ID to Your Project

1. Create a `.env.local` file in your project root (if it doesn't exist):
   ```bash
   touch .env.local
   ```

2. Add your Measurement ID:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Replace `G-XXXXXXXXXX` with your actual ID from Step 1

3. Restart your development server:
   ```bash
   npm run dev
   ```

### Step 3: Test Analytics (Development)

**Option A: Enable in Development**
Edit `components/GoogleAnalytics.tsx` and comment out these lines:
```typescript
// Remove or comment these lines to test in development:
// if (process.env.NODE_ENV === 'development') {
//   return null
// }
```

**Option B: Test in Production Build**
```bash
npm run build
npm start
```

### Step 4: Verify It's Working

1. Open your site in a browser
2. Open browser DevTools (F12)
3. Go to Network tab
4. Look for requests to `google-analytics.com` or `analytics.google.com`
5. Click around your site (navigation, blog articles)
6. In Google Analytics:
   - Go to Reports → Realtime
   - You should see yourself as an active user
   - See which pages you're viewing in real-time

## 📊 What's Being Tracked

### Automatic Tracking
- **Page views** - Every page navigation
- **Sessions** - User sessions with duration
- **Device info** - Desktop/mobile, browser, OS
- **Geography** - Country, city
- **Traffic sources** - How users found your site

### Custom Events Currently Implemented
- **Navigation clicks** - Which menu items users click
- **Article views** - Which blog posts are read

### Custom Events Ready to Use (Just Import)
See `lib/analytics.ts` for all available functions:
- `trackFeatureUse(featureName)` - When users use a feature
- `trackTrackerSession(type)` - Basic or Advanced tracker starts
- `trackSpinAdded(toolType)` - When spins are added
- `trackExport(type, tool)` - CSV/JSON exports
- `trackUpgradeClick(from, to)` - Upgrade button clicks
- `trackPurchaseComplete(tier, price)` - Successful purchases
- And many more...

## 🎯 Key Metrics to Watch

### Traffic Metrics
- **Users** - How many unique visitors
- **Sessions** - How many visits
- **Bounce rate** - % who leave immediately
- **Session duration** - How long people stay

### Engagement Metrics
- **Pages per session** - How many pages viewed
- **Top pages** - Most visited pages
- **Traffic sources** - Organic, direct, referral
- **Geograph**y - Where users are located

### Conversion Funnel (Once Payments Added)
1. Landing page view
2. Tool usage (tracker/assistant)
3. Pricing page view
4. Checkout start
5. Purchase complete

## 🔮 Future: Advanced Analytics

### When You're Ready, Add:

**1. PostHog (Product Analytics)**
```bash
npm install posthog-js
```
- User session replay (watch how they use your app!)
- Feature flags
- A/B testing
- Funnels and cohorts

**2. Custom Dashboards**
- Create custom reports in GA4
- Set up conversion goals
- Track specific user journeys

**3. Heatmaps**
- Hotjar or Microsoft Clarity
- See where users click
- Watch session recordings

## 📝 Adding More Event Tracking

### Example: Track When User Adds a Spin

In your tracker component:
```typescript
import { trackSpinAdded } from '@/lib/analytics'

function handleAddSpin(number: number) {
  // Your existing logic
  addSpin(number)

  // Track the event
  trackSpinAdded('basic') // or 'advanced' or 'assistant'
}
```

### Example: Track Export Button
```typescript
import { trackExport } from '@/lib/analytics'

function handleExportCSV() {
  // Your existing export logic
  exportToCSV()

  // Track the event
  trackExport('csv', 'Advanced Tracker')
}
```

### Example: Track Upgrade Button
```typescript
import { trackUpgradeClick } from '@/lib/analytics'

<button onClick={() => {
  trackUpgradeClick('free', 'pro')
  // Navigate to pricing/checkout
}}>
  Upgrade to Pro
</button>
```

## 🔒 Privacy & Compliance

### Current Setup
- ✅ No personal data collected by default
- ✅ IP anonymization enabled
- ✅ Cookie notice needed (add when you monetize)

### Before Going Live
1. Add Privacy Policy page (required)
2. Add Cookie Consent banner (required in EU/UK)
3. Consider: Simple Analytics or Plausible (privacy-first alternatives)

## 🐛 Troubleshooting

### Analytics Not Loading
1. Check `.env.local` has correct measurement ID
2. Restart dev server after adding env variable
3. Check browser console for errors
4. Verify GA component is in layout.tsx

### Events Not Showing Up
1. Wait 24-48 hours for historical data
2. Use Realtime report for immediate verification
3. Check browser network tab for event calls
4. Ensure function is actually being called

### "Can't find gtag" Error
- This is normal in development before GA loads
- The safety check `isAnalyticsEnabled()` prevents errors
- Test in production build or enable GA in dev mode

## 📚 Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [Next.js Analytics Guide](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [Google Analytics for Developers](https://developers.google.com/analytics)

## ✅ Checklist

- [ ] Created Google Analytics 4 account
- [ ] Got Measurement ID (G-XXXXXXXXXX)
- [ ] Added ID to `.env.local`
- [ ] Restarted dev server
- [ ] Verified tracking in GA4 Realtime
- [ ] Clicked around and saw events
- [ ] Ready to add more custom events as needed!

---

**Need Help?** The analytics utility (`lib/analytics.ts`) has comprehensive comments and TypeScript types to guide you!
