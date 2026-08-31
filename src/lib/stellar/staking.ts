/**
 * Orbit Liquidity Mining & Liquid Staking Protocol
 *
 * Provides high-yield staking pools for vault shares (oXLM), yield tranches (PT/YT),
 * and LP tokens with real-time per-second reward emission and lock multipliers.
 */

import { recordUserTransaction } from "@/lib/user-transactions";

export interface StakingPool {
  id: string;
  name: string;
  stakeTokenSymbol: string;
  rewardTokenSymbol: string;
  iconName: "oxlm" | "pt" | "yt" | "lp";
  category: "Liquid Staking" | "Fixed Yield" | "Leveraged Farm" | "DEX Liquidity";
  baseApr: number; // e.g. 18.5
  totalStaked: number; // in token units
  tvlUsd: number;
  dailyEmission: number; // ORBIT tokens emitted per day
  description: string;
  isPopular?: boolean;
}

export interface StakingPosition {
  poolId: string;
  stakedAmount: number;
  lockDays: number; // 0 = flexible, 30, 90, 180
  lockMultiplier: number; // 1.0, 1.5, 2.5, 4.0
  stakedAt: number; // timestamp in ms
  unlockAt: number; // timestamp in ms
  lastHarvestedAt: number; // timestamp in ms
  accumulatedRewards: number; // already calculated or cached rewards
  claimedRewards: number; // lifetime claimed
}

export interface StakingStats {
  totalTvlUsd: number;
  totalOrbitEmitted: number;
  activeStakersCount: number;
  orbitPriceUsd: number;
}

export const LOCK_PERIODS = [
  { days: 0, label: "Flexible", multiplier: 1.0, badge: "No Lock" },
  { days: 30, label: "30 Days", multiplier: 1.5, badge: "1.5x Boost" },
  { days: 90, label: "90 Days", multiplier: 2.5, badge: "2.5x Boost" },
  { days: 180, label: "180 Days", multiplier: 4.0, badge: "4.0x Max Boost" },
];

export const STAKING_POOLS: StakingPool[] = [
  {
    id: "oxlm-liquid",
    name: "oXLM Liquid Staking",
    stakeTokenSymbol: "oXLM",
    rewardTokenSymbol: "ORBIT",
    iconName: "oxlm",
    category: "Liquid Staking",
    baseApr: 18.5,
    totalStaked: 142580,
    tvlUsd: 17109.6,
    dailyEmission: 2400,
    description: "Stake your Orbit Vault receipt shares to earn liquid ORBIT rewards while continuing to collect underlying Blend protocol yield.",
    isPopular: true,
  },
  {
    id: "pt-xlm-farm",
    name: "PT-XLM Fixed Farm",
    stakeTokenSymbol: "PT-XLM",
    rewardTokenSymbol: "ORBIT",
    iconName: "pt",
    category: "Fixed Yield",
    baseApr: 24.2,
    totalStaked: 89400,
    tvlUsd: 10728.0,
    dailyEmission: 1850,
    description: "Lock Principal Tranche tokens to earn boosted fixed emissions with zero liquidation or impermanent loss risk.",
  },
  {
    id: "yt-xlm-mining",
    name: "YT-XLM Leveraged Mining",
    stakeTokenSymbol: "YT-XLM",
    rewardTokenSymbol: "ORBIT",
    iconName: "yt",
    category: "Leveraged Farm",
    baseApr: 42.8,
    totalStaked: 45200,
    tvlUsd: 5424.0,
    dailyEmission: 3200,
    description: "High-conviction staking for Yield Tokens. Collect aggressive variable ORBIT emissions and protocol fee buybacks.",
    isPopular: true,
  },
  {
    id: "orbit-xlm-lp",
    name: "ORBIT / XLM LP Farm",
    stakeTokenSymbol: "ORBIT-LP",
    rewardTokenSymbol: "ORBIT",
    iconName: "lp",
    category: "DEX Liquidity",
    baseApr: 65.0,
    totalStaked: 62100,
    tvlUsd: 14904.0,
    dailyEmission: 5000,
    description: "Provide liquidity to the primary ORBIT/XLM pool on Soroswap and stake LP tokens to maximize protocol governance yield.",
  },
];

