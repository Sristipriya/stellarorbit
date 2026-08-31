import { useState, useEffect, useCallback, useMemo } from "react";
import {
  STAKING_POOLS,
  PROTOCOL_STATS,
  getStakingPositions,
  computePendingReward,
  stakeTokens,
  unstakeTokens,
  claimStakingRewards,
  compoundStakingRewards,
  type StakingPool,
  type StakingPosition,
  type StakingStats,
} from "@/lib/stellar/staking";

export function useStaking(address: string | null) {
  const [positions, setPositions] = useState<Record<string, StakingPosition>>({});
  const [pendingRewards, setPendingRewards] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const refresh = useCallback(() => {
    if (!address) {
      setPositions({});
      setPendingRewards({});
      return;
    }
    const currentPos = getStakingPositions(address);
    setPositions(currentPos);
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!address || Object.keys(positions).length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const newPending: Record<string, number> = {};

      for (const pool of STAKING_POOLS) {
        const pos = positions[pool.id];
        if (pos && pos.stakedAmount > 0) {
          newPending[pool.id] = computePendingReward(pos, pool, now);
        } else {
          newPending[pool.id] = 0;
        }
      }

      setPendingRewards(newPending);
      setLastUpdated(now);
    }, 1000);

    return () => clearInterval(interval);
  }, [address, positions]);

  const totalStakedUsd = useMemo(() => {
    let sum = 0;
    for (const pool of STAKING_POOLS) {
      const pos = positions[pool.id];
      if (pos && pos.stakedAmount > 0) {
        sum += pos.stakedAmount * 0.12;
      }
    }
    return sum;
  }, [positions]);

  const totalUnclaimedRewards = useMemo(() => {
    let sum = 0;
    for (const r of Object.values(pendingRewards)) {
      sum += r;
    }
    return sum;
  }, [pendingRewards]);

  const totalClaimedRewards = useMemo(() => {
    let sum = 0;
    for (const pos of Object.values(positions)) {
      sum += pos.claimedRewards || 0;
    }
    return sum;
  }, [positions]);

  const handleStake = async (poolId: string, amount: number, lockDays: number) => {
    if (!address) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const res = await stakeTokens(address, poolId, amount, lockDays);
      refresh();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (poolId: string, amount: number) => {
    if (!address) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const res = await unstakeTokens(address, poolId, amount);
      refresh();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (poolId?: string) => {
    if (!address) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const res = await claimStakingRewards(address, poolId);
      refresh();
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleCompound = async (poolId = "oxlm-liquid") => {
    if (!address) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const res = await compoundStakingRewards(address, poolId);
      refresh();
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    pools: STAKING_POOLS,
    stats: PROTOCOL_STATS,
    positions,
    pendingRewards,
    totalStakedUsd,
    totalUnclaimedRewards,
    totalClaimedRewards,
    loading,
    lastUpdated,
    refresh,
    stake: handleStake,
    unstake: handleUnstake,
    claim: handleClaim,
    compound: handleCompound,
  };
}
