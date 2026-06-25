import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ctcyprqhdceazvnaddet.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Y3lwcnFoZGNlYXp2bmFkZGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTI0ODEsImV4cCI6MjA5NzkyODQ4MX0.04Qrf7yXvhgNLO-4xPGt1ebSNHXg3Aa3QlFRaWBtVa0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)