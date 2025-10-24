# Admin Testing Checklist - Roulette Tracker Pro

## 🎯 Complete Testing Guide

Use this checklist to verify all features are working correctly.

---

## 1. Authentication Testing

### Free User (Not Signed In)
- [ ] Go to homepage: https://www.euroroulette-tracker.com/
- [ ] Verify you see "Sign In" and "Get Started" buttons
- [ ] Click "Basic Tracker" - should work (no auth required)
- [ ] Click "Advanced Tracker" - should redirect to sign in OR show "Upgrade Required"
- [ ] Click "Betting Assistant" - should redirect to sign in OR show "Upgrade Required"
- [ ] Click "Learning" - should work (no auth required)

### Signed In as Free User
- [ ] Sign in with a test email (not your Pro account)
- [ ] Go to /tracker - should work
- [ ] Go to /analysis - should show "Upgrade Required" (requires PRO)
- [ ] Go to /assistant - should show "Upgrade Required" (requires ELITE)
- [ ] Go to /account - should show "Free Plan"

### Signed In as PRO User
- [ ] Sign in with: nav.dhillon21@gmail.com / RouletteProTemp2025!
- [ ] Go to /tracker - should work ✅
- [ ] Go to /analysis - should work ✅ (PRO access)
- [ ] Go to /assistant - should show "Upgrade Required" (needs ELITE)
- [ ] Go to /account - should show "Pro Plan" or "Elite Plan"

### Signed In as ELITE User
- [ ] Sign in with: nav.dhillon21@gmail.com / RouletteProTemp2025! (you have 1 Elite sub)
- [ ] Go to /tracker - should work ✅
- [ ] Go to /analysis - should work ✅
- [ ] Go to /assistant - should work ✅ (ELITE access)
- [ ] Go to /account - should show "Elite Plan"

---

## 2. Navigation Testing

### Home Page (/)
- [ ] Loads without errors
- [ ] Shows hero section with tagline
- [ ] Shows "What is Roulette Tracker Pro?" section
- [ ] Shows "The 10 Commandments" section
- [ ] Shows feature cards
- [ ] "Get Started" button goes to /pricing

### Basic Tracker (/tracker)
- [ ] Page loads
- [ ] Can add spins manually
- [ ] Statistics update correctly
- [ ] Session tracking works
- [ ] Bankroll management displays
- [ ] Can export data

### Advanced Tracker (/analysis)
**Requires: PRO or ELITE subscription**
- [ ] Page loads (no "Upgrade Required" for Pro/Elite users)
- [ ] Shows roulette wheel visualization
- [ ] Shows 47 betting groups statistics
- [ ] Tabs work: Statistics, Predictions, Numbers, Anomalies
- [ ] Probability analysis displays
- [ ] Can track advanced metrics

### Betting Assistant (/assistant)
**Requires: ELITE subscription**
- [ ] Page loads (no "Upgrade Required" for Elite users)
- [ ] Session setup works
- [ ] Betting card system displays
- [ ] Can configure cards (target, max bets, progression)
- [ ] Decision engine provides suggestions
- [ ] Performance analytics display

### Learning (/learn)
- [ ] Page loads
- [ ] Shows learning resources
- [ ] Articles/guides display correctly
- [ ] Can navigate between topics

### Pricing (/pricing)
- [ ] Page loads
- [ ] Shows 3 tiers: Free, Pro, Elite
- [ ] Monthly/Annual toggle works
- [ ] Prices display correctly:
  - Pro: $20/month
  - Elite: $30/month
- [ ] "Get Started" buttons work
- [ ] Clicking Pro/Elite opens Stripe Checkout

---

## 3. User Account Testing

### Account Dashboard (/account)
**Must be signed in**
- [ ] Go to /account
- [ ] Shows current subscription tier with icon
- [ ] Shows status (Active/Canceled)
- [ ] Shows renewal/cancellation date (if active subscription)
- [ ] Features list shows correct checkmarks:
  - Free: Only Basic Tracker ✓
  - Pro: Basic Tracker ✓, Advanced Analytics ✓, 47 Groups ✓
  - Elite: All features ✓
- [ ] "Upgrade Now" button shows for Free tier
- [ ] "Manage Billing" button shows for Pro/Elite
- [ ] Click "Manage Billing" button:
  - Shows "Opening Portal..." loading state
  - Redirects to Stripe Customer Portal (billing.stripe.com)
  - Portal displays payment methods, invoices, subscription details
  - Can update payment method
  - Can view billing history
  - Can cancel subscription
  - "← Return to Your Account" button works
- [ ] Account email displays correctly

### User Menu (Top Right)
- [ ] Click profile button (green with 👤)
- [ ] Dropdown shows:
  - Email address
  - ⚙️ Account Settings (goes to /account)
  - 🚪 Sign Out
- [ ] Account Settings link works
- [ ] Sign Out logs you out

---

## 4. Stripe Integration Testing

### Checkout Flow
- [ ] Go to /pricing
- [ ] Click "Get Started" for Pro plan
- [ ] Stripe Checkout opens
- [ ] Shows correct amount: $20.00/month
- [ ] Business name shows "Roulette Tracker Pro" (not "My Glow Mama")
- [ ] Can complete test payment with card: 4242 4242 4242 4242
- [ ] After payment, redirected back to app
- [ ] Subscription appears in Stripe Dashboard

