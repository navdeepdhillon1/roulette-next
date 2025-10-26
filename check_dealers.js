import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jovecrxutogsudfkpldz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmVjcnh1dG9nc3VkZmtwbGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDk5NDMsImV4cCI6MjA3Mzc4NTk0M30.vkivmN1a2tM4geFXPt7zDIpP4vwqRGpZWu7bDZJQykk'
)

async function checkDealers() {
  console.log('🎰 Checking dealers...\\n')

  const { data: dealers, error } = await supabase
    .from('dealers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.log('❌ Error:', error.message)
  } else {
    console.log(`Found ${dealers.length} dealer(s)\\n`)
    dealers.forEach((dealer, i) => {
      console.log(`${i + 1}. ${dealer.name}${dealer.nickname ? ` (${dealer.nickname})` : ''}`)
      console.log('   ID:', dealer.id)
      console.log('   Casino ID:', dealer.casino_id || 'None')
      console.log('   Gender:', dealer.gender || 'N/A')
      console.log('')
    })
  }

  // Now get steps with dealer info
  console.log('\\n📊 Steps with dealer names:\\n')
  const { data: steps } = await supabase
    .from('betting_card_steps')
    .select('step_number, spin_number, dealer_id, dealers(name, nickname)')
    .not('dealer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (steps && steps.length > 0) {
    steps.forEach((step, i) => {
      console.log(`${i + 1}. Step #${step.step_number}, Spin ${step.spin_number}`)
      console.log('   Dealer:', step.dealers?.name || 'Unknown')
      console.log('')
    })
  } else {
    console.log('No steps with dealer data found')
  }
}

checkDealers()
