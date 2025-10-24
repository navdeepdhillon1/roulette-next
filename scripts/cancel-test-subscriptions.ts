/**
 * Cancel all test subscriptions in Stripe
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    process.env[match[1].trim()] = match[2].trim()
  }
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

async function cancelTestSubscriptions() {
  console.log('🔍 Finding all test subscriptions for nav.dhillon21@gmail.com...\n')

  const email = 'nav.dhillon21@gmail.com'

  // Find customer by email
  const customers = await stripe.customers.list({
    email: email,
    limit: 100,
  })

  console.log(`Found ${customers.data.length} customer(s) with email ${email}\n`)

  let totalCanceled = 0

  for (const customer of customers.data) {
    console.log(`\n📧 Customer: ${customer.id} (${customer.email})`)

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 100,
    })

    console.log(`   Found ${subscriptions.data.length} subscription(s)`)

    for (const sub of subscriptions.data) {
      console.log(`\n   📋 Subscription: ${sub.id}`)
      console.log(`      Status: ${sub.status}`)
      console.log(`      Plan: ${sub.items.data[0]?.price.nickname || 'Unknown'}`)
      console.log(`      Amount: $${(sub.items.data[0]?.price.unit_amount || 0) / 100}/month`)

      if (sub.status === 'active' || sub.status === 'trialing') {
        console.log(`      ❌ Canceling...`)

        try {
          await stripe.subscriptions.cancel(sub.id)
          console.log(`      ✅ Canceled successfully!`)
          totalCanceled++
        } catch (error: any) {
          console.log(`      ⚠️  Failed to cancel: ${error.message}`)
        }
      } else {
        console.log(`      ℹ️  Already ${sub.status}, skipping`)
      }
    }
  }

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Canceled ${totalCanceled} subscription(s)`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

cancelTestSubscriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
