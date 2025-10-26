import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jovecrxutogsudfkpldz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmVjcnh1dG9nc3VkZmtwbGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDk5NDMsImV4cCI6MjA3Mzc4NTk0M30.vkivmN1a2tM4geFXPt7zDIpP4vwqRGpZWu7bDZJQykk'
)

async function checkDetails() {
  console.log('📊 Session Details:\n')

  const { data: session } = await supabase
    .from('betting_sessions')
    .select('*')
    .eq('id', 'a8778c1d-9daa-46f9-8c2f-c2475b018ace')
    .single()

  console.log('Session:', JSON.stringify(session, null, 2))

  const { data: cards } = await supabase
    .from('betting_cards')
    .select('*')
    .eq('session_id', 'a8778c1d-9daa-46f9-8c2f-c2475b018ace')

  console.log('\n📇 Cards:', cards?.length || 0)
  if (cards) {
    cards.forEach(card => {
      console.log(`  Card #${card.card_number}: ${card.status}, bets: ${card.bets_used}/${card.max_bets}, total: $${card.current_total}`)
    })
  }

  const { data: steps } = await supabase
    .from('betting_card_steps')
    .select('*')
    .eq('session_id', 'a8778c1d-9daa-46f9-8c2f-c2475b018ace')

  console.log('\n🎲 Steps:', steps?.length || 0)
}

checkDetails()