export const PROTOCOL_STATS: StakingStats = {
  totalTvlUsd: 48165.6,
  totalOrbitEmitted: 842500,
  activeStakersCount: 148,
  orbitPriceUsd: 0.22,
};

const STAKING_STORAGE_PREFIX = "orbit:staking:positions:";

export function getStakingPositions(address: string): Record<string, StakingPosition> {
  if (typeof window === "undefined" || !address) return {};
  try {
    const raw = localStorage.getItem(`${STAKING_STORAGE_PREFIX}${address.toLowerCase()}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load staking positions:", e);
    return {};
  }
}

export function saveStakingPositions(
  address: string,
  positions: Record<string, StakingPosition>
): void {
  if (typeof window === "undefined" || !address) return;
  try {
    localStorage.setItem(
      `${STAKING_STORAGE_PREFIX}${address.toLowerCase()}`,
      JSON.stringify(positions)
    );
  } catch (e) {
    console.error("Failed to save staking positions:", e);
  }
}

export function computePendingReward(
  position: StakingPosition,
  pool: StakingPool,
  now = Date.now()
): number {
  if (!position || position.stakedAmount <= 0) return 0;

  const elapsedSeconds = Math.max(0, (now - position.lastHarvestedAt) / 1000);
  const effectiveApr = (pool.baseApr * position.lockMultiplier) / 100;
  const rewardRatePerSecond = (position.stakedAmount * effectiveApr) / (365 * 86400);
  const newlyAccrued = rewardRatePerSecond * elapsedSeconds;

  return position.accumulatedRewards + newlyAccrued;
}

export async function stakeTokens(
  address: string,
  poolId: string,
  amount: number,
  lockDays: number
): Promise<{ txHash: string; position: StakingPosition }> {
  if (!address || amount <= 0) throw new Error("Invalid stake parameters");

  const pool = STAKING_POOLS.find((p) => p.id === poolId);
  if (!pool) throw new Error("Staking pool not found");

  const lockConfig = LOCK_PERIODS.find((l) => l.days === lockDays) || LOCK_PERIODS[0];
  const now = Date.now();
  const unlockAt = lockDays > 0 ? now + lockDays * 86400 * 1000 : 0;

  const existingPositions = getStakingPositions(address);
  const currentPos = existingPositions[poolId];

  let accumulated = 0;
  if (currentPos && currentPos.stakedAmount > 0) {
    accumulated = computePendingReward(currentPos, pool, now);
  }

  const updatedPosition: StakingPosition = {
    poolId,
    stakedAmount: (currentPos?.stakedAmount || 0) + amount,
    lockDays,
    lockMultiplier: lockConfig.multiplier,
    stakedAt: now,
    unlockAt: Math.max(currentPos?.unlockAt || 0, unlockAt),
    lastHarvestedAt: now,
    accumulatedRewards: accumulated,
    claimedRewards: currentPos?.claimedRewards || 0,
  };

  existingPositions[poolId] = updatedPosition;
  saveStakingPositions(address, existingPositions);

  const txHash = `0x_stake_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`;

  await recordUserTransaction({
    walletAddress: address,
    txHash,
    type: "stake",
    amount,
    asset: pool.stakeTokenSymbol,
    vaultId: poolId,
    shares: String(amount),
    status: "success",
    metadata: {
      poolId,
      lockDays,
      multiplier: lockConfig.multiplier,
      action: "stake",
    },
  });

  return { txHash, position: updatedPosition };
}

export async function unstakeTokens(
  address: string,
  poolId: string,
  amount: number
): Promise<{ txHash: string; position: StakingPosition; harvestedRewards: number }> {
  if (!address || amount <= 0) throw new Error("Invalid unstake parameters");

  const pool = STAKING_POOLS.find((p) => p.id === poolId);
  if (!pool) throw new Error("Staking pool not found");

  const existingPositions = getStakingPositions(address);
  const currentPos = existingPositions[poolId];

  if (!currentPos || currentPos.stakedAmount < amount) {
    throw new Error("Insufficient staked balance");
  }

  const now = Date.now();
  if (currentPos.unlockAt > 0 && now < currentPos.unlockAt) {
    const daysLeft = Math.ceil((currentPos.unlockAt - now) / (86400 * 1000));
    throw new Error(`Tokens are locked for ${daysLeft} more day(s)`);
  }

  const pendingRewards = computePendingReward(currentPos, pool, now);
  const remainingStaked = currentPos.stakedAmount - amount;

  const updatedPosition: StakingPosition = {
    ...currentPos,
    stakedAmount: remainingStaked,
    lastHarvestedAt: now,
    accumulatedRewards: 0,
    claimedRewards: currentPos.claimedRewards + pendingRewards,
  };

  if (remainingStaked <= 0) {
    delete existingPositions[poolId];
  } else {
    existingPositions[poolId] = updatedPosition;
  }
  saveStakingPositions(address, existingPositions);

  const txHash = `0x_unstake_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`;

  await recordUserTransaction({
    walletAddress: address,
    txHash,
    type: "unstake",
    amount,
    asset: pool.stakeTokenSymbol,
    vaultId: poolId,
    shares: String(amount),
    status: "success",
    metadata: {
      poolId,
      harvestedRewards: pendingRewards,
      action: "unstake",
    },
  });

  return { txHash, position: updatedPosition, harvestedRewards: pendingRewards };
}

export async function claimStakingRewards(
  address: string,
  poolId?: string
): Promise<{ txHash: string; totalClaimed: number }> {
  if (!address) throw new Error("Wallet not connected");

  const existingPositions = getStakingPositions(address);
  const now = Date.now();
  let totalClaimed = 0;

  const targetPoolIds = poolId ? [poolId] : Object.keys(existingPositions);

  for (const pid of targetPoolIds) {
    const pos = existingPositions[pid];
    const pool = STAKING_POOLS.find((p) => p.id === pid);
    if (!pos || !pool || pos.stakedAmount <= 0) continue;

    const reward = computePendingReward(pos, pool, now);
    if (reward > 0) {
      totalClaimed += reward;
      existingPositions[pid] = {
        ...pos,
        lastHarvestedAt: now,
        accumulatedRewards: 0,
        claimedRewards: pos.claimedRewards + reward,
      };
    }
  }

  if (totalClaimed <= 0) {
    throw new Error("No rewards available to claim");
  }

  saveStakingPositions(address, existingPositions);

  const txHash = `0x_claim_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`;

  await recordUserTransaction({
    walletAddress: address,
    txHash,
    type: "claim_rewards",
    amount: totalClaimed.toFixed(4),
    asset: "ORBIT",
    vaultId: poolId || "all_pools",
    shares: null,
    status: "success",
    metadata: {
      totalClaimed,
      pools: targetPoolIds,
    },
  });

  return { txHash, totalClaimed };
}

export async function compoundStakingRewards(
  address: string,
  poolId = "oxlm-liquid"
): Promise<{ txHash: string; compoundedAmount: number }> {
  const claimRes = await claimStakingRewards(address, poolId);
  const stakeRes = await stakeTokens(address, poolId, claimRes.totalClaimed, 0);

  const txHash = `0x_compound_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`;

  await recordUserTransaction({
    walletAddress: address,
    txHash,
    type: "compound",
    amount: claimRes.totalClaimed.toFixed(4),
    asset: "ORBIT",
    vaultId: poolId,
    shares: null,
    status: "success",
    metadata: {
      compoundedAmount: claimRes.totalClaimed,
      targetPoolId: poolId,
    },
  });

  return { txHash, compoundedAmount: claimRes.totalClaimed };
}
