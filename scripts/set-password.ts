/**
 * Set password for the correct user account
 */

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

async function setPassword() {
  const correctUserId = '9d399518-201d-4eb7-a5df-21f649359643'
  const email = 'nav.dhillon21@gmail.com'
  const tempPassword = 'RouletteProTemp2025!'

  console.log('🔐 Setting temporary password...\n')
  console.log(`User ID: ${correctUserId}`)
  console.log(`Email: ${email}\n`)

  const { data, error } = await supabase.auth.admin.updateUserById(
    correctUserId,
    { password: tempPassword }
  )

  if (error) {
    console.error('❌ Failed to set password:', error)
    return
  }

  console.log('✅ Password set successfully!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📝 YOUR LOGIN CREDENTIALS:\n')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${tempPassword}\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📋 Next Steps:')
  console.log('   1. Sign out if you\'re currently logged in')
  console.log('   2. Click "Sign In" button')
  console.log('   3. Use EMAIL/PASSWORD (not Google)')
  console.log('   4. Enter the credentials above')
  console.log('   5. Go to /analysis - you should have PRO access!')
  console.log('   6. (Optional) Change your password after logging in\n')
}

setPassword()
  .then(() => {
    console.log('✅ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
