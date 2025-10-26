import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jovecrxutogsudfkpldz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmVjcnh1dG9nc3VkZmtwbGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDk5NDMsImV4cCI6MjA3Mzc4NTk0M30.vkivmN1a2tM4geFXPt7zDIpP4vwqRGpZWu7bDZJQykk'
)

async function checkAllSteps() {
  console.log('🔍 Checking all betting card steps...\\n')

  // Get all steps
  const { data: steps, error } = await supabase
    .from('betting_card_steps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.log('❌ Error:', error.message)
  } else {
    console.log(`Found ${steps.length} step(s) in database`)
    if (steps.length > 0) {
      console.log('\\nMost recent steps:')
      steps.forEach((step, i) => {
        console.log(`\\n${i + 1}. Step #${step.step_number}`)
        console.log('   Session ID:', step.session_id)
        console.log('   Card ID:', step.card_id)
        console.log('   Dealer ID:', step.dealer_id || 'None')
        console.log('   Spin:', step.spin_number)
        console.log('   Bet type:', step.bet_type)
        console.log('   Outcome:', step.outcome)
        console.log('   P/L:', step.net_pl)
      })
    }
  }
}

checkAllSteps()
