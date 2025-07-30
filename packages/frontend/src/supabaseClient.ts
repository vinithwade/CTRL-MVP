import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wyrgvlqtbuplsgqfmgzr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cmd2bHF0YnVwbHNncWZtZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Njk2NzEsImV4cCI6MjA2OTQ0NTY3MX0.jXOIjoei9jMk8sluBYuqeABmXdnaOM8ckvw2X-gZ09o'

export const supabase = createClient(supabaseUrl, supabaseKey)