import { createClient } from '@supabase/supabase-js'
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

async function cleanOldSubscriptions() {
  console.log('\n🧹 Cleaning Up Old Live Mode Subscriptions...\n')

  // Get all subscriptions
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')

  if (error) {
    console.error('❌ Error fetching subscriptions:', error)
    return
  }

  console.log(`Found ${subscriptions?.length || 0} subscriptions\n`)

  // Delete all subscriptions that have live mode customer IDs
  const liveSubscriptions = subscriptions?.filter(sub =>
    sub.stripe_customer_id?.startsWith('cus_') &&
    (sub.stripe_customer_id.includes('TIN') ||
     sub.stripe_customer_id.includes('TIO') ||
     sub.stripe_customer_id.includes('TIP') ||
     sub.stripe_customer_id.includes('TIR') ||
     sub.stripe_customer_id.includes('TID') ||
     sub.stripe_customer_id.includes('TIE'))
  ) || []

  console.log(`Deleting ${liveSubscriptions.length} old subscriptions from live mode...\n`)

  for (const sub of liveSubscriptions) {
    console.log(`  Deleting subscription: ${sub.id}`)
    console.log(`    Customer: ${sub.stripe_customer_id}`)
    console.log(`    Tier: ${sub.tier}`)

    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', sub.id)

    if (deleteError) {
      console.log(`    ❌ Error: ${deleteError.message}`)
    } else {
      console.log(`    ✅ Deleted`)
    }
    console.log()
  }

  console.log(`\n✅ Done! Deleted ${liveSubscriptions.length} old subscriptions\n`)
  console.log('Your account is now on FREE tier.')
  console.log('Create a new test subscription from: https://www.euroroulette-tracker.com/pricing\n')
}

cleanOldSubscriptions()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
