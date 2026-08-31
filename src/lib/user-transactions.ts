import { supabase } from "./supabase";

export interface UserProfile {
  wallet_address: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  points: number;
  referral_code: string | null;
  referred_by: string | null;
}

export interface UserTransaction {
  id: string;
  wallet_address: string;
  tx_hash: string;
  type: "deposit" | "withdraw" | "wrap" | "unwrap" | "lend" | "borrow" | "faucet" | "stake" | "unstake" | "claim_rewards" | "compound";
  amount: string;
  asset: string;
  vault_id: string;
  shares: string | null;
  status: "success" | "failed" | "pending";
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RecordTxInput {
  walletAddress: string;
  txHash: string;
  type: "deposit" | "withdraw" | "wrap" | "unwrap" | "lend" | "borrow" | "faucet" | "stake" | "unstake" | "claim_rewards" | "compound";
  amount: string | number;
  asset?: string;
  vaultId?: string;
  shares?: string | number | null;
  status?: "success" | "failed" | "pending";
  metadata?: Record<string, unknown>;
}

const LOCAL_TX_KEY_PREFIX = "orbit:txs:";

/**
 * Ensures that a user profile exists in Supabase.
 * If new: inserts wallet_address, display_name, created_at, last_seen_at.
 * If existing: updates last_seen_at and optionally display_name, preserving created_at.
 */
export async function ensureUserProfile(
  walletAddress: string,
  displayName?: string | null,
  email?: string | null,
  phone?: string | null,
): Promise<UserProfile | null> {
  if (typeof window === "undefined" || !walletAddress) return null;

  try {
    const now = new Date().toISOString();

    // Check if profile exists
    const { data: existing, error: fetchErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      console.warn("[Orbit User DB] Fetch profile warning:", fetchErr.message);
    }

    if (!existing) {
      // New user registration
      const newProfile = {
        wallet_address: walletAddress,
        display_name: displayName || null,
        email: email || null,
        phone: phone || null,
        created_at: now,
        updated_at: now,
        last_seen_at: now,
        points: 0,
        referral_code: walletAddress,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .maybeSingle();

      if (error) {
        // Fallback upsert
        await supabase.from("profiles").upsert(newProfile, { onConflict: "wallet_address" });
      }
      return (data as UserProfile) || (newProfile as UserProfile);
    } else {
      // Existing user — update last_seen_at and name if provided
      const updates: Partial<UserProfile> = {
        last_seen_at: now,
        updated_at: now,
        ...(displayName ? { display_name: displayName } : {}),
      };

      await supabase
        .from("profiles")
        .update(updates)
        .eq("wallet_address", walletAddress);

      return {
        ...existing,
        ...updates,
      } as UserProfile;
    }
  } catch (err) {
    console.error("[Orbit User DB] Failed to ensure user profile:", err);
    return null;
  }
}

/**
 * Stores a transaction hash in Supabase, strictly linked to the user's wallet address.
 * Guarantees that each transaction is isolated to its respective user and prevents duplicates.
 */
export async function recordUserTransaction(input: RecordTxInput): Promise<UserTransaction | null> {
  if (typeof window === "undefined" || !input.walletAddress || !input.txHash) {
    return null;
  }

  const now = new Date().toISOString();
  const txId = `${input.walletAddress}_${input.txHash}_${input.type}`.toLowerCase();

  const record: UserTransaction = {
    id: txId,
    wallet_address: input.walletAddress,
    tx_hash: input.txHash,
    type: input.type,
    amount: String(input.amount),
    asset: input.asset || "XLM",
    vault_id: input.vaultId || "xlm",
    shares: input.shares != null ? String(input.shares) : null,
    status: input.status || "success",
    metadata: input.metadata || {},
    created_at: now,
  };

  // 1. Always cache in local storage for instant offline reactivity & persistence
  try {
    const storageKey = `${LOCAL_TX_KEY_PREFIX}${input.walletAddress}`;
    const rawLocal = localStorage.getItem(storageKey);
    const localList: UserTransaction[] = rawLocal ? JSON.parse(rawLocal) : [];
    const exists = localList.some((t) => t.id === txId || t.tx_hash === input.txHash);
    if (!exists) {
      localList.unshift(record);
      localStorage.setItem(storageKey, JSON.stringify(localList.slice(0, 100)));
    }
  } catch (e) {
    console.warn("[Orbit User DB] Local storage cache warning:", e);
  }

  // 2. Persist to Supabase with guaranteed user binding
  try {
    // Ensure profile row exists first to satisfy foreign key constraint
    await ensureUserProfile(input.walletAddress);

    const { data, error } = await supabase
      .from("transactions")
      .upsert(record, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Orbit User DB] Failed to save transaction to Supabase:", error.message);
      return record;
    }

    return (data as UserTransaction) || record;
  } catch (err) {
    console.error("[Orbit User DB] Exception storing transaction:", err);
    return record;
  }
}

/**
 * Fetches all transaction hashes strictly for a given wallet address from Supabase.
 * Merges with local storage fallback if network is delayed.
 */
export async function getUserTransactions(walletAddress: string): Promise<UserTransaction[]> {
  if (typeof window === "undefined" || !walletAddress) return [];

  // Local fallback
  let localList: UserTransaction[] = [];
  try {
    const rawLocal = localStorage.getItem(`${LOCAL_TX_KEY_PREFIX}${walletAddress}`);
    if (rawLocal) localList = JSON.parse(rawLocal);
  } catch {}

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return localList;
    }

