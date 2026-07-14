import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Position {
  wallet_address: string;
  vault_id: string;
  entry_share_price: number;
  entry_timestamp: string;
  current_shares: number;
}
