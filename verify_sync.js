import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jovecrxutogsudfkpldz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmVjcnh1dG9nc3VkZmtwbGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDk5NDMsImV4cCI6MjA3Mzc4NTk0M30.vkivmN1a2tM4geFXPt7zDIpP4vwqRGpZWu7bDZJQykk'
)

async function checkData() {
  console.log('🔍 Checking for saved data...\n')

  // Check sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('betting_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (sessionsError) {
    console.log('❌ Error:', sessionsError.message)
  } else {
    console.log(`✅ Found ${sessions.length} session(s) in database`)
    if (sessions.length > 0) {
      console.log('\nMost recent session:')
      console.log('  - ID:', sessions[0].id)
      console.log('  - Name:', sessions[0].session_name)
      console.log('  - Status:', sessions[0].status)
      console.log('  - Started:', sessions[0].started_at)
    }
  }

  // Check casinos
  const { data: casinos } = await supabase
    .from('casinos')
    .select('*')

  console.log(`\n✅ Found ${casinos ? casinos.length : 0} casino(s) in database`)

  // Check dealers
  const { data: dealers } = await supabase
    .from('dealers')
    .select('*')

  console.log(`✅ Found ${dealers ? dealers.length : 0} dealer(s) in database`)
}

checkData()
