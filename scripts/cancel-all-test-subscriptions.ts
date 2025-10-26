import Stripe from 'stripe'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Manual .env.local parser
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim()
    process.env[key] = value
  }
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

async function cancelAllTestSubscriptions() {
  console.log('\n🧹 Canceling Test Subscriptions (keeping the most recent one)...\n')

  // List all subscriptions
  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
    status: 'active',
  })

  console.log(`Found ${subscriptions.data.length} active subscriptions\n`)

  if (subscriptions.data.length === 0) {
    console.log('✅ No active subscriptions to cancel\n')
    return
  }

  // Sort by created date (newest first)
  const sortedSubs = subscriptions.data.sort((a, b) => b.created - a.created)

  // Keep the most recent one, cancel the rest
  console.log(`\n✅ KEEPING most recent subscription:`)
  const keepSub = sortedSubs[0]
  console.log(`   ${keepSub.id}`)
  console.log(`   Customer: ${keepSub.customer}`)
  console.log(`   Amount: $${(keepSub.items.data[0].price.unit_amount || 0) / 100}`)
  console.log(`   Created: ${new Date(keepSub.created * 1000).toLocaleString()}`)

  console.log(`\n🗑️  Canceling ${sortedSubs.length - 1} older subscriptions:\n`)

  // Cancel all except the first one
  for (let i = 1; i < sortedSubs.length; i++) {
    const sub = sortedSubs[i]
    console.log(`📋 Subscription: ${sub.id}`)
    console.log(`   Customer: ${sub.customer}`)
    console.log(`   Amount: $${(sub.items.data[0].price.unit_amount || 0) / 100}`)

    try {
      await stripe.subscriptions.cancel(sub.id)
      console.log(`   ✅ Canceled\n`)
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  console.log(`✅ Done! Kept 1 subscription, canceled ${sortedSubs.length - 1} subscriptions\n`)
}

cancelAllTestSubscriptions()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
