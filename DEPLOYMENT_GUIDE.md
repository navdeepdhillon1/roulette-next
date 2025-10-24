# Deployment Guide - Roulette Tracker Pro

## 🚀 Ready to Deploy!

All code changes are complete and the production build passes successfully. Follow these steps to deploy to production.

---

## Step 1: Add Environment Variables to Vercel

Go to your Vercel project dashboard:
https://vercel.com/dashboard

### Required Environment Variables

Add these to **Production, Preview, and Development** environments:

```
RESEND_API_KEY=re_YRCVRLHT_2LsgWTqWfmcqwPVuhpUxNaqF
NOTIFICATION_EMAIL=nav.dhillon21@gmail.com
```

**How to add:**
1. Go to your project in Vercel
2. Click **Settings** tab
3. Click **Environment Variables** in the sidebar
4. Add each variable:
   - Name: `RESEND_API_KEY`
   - Value: `re_YRCVRLHT_2LsgWTqWfmcqwPVuhpUxNaqF`
   - Environments: ✅ Production ✅ Preview ✅ Development
5. Click **Add** then repeat for `NOTIFICATION_EMAIL`

---

## Step 2: Deploy to Production

### Option A: Automatic Deployment (Recommended)

If you have GitHub connected to Vercel:

```bash
git push origin main
```

Vercel will automatically:
- Detect the push
- Build your app
- Deploy to production
- Apply the new environment variables

**Monitor deployment:**
- Go to Vercel dashboard → Deployments
- Watch the build log
- Wait for "✓ Deployed" status

### Option B: Manual Deployment

If auto-deploy is not enabled:

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Deploy to production
vercel --prod
```

---

## Step 3: Verify Environment Variables Loaded

After deployment completes:

1. Go to: https://www.euroroulette-tracker.com/envtest
2. Check that you see:
   - ✅ SUPABASE_URL exists
   - ✅ SUPABASE_ANON_KEY exists
   - ✅ STRIPE_PUBLISHABLE_KEY exists

If any show ❌, the environment variables didn't load. Trigger a new deployment:

```bash
# Go to Vercel dashboard → Deployments → ⋯ Menu → Redeploy
```

---

## Step 4: Update Stripe Business Name

**Manual step required:**

1. Go to: https://dashboard.stripe.com/settings/account
2. Click **Account details**
3. Change business name from "My Glow Mama" to "Roulette Tracker Pro"
4. Click **Save**

This will update the name shown in Stripe Checkout and email receipts.

---

## Step 5: Test Email Notifications

### Test New Subscription Email

1. Go to: https://www.euroroulette-tracker.com/pricing
2. Click "Get Started" on Pro plan
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Check your email: nav.dhillon21@gmail.com
5. You should receive: "🎉 New PRO Subscription!"

### Test Cancellation Email

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. Find the test subscription you just created
3. Click ⋯ → Cancel subscription
4. Check your email
5. You should receive: "❌ Subscription Canceled - PRO"

---

## Step 6: Run Full Testing Checklist

Use the comprehensive testing guide:

**See:** `TESTING_CHECKLIST.md`

### Quick 5-Minute Test

1. **Sign in** as admin (nav.dhillon21@gmail.com / RouletteProTemp2025!)
2. **Check navigation** - you should see:
   - 🏠 Home
   - 📋 Basic Tracker
   - 📊 Advanced Tracker
   - 🎯 Betting Assistant (Elite only)
   - 📚 Learning
3. **Click Advanced Tracker** - should load immediately (no "Upgrade Required")
4. **Click Betting Assistant** - should load immediately
5. **Go to Account Settings** (click user icon → ⚙️ Account Settings)
   - Should show "Elite Plan" or "Pro Plan"
   - Should show renewal date
   - Features should have checkmarks
6. **Sign out** - navigation should reduce to only Home, Basic Tracker, Learning

---

## Step 7: Clean Up Test Subscriptions (Optional)

Check if you have active test subscriptions in Stripe:

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. Cancel any subscriptions you created during testing
3. This keeps your dashboard clean

---

## What Changed in This Deployment

### 🐛 Bug Fixes
- **Navigation Tier Loading**: Fixed bug where all users saw Elite-tier navigation links regardless of subscription. Now dynamically loads actual user tier.

### ✨ Features Added (from previous sessions)
- Server-side subscription check API (`/api/subscription`)
- Email notifications for new subscriptions and cancellations (Resend)
- Subscription dashboard showing tier, status, and features
- Account settings page with billing management
- Loading states to prevent "Upgrade Required" flash
- Multiple subscription handling (prioritizes highest tier)

---

## Expected Behavior After Deployment

### Free Users (Not Signed In)
- Navigation: Home, Basic Tracker, Learning
- Can access: /, /tracker, /learn
- Cannot access: /analysis, /assistant (redirected or blocked)

### Free Users (Signed In)
- Navigation: Home, Basic Tracker, Learning
- Can access: /, /tracker, /learn, /account
- Cannot access: /analysis, /assistant (shows "Upgrade Required")

### Pro Users
- Navigation: Home, Basic Tracker, Advanced Tracker, Learning
- Can access: All free features + /analysis
- Cannot access: /assistant (shows "Upgrade Required")

### Elite Users
- Navigation: Home, Basic Tracker, Advanced Tracker, Betting Assistant, Learning
- Can access: All features including /assistant

---

## Troubleshooting

### Issue: Navigation shows wrong tabs
**Solution:**
- Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Sign out and sign back in
- Check console for errors

### Issue: Email notifications not arriving
**Solution:**
- Verify RESEND_API_KEY in Vercel environment variables
- Check Vercel deployment logs for webhook execution
- Go to: https://resend.com/emails to see delivery status

### Issue: "Upgrade Required" appears for Pro/Elite users
**Solution:**
- Verify user is signed in with correct account: nav.dhillon21@gmail.com
- Check Supabase subscriptions table for active subscription
- Check browser console for API errors
- Try signing out and back in

---

## Commit History

Latest changes committed:

```
commit 075c6d5
fix(navigation): dynamically load user subscription tier

Previously hardcoded to 'elite', now fetches actual tier from
/api/subscription endpoint. Shows appropriate navigation links
based on user's subscription level.
```

---

## Next Steps After Deployment

1. ✅ Push to GitHub (triggers auto-deploy)
2. ✅ Add Resend environment variables to Vercel
3. ✅ Wait for deployment to complete
4. ✅ Update Stripe business name
5. ✅ Run testing checklist
6. ✅ Test email notifications
7. ✅ Verify all tiers show correct navigation

---

## Support

If you encounter issues:
- Check `TESTING_CHECKLIST.md` Common Issues section
- Review Vercel deployment logs
- Check browser console for errors
- Verify Supabase subscriptions table

---

**Last Updated:** 2025-10-24
**Build Status:** ✅ Passing
**Ready for Production:** ✅ Yes
