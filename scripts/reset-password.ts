/**
 * Send password reset email for the correct user account
 *
 * This will send a password reset link to nav.dhillon21@gmail.com
 * for the user account that has all the subscriptions
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

async function sendPasswordReset() {
  console.log('📧 Sending password reset email...\n')

  const correctUserId = '9d399518-201d-4eb7-a5df-21f649359643'
  const email = 'nav.dhillon21@gmail.com'

  console.log(`User ID: ${correctUserId}`)
  console.log(`Email: ${email}`)
  console.log(`\n🔐 Generating password reset link...\n`)

  try {
    // Option 1: Generate a password reset link manually
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://www.euroroulette-tracker.com/tracker'
      }
    })

    if (linkError) {
      console.error('❌ Failed to generate reset link:', linkError)
      return
    }

    console.log('✅ Password reset link generated!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🔗 CLICK THIS LINK TO RESET YOUR PASSWORD:\n')
    console.log(linkData.properties.action_link)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📝 Instructions:')
    console.log('   1. Copy the link above')
    console.log('   2. Open it in your browser')
    console.log('   3. You\'ll be redirected to set a new password')
    console.log('   4. Enter a new password (minimum 6 characters)')
    console.log('   5. You\'ll be automatically signed in!\n')
    console.log('⚠️  Note: This link expires in 60 minutes\n')

    // Also try to send an email (may not work if email not configured)
    console.log('📬 Also attempting to send email (may fail if SMTP not configured)...\n')

    const { error: emailError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.euroroulette-tracker.com/tracker'
    })

    if (emailError) {
      console.log('ℹ️  Email send failed (expected if SMTP not configured):', emailError.message)
      console.log('   → Use the link above instead!\n')
    } else {
      console.log('✅ Email sent! Check your inbox for nav.dhillon21@gmail.com\n')
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

sendPasswordReset()
  .then(() => {
    console.log('✅ Script completed!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
