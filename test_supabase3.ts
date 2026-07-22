import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rzwyivjgsevwwenxsiwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6d3lpdmpnc2V2d3dlbnhzaXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjc2MTcsImV4cCI6MjA5OTYwMzYxN30.8mbtSjKqhbP591iYwASn_8K4tkzWMDDyp_7wwAFfi6U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(10);
  console.log('Profiles:', data);
  if (error) console.log('Error:', error);
}
run().catch(console.error);