### Webhook Testing
**Test with Stripe Dashboard → Webhooks → Test**
- [ ] Go to: https://dashboard.stripe.com/test/webhooks
- [ ] Find your webhook endpoint
- [ ] Send test `checkout.session.completed` event
- [ ] Check Supabase: new subscription row created
- [ ] Send test `customer.subscription.deleted` event
- [ ] Check Supabase: subscription status updated to "canceled"

---

## 5. Email Notifications Testing

### Setup Required
**Make sure you added these to Vercel:**
- RESEND_API_KEY
- NOTIFICATION_EMAIL

### Test New Subscription Email
- [ ] Create a test subscription via /pricing
- [ ] Check your email (nav.dhillon21@gmail.com)
- [ ] Should receive email with subject: "🎉 New PRO Subscription!"
- [ ] Email shows:
  - Customer email
  - Plan tier
  - Amount
  - Link to Stripe dashboard

### Test Cancellation Email
- [ ] Cancel a subscription in Stripe Dashboard
- [ ] Check your email
- [ ] Should receive email with subject: "❌ Subscription Canceled - PRO"
- [ ] Email shows:
  - Customer email
  - Plan tier that was canceled

---

## 6. Database Testing

### Supabase Subscriptions Table
- [ ] Go to: https://supabase.com/dashboard/project/jovecrxutogsudfkpldz/editor
- [ ] Click "subscriptions" table
- [ ] Verify columns exist:
  - id, user_id, stripe_customer_id, stripe_subscription_id
  - stripe_price_id, tier, status
  - current_period_start, current_period_end
  - created_at, updated_at
- [ ] Check data looks correct for test subscriptions

---

## 7. Performance Testing

### Loading States
- [ ] Navigate to /analysis while signed in as Pro
- [ ] Should see "Checking subscription..." spinner briefly
- [ ] Then smoothly transition to page (no "Upgrade Required" flash)

### Page Load Speed
- [ ] All pages load in < 3 seconds
- [ ] No console errors in browser DevTools
- [ ] Images load properly
- [ ] Navigation is responsive

---

## 8. Mobile Testing

### Responsive Design
- [ ] Open site on mobile or use Chrome DevTools mobile view
- [ ] Navigation collapses to hamburger menu (if implemented)
- [ ] All pages display correctly on small screens
- [ ] Buttons are tappable
- [ ] Forms are usable

---

## 9. Error Handling Testing

### Invalid Access
- [ ] Sign out
- [ ] Try to go to /analysis directly
- [ ] Should show "Authentication Required" OR redirect to sign in
- [ ] Sign in as Free user
- [ ] Try to go to /analysis
- [ ] Should show "Upgrade Required" with pricing button

### Network Errors
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Slow 3G"
- [ ] Navigate between pages
- [ ] Loading states should display
- [ ] Pages should eventually load

---

## 10. Security Testing

### Protected Routes
- [ ] Copy /analysis URL
- [ ] Open in incognito window (not signed in)
- [ ] Should be blocked from accessing
- [ ] Same test for /assistant

### API Endpoints
- [ ] Try accessing /api/subscription without auth
- [ ] Should return 401 Unauthorized
- [ ] Try accessing with invalid token
- [ ] Should return 401 Unauthorized

---

## Quick Test Script (5 minutes)

**Fast verification of all critical paths:**

1. **Homepage** → Click around, verify no errors
2. **Sign In** → Use your Pro account
3. **Basic Tracker** → Add a spin, verify it works
4. **Advanced Tracker** → Check you can access (Pro tier)
5. **Betting Assistant** → Check you can access (Elite tier)
6. **Account Page** → Verify shows correct subscription
7. **Sign Out** → Verify you're logged out
8. **Pricing** → Click Pro, verify Stripe opens correctly

---

## Common Issues & Solutions

### Issue: "Upgrade Required" even with Pro subscription
**Solution:**
- Check you're signed in as correct user (nav.dhillon21@gmail.com)
- Clear browser cache and hard refresh (Cmd+Shift+R)
- Check console for errors
- Verify subscription in Supabase database

### Issue: Email notifications not arriving
**Solution:**
- Check RESEND_API_KEY is set in Vercel
- Check NOTIFICATION_EMAIL is set in Vercel
- Verify webhook is being received (check Vercel logs)
- Check Resend dashboard for delivery status

### Issue: Stripe checkout shows wrong business name
**Solution:**
- Update business name in Stripe Dashboard → Settings → Account
- Clear Stripe Checkout cache

---

## Test Accounts

### Admin Account (Full Access)
- **Email:** nav.dhillon21@gmail.com
- **Password:** RouletteProTemp2025!
- **Access:** Elite (all features)

### Create Test Free User
1. Go to /pricing
2. Click "Sign In"
3. Click "Sign Up"
4. Use a test email: test@example.com
5. Verify limited access (only basic tracker)

---

## Automated Testing Commands

```bash
# Run linter
npm run lint

# Build for production (catches TypeScript errors)
npm run build

# Check for broken links (if implemented)
# npm run test:links
```

---

## Post-Deployment Checklist

After deploying to production:

- [ ] Test live Stripe checkout with real card
- [ ] Verify webhook receives live events
- [ ] Test email notifications with live subscriptions
- [ ] Check all environment variables are set in Vercel
- [ ] Verify SSL certificate is valid
- [ ] Test from different devices/browsers
- [ ] Check Google Analytics is tracking (if configured)

---

## Reporting Issues

If you find bugs:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Check Vercel deployment logs
4. Check Stripe webhook logs
5. Check Supabase database state

---

**Last Updated:** 2025-10-24
