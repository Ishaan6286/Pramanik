import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded keys if .env is missing or blocked, so the app doesn't crash during testing.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rbsjvhfmlogjpftxiioq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJic2p2aGZtbG9nanBmdHhpaW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDkwNjcsImV4cCI6MjA5MDUyNTA2N30.ssm749czeFLFRsmJPn53CjbjTOBuT4zGWGnpjsPiwL0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
