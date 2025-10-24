# Stripe Integration Deployment Checklist

## Issue: "Failed to start checkout" Error

Your code is correct and deployed, but environment variables aren't configured in your hosting platform.

---

## Required Environment Variables (Production)

### 1. Stripe Keys (TEST MODE)

**In Vercel Dashboard → Settings → Environment Variables:**

Get these from Stripe Dashboard → https://dashboard.stripe.com/test/apikeys

```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### 2. Supabase Keys

Get these from Supabase Dashboard → Project Settings → API

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Analytics (Optional)

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-L9MXZXD6NB
```

---

## How to Add Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project: **roulette-next** (or euroroulette-tracker)
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. For EACH variable above:
   - Click **Add New**
   - Enter **Key** (e.g., `STRIPE_SECRET_KEY`)
   - Enter **Value** (from above)
   - Select environment: **Production** (and optionally Preview/Development)
   - Click **Save**

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add STRIPE_SECRET_KEY production
# Paste the value when prompted

# Repeat for all variables
```

---

## After Adding Variables: Redeploy

**Important**: Environment variables are only loaded at build time. You MUST redeploy.

### Trigger Redeploy:

**Option A: Push a commit**
```bash
git commit --allow-empty -m "chore: redeploy with environment variables"
git push
```

**Option B: Vercel Dashboard**
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **⋮** (three dots) → **Redeploy**
4. Check "Use existing Build Cache" = **OFF**
5. Click **Redeploy**

---

## Verification Steps

After redeployment:

### 1. Check Deployment Logs

In Vercel Dashboard:
- Go to **Deployments** → Latest deployment
- Click **View Build Logs**
- Look for any errors during build

### 2. Test Checkout Flow

1. Visit: https://euroroulette-tracker.com/pricing
2. Click "Start Pro Trial" or "Start Elite Trial"
3. Sign in if needed
4. Should redirect to Stripe Checkout (not error)

### 3. Check Server Logs

After clicking checkout:
- Vercel Dashboard → **Logs** tab → **Functions**
- Look for the new error logging output:
  ```json
  {
    "message": "...",
    "hasStripeKey": true,  // Should be true!
    "hasSupabaseUrl": true,
    "hasSupabaseServiceKey": true
  }
  ```

### 4. Test Payment with Test Card

In Stripe Checkout:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

Should redirect to: `/analysis?success=true`

---

## Stripe Webhook Configuration

### Current Status: Webhooks Required

Your webhook endpoint: `https://euroroulette-tracker.com/api/webhooks/stripe`

### Setup Webhooks in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://euroroulette-tracker.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update `STRIPE_WEBHOOK_SECRET` in Vercel if different
8. Redeploy if changed

### Test Webhook

In Stripe Dashboard → Webhooks → Your endpoint:
- Click **Send test webhook**
- Select `checkout.session.completed`
- Should show 200 response

---

## Database Setup: Supabase

### Verify `subscriptions` Table Exists

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor**
4. Check if `subscriptions` table exists

### If Missing: Create Table

Run this SQL in **SQL Editor**:

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite')),
  status TEXT CHECK (status IN ('active', 'incomplete', 'canceled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
```

---

## Common Issues & Solutions

### Issue: Still Getting 500 Error After Setting Variables

**Solution**: Clear build cache and redeploy
```bash
git commit --allow-empty -m "fix: rebuild with cleared cache"
git push
```
In Vercel: Redeploy with "Use existing Build Cache" = OFF

### Issue: Webhook Not Receiving Events

**Solution**:
1. Check webhook endpoint URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Check Stripe Dashboard → Webhooks → Your endpoint → **Recent deliveries**
4. If failing, check error message

### Issue: User Not Found After Payment

**Solution**:
1. Check Supabase logs for errors
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
3. Ensure `subscriptions` table exists with correct schema

### Issue: Test Card Declined

**Solution**: Use correct test cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- More: https://stripe.com/docs/testing#cards

---

## Before Going to LIVE Production

When ready to accept real payments:

### 1. Switch to Live Keys

Get live keys from Stripe Dashboard → https://dashboard.stripe.com/apikeys (switch to Live mode)

Update in Vercel:
```
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
```

### 2. Update Webhook Secret

Create new webhook in **Live Mode** Stripe Dashboard:
- Same endpoint: `https://euroroulette-tracker.com/api/webhooks/stripe`
- Get new signing secret
- Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 3. Update Price IDs

In `lib/stripe-config.ts`, replace test price IDs with live price IDs from Stripe Dashboard.

### 4. Redeploy

```bash
git commit -m "feat: switch to live Stripe keys"
git push
```

---

## Quick Diagnostic Script

Run this locally to verify .env.local:

```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('Environment Check:');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
"
```

Expected output (all ✓):
```
Environment Check:
STRIPE_SECRET_KEY: ✓ Set
STRIPE_WEBHOOK_SECRET: ✓ Set
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ✓ Set
NEXT_PUBLIC_SUPABASE_URL: ✓ Set
NEXT_PUBLIC_SUPABASE_ANON_KEY: ✓ Set
SUPABASE_SERVICE_ROLE_KEY: ✓ Set
```

---

## Next Steps

1. ✅ Add all environment variables to Vercel
2. ✅ Redeploy (without build cache)
3. ✅ Test checkout flow
4. ✅ Verify webhook in Stripe Dashboard
5. ✅ Test full payment with test card
6. ✅ Check user can access Pro/Elite features

---

## Support Resources

- Vercel Env Vars: https://vercel.com/docs/projects/environment-variables
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Stripe Test Cards: https://stripe.com/docs/testing
- Supabase Docs: https://supabase.com/docs
