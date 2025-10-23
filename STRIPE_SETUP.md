# Stripe Payment Integration Setup Guide

## Overview
Your Stripe payment integration is fully coded and ready to go! You just need to add 2 environment variables to complete the setup.

## What's Already Done ✅
- ✅ Stripe products created (Pro & Elite with monthly/annual pricing)
- ✅ Price IDs collected and configured
- ✅ Checkout API endpoint created
- ✅ Webhook handler created
- ✅ Pricing page with billing toggle
- ✅ Subscription tracking in Supabase
- ✅ Protected routes checking subscriptions
- ✅ STRIPE_SECRET_KEY already in .env.local

## What You Need to Do

### Step 1: Add Supabase Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `jovecrxutogsudfkpldz`
3. Go to **Settings** → **API**
4. Find the **service_role key** (starts with `eyJ...`)
5. Copy it
6. Open `.env.local` file
7. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with the actual key

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: This key bypasses Row Level Security. Keep it secret!

### Step 2: Set Up Stripe Webhook (Local Testing)

For local development, you need to forward Stripe webhooks to your local server.

**Option A: Using Stripe CLI (Recommended for testing)**

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3006/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_...`)
5. Open `.env.local` file
6. Replace `YOUR_WEBHOOK_SECRET_HERE` with the actual secret

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Option B: For Production Deployment**

1. Deploy your app to production (Vercel, etc.)
2. Go to Stripe Dashboard → **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe`
5. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the webhook signing secret
7. Add it to your production environment variables

### Step 3: Restart Dev Server

After adding both keys, restart your dev server:

```bash
# Kill current server
Ctrl + C

# Restart
npm run dev
```

### Step 4: Test Payment Flow

1. Go to http://localhost:3006/pricing
2. Toggle between Monthly/Annual billing
3. Click **Start Pro Trial** or **Start Elite Trial**
4. If not logged in, sign in first
5. You'll be redirected to Stripe Checkout
6. Use test card:
   - **Card Number**: 4242 4242 4242 4242
   - **Expiry**: Any future date (e.g., 12/34)
   - **CVC**: Any 3 digits (e.g., 123)
   - **ZIP**: Any 5 digits (e.g., 12345)
7. Complete payment
8. You should be redirected to `/analysis`

### Step 5: Verify Subscription Was Created

1. Go to Supabase Dashboard → **Table Editor**
2. Open the `subscriptions` table
3. You should see a new row with:
   - `user_id`: Your user ID
   - `stripe_customer_id`: Starts with `cus_`
   - `stripe_subscription_id`: Starts with `sub_`
   - `stripe_price_id`: Your selected price ID
   - `tier`: `pro` or `elite`
   - `status`: `active`

### Step 6: Test Access Control

1. Visit http://localhost:3006/analysis (requires Pro tier)
2. Visit http://localhost:3006/assistant (requires Elite tier)
3. You should have access based on your subscription tier
4. Non-subscribed users should see upgrade prompts

## Troubleshooting

### Webhook not receiving events
- Make sure `stripe listen` is running
- Check the terminal for webhook events
- Verify `STRIPE_WEBHOOK_SECRET` is correct

### "Authentication Required" after payment
- Check if subscription was created in Supabase
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check browser console for errors

### Payment succeeds but no database entry
- Check webhook logs in terminal
- Verify webhook secret is correct
- Check Supabase permissions on subscriptions table

## Environment Variables Summary

Your `.env.local` should have all these:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jovecrxutogsudfkpldz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ⬅️ ADD THIS

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  ⬅️ ADD THIS

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-L9MXZXD6NB
```

## Test Cards

Use these Stripe test cards for different scenarios:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires 3D Secure**: 4000 0025 0000 3155

All test cards:
- Use any future expiry date
- Use any 3-digit CVC
- Use any 5-digit ZIP

## Production Checklist

Before going live:

- [ ] Switch from test mode to live mode in Stripe
- [ ] Update Stripe keys in production environment
- [ ] Set up production webhook endpoint
- [ ] Test with real card in test environment
- [ ] Verify email receipts are being sent
- [ ] Test cancellation flow
- [ ] Test upgrade/downgrade flow

## Support

If you run into issues:
1. Check the browser console for errors
2. Check the terminal for webhook events
3. Check Supabase logs
4. Check Stripe Dashboard → Events for webhook delivery status
