import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres:1912Divyanshu@@db.rzwyivjgsevwwenxsiwd.supabase.co:5432/postgres";

async function setup() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    // Create profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        wallet_address TEXT PRIMARY KEY,
        display_name TEXT,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        points NUMERIC DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created/Verified 'profiles' table.");

    // Optional: create an RPC for atomically incrementing points
    await client.query(`
      CREATE OR REPLACE FUNCTION award_points(p_wallet_address TEXT, p_points NUMERIC)
      RETURNS NUMERIC
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        new_points NUMERIC;
      BEGIN
        UPDATE public.profiles
        SET points = points + p_points, last_updated = CURRENT_TIMESTAMP
        WHERE wallet_address = p_wallet_address
        RETURNING points INTO new_points;
        
        -- If no rows were updated, it means the profile doesn't exist.
        IF NOT FOUND THEN
           -- Insert new profile if not found
           INSERT INTO public.profiles (wallet_address, referral_code, points)
           VALUES (p_wallet_address, p_wallet_address, p_points)
           RETURNING points INTO new_points;
        END IF;

        RETURN new_points;
      END;
      $$;
    `);
    console.log("Created/Verified 'award_points' RPC.");

    // Enable Row Level Security (RLS) on profiles
    await client.query(`
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist to avoid errors
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

      -- Create policies
      CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);
      
      CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (true); -- Note: For a real app, verify authentication. Here we allow anon.
      
      CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (true);
    `);
    console.log("Configured RLS for 'profiles'.");

  } catch (e) {
    console.error("Error setting up DB:", e);
  } finally {
    await client.end();
  }
}

setup();
