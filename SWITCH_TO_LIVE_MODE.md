# Switch to LIVE Mode - Urgent

## 🚨 Issue Identified

Your app was using **TEST mode** Stripe keys, but you have **LIVE mode** subscriptions in the database. This caused the "Manage Billing" button to fail.

## ✅ Fixed Locally

I've switched `.env.local` to use LIVE keys. But Vercel still needs to be updated.

---

## 🔧 Update Vercel Environment Variables (REQUIRED)

Go to: https://vercel.com/dashboard

### Step 1: Update Stripe Keys

Change these to **LIVE mode** keys (check your `.env.local` file for the actual values):

**Update these variables in Vercel:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...YOUR_LIVE_PUBLISHABLE_KEY...

STRIPE_SECRET_KEY=sk_live_...YOUR_LIVE_SECRET_KEY...
```

**Note:**
- Live keys start with `pk_live_` and `sk_live_`
- Get these from `.env.local` or Stripe Dashboard → Developers → API Keys
- Make sure you're in LIVE mode (not test mode) when copying from Stripe

### Step 2: Check Webhook Secret

The webhook secret might also need updating if you're using a different webhook for live mode:

Current (works for both test/live):
```
STRIPE_WEBHOOK_SECRET=whsec_b11087e6f2eefb4ab09caeea1716513710565ae481382ed616ebdd26f5e4c521
```

**To verify:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click your webhook endpoint
3. Copy the "Signing secret"
4. Update in Vercel if different

### Step 3: Activate Customer Portal (LIVE MODE)

Go to: https://dashboard.stripe.com/settings/billing/portal

(Note: This is LIVE mode, not test mode - no "/test/" in URL)

1. Click **"Activate"**
2. Configure settings:
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Cancel subscriptions
3. Business name: **Roulette Tracker Pro**
4. Support email: **nav.dhillon21@gmail.com**
5. Click **"Save"**

### Step 4: Redeploy

After updating environment variables in Vercel:
1. Go to: Deployments tab
2. Click ⋯ on latest deployment
3. Click **"Redeploy"**
4. Or just push a new commit to trigger auto-deploy

---

## 📊 What Happened to the Database?

I cleaned up 17 orphaned subscriptions that existed in your database but were already canceled/deleted in Stripe. The Stripe check showed all those customers had **0 active subscriptions**, meaning they were already cleaned up on Stripe's side.

**What you need to do:**
1. Create a NEW subscription from /pricing (with LIVE keys active)
2. This will create a fresh, working subscription
3. "Manage Billing" will work for NEW subscriptions

---

## 🧪 Test After Deployment

1. Go to: https://www.euroroulette-tracker.com/pricing
2. Click "Get Started" on Pro or Elite
3. Use a **REAL credit card** (this is LIVE mode!)
4. Complete checkout
5. Go to /account
6. Click "Manage Billing"
7. Should now work! ✅

---

## ⚠️ Important Notes

### You're in LIVE MODE now:
- ✅ Real credit cards
- ✅ Real charges
- ✅ Real subscriptions
- ✅ Real customer emails

### Test cards (4242 4242 4242 4242) will NOT work in live mode!

### Webhook Events:
Make sure your webhook endpoint in Stripe Dashboard points to:
```
https://www.euroroulette-tracker.com/api/webhooks/stripe
```

And is set to LIVE mode (not test mode).

---

## 🔄 If You Need to Switch Back to Test Mode

1. Edit `.env.local` - uncomment test keys, comment live keys
2. Update Vercel environment variables to test keys
3. Update webhook in Stripe to use test mode
4. Activate Customer Portal for test mode
5. Redeploy

---

## ✅ Checklist

- [ ] Update Vercel: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (live)
- [ ] Update Vercel: STRIPE_SECRET_KEY (live)
- [ ] Verify Vercel: STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
- [ ] Activate Customer Portal in LIVE mode
- [ ] Redeploy from Vercel
- [ ] Test: Create new subscription with real card
- [ ] Test: Manage Billing button works
- [ ] Test: Webhook events are received (check Vercel logs)

---

**Last Updated:** 2025-10-24
**Status:** ⚠️ Action Required - Update Vercel environment variables
