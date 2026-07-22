import * as dotenv from 'dotenv';
dotenv.config();
// Patch import.meta.env
globalThis.import = { meta: { env: process.env } } as any;

import { supabase } from './src/lib/supabase.ts';
async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(10);
  console.log('Profiles:', data);
  if (error) console.log('Error:', error);
}
run().catch(console.error);
