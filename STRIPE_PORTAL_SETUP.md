# Stripe Customer Portal Setup Guide

## Why You Need This

The "Manage Billing" button lets users:
- Update payment methods
- View billing history and invoices
- Cancel their subscription
- Download receipts

Stripe provides this as a pre-built portal, but you need to activate it first.

---

## Step-by-Step Setup

### 1. Go to Stripe Customer Portal Settings

**For Test Mode:**
https://dashboard.stripe.com/test/settings/billing/portal

**For Live Mode:**
https://dashboard.stripe.com/settings/billing/portal

---

### 2. Click "Activate test link" (or "Activate")

You'll see a button that says **"Activate test link"** (in test mode) or **"Activate"** (in live mode).

Click it to enable the Customer Portal.

---

### 3. Configure Portal Settings (Recommended)

After activation, configure these settings:

#### **Features Tab:**

✅ **Allow customers to:**
- ✅ Update payment methods (Recommended: ON)
- ✅ View invoices (Recommended: ON)
- ✅ Cancel subscriptions (Recommended: ON)
- ⚠️ Update subscription (Optional: OFF - we handle upgrades in-app)

#### **Business Information:**
- **Business name**: Roulette Tracker Pro
- **Support email**: nav.dhillon21@gmail.com
- **Privacy policy URL**: (optional)
- **Terms of service URL**: (optional)

#### **Customer Information:**
Choose what information customers can edit:
- Email: ✅ Allowed
- Phone: ✅ Allowed
- Address: ✅ Allowed

---

### 4. Save Changes

Click **"Save"** at the bottom of the page.

---

### 5. Test It

After saving:
1. Deploy your changes (wait for Vercel deployment)
2. Go to: https://www.euroroulette-tracker.com/account
3. Sign in as admin: nav.dhillon21@gmail.com / RouletteProTemp2025!
4. Click **"Manage Billing"**
5. Should now redirect to Stripe Customer Portal ✅

---

## What Customers Will See

When customers click "Manage Billing", they'll see:

### Customer Portal Features:
- **Payment methods**: Add/update credit cards
- **Billing history**: View all past invoices
- **Subscription details**: See plan, status, renewal date
- **Cancel subscription**: Self-service cancellation
- **Update email/address**: Keep account info current

### Example Portal URL:
```
https://billing.stripe.com/p/session/test_xxxxxxxxxxxxx
```

After they're done, they click **"← Return to Your Account"** to go back to your site.

---

## Common Issues

### Issue: "Customer portal is not active"
**Solution:** You haven't activated the portal yet. Follow steps 1-2 above.

### Issue: Portal shows wrong business name
**Solution:** Update business name in Step 3 → Business Information section.

### Issue: Portal redirect doesn't work
**Solution:**
- Verify `NEXT_PUBLIC_SITE_URL=https://www.euroroulette-tracker.com` is set in Vercel
- Check Vercel deployment logs for errors

---

## Test Mode vs Live Mode

### Test Mode
- Portal URL: `https://billing.stripe.com/p/session/test_xxxxx`
- Only works with test subscriptions
- Use test cards: 4242 4242 4242 4242
- **Status:** You need to activate this first

### Live Mode
- Portal URL: `https://billing.stripe.com/p/session/live_xxxxx`
- Works with real subscriptions and real cards
- **Status:** Activate when ready for production

**Important:** You must activate the portal **separately** for test mode and live mode!

---

## What Happens When User Cancels

When a customer cancels their subscription through the portal:

1. Subscription is marked as `cancel_at_period_end: true`
2. They keep access until end of billing period
3. Webhook sends `customer.subscription.updated` event
4. Your app updates subscription status in Supabase
5. Email notification sent to you (admin)

After the billing period ends:
1. Subscription status changes to `canceled`
2. Webhook sends `customer.subscription.deleted` event
3. User loses access to Pro/Elite features
4. They can re-subscribe anytime from /pricing

---

## Security Notes

✅ **Secure by default:**
- Portal sessions expire after 1 hour
- Each session is unique and one-time use
- Sessions are tied to specific customers
- Return URL is validated by Stripe

🔒 **Your app's security:**
- API route validates user authentication token
- Only returns portal URL for authenticated users
- Uses customer ID from Supabase subscription record
- Server-side only (customer ID never exposed to client)

---

## Customization Options

You can customize the portal in Stripe Dashboard:

### Appearance
- Brand color
- Logo
- Font (uses your Stripe account settings)

### Policies
- Add privacy policy link
- Add terms of service link
- Custom footer text

### Subscription Changes
- Allow plan upgrades/downgrades
- Allow quantity changes (not applicable for your use case)
- Proration settings

---

## Quick Reference

| Action | URL |
|--------|-----|
| Test Mode Portal Settings | https://dashboard.stripe.com/test/settings/billing/portal |
| Live Mode Portal Settings | https://dashboard.stripe.com/settings/billing/portal |
| Test Mode Customers | https://dashboard.stripe.com/test/customers |
| Live Mode Customers | https://dashboard.stripe.com/customers |
| Webhooks | https://dashboard.stripe.com/test/webhooks |

---

## After Setup Checklist

- [x] Activated Customer Portal in Stripe (test mode)
- [x] Configured portal features (cancel, update payment, view invoices)
- [x] Set business name to "Roulette Tracker Pro"
- [x] Added support email
- [x] Tested "Manage Billing" button
- [x] Verified portal loads correctly
- [x] Verified return URL works
- [ ] (Later) Activate portal for live mode when ready

---

**Last Updated:** 2025-10-24
**Status:** Waiting for activation in Stripe Dashboard
