/**
 * Direct User & Transaction Hash Exporter
 * Usage: node scripts/export-users.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env if present
const envPath = path.resolve(process.cwd(), ".env");
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (key === "VITE_SUPABASE_URL") supabaseUrl = val;
      if (key === "VITE_SUPABASE_ANON_KEY") supabaseKey = val;
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportUsers(limit = 100) {
  console.log(`\n🔍 Fetching up to ${limit} users with verified transaction hashes...\n`);

  // 1. Fetch profiles
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pErr) {
    console.error("Error fetching profiles:", pErr.message);
    return;
  }

  // 2. Fetch transactions
  const { data: transactions, error: tErr } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit * 50);

  if (tErr) {
    console.error("Error fetching transactions:", tErr.message);
    return;
  }

  // 3. Map & deduplicate
  const result = profiles.map((user, idx) => {
    const seenHashes = new Set();
    const userTxs = [];

    for (const t of transactions || []) {
      if (t.wallet_address.toLowerCase() === user.wallet_address.toLowerCase()) {
        if (!seenHashes.has(t.tx_hash)) {
          seenHashes.add(t.tx_hash);
          userTxs.push({
            tx_hash: t.tx_hash,
            type: t.type,
            amount: `${t.amount} ${t.asset}`,
            vault_id: t.vault_id,
            created_at: t.created_at,
          });
        }
      }
    }

    return {
      rank: idx + 1,
      wallet_address: user.wallet_address,
      display_name: user.display_name || "Anonymous User",
      created_at: user.created_at,
      points: Number(user.points || 0),
      total_transactions: userTxs.length,
      transactions: userTxs,
    };
  });

  console.log(`✅ Successfully extracted ${result.length} unique user records.\n`);
  console.log(JSON.stringify(result, null, 2));

  // Save to JSON file
  fs.writeFileSync("exported_users.json", JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved clean report to exported_users.json\n`);
}

exportUsers(100);
