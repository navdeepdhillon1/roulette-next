import { createClient } from '@supabase/supabase-js'
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  console.log('🔍 Checking users...\n')

  const userIds = [
    '9d399518-201d-4eb7-a5df-21f649359643', // Has subscriptions
    '9d399518-201d-4eb7-a5df-21f6493596d3'  // Currently logged in
  ]

  for (const userId of userIds) {
    console.log(`\n📧 User ID: ${userId}`)

    // Check auth.users
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error) {
      console.log(`   ❌ Not found in auth: ${error.message}`)
    } else if (data.user) {
      console.log(`   ✅ Found in auth!`)
      console.log(`   Email: ${data.user.email}`)
      console.log(`   Provider: ${data.user.app_metadata.provider || 'email'}`)
      console.log(`   Created: ${new Date(data.user.created_at).toLocaleString()}`)
      console.log(`   Last sign in: ${data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).toLocaleString() : 'Never'}`)
    }

    // Check subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    console.log(`   Subscriptions: ${subs?.length || 0}`)
    if (subs && subs.length > 0) {
      subs.forEach(sub => {
        console.log(`      - ${sub.tier.toUpperCase()} (${sub.status})`)
      })
    }
  }
}

checkUsers().then(() => process.exit(0))
