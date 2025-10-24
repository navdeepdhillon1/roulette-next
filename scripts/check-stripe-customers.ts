import { createClient } from '@supabase/supabase-js'
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

async function checkCustomers() {
  console.log('\n🔍 Checking Stripe Customers vs Database...\n')

  // Get all subscriptions from database
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')

  if (error) {
    console.error('❌ Error fetching subscriptions:', error)
    return
  }

  console.log(`Found ${subscriptions?.length || 0} active subscriptions in database\n`)

  for (const sub of subscriptions || []) {
    console.log(`\n📋 Subscription ID: ${sub.id}`)
    console.log(`   User ID: ${sub.user_id}`)
    console.log(`   Tier: ${sub.tier}`)
    console.log(`   Stripe Customer ID: ${sub.stripe_customer_id}`)
    console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id}`)

    // Check if customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(sub.stripe_customer_id)

      if (customer.deleted) {
        console.log('   ⚠️  Customer exists but is DELETED in Stripe')
      } else {
        console.log(`   ✅ Customer exists in Stripe: ${(customer as any).email}`)
      }

      // Check if subscription exists in Stripe
      if (sub.stripe_subscription_id) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
          console.log(`   ✅ Subscription exists in Stripe: ${stripeSub.status}`)
        } catch (e: any) {
          console.log(`   ❌ Subscription NOT found in Stripe: ${e.message}`)
        }
      }
    } catch (e: any) {
      console.log(`   ❌ Customer NOT found in Stripe: ${e.message}`)
    }
  }

  // List all customers from Stripe
  console.log('\n\n📊 All Customers in Stripe:\n')
  const customers = await stripe.customers.list({ limit: 20 })

  for (const customer of customers.data) {
    console.log(`\nCustomer: ${customer.id}`)
    console.log(`  Email: ${customer.email}`)
    console.log(`  Created: ${new Date(customer.created * 1000).toLocaleString()}`)

    // Check if this customer has active subscriptions
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active' })
    console.log(`  Active Subscriptions: ${subs.data.length}`)

    for (const sub of subs.data) {
      console.log(`    - ${sub.id} (${sub.items.data[0]?.price.id})`)
    }
  }
}

checkCustomers()
  .then(() => {
    console.log('\n✅ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
