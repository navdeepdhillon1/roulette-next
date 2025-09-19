import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jovecrxutogsudfkpldz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdmVjcnh1dG9nc3VkZmtwbGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDk5NDMsImV4cCI6MjA3Mzc4NTk0M30.vkivmN1a2tM4geFXPt7zDIpP4vwqRGpZWu7bDZJQykk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)