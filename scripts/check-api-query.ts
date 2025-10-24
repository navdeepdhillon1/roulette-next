import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    process.env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const userId = '9d399518-201d-4eb7-a5df-21f649359643'

async function checkQuery() {
  console.log('🔍 Testing the exact API query...\n')
  console.log(`User ID: ${userId}\n`)

  // Test 1: Query with status filter (what API does)
  console.log('Test 1: Query with status="active" filter')
  const { data: active, error: activeError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  console.log(`  Found: ${active?.length || 0} subscriptions`)
  if (activeError) console.log(`  Error: ${activeError.message}`)
  if (active && active.length > 0) {
    console.log(`  First sub: tier=${active[0].tier}, status=${active[0].status}`)
  }
  console.log()

  // Test 2: Query without status filter
  console.log('Test 2: Query without status filter')
  const { data: all, error: allError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)

  console.log(`  Found: ${all?.length || 0} subscriptions`)
  if (allError) console.log(`  Error: ${allError.message}`)
  if (all && all.length > 0) {
    console.log(`  Subscriptions:`)
    all.forEach((sub, i) => {
      console.log(`    ${i + 1}. tier=${sub.tier}, status=${sub.status}`)
    })
  }
  console.log()

  // Test 3: Single query (what API does)
  console.log('Test 3: .single() query (what API uses)')
  const { data: single, error: singleError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (singleError) {
    console.log(`  ❌ Error: ${singleError.message}`)
    console.log(`  Code: ${singleError.code}`)
  } else {
    console.log(`  ✅ Found: tier=${single.tier}, status=${single.status}`)
  }
}

checkQuery().then(() => process.exit(0))
