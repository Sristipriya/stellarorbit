import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "dummy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Position {
  wallet_address: string;
  vault_id: string;
  entry_share_price: number;
  entry_timestamp: string;
  current_shares: number;
}