    // Merge Supabase data with any unsynced local data
    const map = new Map<string, UserTransaction>();
    for (const item of data as UserTransaction[]) {
      map.set(item.id || item.tx_hash, item);
    }
    for (const item of localList) {
      if (!map.has(item.id || item.tx_hash)) {
        map.set(item.id || item.tx_hash, item);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (err) {
    console.error("[Orbit User DB] Failed to fetch user transactions:", err);
    return localList;
  }
}

/**
 * Updates a user's display name in Supabase.
 */
export async function updateUserProfileName(
  walletAddress: string,
  displayName: string,
): Promise<boolean> {
  if (typeof window === "undefined" || !walletAddress) return false;
  try {
    await ensureUserProfile(walletAddress, displayName);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("wallet_address", walletAddress);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches all registered users for Admin / Leaderboard views.
 */
export async function getAllUsers(limit = 100): Promise<UserProfile[]> {
  if (typeof window === "undefined") return [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as UserProfile[];
  } catch {
    return [];
  }
}

/**
 * Fetches global transactions across all users for Admin tables.
 */
export async function getAllTransactions(limit = 100): Promise<UserTransaction[]> {
  if (typeof window === "undefined") return [];
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    // Deduplicate by tx_hash
    const seen = new Set<string>();
    const deduplicated: UserTransaction[] = [];
    for (const t of data as UserTransaction[]) {
      if (!seen.has(t.tx_hash)) {
        seen.add(t.tx_hash);
        deduplicated.push(t);
      }
    }
    return deduplicated;
  } catch {
    return [];
  }
}

export interface UserWithTransactions {
  walletAddress: string;
  displayName: string;
  createdAt: string;
  lastSeenAt: string;
  points: number;
  referralCode: string | null;
  referredBy: string | null;
  transactionCount: number;
  transactions: Array<{
    id: string;
    txHash: string;
    type: string;
    amount: string;
    asset: string;
    vaultId: string;
    createdAt: string;
    status: string;
  }>;
}

/**
 * Fetches up to `limit` unique users with their strictly-isolated, 100% duplicate-free transactions.
 */
export async function getUsersWithTransactions(limit = 100): Promise<UserWithTransactions[]> {
  try {
    // 1. Fetch top unique profiles
    const users = await getAllUsers(limit);
    if (!users || users.length === 0) return [];

    // 2. Fetch all transactions
    const txs = await getAllTransactions(limit * 20);

    // 3. Map transactions strictly to each user with guaranteed zero duplicates
    const result: UserWithTransactions[] = users.map((u) => {
      const seenTxHashes = new Set<string>();
      const userTxs: UserWithTransactions["transactions"] = [];

      for (const t of txs) {
        if (t.wallet_address.toLowerCase() === u.wallet_address.toLowerCase()) {
          if (!seenTxHashes.has(t.tx_hash)) {
            seenTxHashes.add(t.tx_hash);
            userTxs.push({
              id: t.id,
              txHash: t.tx_hash,
              type: t.type,
              amount: t.amount,
              asset: t.asset,
              vaultId: t.vault_id,
              createdAt: t.created_at,
              status: t.status,
            });
          }
        }
      }

      return {
        walletAddress: u.wallet_address,
        displayName: u.display_name || "Anonymous User",
        createdAt: u.created_at,
        lastSeenAt: u.last_seen_at,
        points: Number(u.points || 0),
        referralCode: u.referral_code,
        referredBy: u.referred_by,
        transactionCount: userTxs.length,
        transactions: userTxs,
      };
    });

    return result;
  } catch (err) {
    console.error("[Orbit User DB] Failed to fetch users with transactions:", err);
    return [];
  }
}
