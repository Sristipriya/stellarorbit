import { Client } from "pg";

const connectionString =
  "postgresql://postgres:1912Divyanshu@@db.rzwyivjgsevwwenxsiwd.supabase.co:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const query = `
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      vault_id TEXT NOT NULL,
      entry_share_price NUMERIC NOT NULL,
      entry_timestamp TIMESTAMPTZ DEFAULT NOW(),
      current_shares NUMERIC NOT NULL,
      UNIQUE(wallet_address, vault_id)
    );
  `;
  await client.query(query);
  console.log("Table 'positions' created successfully!");
  await client.end();
}

main().catch(console.error);
