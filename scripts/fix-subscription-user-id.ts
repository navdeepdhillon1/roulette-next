/**
 * Fix subscription user_id mismatch
 *
 * Run this script to update the subscription user_id to match the actual logged-in user
 *
 * Usage: npx tsx scripts/fix-subscription-user-id.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim()
    process.env[key] = value
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSubscriptionUserId() {
  console.log('🔍 Checking subscriptions...')

  // The correct user_id (from your logged-in session)
  const correctUserId = '9d399518-201d-4eb7-a5df-21f6493596d3'

  // Your email to identify the subscription
  const userEmail = 'nav.dhillon21@gmail.com'

  // Find all subscriptions
  const { data: allSubs, error: allError } = await supabase
    .from('subscriptions')
    .select('*')

  console.log('\n📊 All subscriptions found:', allSubs?.length || 0)

  if (allSubs && allSubs.length > 0) {
    console.log('\n📋 Subscription details:')
    allSubs.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription:`)
      console.log(`   - user_id: ${sub.user_id}`)
      console.log(`   - tier: ${sub.tier}`)
      console.log(`   - status: ${sub.status}`)
      console.log(`   - stripe_customer_id: ${sub.stripe_customer_id}`)
      console.log(`   - stripe_subscription_id: ${sub.stripe_subscription_id}`)
    })

    // Find subscription that needs fixing (Pro/Elite with wrong user_id)
    const wrongSub = allSubs.find(sub =>
      (sub.tier === 'pro' || sub.tier === 'elite') &&
      sub.user_id !== correctUserId
    )

    if (wrongSub) {
      console.log('\n⚠️  Found subscription with wrong user_id!')
      console.log(`   Current user_id: ${wrongSub.user_id}`)
      console.log(`   Should be: ${correctUserId}`)
      console.log(`\n🔧 Updating subscription...`)

      const { data: updated, error: updateError } = await supabase
        .from('subscriptions')
        .update({ user_id: correctUserId })
        .eq('id', wrongSub.id)
        .select()

      if (updateError) {
        console.error('❌ Failed to update:', updateError)
      } else {
        console.log('✅ Successfully updated subscription!')
        console.log('   New user_id:', updated[0].user_id)
      }
    } else {
      console.log('\n✅ All subscriptions have correct user_id!')
    }
  } else {
    console.log('\n❌ No subscriptions found in database!')
  }
}

fixSubscriptionUserId()
  .then(() => {
    console.log('\n✅ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
