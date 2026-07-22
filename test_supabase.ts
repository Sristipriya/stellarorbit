import { supabase } from './src/lib/supabase.ts';
async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(10);
  console.log('Profiles:', data);
  console.log('Error:', error);
}
run().catch(console.error);
